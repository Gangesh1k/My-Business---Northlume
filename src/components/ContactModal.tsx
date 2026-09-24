import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/site';
import { saveLead } from '../lib/leads';
import { 
  X, 
  Send, 
  CheckCircle2, 
  User, 
  Mail, 
  Building, 
  MessageSquare, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTopic = '' 
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setMessage(`Regarding: ${initialTopic}\n\n`);
    }
  }, [initialTopic]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    saveLead(initialTopic?.toLowerCase().includes('pilot') ? 'pilot' : initialTopic?.toLowerCase().includes('score') ? 'scorecard' : 'consultation', { name, email, company, message: [initialTopic, message].filter(Boolean).join(' — ') });

    const subject = encodeURIComponent(`Consultation Booking: ${company || name || 'Operations Automation'}`);
    const body = encodeURIComponent(
      `Hello Gangesh,\n\nI would like to book an operational automation consultation.\n\nName: ${name}\nCompany: ${company}\nEmail: ${email}\n\nDetails:\n${message}`
    );
    window.location.href = `mailto:${siteConfig.contact.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Consultation Request Prepared
            </h3>
            <p className="text-xs text-slate-300">
              Your email client has been prepared with your request for <span className="text-teal-300 font-mono">{siteConfig.contact.email}</span>.
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-mono uppercase font-bold mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Direct Operations Review</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Book Free AI Automation Consultation
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Speak directly with Lean Six Sigma Master Black Belt leadership.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Company / Operations Scope</label>
                <input
                  type="text"
                  placeholder="Logistics / Shared Services"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Process Details / Goal *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us what manual reports, Excel files, or email handoffs you want to eliminate..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <a
                href={siteConfig.contact.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>Or message on LinkedIn</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>

              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <span>Submit &amp; Schedule</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
