import React, { useState } from 'react';
import { 
  XCircle, 
  CheckCircle2, 
  SlidersHorizontal, 
  ArrowRight, 
  Clock, 
  FileSpreadsheet, 
  Mail, 
  Cpu, 
  BarChart3, 
  Zap,
  Layers,
  Flame,
  Sparkles
} from 'lucide-react';

export const BeforeVsAfter: React.FC = () => {
  const [viewMode, setViewMode] = useState<'split' | 'before' | 'after'>('split');
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const comparisonItems = [
    {
      label: 'Spreadsheet Hygiene',
      before: 'Manual Excel copying, formula repair, and version collision (vFinal_v4.xlsx)',
      after: 'Automated data pipelines, schema validation, and single source-of-truth tables',
      category: 'Data Management'
    },
    {
      label: 'Communication & Follow-ups',
      before: 'Manual email threads, missing attachment chases, and forgotten status updates',
      after: 'Intelligent inbox triggers, automated status webhooks, and instant acknowledgment receipts',
      category: 'Communication'
    },
    {
      label: 'Management Reporting',
      before: 'Repetitive MIS compilation taking hours of supervisor time every morning & month-end',
      after: 'Zero-touch daily scheduled reports delivered directly to stakeholder inboxes by 8:00 AM',
      category: 'Reporting'
    },
    {
      label: 'Data Entry & Transposition',
      before: 'Operators manually retyping figures from PDF invoices and emails into ERP portals',
      after: 'AI-assisted OCR extraction with contextual field mapping and error-checking',
      category: 'Execution'
    },
    {
      label: 'Operational Governance',
      before: 'Heavy human dependency; processes freeze whenever key staff are absent or on leave',
      after: 'Standardized automated execution rules with systematic Six Sigma exception logging',
      category: 'Reliability'
    },
    {
      label: 'Executive Decision Speed',
      before: 'Delayed insights delivered 24-48 hours after issues arise; reactive fire-fighting',
      after: 'Real-time operational dashboards with proactive anomaly alerts and forward forecasts',
      category: 'Visibility'
    }
  ];

  return (
    <section id="before-after" className="py-14 md:py-20 bg-white relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span>Transformation Contrast</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            What Changes After Automation?
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Compare the friction of legacy manual operations against the precision and speed of an automated operational architecture.
          </p>

          {/* Interactive Mode Switcher */}
          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('split')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'split'
                    ? 'bg-white text-slate-950 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Side-by-Side Comparison
              </button>
              <button
                onClick={() => setViewMode('before')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'before'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Before Automation
              </button>
              <button
                onClick={() => setViewMode('after')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'after'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                After Automation
              </button>
            </div>
          </div>
        </div>

        {/* Side-by-side or Toggle Views */}
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* BEFORE Column */}
            <div className="bg-slate-50/90 rounded-2xl border border-rose-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-5 border-b border-rose-200/60 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-mono">
                      BEFORE AUTOMATION
                    </h3>
                    <p className="text-xs text-rose-700 font-medium">
                      High Friction • Manual Overhead • Bottlenecks
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  Legacy
                </span>
              </div>

              <div className="space-y-4">
                {comparisonItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-white border border-rose-100 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-rose-600 font-mono font-semibold">
                        Manual Friction
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item.before}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER Column */}
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">
                      AFTER AUTOMATION
                    </h3>
                    <p className="text-xs text-teal-300 font-medium">
                      Intelligent Workflows • Real-time BI • Scalable
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-teal-500 text-slate-950">
                  Transformed
                </span>
              </div>

              <div className="space-y-4 relative z-10">
                {comparisonItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-400">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Automated
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {item.after}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'before' ? (
          <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl border-2 border-rose-200 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-rose-200">
              <XCircle className="w-6 h-6 text-rose-600" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-mono">
                  State Before Automation: The Hidden Drag
                </h3>
                <p className="text-xs text-rose-700 font-medium">
                  High burnout, formula breaks, and delayed executive visibility.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {comparisonItems.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white border border-rose-100 space-y-1">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase">{item.label}</span>
                  <p className="text-xs text-slate-700">{item.before}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-slate-900 text-white rounded-2xl border-2 border-teal-500 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <CheckCircle2 className="w-6 h-6 text-teal-400" />
              <div>
                <h3 className="text-xl font-bold text-white font-mono">
                  State After Automation: Intelligent Operations
                </h3>
                <p className="text-xs text-teal-300 font-medium">
                  Zero manual touch, exception-driven alerts, and continuous 8:00 AM reporting.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {comparisonItems.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                  <span className="text-xs font-mono font-bold text-teal-400 uppercase">{item.label}</span>
                  <p className="text-xs text-slate-200">{item.after}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
