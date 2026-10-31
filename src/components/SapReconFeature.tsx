import React, { useMemo } from 'react';
import { Landmark, PlayCircle, ArrowRight, GitCompareArrows, ShieldAlert, FileCheck2, Database, CheckCircle2 } from 'lucide-react';
import { money, r2, reconcile, sampleData } from '../lib/sapRecon';

interface Props { onTryDemo: () => void; onOpenConsultation: () => void }

const POINTS = [
  { icon: GitCompareArrows, title: 'Five matching passes', text: 'Reference, bank charges, invoice numbers in the narrative, F110 payment runs and lockbox batches (1:n), then amount within a date window.' },
  { icon: ShieldAlert, title: 'Every exception explained', text: 'Unidentified receipts, direct debits, bank charges, duplicates, stale cheques and timing items — each with a reason and a severity.' },
  { icon: FileCheck2, title: 'Postings proposed for you', text: 'Ready-to-approve entries with the SAP transaction to use (FEBAN, FB50, F-28, FB08). Nothing posts without approval.' },
  { icon: Database, title: 'Fits your SAP landscape', text: 'ECC 6.0 or S/4HANA. FBL3N / ACDOCA line items against MT940, CAMT.053 or BAI2 statements.' },
];

export const SapReconFeature: React.FC<Props> = ({ onTryDemo, onOpenConsultation }) => {
  const s = useMemo(() => {
    const d = sampleData(), res = reconcile(d, 3, 30);
    const matched = res.groups.reduce((n, g) => n + 1 + g.gl.length, 0), total = d.gl.length + d.bank.length;
    return { d, res, rate: (100 * matched) / total, exc: res.exceptions.filter(e => e.sev !== 'low').length, timing: res.exceptions.filter(e => e.sev === 'low').length };
  }, []);

  return (
    <section id="sap-bank-reconciliation" className="py-14 md:py-20 bg-slate-900 text-white relative overflow-hidden scroll-mt-16">
      <div className="absolute inset-0 opacity-[0.07] bg-grid-pattern invert pointer-events-none" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Landmark className="w-3.5 h-3.5" /><span>New · For SAP finance teams</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">SAP Bank Reconciliation, ready before month-end close</h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl">
            We match your SAP bank G/L account against the bank statement every day, explain each difference and prepare the postings. Your team reviews exceptions instead of ticking lines in Excel.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {POINTS.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2 text-sm font-bold"><Icon className="w-4 h-4 text-teal-400" />{p.title}</div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{p.text}</p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onTryDemo} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm transition-colors">
              <PlayCircle className="w-4 h-4" />Run the live SAP demo
            </button>
            <button type="button" onClick={onOpenConsultation} className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 hover:bg-white/10 font-semibold text-sm transition-colors">
              Book an SAP walkthrough<ArrowRight className="w-4 h-4 text-teal-400" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-white text-slate-900 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">Sample month-end · {s.d.scope.period}</div>
                <div className="text-sm font-bold">G/L {s.d.scope.glAccount} ↔ {s.d.scope.statement}</div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" />Reconciled</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[[`${s.rate.toFixed(0)}%`, 'auto-matched'], [String(s.exc), 'exceptions to review'], [String(s.timing), 'timing items']].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-slate-200 p-3"><div className="text-xl font-extrabold">{v}</div><div className="text-[11px] text-slate-500 leading-tight">{l}</div></div>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
              {[['Closing balance per bank', s.res.bankClose], ['SAP items not yet on the statement', r2(s.res.adjBank - s.res.bankClose)], ['Adjusted bank balance', s.res.adjBank],
                ['Closing balance per SAP', s.res.bookClose], ['Bank items, charges and corrections to post', r2(s.res.adjBook - s.res.bookClose)], ['Adjusted book balance', s.res.adjBook]].map(([l, v], i) => (
                <div key={i} className={`flex justify-between gap-3 px-3 py-1.5 ${i === 2 || i === 5 ? 'bg-slate-50 font-bold' : 'text-slate-600'} ${i === 2 ? 'border-b border-slate-200' : ''}`}>
                  <span>{l}</span><span className="font-mono">{money(v as number)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">Synthetic sample data in USD. Difference after adjustments: <span className="font-mono font-semibold">{money(r2(s.res.adjBank - s.res.adjBook))}</span></p>
          </div>
        </div>
      </div>
    </section>
  );
};
