import React, { useState } from 'react';
import { businessProblems } from '../data/siteData';
import { 
  FileSpreadsheet, 
  Mail, 
  FileText, 
  Clock, 
  Repeat, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

interface BusinessProblemsProps {
  onOpenScorecard: () => void;
}

export const BusinessProblems: React.FC<BusinessProblemsProps> = ({ onOpenScorecard }) => {
  const [activeProblem, setActiveProblem] = useState<string | null>(null);

  const getProblemIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-5 h-5 text-teal-700" />;
      case 'Mail': return <Mail className="w-5 h-5 text-teal-700" />;
      case 'FileText': return <FileText className="w-5 h-5 text-teal-700" />;
      case 'Clock': return <Clock className="w-5 h-5 text-teal-700" />;
      case 'Repeat': return <Repeat className="w-5 h-5 text-teal-700" />;
      case 'AlertTriangle': return <AlertTriangle className="w-5 h-5 text-teal-700" />;
      default: return <Info className="w-5 h-5 text-teal-700" />;
    }
  };

  return (
    <section id="business-problems" className="py-14 md:py-20 bg-white relative border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <span>The Hidden Cost of Manual Friction</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Your Team Shouldn't Spend Hours Doing Work AI Can Handle.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Most businesses don’t lack talent — they lack automation. High-value teams get dragged down by repetitive spreadsheet hygiene, manual data collation, and email forwarding.
          </p>
        </div>

        {/* 6 Problem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessProblems.map((problem) => {
            const isHovered = activeProblem === problem.id;

            return (
              <div
                key={problem.id}
                onMouseEnter={() => setActiveProblem(problem.id)}
                onMouseLeave={() => setActiveProblem(null)}
                className={`p-6 sm:p-7 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                  isHovered
                    ? 'border-slate-900 shadow-xl bg-slate-50/70 -translate-y-1'
                    : 'border-slate-200/90 hover:border-slate-300 bg-white shadow-xs'
                }`}
              >
                <div>
                  {/* Top row: Icon and Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100/80">
                      {getProblemIcon(problem.iconName)}
                    </div>
                    <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Operational Drag
                    </span>
                  </div>

                  {/* Title & Short Description */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {problem.shortDesc}
                  </p>

                  {/* Deep Symptom Detail */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">Everyday Symptom:</span>{' '}
                      <span className="text-slate-600">{problem.symptom}</span>
                    </div>
                  </div>
                </div>

                {/* Business Cost / Impact Footer */}
                <div className="mt-5 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cost: {problem.impact}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Bottom Punchline Statement */}
        <div className="mt-16 p-8 sm:p-10 rounded-3xl bg-slate-900 text-white text-center shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              We automate the work behind the work.
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Eliminate the invisible manual layer of spreadsheet reconciliations, email polling, and manual report building so your people can focus on growth, strategy, and customer relationships.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenScorecard}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl transition-all shadow-md"
              >
                <span>Calculate Your Process Automation Score</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
