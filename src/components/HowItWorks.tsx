import React from 'react';
import { 
  Search, 
  Target, 
  Workflow, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface HowItWorksProps {
  onOpenConsultation: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenConsultation }) => {
  const steps = [
    {
      number: '01',
      title: 'Discover',
      headline: 'We understand the current process.',
      description: 'We conduct a rapid operational walkthrough of your current spreadsheets, email threads, ERP handoffs, and team pain points without disrupting day-to-day work.',
      icon: Search,
      deliverable: 'Process Map & Bottleneck Inventory'
    },
    {
      number: '02',
      title: 'Identify',
      headline: 'We find the highest-value automation opportunities.',
      description: 'We evaluate automation feasibility, calculate hours saved, and prioritize the quick-win workflows that offer the highest operational yield and fastest payback.',
      icon: Target,
      deliverable: 'ROI & Technical Blueprint'
    },
    {
      number: '03',
      title: 'Build',
      headline: 'We design and implement the workflow.',
      description: 'We construct the automated pipelines, connect inboxes, integrate AI reasoning logic, format dashboards, and run rigorous edge-case testing.',
      icon: Workflow,
      deliverable: 'Production Workflow & Audit Logs'
    },
    {
      number: '04',
      title: 'Improve',
      headline: 'We monitor results and continuously optimize.',
      description: 'We monitor production execution, stabilize performance, train your team on exception handling, and apply Lean Six Sigma refinements over time.',
      icon: TrendingUp,
      deliverable: 'Continuous SLA Governance'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-slate-50 relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-200/80 border border-slate-300 text-slate-800 text-xs font-mono font-semibold uppercase tracking-wider">
            <span>Implementation Framework</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            From Problem to Production in 4 Steps
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            A structured, Lean Six Sigma-backed deployment methodology designed to deliver live production workflows in weeks, not quarters.
          </p>
        </div>

        {/* Horizontal Process Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                {/* Step number badge & icon */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-extrabold font-mono text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60">
                      {step.number}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-teal-400 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-950 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs font-semibold text-teal-800 mb-3">
                    {step.headline}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Deliverable tag */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Deliverable:
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200/60 block truncate">
                    {step.deliverable}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Bottom Action */}
        <div className="mt-12 text-center">
          <button
            onClick={onOpenConsultation}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
          >
            <span>Start Step 01: Request Process Walkthrough</span>
            <ArrowRight className="w-4 h-4 text-teal-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
