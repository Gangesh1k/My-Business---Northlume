import { supabase } from './supabase';
import { track, visitorId } from './track';

/** Save a form submission to the leads table (best effort — the mailto fallback still runs). */
export function saveLead(source: 'consultation' | 'lead_form' | 'scorecard' | 'pilot', f: { name?: string; email: string; company?: string; message?: string }) {
  track('consultation', source);
  if (!supabase || !f.email) return;
  supabase.from('leads').insert({
    source, visitor_id: visitorId(), full_name: f.name || null, email: f.email.trim().toLowerCase(),
    company: f.company || null, message: f.message ? f.message.slice(0, 3900) : null,
  }).then(({ error }) => { if (error) console.warn('lead', error.message); });
}
