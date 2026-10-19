-- ============================================================================
-- NorthLume AI — visitor details for the admin dashboard
-- (who visited, when, from where, how many times, how long they stayed, what they looked at)
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to re-run.
-- ============================================================================

-- 1. approximate location + a new "engaged" event that carries seconds on the page
alter table public.visits add column if not exists country text check (char_length(country) <= 8);
alter table public.visits add column if not exists region  text check (char_length(region)  <= 40);
alter table public.visits add column if not exists city    text check (char_length(city)    <= 80);

alter table public.visits drop constraint if exists visits_event_check;
alter table public.visits add constraint visits_event_check check (event in (
  'page_view','section_view','demo_run','own_data_run','cta_click','signup','subscribe_request','consultation','engaged'));

create index if not exists visits_session_idx on public.visits (session_id);

-- 2. one row per visitor, newest first, with their recent sessions
create or replace function public.admin_visitors(p_days int default 30, p_limit int default 300)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return coalesce((
    with v as (select * from visits where created_at >= since),
    sess as (
      select visitor_id, session_id, min(created_at) started, max(created_at) ended,
             coalesce(max(case when event = 'engaged' and detail ~ '^[0-9]{1,6}$' then detail::int end),   -- measured time on page
                      least(extract(epoch from max(created_at) - min(created_at))::int, 1800)) secs,       -- older visits: first→last click, max 30 min
             count(*) filter (where event = 'page_view') pages,
             coalesce(array_remove(array_agg(distinct section) filter (where event = 'section_view'), null), '{}') sections,
             count(*) filter (where event in ('demo_run','own_data_run')) demos
      from v group by visitor_id, session_id),
    who as (  -- registered visitors: any row of theirs carries the user id (also older rows, after claim_visitor)
      select distinct on (x.visitor_id) x.visitor_id, p.email, p.full_name, p.company
      from visits x join profiles p on p.id = x.user_id
      where x.visitor_id in (select visitor_id from v) order by x.visitor_id, x.created_at desc),
    last_row as (
      select distinct on (visitor_id) visitor_id, device, city, region, country, timezone, language
      from v order by visitor_id, (city is null), created_at desc),
    first_src as (
      select distinct on (visitor_id) visitor_id,
             coalesce(nullif(utm_source,''), nullif(split_part(split_part(referrer,'//',2),'/',1),''), 'direct') source,
             nullif(utm_campaign,'') campaign
      from v where event = 'page_view' order by visitor_id, created_at),
    agg as (
      select s.visitor_id, min(started) first_seen, max(ended) last_seen, count(*) visits, sum(secs) secs,
             sum(pages) pages, sum(demos) demos,
             (select array_agg(distinct x) from sess s2, unnest(s2.sections) x where s2.visitor_id = s.visitor_id) sections,
             (select count(*) from visits c where c.visitor_id = s.visitor_id and c.event = 'cta_click' and c.created_at >= since) clicks,
             (select jsonb_agg(jsonb_build_object('started', started, 'secs', secs, 'pages', pages, 'sections', sections, 'demos', demos)
                     order by started desc) from (select * from sess s3 where s3.visitor_id = s.visitor_id order by started desc limit 15) z) recent
      from sess s group by s.visitor_id)
    select jsonb_agg(jsonb_build_object(
             'id', left(a.visitor_id::text, 8), 'email', w.email, 'name', w.full_name, 'company', w.company,
             'is_admin', coalesce(lower(w.email) in (select lower(jsonb_array_elements_text(value)) from app_settings where key = 'admin_emails'), false),
             'first_seen', a.first_seen, 'last_seen', a.last_seen, 'visits', a.visits, 'secs', a.secs, 'pages', a.pages,
             'demos', a.demos, 'clicks', a.clicks, 'sections', coalesce(a.sections, '{}'),
             'device', l.device, 'city', l.city, 'region', l.region, 'country', l.country, 'timezone', l.timezone, 'language', l.language,
             'source', f.source, 'campaign', f.campaign, 'sessions', a.recent)
           order by a.last_seen desc)
    from (select * from agg order by last_seen desc limit greatest(1, least(p_limit, 1000))) a
    left join who w on w.visitor_id = a.visitor_id
    left join last_row l on l.visitor_id = a.visitor_id
    left join first_src f on f.visitor_id = a.visitor_id
  ), '[]'::jsonb);
end $$;

grant execute on function public.admin_visitors(int, int) to authenticated;
