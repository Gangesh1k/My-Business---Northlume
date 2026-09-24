// First-party, cookie-free visit tracking into Supabase (table public.visits).
// Stores a random visitor id in the browser — no personal data until someone chooses to register.
import { supabase } from './supabase';

type Event = 'page_view' | 'section_view' | 'demo_run' | 'own_data_run' | 'cta_click' | 'signup' | 'subscribe_request' | 'consultation';

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

let currentUserId: string | null = null;
export const setTrackedUser = (id: string | null) => { currentUserId = id; };

/** Fire-and-forget. Never throws, never blocks the page. */
export function track(event: Event, section?: string, detail?: string) {
  if (!supabase) return;
  const u = utm();
  const row = {
    visitor_id: visitorId(), session_id: sessionId(), user_id: currentUserId, event,
    path: cut(window.location.pathname + window.location.hash, 300), section: cut(section, 80), detail: cut(detail, 300),
    referrer: cut(u.r, 500), utm_source: cut(u.s, 100), utm_medium: cut(u.m, 100), utm_campaign: cut(u.c, 100),
    device: device(), language: cut(navigator.language, 20),
    timezone: cut(Intl.DateTimeFormat().resolvedOptions().timeZone, 60), screen: `${window.screen.width}x${window.screen.height}`,
  };
  supabase.from('visits').insert(row).then(() => undefined, () => undefined);
}

/** Page view once per load + a section_view the first time each main section is seen in a session. */
export function startTracking() {
  if (!supabase) return;
  track('page_view');
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
