import React, { useState } from 'react';
import { automationCapabilities } from '../data/siteData';
import { AutomationCapability } from '../types';
import { 
  Mail, 
  FileSpreadsheet, 
  BarChart3, 
  Sparkles, 
  Share2, 
  Bot, 
  CheckCircle2, 
  ArrowRight,
  Layers,
  Zap
} from 'lucide-react';

interface WhatWeAutomateProps {
  onOpenConsultation: () => void;
}

export const WhatWeAutomate: React.FC<WhatWeAutomateProps> = ({ onOpenConsultation }) => {
  const [activeCapabilityId, setActiveCapabilityId] = useState<string>(automationCapabilities[0].id);

  const getCapabilityIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case 'Mail': return <Mail className={className} />;
      case 'FileSpreadsheet': return <FileSpreadsheet className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Share2': return <Share2 className={className} />;
      case 'Bot': return <Bot className={className} />;
      default: return <Zap className={className} />;
    }
  };

  const activeCapability = automationCapabilities.find(c => c.id === activeCapabilityId) || automationCapabilities[0];

  return (
    <section id="what-we-automate" className="py-20 md:py-28 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Operational Capabilities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            What Can We Automate?
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            From single-task Excel cleanups to autonomous multi-system operational pipelines — we turn manual overhead into continuous, accurate background workflows.
          </p>
        </div>

        {/* 6 Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automationCapabilities.map((capability) => {
            const isSelected = activeCapabilityId === capability.id;

            return (
              <div
                key={capability.id}
                onClick={() => setActiveCapabilityId(capability.id)}
                className={`cursor-pointer rounded-3xl border p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-slate-900 shadow-xl ring-2 ring-teal-500/20 -translate-y-1'
                    : 'bg-white hover:border-slate-300 border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  {/* Top line: Icon and Metric */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-2xl transition-colors ${
                      isSelected ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 border border-teal-100'
                    }`}>
                      {getCapabilityIcon(capability.iconName, "w-6 h-6")}
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
                      {capability.metric}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {capability.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {capability.description}
                  </p>

                  {/* Examples Checklist */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-mono font-semibold uppercase text-slate-400 tracking-wider">
                      Examples:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {capability.examples.map((ex, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Workflow Architecture Pill */}
                <div className="mt-5 pt-3 border-t border-dashed border-slate-200">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-600 flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-900">Flow:</span>
                    <span className="truncate text-teal-800 font-medium">{capability.workflowSnippet}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Dive Action Banner */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600 mb-3">
            Have a custom workflow combining email, spreadsheets, and internal databases?
          </p>
          <button
            onClick={onOpenConsultation}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-full transition-colors shadow-lg shadow-slate-200"
          >
            <span>Discuss Your Specific Workflow</span>
            <ArrowRight className="w-4 h-4 text-teal-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
