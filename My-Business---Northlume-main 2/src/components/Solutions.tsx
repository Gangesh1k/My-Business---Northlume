import React, { useEffect, useState } from 'react';
import { solutionPackages } from '../data/siteData';
import { Check, ArrowRight, ShieldCheck, Loader2, Lock, Sparkles } from 'lucide-react';
import { useAccess } from '../auth/AccessProvider';
import { CurrencyToggle } from './CurrencyToggle';
import { Currency, DEFAULT_PLANS, PlanId, PricePlan, defaultCurrency, loadPlans, price } from '../lib/payments';

const PLAN_FOR: Record<string, PlanId> = { starter: 'starter', business: 'business', 'intelligent-ops': 'intelligent', custom: 'custom' };
const PRICE_NOTE: Record<string, string> = { starter: 'one-time project fee', business: 'one-time project fee', 'intelligent-ops': 'one-time project fee', custom: 'scoping deposit · adjusted in final quote' };


interface SolutionsProps {
  onSelectPlan: (planName: string) => void;
}

export const Solutions: React.FC<SolutionsProps> = ({ onSelectPlan }) => {
  const { pay, paying } = useAccess();
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [plans, setPlans] = useState<PricePlan[]>(DEFAULT_PLANS);
  useEffect(() => { loadPlans().then(setPlans); }, []);
  const plan = (id: PlanId) => plans.find(p => p.id === id);
  const monthly = plan('pro_monthly'), yearly = plan('pro_yearly');
  return (
    <section id="solutions" className="py-14 md:py-20 bg-slate-50 relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <span>Engagement Models</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            From Manual Process to Intelligent Workflow
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Tailored engagement structures calibrated to your team&apos;s current operational complexity — whether you need to fix one painful spreadsheet bottleneck or overhaul cross-functional operations.
          </p>
        </div>

        <div className="flex justify-center mb-6"><CurrencyToggle value={currency} onChange={setCurrency} /></div>

        {/* 4 Solution Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutionPackages.map((pkg) => {
            const isPopular = pkg.id === 'business';

            return (
              <div
                key={pkg.id}
                className={`rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                  isPopular
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl ring-2 ring-teal-500/30'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Popular / Tier Badge */}
                {pkg.badge && (
                  <div className="mb-4">
                    <span
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
                        isPopular
                          ? 'bg-teal-500 text-slate-950'
                          : 'bg-teal-50 text-teal-700 border border-teal-100'
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Tier Title */}
                  <h3
                    className={`text-lg font-bold tracking-tight mb-2 ${
                      isPopular ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {pkg.tier}
                  </h3>

                  {/* Price */}
                  <div className="mb-3">
                    <span className={`text-2xl font-extrabold tracking-tight ${isPopular ? 'text-white' : 'text-slate-900'}`}>{price(plan(PLAN_FOR[pkg.id]), currency)}</span>
                    <span className={`block text-[11px] ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{PRICE_NOTE[pkg.id]}</span>
                  </div>

                  {/* Ideal For description */}
                  <p
                    className={`text-xs leading-relaxed mb-6 ${
                      isPopular ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {pkg.idealFor}
                  </p>

                  {/* Deliverable highlight */}
                  <div
                    className={`p-3 rounded-2xl mb-6 text-xs font-medium ${
                      isPopular
                        ? 'bg-slate-800/90 text-teal-300 border border-slate-700'
                        : 'bg-slate-50 text-slate-800 border border-slate-100'
                    }`}
                  >
                    <span className="text-[10px] uppercase block text-slate-400 font-bold">
                      Outcome:
                    </span>
                    {pkg.deliverables}
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-8">
                    <p
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                        isPopular ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Includes:
                    </p>
                    <ul className="space-y-2 text-xs">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isPopular ? 'text-teal-400' : 'text-teal-600'
                            }`}
                          />
                          <span className={isPopular ? 'text-slate-200' : 'text-slate-700'}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA: pay now, or talk first */}
                <div className="space-y-2">
                  <button
                    onClick={() => pay(PLAN_FOR[pkg.id], currency, plan(PLAN_FOR[pkg.id])?.name ?? pkg.tier)}
                    disabled={paying !== null}
                    className={`w-full py-3 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                      isPopular ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                    }`}
                  >
                    {paying === PLAN_FOR[pkg.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{pkg.id === 'custom' ? 'Pay deposit' : 'Pay'} {price(plan(PLAN_FOR[pkg.id]), currency)} &amp; start</span>
                  </button>
                  <button onClick={() => onSelectPlan(pkg.tier)}
                    className={`w-full py-2 text-[11px] font-semibold flex items-center justify-center gap-1 ${isPopular ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                    {pkg.ctaText.replace('Explore', 'Or book a free call —').replace('Talk to Us', 'Or talk to us first').replace('Discuss Your Requirement', 'Or discuss your requirement')}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Self-serve website plan */}
        <div className="mt-8 rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-teal-700"><Sparkles className="w-3.5 h-3.5" /> Self-serve · Pro plan</div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Use the tools yourself on this website</h3>
            <p className="text-xs text-slate-600 mt-1">The demos are free, and each email gets one free run per tool. Pro unlocks unlimited runs of all 6 tools on your own files, with Excel downloads.</p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[{ p: monthly, id: 'pro_monthly' as PlanId, per: '/ month', note: 'Cancel any time' }, { p: yearly, id: 'pro_yearly' as PlanId, per: '/ year', note: 'Save 10% vs monthly' }].map(x => (
              <div key={x.id} className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col gap-2">
                <div><span className="text-2xl font-extrabold text-slate-900">{price(x.p, currency)}</span><span className="text-xs text-slate-500"> {x.per}</span></div>
                <div className="text-[11px] text-slate-500">{x.note}</div>
                <button onClick={() => pay(x.id, currency, x.p?.name ?? 'Pro')} disabled={paying !== null}
                  className="mt-auto w-full py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  {paying === x.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />} Pay &amp; activate Pro
                </button>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-500">Secure payments by Razorpay — UPI, cards, net banking and wallets in India; international cards in USD. Access switches on as soon as the payment succeeds.</p>

        {/* Scope Note */}
        <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-200 max-w-2xl mx-auto flex items-center gap-3 text-xs text-slate-600 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
          <span>
            Every engagement begins with a no-risk operational assessment to quantify time saved and verify technical viability before building.
          </span>
        </div>
      </div>
    </section>
  );
};
