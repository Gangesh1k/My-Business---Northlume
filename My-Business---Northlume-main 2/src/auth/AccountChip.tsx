import React from 'react';
import { LogIn, LogOut, Crown, LayoutDashboard, UserRound } from 'lucide-react';
import { useAccess } from './AccessProvider';

export const AccountChip: React.FC<{ mobile?: boolean; onAction?: () => void }> = ({ mobile, onAction }) => {
  const { ready, status, openLogin, signOut, openSubscribe } = useAccess();
  if (!ready) return null;
  const base = mobile
    ? 'w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center gap-1.5'
    : 'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-full shadow-2xs transition-all';
  if (!status.signed_in) return <button onClick={() => { onAction?.(); openLogin(); }} className={base}><LogIn className="w-3.5 h-3.5 text-teal-600" /> Sign in</button>;
  const paid = status.active_paid;
  return (
    <div className={mobile ? 'flex flex-col gap-2' : 'flex items-center gap-1.5'}>
      {status.is_admin && <a href="#admin" onClick={onAction} className={base} title="Admin dashboard"><LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />{mobile && 'Admin dashboard'}</a>}
      <button onClick={() => { onAction?.(); if (!paid) openSubscribe(); }} className={base} title={status.email}>
        {paid ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <UserRound className="w-3.5 h-3.5 text-slate-500" />}
        <span className="max-w-[9rem] truncate">{status.email?.split('@')[0]}</span>
        <span className={`px-1.5 rounded-full text-[10px] uppercase ${paid ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{paid ? status.plan : 'free'}</span>
      </button>
      <button onClick={() => { onAction?.(); signOut(); }} className={base} title="Sign out" aria-label="Sign out"><LogOut className="w-3.5 h-3.5" />{mobile && 'Sign out'}</button>
    </div>
  );
};
