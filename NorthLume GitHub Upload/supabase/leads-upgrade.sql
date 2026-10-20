-- ============================================================================
-- NorthLume AI — leads: optional phone number, email alert bookkeeping, full message in the admin dashboard
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to re-run.
-- ============================================================================
alter table public.leads add column if not exists phone text check (char_length(phone) <= 40);
alter table public.leads add column if not exists notified_at timestamptz;   -- set by the lead-notify function after it emails you
-- existing leads: don't email about them now
update public.leads set notified_at = coalesce(notified_at, created_at) where created_at < now() - interval '1 hour';

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
        select jsonb_build_object('id', id, 'source', source, 'name', full_name, 'email', email, 'company', company,
               'phone', phone, 'message', message, 'created_at', created_at, 'notified_at', notified_at) l
        from leads order by created_at desc limit 200) x), '[]')
  );
end $$;
