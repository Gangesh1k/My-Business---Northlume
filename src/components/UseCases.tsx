import React, { useState } from 'react';
import { useCases } from '../data/siteData';
import { UseCaseCategory } from '../types';
import { 
  Receipt, 
  Activity, 
  Truck, 
  Building2, 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface UseCasesProps {
  onOpenConsultation: () => void;
}

export const UseCases: React.FC<UseCasesProps> = ({ onOpenConsultation }) => {
  const [activeTabId, setActiveTabId] = useState<string>(useCases[0].id);

  const activeCategory = useCases.find(c => c.id === activeTabId) || useCases[0];

  const getTabIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'Receipt': return <Receipt className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Truck': return <Truck className={className} />;
      case 'Building2': return <Building2 className={className} />;
      case 'Compass': return <Compass className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  return (
    <section id="use-cases" className="py-20 md:py-28 bg-slate-50 relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold uppercase tracking-wider">
            <span>Functional Workflows</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            Where We Create the Most Impact
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Tailored operational intelligence across core business functions where manual work creates the highest hidden costs.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {useCases.map((category) => {
            const isActive = activeTabId === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setActiveTabId(category.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {getTabIcon(category.iconName, isActive ? "w-4 h-4 text-teal-400" : "w-4 h-4 text-slate-500")}
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Category Showcase */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-teal-700 font-bold">
                Domain Deep Dive: {activeCategory.name}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
                {activeCategory.headline}
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl">
                {activeCategory.description}
              </p>
            </div>

            <button
              onClick={onOpenConsultation}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold font-mono transition-colors shrink-0"
            >
              <span>Automate {activeCategory.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Workflows in 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            {activeCategory.workflows.map((wf, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                      0{idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {wf.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {wf.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-mono font-semibold text-teal-800">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                  <span>Target Yield: {wf.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
