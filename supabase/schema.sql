-- ============================================================================
-- NorthLume AI — visitor tracking, free trial (1 run per tool per email),
-- subscription requests and leads.  Run once in Supabase → SQL Editor → New query.
-- Safe to re-run: every object is created with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

-- ---------- settings ---------------------------------------------------------
create table if not exists public.app_settings (
  key   text primary key,
  value jsonb not null
);
insert into public.app_settings (key, value) values
  ('free_runs_per_tool', '1'::jsonb),
  ('admin_emails', '["gangesh@northlumeai.com"]'::jsonb)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;
-- nobody reads settings directly from the browser; functions below read them.

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in (
      select lower(jsonb_array_elements_text(value)) from public.app_settings where key = 'admin_emails'),
    false)
$$;

create or replace function public.valid_tool(p text)
returns boolean language sql immutable as $$
  select p in ('email-automation','excel-automation','reporting-automation',
               'ai-business-insights','workflow-automation','ai-agents')
$$;

-- ---------- profiles (one per verified email) --------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null unique,
  full_name        text check (char_length(full_name) <= 120),
  company          text check (char_length(company) <= 160),
  phone            text check (char_length(phone) <= 40),
  plan             text not null default 'free' check (plan in ('free','pro','business')),
  plan_until       date,
  marketing_consent boolean not null default false,
  created_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "admin profiles"     on public.profiles;
create policy "own profile read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admin profiles"     on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- only an admin may change plan / plan_until / email
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and (new.plan is distinct from old.plan
       or new.plan_until is distinct from old.plan_until or new.email is distinct from old.email) then
    raise exception 'Only an administrator can change the plan or email';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- create a profile automatically when someone verifies their email for the first time
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- visits (website footprint) ---------------------------------------
create table if not exists public.visits (
  id           bigint generated always as identity primary key,
  visitor_id   uuid not null,                 -- random id kept in the visitor's browser
  session_id   uuid not null,                 -- new id per browser session
  user_id      uuid references auth.users(id) on delete set null,  -- filled once they register
  event        text not null check (event in ('page_view','section_view','demo_run','own_data_run',
                                              'cta_click','signup','subscribe_request','consultation')),
  path         text check (char_length(path) <= 300),
  section      text check (char_length(section) <= 80),
  detail       text check (char_length(detail) <= 300),
  referrer     text check (char_length(referrer) <= 500),
  utm_source   text check (char_length(utm_source) <= 100),
  utm_medium   text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  device       text check (char_length(device) <= 20),
  language     text check (char_length(language) <= 20),
  timezone     text check (char_length(timezone) <= 60),
  screen       text check (char_length(screen) <= 20),
  created_at   timestamptz not null default now()
);
create index if not exists visits_created_idx on public.visits (created_at desc);
create index if not exists visits_visitor_idx on public.visits (visitor_id);
alter table public.visits enable row level security;
drop policy if exists "anyone logs visits" on public.visits;
drop policy if exists "admin reads visits" on public.visits;
create policy "anyone logs visits" on public.visits for insert
  with check (user_id is null or user_id = auth.uid());
create policy "admin reads visits" on public.visits for select using (public.is_admin());

-- after sign-in, attach the visitor's earlier anonymous browsing to their account
create or replace function public.claim_visitor(p_visitor uuid)
returns void language sql security definer set search_path = public as $$
  update public.visits set user_id = auth.uid()
  where visitor_id = p_visitor and user_id is null and auth.uid() is not null;
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

-- ---------- tool runs (free-trial counter) -----------------------------------
create table if not exists public.tool_runs (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  tool       text not null check (public.valid_tool(tool)),
  allowed    boolean not null,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists tool_runs_user_tool_idx on public.tool_runs (user_id, tool);
alter table public.tool_runs enable row level security;
drop policy if exists "own runs read" on public.tool_runs;
create policy "own runs read" on public.tool_runs for select using (user_id = auth.uid() or public.is_admin());
-- no insert policy: rows are only written through start_tool_run()

create or replace function public.start_tool_run(p_tool text, p_meta jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid     uuid := auth.uid();
  v_plan  text; v_until date; v_limit int; v_used int;
begin
  if uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'login_required');
  end if;
  if not public.valid_tool(p_tool) then
    raise exception 'Unknown tool %', p_tool;
  end if;
  perform pg_advisory_xact_lock(hashtext(uid::text || p_tool));   -- no double-spend from two tabs

  select plan, plan_until into v_plan, v_until from public.profiles where id = uid;
  if v_plan in ('pro','business') and (v_until is null or v_until >= current_date) then
    insert into public.tool_runs (user_id, tool, allowed, meta) values (uid, p_tool, true, coalesce(p_meta, '{}'));
    return jsonb_build_object('allowed', true, 'plan', v_plan);
  end if;

  select coalesce((value #>> '{}')::int, 1) into v_limit from public.app_settings where key = 'free_runs_per_tool';
  v_limit := coalesce(v_limit, 1);
  select count(*) into v_used from public.tool_runs where user_id = uid and tool = p_tool and allowed;

  if v_used < v_limit then
    insert into public.tool_runs (user_id, tool, allowed, meta) values (uid, p_tool, true, coalesce(p_meta, '{}'));
    return jsonb_build_object('allowed', true, 'plan', 'free', 'remaining', v_limit - v_used - 1);
  end if;
  insert into public.tool_runs (user_id, tool, allowed, meta) values (uid, p_tool, false, coalesce(p_meta, '{}'));
  return jsonb_build_object('allowed', false, 'plan', 'free', 'reason', 'free_limit_reached');
end $$;

create or replace function public.my_status()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then jsonb_build_object('signed_in', false) else
    jsonb_build_object(
      'signed_in', true,
      'email', p.email,
      'plan', p.plan,
      'plan_until', p.plan_until,
      'active_paid', p.plan in ('pro','business') and (p.plan_until is null or p.plan_until >= current_date),
      'free_limit', coalesce((select (value #>> '{}')::int from public.app_settings where key = 'free_runs_per_tool'), 1),
      'used', coalesce((select jsonb_object_agg(tool, n) from (
                 select tool, count(*) n from public.tool_runs
                 where user_id = auth.uid() and allowed group by tool) t), '{}'::jsonb),
      'is_admin', public.is_admin())
  end
  from (select 1) one left join public.profiles p on p.id = auth.uid()
$$;

-- ---------- subscription requests & leads ------------------------------------
create table if not exists public.subscription_requests (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  email      text not null check (char_length(email) <= 200),
  full_name  text check (char_length(full_name) <= 120),
  company    text check (char_length(company) <= 160),
  phone      text check (char_length(phone) <= 40),
  plan_interest text check (char_length(plan_interest) <= 40),
  tools      text[] not null default '{}',
  message    text check (char_length(message) <= 2000),
  status     text not null default 'new' check (status in ('new','contacted','won','lost')),
  created_at timestamptz not null default now()
);
alter table public.subscription_requests enable row level security;
drop policy if exists "anyone requests" on public.subscription_requests;
drop policy if exists "admin requests"  on public.subscription_requests;
drop policy if exists "admin updates requests" on public.subscription_requests;
create policy "anyone requests" on public.subscription_requests for insert
  with check ((user_id is null or user_id = auth.uid()) and status = 'new');
create policy "admin requests"  on public.subscription_requests for select using (public.is_admin());
create policy "admin updates requests" on public.subscription_requests for update using (public.is_admin());

create table if not exists public.leads (
  id         bigint generated always as identity primary key,
  source     text not null check (source in ('consultation','lead_form','scorecard','pilot')),
  full_name  text check (char_length(full_name) <= 120),
  email      text not null check (char_length(email) <= 200),
  company    text check (char_length(company) <= 160),
  message    text check (char_length(message) <= 4000),
  visitor_id uuid,
  created_at timestamptz not null default now()
);
alter table public.leads enable row level security;
drop policy if exists "anyone leaves a lead" on public.leads;
drop policy if exists "admin reads leads"    on public.leads;
create policy "anyone leaves a lead" on public.leads for insert with check (true);
create policy "admin reads leads"    on public.leads for select using (public.is_admin());

-- ---------- admin dashboard (one call) ---------------------------------------
create or replace function public.admin_dashboard(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return jsonb_build_object(
    'since', since,
    'visitors',  (select count(distinct visitor_id) from visits where created_at >= since),
    'sessions',  (select count(distinct session_id) from visits where created_at >= since),
    'page_views',(select count(*) from visits where event = 'page_view' and created_at >= since),
    'signups',   (select count(*) from profiles where created_at >= since),
    'paid',      (select count(*) from profiles where plan <> 'free'),
    'requests_new', (select count(*) from subscription_requests where status = 'new'),
    'by_day', coalesce((select jsonb_agg(d order by d->>'day') from (
        select jsonb_build_object('day', to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
               'visitors', count(distinct visitor_id)) d
        from visits where created_at >= since group by date_trunc('day', created_at)) x), '[]'),
    'top_sections', coalesce((select jsonb_agg(s) from (
        select jsonb_build_object('section', section, 'views', count(*)) s
        from visits where event = 'section_view' and created_at >= since and section is not null
        group by section order by count(*) desc limit 12) x), '[]'),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('source', src, 'visitors', n)) from (
        select src, count(distinct visitor_id) n from (
          select visitor_id, coalesce(nullif(utm_source,''), nullif(split_part(split_part(referrer,'//',2),'/',1),''), 'direct') src
          from visits where event = 'page_view' and created_at >= since) v
        group by src order by count(distinct visitor_id) desc limit 10) x), '[]'),
    'demo_runs', coalesce((select jsonb_agg(s) from (
        select jsonb_build_object('tool', section, 'runs', count(*)) s
        from visits where event in ('demo_run','own_data_run') and created_at >= since
        group by section order by count(*) desc) x), '[]'),
    'users', coalesce((select jsonb_agg(u order by u->>'created_at' desc) from (
        select jsonb_build_object('email', p.email, 'name', p.full_name, 'company', p.company, 'plan', p.plan,
               'created_at', p.created_at, 'last_seen_at', p.last_seen_at,
               'runs', (select count(*) from tool_runs r where r.user_id = p.id and r.allowed),
               'blocked', (select count(*) from tool_runs r where r.user_id = p.id and not r.allowed),
               'visits', (select count(distinct session_id) from visits v where v.user_id = p.id)) u
        from profiles p order by p.created_at desc limit 200) x), '[]'),
    'requests', coalesce((select jsonb_agg(r order by r->>'created_at' desc) from (
        select jsonb_build_object('id', id, 'email', email, 'name', full_name, 'company', company, 'plan', plan_interest,
               'tools', tools, 'message', message, 'status', status, 'created_at', created_at) r
        from subscription_requests order by created_at desc limit 200) x), '[]'),
    'leads', coalesce((select jsonb_agg(l order by l->>'created_at' desc) from (
        select jsonb_build_object('source', source, 'name', full_name, 'email', email, 'company', company,
               'message', left(message, 300), 'created_at', created_at) l
        from leads order by created_at desc limit 200) x), '[]')
  );
end $$;

-- admin: activate / change a subscription in one call
create or replace function public.admin_set_plan(p_email text, p_plan text, p_until date default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.profiles set plan = p_plan, plan_until = p_until where email = lower(p_email);
  if not found then raise exception 'No registered user with email %', p_email; end if;
end $$;

-- ---------- privileges -------------------------------------------------------
revoke all on public.tool_runs from anon, authenticated;
grant select on public.tool_runs to authenticated;
revoke all on public.app_settings from anon, authenticated;
grant insert on public.visits, public.leads, public.subscription_requests to anon, authenticated;
grant select on public.visits, public.leads to authenticated;
grant select, update on public.subscription_requests to authenticated;
grant select, update on public.profiles to authenticated;
grant execute on function public.start_tool_run(text, jsonb), public.my_status(), public.claim_visitor(uuid),
                          public.admin_dashboard(int), public.admin_set_plan(text, text, date) to authenticated;
grant execute on function public.my_status() to anon;
