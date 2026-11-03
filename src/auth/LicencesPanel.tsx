import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus, Pause, Play, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Label } from '../components/demos/kit';

interface Row { email: string; company: string | null; feature: string; license_key: string; units: number; valid_until: string; active: boolean; last_check_at: string | null; checks: number; created_at: string }
const when = (s: string | null) => (s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const day = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const LicencesPanel: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ email: '', company: '', days: 31, units: 3 });
  const [copied, setCopied] = useState('');
  const load = useCallback(async () => {
    const { data, error } = await supabase!.rpc('admin_entitlements');
    if (error) setErr(error.message.includes('admin_entitlements') ? 'Run supabase/sap-recon.sql in Supabase to switch on licences.' : error.message);
    else { setErr(''); setRows((data as Row[]) ?? []); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase!.rpc('admin_grant_entitlement', { p_email: f.email, p_feature: 'sap_recon', p_days: f.days, p_units: f.units, p_company: f.company || null });
    if (error) alert(error.message); else { setF({ ...f, email: '', company: '' }); load(); }
  };
  const toggle = async (r: Row) => { await supabase!.rpc('admin_set_entitlement_active', { p_key: r.license_key, p_active: !r.active }); load(); };
  const copy = (k: string) => { navigator.clipboard?.writeText(k); setCopied(k); setTimeout(() => setCopied(''), 1500); };
  const today = new Date().toISOString().slice(0, 10);
  const input = 'px-3 py-1.5 rounded-full border border-slate-200 text-xs';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <Label>SAP reconciliation licences</Label>
        <form onSubmit={grant} className="flex flex-wrap items-center gap-2">
          <input required type="email" placeholder="client email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className={`${input} w-48`} />
          <input placeholder="company" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} className={`${input} w-32`} />
          <select value={f.days} onChange={e => setF({ ...f, days: +e.target.value })} className={input}>{[[14, '14-day pilot'], [31, '1 month'], [92, '3 months'], [366, '1 year']].map(([d, l]) => <option key={d} value={d}>{l}</option>)}</select>
          <select value={f.units} onChange={e => setF({ ...f, units: +e.target.value })} className={input}>{[1, 2, 3, 5, 10, 20].map(n => <option key={n} value={n}>{n} bank accts</option>)}</select>
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold"><Plus className="w-3.5 h-3.5" />Grant / extend</button>
        </form>
      </div>
      {err ? <p className="text-sm text-amber-700">{err}</p> : rows.length ? (
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="text-left text-slate-500 border-b border-slate-200">{['Client', 'Licence key', 'Valid until', 'Accounts', 'Status', 'Last used by the tool', ''].map(h => <th key={h} className="py-1.5 pr-3 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>{rows.map(r => {
            const live = r.active && r.valid_until >= today;
            return (
              <tr key={r.license_key} className="border-b border-slate-100">
                <td className="py-1.5 pr-3"><div className="font-semibold text-slate-900">{r.company || r.email}</div>{r.company && <div className="text-[11px] text-slate-500">{r.email}</div>}</td>
                <td className="py-1.5 pr-3 whitespace-nowrap"><span className="inline-flex items-center gap-1 font-mono"><KeyRound className="w-3 h-3 text-slate-400" />{r.license_key}
                  <button onClick={() => copy(r.license_key)} aria-label="Copy" className="text-slate-400 hover:text-slate-700">{copied === r.license_key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button></span></td>
                <td className="py-1.5 pr-3 whitespace-nowrap">{day(r.valid_until)}</td>
                <td className="py-1.5 pr-3">{r.units}</td>
                <td className="py-1.5 pr-3"><span className={`px-1.5 rounded text-[10px] font-bold ${live ? 'bg-emerald-100 text-emerald-700' : !r.active ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{live ? 'active' : !r.active ? 'paused' : 'expired'}</span></td>
                <td className="py-1.5 pr-3 whitespace-nowrap">{when(r.last_check_at)}{r.checks ? <span className="text-slate-400"> · {r.checks} runs</span> : null}</td>
                <td className="py-1.5"><button onClick={() => toggle(r)} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-slate-300 text-slate-600">{r.active ? <><Pause className="w-3 h-3" />Pause</> : <><Play className="w-3 h-3" />Resume</>}</button></td>
              </tr>);
          })}</tbody>
        </table></div>
      ) : <p className="text-sm text-slate-500">No licences yet. They are created automatically when a client pays for Live SAP Bank Reconciliation, or grant one here for a pilot.</p>}
    </div>
  );
};
