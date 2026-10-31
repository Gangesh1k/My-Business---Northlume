import React from 'react';
import { siteConfig } from '../config/site';
import { HeroWorkflowVisual } from './HeroWorkflowVisual';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  TrendingUp, 
  FileSpreadsheet, 
  Mail, 
  Clock, 
  Check
} from 'lucide-react';

interface HeroProps {
  onOpenScorecard: () => void;
  onOpenConsultation: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenScorecard, onOpenConsultation }) => {
  return (
    <section id="hero" className="relative pt-24 pb-10 md:pt-28 md:pb-14 overflow-hidden bg-slate-50">
      {/* Background ambient accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-5">
          {/* Eyebrow badge / credibility tag */}
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-100 shadow-2xs">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
            <span>Operations Transformation &amp; AI Automation</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
            Stop Managing Manual Work.{' '}
            <span className="text-teal-600 block sm:inline">
              Start Automating It.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            We help businesses turn repetitive email, Excel, and operational processes into intelligent, AI-powered workflows that save time and reduce errors.
          </p>

          {/* Call-to-action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-primary-cta"
              onClick={onOpenScorecard}
              className="w-full sm:w-auto bg-teal-600 text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-2"
            >
              <span>Find My Automation Opportunity</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              id="hero-secondary-cta"
              href="#demo"
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-base font-bold hover:bg-slate-50 transition-all shadow-xs flex items-center justify-center"
            >
              <span>See How It Works</span>
            </a>
          </div>

          {/* Supporting Value Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-slate-500">Save Time</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Reduce Errors</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Scale Faster</span>
          </div>
        </div>

        {/* Hero Interactive Workflow Visual */}
        <div className="mt-8 lg:mt-10">
          <HeroWorkflowVisual />
        </div>
      </div>
    </section>
  );
};
