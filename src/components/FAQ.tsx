import React, { useState } from 'react';
import { faqItems } from '../data/siteData';
import { 
  ChevronDown, 
  HelpCircle, 
  ArrowRight, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface FAQProps {
  onOpenConsultation: () => void;
}

export const FAQ: React.FC<FAQProps> = ({ onOpenConsultation }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-14 md:py-20 bg-slate-50 relative border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-200/80 border border-slate-300 text-slate-800 text-xs font-mono font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            Frequently Asked Questions
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Clear, honest answers about our approach, software requirements, and how we deliver practical operational automation.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-base sm:text-lg text-slate-900">
                    {item.question}
                  </span>
                  <div
                    className={`p-1.5 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 bg-teal-50 text-teal-800' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions prompt */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <h4 className="font-bold text-slate-900 text-base">
            Have a unique process or specific integration question?
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            We are always happy to review a spreadsheet sample or process diagram to evaluate technical feasibility.
          </p>
          <div>
            <button
              onClick={onOpenConsultation}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <span>Ask About Your Process</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
