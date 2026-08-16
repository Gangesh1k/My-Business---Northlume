import React, { useState } from 'react';
import { siteConfig } from '../config/site';
import { 
  Mail, 
  Send, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check,
  Building,
  User,
  MessageSquare
} from 'lucide-react';

interface LeadCTAProps {
  initialNotes?: string;
  onOpenConsultation?: () => void;
}

export const LeadCTA: React.FC<LeadCTAProps> = ({ initialNotes = '', onOpenConsultation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Formulate a pre-filled mailto fallback link
    const subject = encodeURIComponent(`AI Automation Assessment Request: ${company || name || 'Operations Inquiry'}`);
    const body = encodeURIComponent(
      `Hello Gangesh,\n\nI would like to explore automating an operational process.\n\nName: ${name}\nCompany: ${company}\nEmail: ${email}\nProcess to Automate:\n${notes}\n\nLooking forward to speaking.`
    );
    const mailtoUrl = `mailto:${siteConfig.contact.email}?subject=${subject}&body=${body}`;
    
    // Attempt mailto trigger
    window.location.href = mailtoUrl;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(siteConfig.contact.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & Direct Channels */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Let&apos;s Automate Something</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              What Are You Still Doing Manually?
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Tell us about one repetitive process that consumes your team&apos;s time. We&apos;ll help identify whether it can be automated and calculate the expected hours saved.
            </p>

            {/* Direct Connect Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <a
                href={siteConfig.contact.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold rounded-xl border border-slate-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-sky-400" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>Connect on LinkedIn</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </a>

              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-2 px-4 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded-xl border border-slate-800 transition-colors"
                title="Click to copy email address"
              >
                <Mail className="w-4 h-4 text-teal-400" />
                <span>{siteConfig.contact.email}</span>
                {copiedEmail ? (
                  <span className="text-emerald-400 text-[10px] font-bold">Copied!</span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>

            {/* Zero Risk Assurance */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
              <span>
                Confidential consultation • No sales pressure • Concrete process feasibility analysis.
              </span>
            </div>
          </div>

          {/* Right Column: Contact & Assessment Form */}
          <div className="lg:col-span-6 bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 lg:p-10 shadow-2xl">
            {isSubmitted ? (
              <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Assessment Request Initialized
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Your mail client has been opened with your inquiry details addressed to <span className="text-teal-300 font-mono">{siteConfig.contact.email}</span>.
                </p>
                <p className="text-xs text-slate-500">
                  If your mail client didn&apos;t launch automatically, please email us directly at <span className="font-mono text-slate-300">{siteConfig.contact.email}</span>.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" id="lead-contact-form">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    Request Automation Assessment
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fill in your details below to schedule a 30-minute operational review.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-400" />
                      <span>Full Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-400" />
                      <span>Work Email *</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-teal-400" />
                    <span>Company Name / Team</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Operations / Logistics Team"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                    <span>What would you like to automate? *</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Daily morning reporting from 15 branch spreadsheets, invoice reconciliation in Excel, or customer dispute triage in email..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-500 placeholder:text-slate-600 transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-mono text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Request Automation Assessment</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 text-center font-mono">
                  Direct connection with founder &amp; operations leadership.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
