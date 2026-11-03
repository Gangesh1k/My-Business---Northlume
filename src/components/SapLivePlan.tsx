import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Copy, Check, FolderUp, PlugZap, ShieldCheck, KeyRound, Loader2, Lock } from 'lucide-react';
import { useAccess } from '../auth/AccessProvider';
import { supabase } from '../lib/supabase';
import { Currency, DEFAULT_PLANS, PlanId, PricePlan, defaultCurrency, loadPlans, price } from '../lib/payments';
import { CurrencyToggle } from './CurrencyToggle';

interface Licence { feature: string; license_key: string; units: number; company: string | null; valid_until: string; active: boolean }

const HOW = [
  { icon: FolderUp, title: 'Scheduled file drop — no SAP access needed', text: 'Your IT schedules the FBL3N / FAGLL03 report as a daily background job (SM36) to a secure SFTP or SharePoint folder, next to the bank statement (MT940, CAMT.053 or CSV). We pick both up and reconcile.' },
  { icon: PlugZap, title: 'Or a read-only API connection', text: 'For fully hands-off runs we read G/L line items through SAP’s standard read APIs (OData on S/4HANA, RFC on ECC) with a read-only technical user limited to your bank accounts.' },
  { icon: ShieldCheck, title: 'Nothing posts without approval', text: 'Proposed entries come as an upload file your team posts (FEBAN / FB50 / F-28). No bank credentials, full audit trail, and hosting by us, in your cloud or on your own server.' },
];
const INCLUDED = ['Daily automatic reconciliation per bank account', 'Exceptions queue with reasons and ageing', 'Proposed postings with the SAP transaction to use', 'Month-end bank reconciliation statement (Excel)', 'Email summary to your finance team every run'];

export const SapLivePlan: React.FC<{ onOpenConsultation: () => void }> = ({ onOpenConsultation }) => {
  const { status, pay, paying } = useAccess();
  const [plans, setPlans] = useState<PricePlan[]>(DEFAULT_PLANS);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency());
  const [lic, setLic] = useState<Licence | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const plan = (id: PlanId) => plans.find(p => p.id === id);

  useEffect(() => { loadPlans().then(setPlans); }, []);
  const loadLicence = useCallback(async () => {
    if (!supabase || !status.signed_in) { setLic(null); return; }
    setChecking(true);
    const { data } = await supabase.rpc('my_entitlements');
    setLic(((data as Licence[] | null) ?? []).find(x => x.feature === 'sap_recon') ?? null);
    setChecking(false);
  }, [status.signed_in, status.plan_until]);
  useEffect(() => { loadLicence(); }, [loadLicence, paying]);

  const buy = async (id: PlanId) => { await pay(id, currency, plan(id)?.name ?? 'Live SAP Bank Reconciliation'); loadLicence(); };
  const until = lic ? new Date(lic.valid_until + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const copy = () => { if (lic) { navigator.clipboard?.writeText(lic.license_key); setCopied(true); setTimeout(() => setCopied(false), 1500); } };
  const btn = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-colors disabled:opacity-60';

  return (
    <div id="sap-go-live" className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-8 scroll-mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-teal-300">Go live with your SAP</div>
            <h3 className="text-2xl sm:text-3xl font-bold mt-1">The demo runs once. Live runs every day.</h3>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">The demo above is free and runs in your browser. The live service connects to your SAP and bank statements, reconciles automatically and keeps the history — switched on as soon as you subscribe.</p>
          </div>
          <div className="space-y-3">
            {HOW.map(h => { const I = h.icon; return (
              <div key={h.title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <I className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div><div className="text-sm font-bold">{h.title}</div><p className="text-xs text-slate-400 mt-1 leading-relaxed">{h.text}</p></div>
              </div>); })}
          </div>
          <p className="text-xs text-slate-400">Works with SAP ECC 6.0, S/4HANA (on-premise, RISE) and S/4HANA Cloud. Go-live is typically 2–3 weeks after your IT schedules the reports.</p>
        </div>

        <div className="lg:col-span-5">
          {lic ? (
            <div className="rounded-3xl bg-white text-slate-900 p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold">{lic.active ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-amber-600" />}
                {lic.active ? 'Live SAP Reconciliation is active' : 'Your licence has expired'}</div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1"><KeyRound className="w-3 h-3" />Licence key</div>
                <div className="flex items-center justify-between gap-2 mt-1"><code className="font-mono text-sm font-bold break-all">{lic.license_key}</code>
                  <button onClick={copy} aria-label="Copy licence key" className="text-slate-500 hover:text-slate-900">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></div>
                <div className="text-xs text-slate-500 mt-2">{lic.active ? 'Valid until' : 'Expired on'} <b>{until}</b> · {lic.units} bank accounts</div>
              </div>
              <p className="text-xs text-slate-600">We use this key to switch on the daily runs for your company. Our team will email you within one business day to schedule the SAP report and bank statement drop.</p>
              <div className="flex justify-center"><CurrencyToggle value={currency} onChange={setCurrency} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['sap_recon_monthly', 'sap_recon_yearly'] as PlanId[]).map(id => (
                  <button key={id} onClick={() => buy(id)} disabled={paying !== null} className={`${btn} ${id === 'sap_recon_yearly' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-800'}`}>
                    {paying === id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {lic.active ? 'Extend' : 'Renew'} {price(plan(id), currency)} / {id === 'sap_recon_yearly' ? 'year' : 'month'}
                  </button>))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white text-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">Live SAP Bank Reconciliation</div>
                <CurrencyToggle value={currency} onChange={setCurrency} />
              </div>
              <div>
                <div className="text-3xl font-extrabold tracking-tight">{price(plan('sap_recon_monthly'), currency)}<span className="text-sm font-semibold text-slate-500"> / month</span></div>
                <div className="text-xs text-slate-500 mt-1">+ one-time setup {price(plan('sap_recon_setup'), currency)} (includes the first month) · or {price(plan('sap_recon_yearly'), currency)} / year after setup (save 10%)</div>
                <div className="text-xs text-slate-500">1 company code, up to 3 bank accounts. More accounts on request.</div>
              </div>
              <ul className="space-y-1.5">{INCLUDED.map(x => <li key={x} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />{x}</li>)}</ul>
              <button onClick={() => buy('sap_recon_setup')} disabled={paying !== null || checking} className={`${btn} w-full bg-teal-600 hover:bg-teal-500 text-white`}>
                {paying === 'sap_recon_setup' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Pay setup {price(plan('sap_recon_setup'), currency)} &amp; go live
              </button>
              <button onClick={onOpenConsultation} className={`${btn} w-full border border-slate-300 text-slate-800`}>Talk to us first</button>
              <p className="text-[11px] text-slate-500">Secure payment by Razorpay. Your licence key appears here right after payment{status.signed_in ? '' : ' (you’ll sign in with your work email first)'}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
