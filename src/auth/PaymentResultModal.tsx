import React from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import type { PayResult } from '../lib/payments';
import { siteConfig } from '../config/site';

export const PaymentResultModal: React.FC<{ result: PayResult & { label: string }; onClose: () => void }> = ({ result, onClose }) => {
  const until = result.access_until ? new Date(result.access_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const service = result.plan_id && !result.plan_id.startsWith('pro');
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-950/70" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 relative text-center space-y-3">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Close"><X className="w-5 h-5" /></button>
        {result.ok ? <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" /> : <XCircle className="w-12 h-12 text-red-500 mx-auto" />}
        <h3 className="text-xl font-extrabold text-slate-900">{result.ok ? 'Payment successful' : 'Payment not completed'}</h3>
        {result.ok ? (
          <div className="text-sm text-slate-600 space-y-2">
            <p>Thank you — <b>{result.label}</b> is confirmed. A Razorpay receipt is on its way to your email.</p>
            {until && <p>Unlimited use of all 6 tools on your own files is active until <b>{until}</b>.</p>}
            {service && <p>We'll email you within one business day to schedule the kickoff call.</p>}
            {result.error && <p className="text-amber-700">{result.error}</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-600">{result.error ?? 'The payment did not go through.'} If money was deducted, it is refunded automatically by your bank, or email <a className="underline" href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.</p>
        )}
        <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold">{result.ok ? 'Start using it' : 'Close'}</button>
      </div>
    </div>
  );
};
