import React, { useCallback, useEffect, useState } from 'react';
import { X, RefreshCw, Users, Eye, MousePointerClick, Crown, Inbox, Download, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAccess } from './AccessProvider';
import { downloadXlsx, LineChart, Bars, MiniTable, Label } from '../components/demos/kit';

interface Dash {
  visitors: number; sessions: number; page_views: number; signups: number; paid: number; requests_new: number;
  by_day: { day: string; visitors: number }[]; top_sections: { section: string; views: number }[];
  sources: { source: string; visitors: number }[]; demo_runs: { tool: string; runs: number }[];
  users: { email: string; name: string | null; company: string | null; plan: string; created_at: string; last_seen_at: string; runs: number; blocked: number; visits: number }[];
  requests: { id: number; email: string; name: string | null; company: string | null; plan: string | null; tools: string[]; message: string | null; status: string; created_at: string }[];
  leads: { source: string; name: string | null; email: string; company: string | null; message: string | null; created_at: string }[];
}
const d = (s: string) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { ready, status, openLogin } = useAccess();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !status.is_admin) return;
    setBusy(true); setErr('');
    const { data: res, error } = await supabase.rpc('admin_dashboard', { p_days: days });
    setBusy(false);
    if (error) setErr(error.message); else setData(res as Dash);
  }, [days, status.is_admin]);
  useEffect(() => { load(); }, [load]);

  const activate = async (email: string, plan: 'pro' | 'business' | 'free') => {
    const until = plan === 'free' ? null : new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
    const { error } = await supabase!.rpc('admin_set_plan', { p_email: email, p_plan: plan, p_until: until });
    if (error) alert(error.message); else load();
  };
  const setReq = async (id: number, s: string) => { await supabase!.from('subscription_requests').update({ status: s }).eq('id', id); load(); };

  const shell = (body: React.ReactNode) => (
    <div className="fixed inset-0 z-[55] bg-slate-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div><div className="text-[11px] font-mono uppercase tracking-wider text-teal-700">NorthLume AI · private</div><h1 className="text-2xl font-extrabold text-slate-900">Admin dashboard</h1></div>
          <div className="flex items-center gap-2">
            {data && <select value={days} onChange={e => setDays(+e.target.value)} className="px-3 py-2 rounded-full border border-slate-200 text-sm bg-white">
              {[7, 30, 90, 365].map(n => <option key={n} value={n}>Last {n} days</option>)}</select>}
            {data && <button onClick={load} className="p-2 rounded-full border border-slate-200 bg-white" aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /></button>}
            <button onClick={onClose} className="p-2 rounded-full border border-slate-200 bg-white" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
        </div>
        {body}
      </div>
    </div>
  );

  if (!ready) return shell(<p className="text-sm text-slate-600">The database isn't connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy.</p>);
  if (!status.signed_in) return shell(<button onClick={openLogin} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold"><LogIn className="w-4 h-4" /> Sign in with your admin email</button>);
  if (!status.is_admin) return shell(<p className="text-sm text-slate-600">{status.email} is not an admin account.</p>);
  if (err) return shell(<p className="text-sm text-red-600">{err}</p>);
  if (!data) return shell(<p className="text-sm text-slate-500">Loading…</p>);

  const card = 'rounded-3xl border border-slate-200 bg-white p-5';
  const exportAll = () => downloadXlsx(`NorthLumeAI_admin_${new Date().toISOString().slice(0, 10)}.xlsx`, [
    { name: 'Users', header: ['Email', 'Name', 'Company', 'Plan', 'Registered', 'Last seen', 'Free runs used', 'Blocked (asked to subscribe)', 'Sessions'],
      rows: data.users.map(u => [u.email, u.name, u.company, u.plan, new Date(u.created_at), new Date(u.last_seen_at), u.runs, u.blocked, u.visits]) },
    { name: 'Subscription requests', header: ['Date', 'Email', 'Name', 'Company', 'Plan', 'Tools', 'Message', 'Status'],
      rows: data.requests.map(r => [new Date(r.created_at), r.email, r.name, r.company, r.plan, r.tools.join(', '), r.message, r.status]) },
    { name: 'Leads', header: ['Date', 'Source', 'Name', 'Email', 'Company', 'Message'], rows: data.leads.map(l => [new Date(l.created_at), l.source, l.name, l.email, l.company, l.message]) },
    { name: 'Traffic sources', header: ['Source', 'Visitors'], rows: data.sources.map(s => [s.source, s.visitors]) },
  ]);

  return shell(<>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {[[Eye, 'Visitors', data.visitors], [MousePointerClick, 'Sessions', data.sessions], [Eye, 'Page views', data.page_views],
        [Users, 'Registered', data.signups], [Crown, 'Paid accounts', data.paid], [Inbox, 'New sub. requests', data.requests_new]].map(([Icon, l, v]) => {
        const I = Icon as React.ElementType;
        return <div key={l as string} className={card + ' !p-4'}><div className="flex items-center gap-1.5 text-[11px] text-slate-500"><I className="w-3.5 h-3.5 text-teal-600" />{l as string}</div><div className="text-2xl font-extrabold text-slate-900">{v as number}</div></div>;
      })}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className={card + ' lg:col-span-2'}><Label>Unique visitors per day</Label>
        {data.by_day.length > 1 ? <LineChart labels={data.by_day.map(x => x.day.slice(5))} series={[{ name: 'Visitors', values: data.by_day.map(x => x.visitors) }]} /> : <p className="text-sm text-slate-500">Not enough data yet.</p>}</div>
      <div className={card}><Bars title="Where visitors come from" rows={data.sources.map(s => ({ label: s.source, value: s.visitors }))} /></div>
      <div className={card}><Bars title="Most viewed sections" rows={data.top_sections.map(s => ({ label: s.section, value: s.views }))} /></div>
      <div className={card}><Bars title="Demo & tool runs" rows={data.demo_runs.map(s => ({ label: s.tool ?? '—', value: s.runs }))} /></div>
      <div className={card + ' flex flex-col justify-between'}><div><Label>Export</Label><p className="text-sm text-slate-600">Download users, subscription requests, leads and traffic sources as Excel.</p></div>
        <button onClick={exportAll} className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-teal-600 text-white text-sm font-semibold"><Download className="w-4 h-4" /> Download Excel</button></div>
    </div>
    <div className={card}><Label>Subscription requests</Label>
      <MiniTable max={50} head={['Date', 'Email', 'Company', 'Plan', 'Tools', 'Status', 'Actions']}
        rows={data.requests.map(r => [d(r.created_at), r.email, r.company ?? '', r.plan ?? '', r.tools.join(', '),
          <select value={r.status} onChange={e => setReq(r.id, e.target.value)} className="text-xs border border-slate-200 rounded-lg px-1.5 py-0.5">{['new', 'contacted', 'won', 'lost'].map(s => <option key={s}>{s}</option>)}</select>,
          <span className="flex gap-1"><button onClick={() => activate(r.email, 'pro')} className="text-[11px] px-2 py-0.5 rounded-full bg-teal-600 text-white">Activate Pro</button><button onClick={() => activate(r.email, 'business')} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-white">Business</button></span>])} /></div>
    <div className={card}><Label>Registered users</Label>
      <MiniTable max={100} head={['Email', 'Name', 'Company', 'Plan', 'Registered', 'Last seen', 'Runs', 'Asked to subscribe', 'Sessions', '']} align={['l', 'l', 'l', 'l', 'l', 'l', 'r', 'r', 'r', 'l']}
        rows={data.users.map(u => [u.email, u.name ?? '', u.company ?? '', u.plan, d(u.created_at), d(u.last_seen_at), String(u.runs), String(u.blocked), String(u.visits),
          u.plan === 'free' ? <button onClick={() => activate(u.email, 'pro')} className="text-[11px] px-2 py-0.5 rounded-full border border-teal-600 text-teal-700">Give Pro</button>
            : <button onClick={() => activate(u.email, 'free')} className="text-[11px] px-2 py-0.5 rounded-full border border-slate-300 text-slate-600">Set free</button>])} /></div>
    <div className={card}><Label>Leads from forms</Label>
      <MiniTable max={50} head={['Date', 'Source', 'Name', 'Email', 'Company', 'Message']} rows={data.leads.map(l => [d(l.created_at), l.source, l.name ?? '', l.email, l.company ?? '', l.message ?? ''])} /></div>
    <p className="text-[11px] text-slate-500">Anonymous visitors are counted by a random browser id; names and emails appear only for people who registered. Their earlier visits are linked to them once they register.</p>
  </>);
};
