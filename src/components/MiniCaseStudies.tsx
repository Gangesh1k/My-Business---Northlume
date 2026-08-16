import React from 'react';
import { caseStudies } from '../data/siteData';
import { 
  FileSpreadsheet, 
  Sparkles, 
  Workflow, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';

export const MiniCaseStudies: React.FC = () => {
  return (
    <section id="case-studies" className="py-20 md:py-28 bg-white relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-semibold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Illustrative Automation Scenarios</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            Examples of Problems We Can Solve
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Realistic enterprise operational bottlenecks and the step-by-step transformation into automated AI workflows.
          </p>
        </div>

        {/* 3 Case Study Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {caseStudies.map((study, idx) => (
            <div
              key={study.id}
              className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60">
                  <span className="text-[11px] font-mono font-bold uppercase text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">
                    Case 0{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {study.timeframe}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-950 mb-4">
                  {study.title}
                </h3>

                {/* Before Box */}
                <div className="mb-3.5 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-800 uppercase">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Before:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {study.before}
                  </p>
                </div>

                {/* After Box */}
                <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-teal-900 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>After:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {study.after}
                  </p>
                </div>
              </div>

              {/* Potential Impact Callout */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                    Potential Business Impact:
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {study.potentialImpact}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote statement */}
        <div className="mt-8 text-center text-xs text-slate-500 font-mono">
          *Note: Scenarios are illustrative representations of common client operational transformations.
        </div>
      </div>
    </section>
  );
};
