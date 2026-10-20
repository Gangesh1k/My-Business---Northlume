// NorthLume AI — email you as soon as someone sends a form on the website.
// Supabase → Edge Functions → Deploy a new function → name: lead-notify → paste this file → Deploy.
// Then in the function's Details/Settings turn OFF "Verify JWT" (visitors aren't signed in).
// Secrets (Edge Functions → Secrets): NOTIFY_SMTP_USER (gangesh@northlumeai.com), NOTIFY_SMTP_PASS (a Google App password),
//                                     NOTIFY_TO (where alerts go, e.g. sales@northlumeai.com).
// Safe to call from the browser: it only ever emails leads that are already in the database and not yet notified.
import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const LABEL: Record<string, string> = { consultation: 'Consultation booking', lead_form: 'Contact form', scorecard: 'Scorecard', pilot: 'Pilot request' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = Deno.env.get('NOTIFY_SMTP_USER'), pass = (Deno.env.get('NOTIFY_SMTP_PASS') ?? '').replace(/\s/g, '');
    const to = Deno.env.get('NOTIFY_TO') || user;
    if (!user || !pass) return json({ ok: false, error: 'not configured' }, 200);
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // claim new leads from the last day (atomic: two calls at once can't both email the same lead)
    const since = new Date(Date.now() - 864e5).toISOString();
    const { data: claimed, error } = await db.from('leads').update({ notified_at: new Date().toISOString() })
      .is('notified_at', null).gte('created_at', since).select('id,source,full_name,email,company,phone,message,created_at');
    if (error) return json({ ok: false, error: error.message }, 500);
    if (!claimed?.length) return json({ ok: true, sent: 0 });

    const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
    let sent = 0;
    for (const l of claimed) {
      const when = new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
      const who = l.full_name || l.email;
      const rows: [string, string][] = [['Name', l.full_name ?? ''], ['Email', l.email], ['Phone', l.phone ?? '—'], ['Company', l.company ?? '—'],
        ['Form', LABEL[l.source] ?? l.source], ['Received', `${when} IST`]];
      const text = `New ${LABEL[l.source] ?? 'lead'} on northlumeai.com\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nMessage:\n${l.message ?? '—'}\n\n`
        + `Just hit Reply to answer ${who} directly.\nAll leads: https://northlumeai.com/#admin\n`;
      const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
        <p style="margin:0 0 8px"><b>New ${esc(LABEL[l.source] ?? 'lead')}</b> on northlumeai.com</p>
        <table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#666">${k}</td><td style="padding:3px 0">${esc(v)}</td></tr>`).join('')}</table>
        <p style="margin:12px 0 4px;color:#666">Message</p><div style="white-space:pre-wrap;border-left:3px solid #0d9488;padding:6px 10px;background:#f6f7f9">${esc(l.message ?? '—')}</div>
        <p style="margin:14px 0 0">Just hit <b>Reply</b> to answer ${esc(who)} directly · <a href="https://northlumeai.com/#admin">All leads</a></p></div>`;
      try {
        await mail.sendMail({ from: `"NorthLume Website" <${user}>`, to, replyTo: l.full_name ? `"${l.full_name.replace(/"/g, '')}" <${l.email}>` : l.email,
          subject: `New lead: ${who}${l.company ? ` (${l.company})` : ''} — ${LABEL[l.source] ?? l.source}`, text, html });
        sent++;
      } catch (e) {
        await db.from('leads').update({ notified_at: null }).eq('id', l.id);   // try again on the next call
        console.error('mail failed', l.id, String(e));
      }
    }
    return json({ ok: true, sent });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
