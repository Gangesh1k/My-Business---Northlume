import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Loader2, Send } from 'lucide-react';
import { supabase, ToolId, TOOL_LABELS } from '../lib/supabase';
import { track } from '../lib/track';
import { siteConfig } from '../config/site';
import { useAccess } from './AccessProvider';
import { CurrencyToggle } from '../components/CurrencyToggle';
import { Currency, DEFAULT_PLANS, PricePlan, defaultCurrency, loadPlans, price } from '../lib/payments';

interface Props { tool?: ToolId; email: string; userId?: string; onClose: () => void }

const PLANS = [
  { id: 'pro', name: 'Pro', blurb: 'Unlimited runs of all 6 tools on your own files, here on the website.', points: ['All 6 automation tools', 'Unlimited runs on your files', 'Excel & PDF downloads', 'Email support'] },
  { id: 'business', name: 'Business', blurb: 'We set the automations up on your own inbox, folders and systems.', points: ['Everything in Pro', 'Runs automatically on your mailbox / ERP', 'Your own dashboard & alerts', 'Setup, monitoring & monthly review'] },
];

export const SubscribeModal: React.FC<Props> = ({ tool, email, userId, onClose }) => {
  const [plan, setPlan] = useState<'pro' | 'business'>('pro');
  const [form, setForm] = useState({ email, full_name: '', company: '', phone: '', message: '' });
  const [tools, setTools] = useState<ToolId[]>(tool ? [tool] : []);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const { pay } = useAccess();
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [plans, setPlans] = useState<PricePlan[]>(DEFAULT_PLANS);
  const [showForm, setShowForm] = useState(false);
  React.useEffect(() => { loadPlans().then(setPlans); }, []);
  const pp = (id: string) => plans.find(p => p.id === id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) { setErr('Please enter a valid email.'); return; }
    setBusy(true);
    const { error } = await supabase!.from('subscription_requests').insert({
      user_id: userId ?? null, email: form.email.trim().toLowerCase(), full_name: form.full_name || null, company: form.company || null,
      phone: form.phone || null, plan_interest: plan, tools, message: form.message || null,
    });
    setBusy(false);
    if (error) { setErr('Could not send right now — please email us at ' + siteConfig.contact.email); return; }
    track('subscribe_request', plan, tools.join(','));
    setDone(true);
  };

  const input = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-500';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Close"><X className="w-5 h-5" /></button>
        {done ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
            <h3 className="text-xl font-extrabold text-slate-900">Request received</h3>
            <p className="text-sm text-slate-600">Thank you. We'll email <b>{form.email}</b> within one business day with pricing and next steps.</p>
            <button onClick={onClose} className="mt-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider"><Sparkles className="w-3.5 h-3.5" /> Subscribe</div>
            <h3 className="text-xl font-extrabold text-slate-900">{tool ? `You've used your free ${TOOL_LABELS[tool]} run` : 'Subscribe to NorthLume AI'}</h3>
            <p className="text-sm text-slate-600">Subscribe to keep using the tools on your own files, or have them running automatically on your systems. The sample demos stay free.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANS.map(p => (
                <button type="button" key={p.id} onClick={() => setPlan(p.id as 'pro' | 'business')}
                  className={`text-left rounded-2xl border p-4 transition-all ${plan === p.id ? 'border-slate-900 ring-2 ring-teal-500/30 bg-white' : 'border-slate-200 bg-slate-50 hover:bg-white'}`}>
                  <div className="text-sm font-extrabold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{p.blurb}</div>
                  <ul className="mt-2 space-y-1">{p.points.map(x => <li key={x} className="flex gap-1.5 text-xs text-slate-700"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-px" />{x}</li>)}</ul>
                </button>
              ))}
            </div>
            {plan === 'pro' && !showForm ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-700">Pay online and start now</span><CurrencyToggle value={currency} onChange={setCurrency} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[['pro_monthly', '/ month', 'Cancel any time'], ['pro_yearly', '/ year', 'Save 10%']].map(([id, per, note]) => (
                    <button type="button" key={id} onClick={() => pay(id as any, currency, pp(id)?.name ?? 'Pro')}
                      className="rounded-2xl border border-slate-200 hover:border-teal-500 p-4 text-left bg-white">
                      <div><span className="text-xl font-extrabold text-slate-900">{price(pp(id), currency)}</span><span className="text-xs text-slate-500"> {per}</span></div>
                      <div className="text-[11px] text-slate-500">{note}</div>
                      <div className="mt-2 text-xs font-bold text-teal-700">Pay &amp; activate →</div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Secure checkout by Razorpay (UPI, cards, net banking; international cards in USD). Pro switches on instantly.</p>
                <button type="button" onClick={() => setShowForm(true)} className="text-xs text-slate-600 underline">Need an invoice or bank transfer instead? Request it here</button>
              </div>
            ) : (<>
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">Tools you're interested in</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TOOL_LABELS) as ToolId[]).map(t => (
                  <button type="button" key={t} onClick={() => setTools(v => v.includes(t) ? v.filter(x => x !== t) : [...v, t])}
                    className={`px-2.5 py-1 rounded-full text-xs border ${tools.includes(t) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200'}`}>{TOOL_LABELS[t]}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className={input} type="email" required placeholder="Work email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className={input} placeholder="Your name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              <input className={input} placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              <input className={input} placeholder="Phone / WhatsApp (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <textarea className={`${input} resize-none`} rows={3} placeholder="Which process would you like to automate? (optional)" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            {err && <p className="text-xs text-red-600">{err}</p>}
            <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-teal-400" />} Request {plan === 'pro' ? 'Pro' : 'Business'} subscription
            </button>
            <p className="text-[11px] text-slate-500 text-center">No payment now. We'll send pricing and an invoice; access is switched on as soon as it's confirmed.</p>
            </>)}
          </form>
        )}
      </div>
    </div>
  );
};
