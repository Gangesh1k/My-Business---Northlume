import React, { useState } from 'react';
import { scorecardQuestions } from '../data/siteData';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  ShieldAlert, 
  HelpCircle,
  FileSpreadsheet,
  Mail,
  Zap,
  Gauge
} from 'lucide-react';

interface AutomationScorecardProps {
  onOpenConsultationWithScore?: (scoreSummary: string) => void;
}

export const AutomationScorecard: React.FC<AutomationScorecardProps> = ({ 
  onOpenConsultationWithScore 
}) => {
  const [answers, setAnswers] = useState<Record<number, number>>({
    1: 3, // Daily default
    2: 2, // 2-4 people
    3: 3, // Yes Excel
    4: 3, // Yes Emails
    5: 3  // Yes Copying
  });
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  const handleSelect = (questionId: number, points: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: points
    }));
    setHasCalculated(false);
  };

  const totalPoints = (Object.values(answers) as number[]).reduce((a: number, b: number) => a + b, 0);
  const maxPoints = scorecardQuestions.length * 3;
  const scorePercent = Math.round((totalPoints / maxPoints) * 100);

  const getTier = () => {
    if (scorePercent >= 75) return { tier: 'HIGH OPPORTUNITY', color: 'text-emerald-700 bg-emerald-50 border-emerald-300', level: 'HIGH' };
    if (scorePercent >= 50) return { tier: 'MODERATE OPPORTUNITY', color: 'text-teal-800 bg-teal-50 border-teal-300', level: 'MODERATE' };
    return { tier: 'FOUNDATIONAL OPPORTUNITY', color: 'text-amber-800 bg-amber-50 border-amber-300', level: 'SELECTIVE' };
  };

  const currentTier = getTier();

  const handleCalculate = () => {
    setHasCalculated(true);
  };

  const handleConsultation = () => {
    const summary = `Automation Scorecard Result: ${currentTier.level} (${scorePercent}%) - ${Object.keys(answers).length} questions evaluated.`;
    if (onOpenConsultationWithScore) {
      onOpenConsultationWithScore(summary);
    }
  };

  return (
    <section id="scorecard" className="py-14 md:py-20 bg-white relative border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold uppercase tracking-wider">
            <Gauge className="w-3.5 h-3.5 text-teal-600" />
            <span>Interactive Self-Assessment</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            How Automatable Is Your Process?
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Answer 5 quick operational questions to evaluate your workflow&apos;s automation feasibility and potential time recovery.
          </p>
        </div>

        {/* Scorecard Container */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg">
          <div className="space-y-8">
            {scorecardQuestions.map((q) => (
              <div key={q.id} className="space-y-3 pb-6 border-b border-slate-200/80 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-900 text-teal-300 shrink-0">
                    Q{q.id}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {q.question}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {q.options.map((opt, idx) => {
                    const isSelected = answers[q.id] === opt.points;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(q.id, opt.points)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-white border-slate-950 shadow-md ring-2 ring-teal-500/30'
                            : 'bg-white/60 hover:bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-slate-950' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {opt.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Calculate Trigger & Result Box */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col items-center">
            {!hasCalculated ? (
              <button
                id="calculate-score-btn"
                onClick={handleCalculate}
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm font-mono rounded-xl shadow-lg transition-all"
              >
                <span>Calculate My Automation Score</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            ) : (
              <div className="w-full bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono font-semibold uppercase text-teal-400 block mb-1">
                      Automation Opportunity Level
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                        {currentTier.level}
                      </span>
                      <span className="text-sm font-mono text-teal-300 font-bold">
                        ({scorePercent}% Feasibility Match)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      Your operational profile indicates strong potential for immediate manual hours recovery and error reduction.
                    </p>
                  </div>

                  <button
                    onClick={handleConsultation}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition-all shadow-md shrink-0"
                  >
                    <span>Discuss My Process</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-6">
                  <span className="text-xs font-mono uppercase text-slate-400 font-bold block mb-3">
                    Recommended Automation Focus Areas:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Data Extraction & Cleaning</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>End-to-End Workflow Pipeline</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Automated 8:00 AM Reporting</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>AI-Assisted Exception Triage</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
                  <span>*Disclaimer: This is an indicative assessment, not a formal consulting assessment.</span>
                  <button
                    onClick={() => setHasCalculated(false)}
                    className="text-slate-400 hover:text-slate-200 underline"
                  >
                    Adjust Answers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
