import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Mail, Phone, MessageCircle, Copy, Check } from 'lucide-react';
import { Label } from '../components/demos/kit';
import { siteConfig } from '../config/site';

export interface LeadRow {
  id?: number; source: string; name: string | null; email: string; company: string | null; phone?: string | null;
  message: string | null; created_at: string; notified_at?: string | null;
}
const LABEL: Record<string, string> = { consultation: 'Consultation', lead_form: 'Contact form', scorecard: 'Scorecard', pilot: 'Pilot' };
const when = (s: string) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const topic = (l: LeadRow) => (l.message ?? '').split(' — ')[0].replace(/^Regarding:\s*/, '').trim() || LABEL[l.source] || 'your enquiry';
/** what they typed themselves, without the topic the form pre-filled */
const ownWords = (l: LeadRow) => (l.message ?? '').split(' — ').slice(1).join(' — ').replace(/^Regarding:[^\n]*\n*/, '').trim();

function replyDraft(l: LeadRow) {
  const first = (l.name ?? '').trim().split(/\s+/)[0] || 'there';
  const subject = `Your ${topic(l)} request — NorthLume AI`;
  const body = `Hi ${first},\n\nThanks for reaching out about ${topic(l)} on our website.\n\n`
    + (ownWords(l) ? `You mentioned: "${ownWords(l).slice(0, 200)}". ` : '')
    + `To make our 30-minute call useful, could you share a line on what ${l.company || 'your company'} does and which process takes your team the most time today?\n\n`
    + `A few slots that work for me: [day/time], [day/time], [day/time] IST — or reply with a time that suits you and I'll send an invite.\n\nBest regards,\nGangesh\nNorthLume AI`;
  return { subject, body };
}
const gmailUrl = (l: LeadRow) => {
  const { subject, body } = replyDraft(l);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(l.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
const digits = (p?: string | null) => (p ?? '').replace(/[^\d+]/g, '');
const waNumber = (p?: string | null) => { const d = digits(p).replace(/^\+/, ''); return d.length === 10 ? '91' + d : d; };

export const LeadsPanel: React.FC<{ rows: LeadRow[] }> = ({ rows }) => {
  const [open, setOpen] = useState<number | null>(0);
  const [copied, setCopied] = useState('');
  const copy = (t: string) => { navigator.clipboard?.writeText(t); setCopied(t); setTimeout(() => setCopied(''), 1500); };
  const btn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold';
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <Label>Leads from forms</Label>
      {rows.length ? (
        <div className="divide-y divide-slate-100">
          {rows.slice(0, 100).map((l, i) => {
            const isOpen = open === i, own = ownWords(l);
            return (
              <div key={l.id ?? i}>
                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full text-left py-2.5 flex items-start gap-2 hover:bg-slate-50 rounded-lg px-1">
                  {isOpen ? <ChevronDown className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />}
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[110px_1fr_1fr_1.4fr] gap-x-3 text-xs">
                    <span className="text-slate-500">{when(l.created_at)}</span>
                    <span className="font-semibold text-slate-900 truncate">{l.name || '—'}{l.company ? <span className="font-normal text-slate-500"> · {l.company}</span> : null}</span>
                    <span className="text-slate-700 truncate">{l.email}</span>
                    <span className="text-slate-600 truncate"><span className="px-1.5 mr-1.5 rounded bg-teal-50 text-teal-700 text-[10px] font-bold">{LABEL[l.source] ?? l.source}</span>{topic(l)}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="pl-7 pb-4 pr-2 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      {([['Name', l.name], ['Email', l.email], ['Phone', l.phone], ['Company', l.company]] as [string, string | null | undefined][]).map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
                          <div className="flex items-center justify-between gap-2 text-slate-900 font-medium break-all">{v || <span className="text-slate-400 font-normal">not given</span>}
                            {v && (k === 'Email' || k === 'Phone') && <button onClick={() => copy(v)} aria-label={`Copy ${k}`} className="text-slate-400 hover:text-slate-700">{copied === v ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>}</div>
                        </div>))}
                    </div>
                    <div className="text-xs">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Message</div>
                      <div className="whitespace-pre-wrap rounded-xl border-l-4 border-teal-500 bg-slate-50 px-3 py-2 text-slate-800">
                        <b>{topic(l)}</b>{own ? <><br />{own}</> : <span className="text-slate-500"> — no extra details typed; they picked this topic on the website.</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={gmailUrl(l)} target="_blank" rel="noopener noreferrer" className={`${btn} bg-teal-600 text-white`}><Mail className="w-3.5 h-3.5" /> Reply in Gmail</a>
                      {l.phone && <a href={`https://wa.me/${waNumber(l.phone)}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-emerald-600 text-white`}><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>}
                      {l.phone && <a href={`tel:${digits(l.phone)}`} className={`${btn} border border-slate-300 text-slate-700`}><Phone className="w-3.5 h-3.5" /> Call</a>}
                      <button onClick={() => { const { subject, body } = replyDraft(l); copy(`Subject: ${subject}\n\n${body}`); }} className={`${btn} border border-slate-300 text-slate-700`}><Copy className="w-3.5 h-3.5" /> Copy reply draft</button>
                    </div>
                    <p className="text-[11px] text-slate-500">"Reply in Gmail" opens a ready draft. In Gmail, set <b>From</b> to {siteConfig.contact.email} before sending.{l.notified_at ? ` Email alert sent ${when(l.notified_at)}.` : ''}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : <p className="text-sm text-slate-500">No leads yet.</p>}
    </div>
  );
};
