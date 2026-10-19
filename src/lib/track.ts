// First-party, cookie-free visit tracking into Supabase (table public.visits).
// Stores a random visitor id in the browser — no personal data until someone chooses to register.
import { supabase, url as SB_URL, anonKey as SB_KEY } from './supabase';

type Event = 'page_view' | 'section_view' | 'demo_run' | 'own_data_run' | 'cta_click' | 'signup' | 'subscribe_request' | 'consultation' | 'engaged';

const uuid = () => (crypto?.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));

function stored(store: 'local' | 'session', key: string, make: () => string): string {
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage;
    let v = s.getItem(key);
    if (!v) { v = make(); s.setItem(key, v); }
    return v;
  } catch { return make(); }
}

export const visitorId = () => stored('local', 'nl_vid', uuid);
const sessionId = () => stored('session', 'nl_sid', uuid);

function utm() {
  const read = () => {
    const q = new URLSearchParams(window.location.search);
    return JSON.stringify({ s: q.get('utm_source') || '', m: q.get('utm_medium') || '', c: q.get('utm_campaign') || '', r: document.referrer || '' });
  };
  try { return JSON.parse(stored('session', 'nl_utm', read)); } catch { return JSON.parse(read()); }
}

const device = () => (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1100 ? 'tablet' : 'desktop');
const cut = (s: string | undefined, n: number) => (s ? s.slice(0, n) : null);

// Approximate location (city / region / country) from our own Vercel function — looked up once per browser session.
type Geo = { country: string | null; region: string | null; city: string | null };
const NO_GEO: Geo = { country: null, region: null, city: null };
let geo: Geo = NO_GEO;
const geoReady: Promise<void> = (async () => {
  try {
    const cached = window.sessionStorage.getItem('nl_geo');
    if (cached) { geo = JSON.parse(cached); return; }
  } catch { /* ignore */ }
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 1500);
    const r = await fetch('/api/geo', { signal: ctl.signal }); clearTimeout(t);
    if (r.ok) {
      const g = await r.json();
      geo = { country: cut(g.country, 8) || null, region: cut(g.region, 40) || null, city: cut(g.city, 80) || null };
      try { window.sessionStorage.setItem('nl_geo', JSON.stringify(geo)); } catch { /* ignore */ }
    }
  } catch { /* no location — fine */ }
})();

let currentUserId: string | null = null;
export const setTrackedUser = (id: string | null) => { currentUserId = id; };

/** Fire-and-forget. Never throws, never blocks the page. */
function buildRow(event: Event, section?: string, detail?: string, withUser = true) {
  const u = utm();
  return {
    visitor_id: visitorId(), session_id: sessionId(), user_id: withUser ? currentUserId : null, event,
    path: cut(window.location.pathname + window.location.hash, 300), section: cut(section, 80), detail: cut(detail, 300),
    referrer: cut(u.r, 500), utm_source: cut(u.s, 100), utm_medium: cut(u.m, 100), utm_campaign: cut(u.c, 100),
    device: device(), language: cut(navigator.language, 20),
    timezone: cut(Intl.DateTimeFormat().resolvedOptions().timeZone, 60), screen: `${window.screen.width}x${window.screen.height}`,
    ...geo,
  };
}

/** Fire-and-forget. Never throws, never blocks the page. */
export function track(event: Event, section?: string, detail?: string) {
  if (!supabase) return;
  geoReady.then(() => {
    supabase!.from('visits').insert(buildRow(event, section, detail)).then(() => undefined, () => undefined);
  });
}

/** Survives the tab closing (keepalive). Sent without the user id, so it never needs a sign-in token. */
function beacon(event: Event, detail: string) {
  if (!supabase || !SB_URL) return;
  try {
    fetch(`${SB_URL}/rest/v1/visits`, {
      method: 'POST', keepalive: true,
      headers: { apikey: SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(buildRow(event, undefined, detail, false)),
    }).catch(() => undefined);
  } catch { /* ignore */ }
}

/** Time actually spent with the page in front of the visitor, sent every 30 s and when they leave. */
function startEngagedTimer() {
  let secs = 0, sent = 0, last = Date.now();
  const visible = () => document.visibilityState === 'visible';
  const tick = () => { const now = Date.now(); if (visible()) secs += Math.min(5, (now - last) / 1000); last = now; };
  const flush = () => { tick(); const s = Math.round(secs); if (s >= 5 && s !== sent) { sent = s; beacon('engaged', String(s)); } };
  setInterval(tick, 1000);
  setInterval(() => { if (visible()) flush(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!visible()) flush(); else last = Date.now(); });
  window.addEventListener('pagehide', flush);
}

/** Page view once per load + a section_view the first time each main section is seen in a session. */
export function startTracking() {
  if (!supabase) return;
  track('page_view');
  startEngagedTimer();
  const seen = new Set<string>();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const id = (e.target as HTMLElement).id;
      if (e.isIntersecting && id && !seen.has(id)) { seen.add(id); track('section_view', id); }
    });
  }, { threshold: 0.35 });
  const observe = () => document.querySelectorAll('main section[id], section[id]').forEach(s => io.observe(s));
  observe();
  setTimeout(observe, 1500);
}
