-- ============================================================================
--  NorthLume AI — online payments with Razorpay (run AFTER schema.sql)
--  Supabase → SQL Editor → New query → paste this whole file → Run.  Safe to re-run.
-- ============================================================================

-- ---------- price list (edit prices here any time; the website reads them live) ----------
create table if not exists public.price_plans (
  id           text primary key,
  name         text not null,
  kind         text not null check (kind in ('subscription','service')),
  inr_paise    bigint not null check (inr_paise > 0),     -- ₹1,000 = 100000
  usd_cents    bigint not null check (usd_cents > 0),     -- $10   = 1000
  period_days  int,                                       -- how long website access lasts
  grants_plan  text check (grants_plan in ('pro','business')),
  blurb        text,
  sort         int not null default 100,
  active       boolean not null default true
);
insert into public.price_plans (id, name, kind, inr_paise, usd_cents, period_days, grants_plan, blurb, sort) values
  ('pro_monthly',  'Pro — monthly',                      'subscription',   100000,   1000,  31, 'pro',      'Unlimited runs of all 6 tools on your own files', 10),
  ('pro_yearly',   'Pro — yearly (save 10%)',            'subscription',  1080000,  10800, 366, 'pro',      '12 months for the price of 10.8', 11),
  ('starter',      'Starter Automation',                 'service',       4999900,  59900, 365, 'business', 'One end-to-end workflow, live in 2 weeks', 20),
  ('business',     'Business Automation',                'service',      14999900, 179900, 365, 'business', 'Up to 3–5 connected workflows', 21),
  ('intelligent',  'Intelligent Operations',             'service',      34999900, 419900, 365, 'business', 'Full operations control tower', 22),
  ('custom',       'Custom AI Solutions — scoping deposit','service',     2500000,  29900, 365, 'business', 'Adjusted against the final quote', 23)
on conflict (id) do nothing;          -- re-running never overwrites prices you changed
alter table public.price_plans enable row level security;
drop policy if exists "prices are public" on public.price_plans;
create policy "prices are public" on public.price_plans for select using (active);
grant select on public.price_plans to anon, authenticated;

-- ---------- payments ----------
create table if not exists public.payments (
  id                  bigint generated always as identity primary key,
  user_id             uuid references auth.users(id) on delete set null,
  email               text not null,
  plan_id             text not null references public.price_plans(id),
  currency            text not null check (currency in ('INR','USD')),
  amount              bigint not null,                 -- smallest unit (paise / cents)
  razorpay_order_id   text not null unique,
  razorpay_payment_id text,
  status              text not null default 'created' check (status in ('created','paid','failed')),
  access_until        date,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  raw                 jsonb
);
create index if not exists payments_user_idx on public.payments (user_id);
alter table public.payments enable row level security;
drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments for select using (user_id = auth.uid() or public.is_admin());
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;     -- rows are only written by the payment functions

-- ---------- let the payment function change a plan (normal users still can't) ----------
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('nl.payment_apply', true), '') = 'on' then
    return new;                                   -- set only inside apply_payment()
  end if;
  if not public.is_admin() and (new.plan is distinct from old.plan
       or new.plan_until is distinct from old.plan_until or new.email is distinct from old.email) then
    raise exception 'Only an administrator can change the plan or email';
  end if;
  return new;
end $$;

-- ---------- mark an order paid and switch access on (called only by the Edge Functions) ----------
create or replace function public.apply_payment(p_order_id text, p_payment_id text, p_raw jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pay public.payments; pl public.price_plans; prof public.profiles; new_plan text; until date;
begin
  select * into pay from public.payments where razorpay_order_id = p_order_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'unknown_order'); end if;
  if pay.status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true, 'plan_id', pay.plan_id, 'access_until', pay.access_until);
  end if;
  select * into pl from public.price_plans where id = pay.plan_id;

  if pay.user_id is not null and pl.grants_plan is not null then
    select * into prof from public.profiles where id = pay.user_id for update;
    new_plan := case when prof.plan = 'business' then 'business' else pl.grants_plan end;
    until := greatest(coalesce(prof.plan_until, current_date), current_date) + coalesce(pl.period_days, 31);
    perform set_config('nl.payment_apply', 'on', true);
    update public.profiles set plan = new_plan, plan_until = until where id = pay.user_id;
    perform set_config('nl.payment_apply', 'off', true);
  end if;

  update public.payments set status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now(),
         access_until = until, raw = coalesce(p_raw, raw) where id = pay.id;

  insert into public.subscription_requests (user_id, email, plan_interest, message, status)
  values (pay.user_id, pay.email, pl.id,
          format('Paid online via Razorpay: %s %s (%s)', pay.currency, to_char(pay.amount / 100.0, 'FM999G999G990D00'), pl.name), 'won');

  return jsonb_build_object('ok', true, 'plan_id', pl.id, 'plan', new_plan, 'access_until', until);
end $$;
revoke all on function public.apply_payment(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_payment(text, text, jsonb) to service_role;
