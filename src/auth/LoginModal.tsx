import React, { useState } from 'react';
import { X, Mail, KeyRound, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props { toolLabel?: string; onClose: () => void; onDone: () => void }

export const LoginModal: React.FC<Props> = ({ toolLabel, onClose, onDone }) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault(); setErr('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr('Please enter a valid work email.'); return; }
    if (!consent) { setErr('Please tick the box to agree to how we use your email.'); return; }
    setBusy(true);
    const { error } = await supabase!.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true, data: { full_name: name.trim(), company: company.trim() } },
    });
    setBusy(false);
    if (error) { setErr(error.message.includes('rate') ? 'Too many attempts — please wait a minute and try again.' : error.message); return; }
    setStep('code');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (!/^\d{6,8}$/.test(code.trim())) { setErr('Enter the code from the email (6–8 digits).'); return; }
    setBusy(true);
    const { data, error } = await supabase!.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    if (error || !data.session) { setBusy(false); setErr('That code is not valid or has expired. Request a new one.'); return; }
    const patch: Record<string, unknown> = { marketing_consent: true };
    if (name.trim()) patch.full_name = name.trim();
    if (company.trim()) patch.company = company.trim();
    await supabase!.from('profiles').update(patch).eq('id', data.session.user.id);
    setBusy(false);
    onDone();
  };

  const input = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-teal-500';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Close"><X className="w-5 h-5" /></button>
        {step === 'email' ? (
          <form onSubmit={send} className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-bold uppercase tracking-wider"><Mail className="w-3.5 h-3.5" /> Free trial</div>
            <h3 className="text-xl font-extrabold text-slate-900">{toolLabel ? `Try ${toolLabel} on your own data` : 'Sign in to NorthLume AI'}</h3>
            <p className="text-sm text-slate-600">Enter your work email and we'll send a 6-digit code. Each email gets <b>one free run per tool</b> on your own files; the sample demos stay free for everyone.</p>
            <input className={input} type="email" required placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              <input className={input} placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" className="mt-0.5 accent-teal-600" checked={consent} onChange={e => setConsent(e.target.checked)} />
              <span>I agree that NorthLume AI may store my email, name and company to provide the free trial and to contact me about it. I can ask for my data to be deleted at any time. <a href="#privacy" onClick={onClose} className="underline">Privacy notice</a>.</span>
            </label>
            {err && <p className="text-xs text-red-600">{err}</p>}
            <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 text-teal-400" />} Send my code
            </button>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Your files are processed in your browser and are never uploaded.</p>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <button type="button" onClick={() => { setStep('email'); setCode(''); setErr(''); }} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"><ArrowLeft className="w-3.5 h-3.5" /> Change email</button>
            <h3 className="text-xl font-extrabold text-slate-900">Check your inbox</h3>
            <p className="text-sm text-slate-600">We sent a sign-in code to <b>{email}</b>. It expires in 1 hour. Check spam if you don't see it.</p>
            <input className={`${input} text-center text-2xl tracking-[0.5em] font-mono`} inputMode="numeric" maxLength={8} placeholder="Code" value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
            {err && <p className="text-xs text-red-600">{err}</p>}
            <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Verify and continue
            </button>
            <button type="button" onClick={() => send()} disabled={busy} className="w-full text-xs text-slate-500 hover:text-slate-800">Resend code</button>
          </form>
        )}
      </div>
    </div>
  );
};
