import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Label } from '../components/demos/kit';

export interface VisitorRow {
  id: string; email: string | null; name: string | null; company: string | null; is_admin: boolean;
  first_seen: string; last_seen: string; visits: number; secs: number; pages: number; demos: number; clicks: number;
  sections: string[]; device: string | null; city: string | null; region: string | null; country: string | null;
  timezone: string | null; language: string | null; source: string | null; campaign: string | null;
  sessions: { started: string; secs: number; pages: number; sections: string[]; demos: number }[];
}

export const dur = (s: number) => {
  s = Math.max(0, Math.round(s || 0));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}h ${m}m` : `${m}m ${String(r).padStart(2, '0')}s`;
};
export const place = (v: VisitorRow) => [v.city, v.country].filter(Boolean).join(', ') || (v.timezone ? v.timezone.split('/').pop()!.replace(/_/g, ' ') + ' (time zone)' : '—');
const when = (s: string) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const DeviceIcon: React.FC<{ d: string | null }> = ({ d }) => {
  const I = d === 'mobile' ? Smartphone : d === 'tablet' ? Tablet : Monitor;
  return <I className="w-3.5 h-3.5 text-slate-400" aria-label={d ?? 'device'} />;
};

export const VisitorsPanel: React.FC<{ rows: VisitorRow[] }> = ({ rows }) => {
  const [hideMe, setHideMe] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [onlyKnown, setOnlyKnown] = useState(false);
  const list = useMemo(() => rows.filter(v => (!hideMe || !v.is_admin) && (!onlyKnown || v.email)
    && (!q || [v.email, v.name, v.company, v.city, v.country, v.source, v.campaign].join(' ').toLowerCase().includes(q.toLowerCase()))), [rows, hideMe, q, onlyKnown]);
  const shown = list.slice(0, 200);
  const totalSecs = list.reduce((t, v) => t + v.secs, 0), totalVisits = list.reduce((t, v) => t + v.visits, 0);
  const returning = list.filter(v => v.visits > 1).length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <Label>Visitors — who came, when, from where, and for how long</Label>
          <div className="flex flex-wrap gap-2 text-xs mt-1">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{list.length} visitors</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{returning} came back more than once</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">avg {dur(totalVisits ? totalSecs / totalVisits : 0)} per visit</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search email, company, city, source" className="px-3 py-1.5 rounded-full border border-slate-200 w-56" />
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={onlyKnown} onChange={e => setOnlyKnown(e.target.checked)} /> Registered only</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={hideMe} onChange={e => setHideMe(e.target.checked)} /> Hide my own visits</label>
        </div>
      </div>
      {shown.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-slate-500 border-b border-slate-200">
              {['', 'Visitor', 'Location', 'Came from', 'First visit', 'Last visit', 'Visits', 'Time on site', 'Pages', 'Demos', 'Looked at'].map((h, i) =>
                <th key={i} className={`py-1.5 pr-3 font-semibold whitespace-nowrap ${i >= 6 && i <= 9 ? 'text-right' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {shown.map((v, i) => {
                const key = v.id + i, isOpen = open === key;
                return (
                  <React.Fragment key={key}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setOpen(isOpen ? null : key)}>
                      <td className="py-1.5 pr-1 text-slate-400">{isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><DeviceIcon d={v.device} />
                          {v.email ? <span className="font-semibold text-slate-900">{v.name || v.email}</span> : <span className="text-slate-500">Anonymous · {v.id}</span>}
                          {v.is_admin && <span className="px-1.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">you</span>}</div>
                        {v.email && <div className="text-[11px] text-slate-500">{v.name ? v.email : ''}{v.company ? ` · ${v.company}` : ''}</div>}
                      </td>
                      <td className="py-1.5 pr-3 whitespace-nowrap"><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{place(v)}</span></td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{v.source ?? '—'}{v.campaign ? <span className="text-slate-400"> · {v.campaign}</span> : null}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{when(v.first_seen)}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{when(v.last_seen)}</td>
                      <td className="py-1.5 pr-3 text-right font-mono">{v.visits}</td>
                      <td className="py-1.5 pr-3 text-right font-mono">{dur(v.secs)}</td>
                      <td className="py-1.5 pr-3 text-right font-mono">{v.pages}</td>
                      <td className="py-1.5 pr-3 text-right font-mono">{v.demos}</td>
                      <td className="py-1.5 pr-3 text-slate-600 max-w-[260px] truncate" title={v.sections.join(', ')}>{v.sections.join(', ') || '—'}</td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50 border-b border-slate-100"><td></td><td colSpan={10} className="py-2 pr-3">
                        <div className="text-[11px] text-slate-500 mb-1">
                          {v.device ?? 'unknown device'} · {v.language ?? ''} · {v.timezone ?? ''}{v.region ? ` · region ${v.region}` : ''} · {v.clicks} button clicks
                        </div>
                        <table className="text-[11px]"><thead><tr className="text-slate-500"><th className="pr-4 text-left font-semibold">Visit started</th><th className="pr-4 text-right font-semibold">Stayed</th><th className="pr-4 text-right font-semibold">Pages</th><th className="pr-4 text-right font-semibold">Demos</th><th className="text-left font-semibold">Sections seen</th></tr></thead>
                          <tbody>{v.sessions.map((s, j) => <tr key={j}><td className="pr-4">{when(s.started)}</td><td className="pr-4 text-right font-mono">{dur(s.secs)}</td><td className="pr-4 text-right font-mono">{s.pages}</td><td className="pr-4 text-right font-mono">{s.demos}</td><td className="text-slate-600">{(s.sections || []).join(', ') || '—'}</td></tr>)}</tbody>
                        </table>
                        {v.visits > v.sessions.length && <div className="text-[11px] text-slate-400 mt-1">Showing the latest {v.sessions.length} of {v.visits} visits.</div>}
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {list.length > shown.length && <div className="text-[11px] text-slate-400 mt-1">+ {list.length - shown.length} more in the Excel download</div>}
        </div>
      ) : <p className="text-sm text-slate-500">No visitors in this period yet.</p>}
      <p className="text-[11px] text-slate-500 mt-2">Anonymous visitors appear by a random browser id; the name and email show once they register. Location is approximate (city, from the internet connection) and is recorded from today onwards; older visits show the time zone instead. Time on site counts only while the page is open in front of them.</p>
    </div>
  );
};
