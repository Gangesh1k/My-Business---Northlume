import { supabase } from './supabase';
import { track, visitorId } from './track';
import { LEAD_NOTIFY_FUNCTION } from '../config/supabase';

/** Save a form submission to the leads table and ask the server to email you about it.
 *  Best effort — the mailto fallback in the form still runs. */
export function saveLead(source: 'consultation' | 'lead_form' | 'scorecard' | 'pilot',
                         f: { name?: string; email: string; company?: string; phone?: string; message?: string }) {
  track('consultation', source);
  if (!supabase || !f.email) return;
  supabase.from('leads').insert({
    source, visitor_id: visitorId(), full_name: f.name || null, email: f.email.trim().toLowerCase(),
    company: f.company || null, phone: f.phone ? f.phone.trim().slice(0, 40) : null,
    message: f.message ? f.message.slice(0, 3900) : null,
  }).then(({ error }) => {
    if (error) { console.warn('lead', error.message); return; }
    supabase!.functions.invoke(LEAD_NOTIFY_FUNCTION, { body: {} }).then(() => undefined, () => undefined);
  });
}
