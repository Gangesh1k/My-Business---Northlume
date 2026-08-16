import React from 'react';
import { solutionPackages } from '../data/siteData';
import { SolutionPackage } from '../types';
import { Check, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface SolutionsProps {
  onSelectPlan: (planName: string) => void;
}

export const Solutions: React.FC<SolutionsProps> = ({ onSelectPlan }) => {
  return (
    <section id="solutions" className="py-20 md:py-28 bg-slate-50 relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
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

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(pkg.tier)}
                  className={`w-full py-3 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  <span>{pkg.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Scope Note */}
        <div className="mt-12 p-4 rounded-2xl bg-white border border-slate-200 max-w-2xl mx-auto flex items-center gap-3 text-xs text-slate-600 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
          <span>
            Every engagement begins with a no-risk operational assessment to quantify time saved and verify technical viability before building.
          </span>
        </div>
      </div>
    </section>
  );
};
