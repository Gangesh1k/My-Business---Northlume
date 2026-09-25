import React from 'react';
import { siteConfig } from '../config/site';
import { 
  Award, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Cpu, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface FounderCredibilityProps {
  onOpenConsultation: () => void;
}

export const FounderCredibility: React.FC<FounderCredibilityProps> = ({ onOpenConsultation }) => {
  const { founder } = siteConfig;

  const credentialsGrid = [
    {
      metric: '20+ Years',
      label: 'Operations Leadership',
      detail: 'Proven track record leading complex global enterprise operations.'
    },
    {
      metric: '$4.5M+',
      label: 'Annual Portfolio Responsibility',
      detail: 'Direct P&L stewardship and operational cost optimization.'
    },
    {
      metric: '450+ FTEs',
      label: 'Global Team Leadership',
      detail: 'Managing multi-shift, cross-border operations and BPO delivery.'
    },
    {
      metric: 'Master Black Belt',
      label: 'Lean Six Sigma Certified',
      detail: 'Rigorous root-cause methodology, DMAIC framework, and zero-defect focus.'
    }
  ];

  return (
    <section id="about" className="py-14 md:py-20 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
      {/* Subtle ambient lighting */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-teal-400" />
            <span>Operational Pedigree</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Enterprise Operations Experience. Practical AI Execution.
          </h2>

          <p className="text-base sm:text-lg text-slate-300">
            We bridge the gap between deep process governance and modern AI automation. No theoretical fluff — just battle-tested execution principles applied to your operations.
          </p>
        </div>

        {/* Founder & Credibility Card */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-7 sm:p-10 lg:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Profile Details */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider block">
                  Leadership & Process Architecture
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {founder.name}
                </h3>
                <p className="text-sm font-semibold text-teal-300">
                  {founder.title}
                </p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                With over two decades leading mission-critical operations across Fortune 500 and mid-market supply chain and finance hubs, we understand that automation only succeeds when anchored in flawless process fundamentals.
              </p>

              {/* Specializations Tags */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
                  Core Process Disciplines:
                </span>
                <div className="flex flex-wrap gap-2">
                  {founder.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs font-mono font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Founder Social & Contact */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <a
                  href={siteConfig.contact.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-sky-400" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>Connect on LinkedIn</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <button
                  onClick={onOpenConsultation}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold font-mono rounded-xl transition-colors shadow-md"
                >
                  <span>Book Operations Discussion</span>
                </button>
              </div>
            </div>

            {/* Right Metrics Grid */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {credentialsGrid.map((cred, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-300 block">
                    {cred.metric}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {cred.label}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cred.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
