import React, { useState } from 'react';
import { 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Eye, 
  Zap, 
  TrendingUp, 
  Calculator, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface BusinessImpactProps {
  onOpenConsultation: () => void;
}

export const BusinessImpact: React.FC<BusinessImpactProps> = ({ onOpenConsultation }) => {
  // Interactive ROI & Hours-Saved Estimator
  const [teamSize, setTeamSize] = useState<number>(5);
  const [hoursPerDayInExcel, setHoursPerDayInExcel] = useState<number>(2.5);

  const monthlyHoursSaved = Math.round(teamSize * hoursPerDayInExcel * 21 * 0.8); // 80% automatable
  const annualHoursSaved = monthlyHoursSaved * 12;
  const estimatedAnnualValue = annualHoursSaved * 35; // $35/hr blended burdened cost

  const impacts = [
    {
      title: 'Time Saved',
      description: 'Reduce repetitive manual work across Excel, emails, and reporting.',
      metric: '70–90%',
      subtext: 'Reduction in manual collation time',
      icon: Clock
    },
    {
      title: 'Cost Reduced',
      description: 'Optimize existing process capacity and resource allocation.',
      metric: '3–5x ROI',
      subtext: 'Payback achieved within first 90 days',
      icon: DollarSign
    },
    {
      title: 'Accuracy Improved',
      description: 'Eliminate formula corruption, copy-paste slips, and broken lookups.',
      metric: '99.9%',
      subtext: 'Data validation and audit integrity',
      icon: ShieldCheck
    },
    {
      title: 'Visibility Improved',
      description: 'Deliver real-time management insights and automated 8:00 AM digests.',
      metric: 'Instant',
      subtext: 'Leadership visibility instead of 48hr lag',
      icon: Eye
    },
    {
      title: 'Productivity Improved',
      description: 'Free high-skill operators to focus on exceptions, clients, and growth.',
      metric: '+40%',
      subtext: 'Capacity freed for strategic work',
      icon: Zap
    },
    {
      title: 'Scalability Increased',
      description: 'Scale transaction volume 10x without adding linear headcount.',
      metric: '10x',
      subtext: 'Workload elasticity without hiring friction',
      icon: TrendingUp
    }
  ];

  return (
    <section id="business-impact" className="py-20 md:py-28 bg-white relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold uppercase tracking-wider">
            <span>Bottom-Line Outcomes</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            Automation Should Create Business Impact — Not Just Technology.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            We don’t build technology for technology&apos;s sake. Every workflow we design is engineered to deliver measurable operational velocity, error reduction, and hard financial return.
          </p>
        </div>

        {/* 6 Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {impacts.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-teal-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-extrabold font-mono text-slate-950">
                      {item.metric}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-mono text-teal-800 font-semibold">
                  {item.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Impact & Hours-Saved Calculator */}
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left sliders */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-teal-400">
                <Calculator className="w-5 h-5" />
                <span className="text-xs font-mono uppercase font-bold tracking-wider">
                  Interactive Operational Yield Estimator
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Estimate the hours your team can reclaim
              </h3>

              {/* Slider 1: Team Size */}
              <div className="space-y-2 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300">Team members handling spreadsheets/reporting:</span>
                  <span className="text-teal-300 font-bold text-sm">{teamSize} people</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 person</span>
                  <span>25 people</span>
                  <span>50 people</span>
                </div>
              </div>

              {/* Slider 2: Hours spent in manual Excel / email per day */}
              <div className="space-y-2 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300">Average daily hours per person on manual workflows:</span>
                  <span className="text-teal-300 font-bold text-sm">{hoursPerDayInExcel} hours/day</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={hoursPerDayInExcel}
                  onChange={(e) => setHoursPerDayInExcel(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>30 mins</span>
                  <span>3 hours</span>
                  <span>6 hours</span>
                </div>
              </div>
            </div>

            {/* Right calculated outcomes */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5">
              <span className="text-[11px] font-mono uppercase text-teal-400 font-bold tracking-wider block">
                Estimated Operational Recovery
              </span>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-300">Monthly Capacity Reclaimed:</span>
                  <span className="text-2xl font-mono font-bold text-white">{monthlyHoursSaved.toLocaleString()} hrs</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-300">Annual Hours Saved:</span>
                  <span className="text-2xl font-mono font-bold text-teal-300">{annualHoursSaved.toLocaleString()} hrs</span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-slate-300">Est. Annual Productivity Value:</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">${estimatedAnnualValue.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenConsultation}
                  className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span>Validate My Automation Opportunity</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[10px] text-slate-500 font-mono text-center">
                *Indicative estimation assuming 80% automation potential at $35/hr burdened cost.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
