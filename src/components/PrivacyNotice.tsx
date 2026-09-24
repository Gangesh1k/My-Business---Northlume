import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { siteConfig } from '../config/site';

export const PrivacyNotice: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[58] flex items-center justify-center p-4 bg-slate-950/70 overflow-y-auto" role="dialog" aria-modal="true">
    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative my-8 text-sm text-slate-700 space-y-3">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Close"><X className="w-5 h-5" /></button>
      <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900"><ShieldCheck className="w-5 h-5 text-teal-600" /> Privacy notice</div>
      <p><b>Who we are.</b> {siteConfig.name} ({siteConfig.contact.email}) runs this website.</p>
      <p><b>What we collect.</b> (1) Anonymous usage: pages and sections viewed, demo runs, the site that referred you, device type, language and time zone, linked to a random id stored in your browser. (2) If you register or send a form: your email, and optionally your name, company, phone and message. (3) How many times you used each tool on your own data.</p>
      <p><b>What we don't collect.</b> Files you analyse in the demos are processed only in your browser and are never uploaded to us. We don't use advertising cookies or sell data.</p>
      <p><b>Why.</b> To run the free trial (one run per tool per email), to reply to your requests, to improve the website, and — if you agreed — to contact you about the trial and our services.</p>
      <p><b>Where and how long.</b> Data is stored with our database provider (Supabase) and kept while your account is active, or up to 24 months for anonymous usage data.</p>
      <p><b>Your choices.</b> You can ask us to access, correct or delete your data, or withdraw consent, at any time by emailing {siteConfig.contact.email}. We'll respond within 30 days.</p>
      <p className="text-xs text-slate-500">Last updated: September 2026.</p>
    </div>
  </div>
);
