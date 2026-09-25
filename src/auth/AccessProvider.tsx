import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseReady, ToolId, TOOL_LABELS } from '../lib/supabase';
import { setTrackedUser, track, visitorId } from '../lib/track';
import { LoginModal } from './LoginModal';
import { SubscribeModal } from './SubscribeModal';
import { checkout, Currency, PlanId, PayResult } from '../lib/payments';
import { PaymentResultModal } from './PaymentResultModal';

export interface AccessStatus {
  signed_in: boolean; email?: string; plan?: 'free' | 'pro' | 'business'; plan_until?: string | null;
  active_paid?: boolean; free_limit?: number; used?: Partial<Record<ToolId, number>>; is_admin?: boolean;
}
interface Ctx {
  ready: boolean;                 // Supabase configured
  session: Session | null;
  status: AccessStatus;
  /** Ask before running a tool on the visitor's OWN data. Resolves true if allowed (and records the run). */
  requestRun: (tool: ToolId, meta?: Record<string, unknown>) => Promise<boolean>;
  remaining: (tool: ToolId) => number | null;   // null = unlimited / not configured
  openLogin: () => void;
  /** Resolves true once the visitor is signed in (opens the email-code box if needed). */
  ensureSignedIn: (reason?: string) => Promise<boolean>;
  /** Sign in if needed, open Razorpay, and switch access on after payment. */
  pay: (plan: PlanId, currency: Currency, label: string) => Promise<void>;
  paying: PlanId | null;
  openSubscribe: (tool?: ToolId) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}
const AccessContext = createContext<Ctx | null>(null);
export const useAccess = () => {
  const c = useContext(AccessContext);
  if (!c) throw new Error('useAccess outside AccessProvider');
  return c;
};

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AccessStatus>({ signed_in: false });
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTool, setLoginTool] = useState<ToolId | undefined>();
  const [loginReason, setLoginReason] = useState<string | undefined>();
  const [subscribeTool, setSubscribeTool] = useState<ToolId | undefined | null>(null);   // null = closed
  const pending = useRef<((ok: boolean) => void) | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.rpc('my_status');
    if (data) setStatus(data as AccessStatus);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setTrackedUser(data.session?.user.id ?? null); refresh(); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setTrackedUser(s?.user.id ?? null); refresh(); });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const runCheck = useCallback(async (tool: ToolId, meta?: Record<string, unknown>) => {
    const { data, error } = await supabase!.rpc('start_tool_run', { p_tool: tool, p_meta: meta ?? {} });
    await refresh();
    if (error) { console.warn('start_tool_run', error.message); return true; }   // fail open rather than block a visitor
    const res = data as { allowed: boolean; reason?: string };
    if (res.allowed) { track('own_data_run', tool); return true; }
    if (res.reason === 'login_required') { setLoginTool(tool); setLoginOpen(true); return false; }
    setSubscribeTool(tool);
    return false;
  }, [refresh]);

  const requestRun = useCallback(async (tool: ToolId, meta?: Record<string, unknown>) => {
    if (!supabaseReady) return true;                 // not connected yet → site keeps working as before
    const { data } = await supabase!.auth.getSession();
    if (!data.session) {
      setLoginTool(tool); setLoginReason(undefined); setLoginOpen(true);
      const signedIn = await new Promise<boolean>(res => { pending.current = res; });
      if (!signedIn) return false;
    }
    return runCheck(tool, meta);
  }, [runCheck]);

  const ensureSignedIn = useCallback(async (reason?: string) => {
    if (!supabaseReady) return false;
    const { data } = await supabase!.auth.getSession();
    if (data.session) return true;
    setLoginReason(reason); setLoginTool(undefined); setLoginOpen(true);
    return new Promise<boolean>(res => { pending.current = res; });
  }, []);

  const [paying, setPaying] = useState<PlanId | null>(null);
  const [payResult, setPayResult] = useState<(PayResult & { label: string }) | null>(null);
  const pay = useCallback(async (plan: PlanId, currency: Currency, label: string) => {
    if (!supabaseReady) { setPayResult({ ok: false, label, error: 'Online payment is not switched on yet — please use Book a call.' }); return; }
    const ok = await ensureSignedIn(`Sign in to buy ${label}`);
    if (!ok) return;
    setPaying(plan); setSubscribeTool(null);
    try {
      const r = await checkout(plan, currency, { email: session?.user.email ?? undefined });
      if (!r.cancelled) setPayResult({ ...r, label });
      if (r.ok) await refresh();
    } catch (e) { setPayResult({ ok: false, label, error: (e as Error).message }); }
    finally { setPaying(null); }
  }, [ensureSignedIn, refresh, session]);

  const onLoggedIn = async () => {
    setLoginOpen(false);
    try { await supabase!.rpc('claim_visitor', { p_visitor: visitorId() }); } catch { /* ignore */ }
    track('signup');
    await refresh();
    pending.current?.(true); pending.current = null;
  };
  const onLoginClosed = () => { setLoginOpen(false); pending.current?.(false); pending.current = null; };

  const remaining = (tool: ToolId) => {
    if (!supabaseReady || status.active_paid) return null;
    const limit = status.free_limit ?? 1;
    return Math.max(0, limit - (status.used?.[tool] ?? 0));
  };

  const value: Ctx = {
    ready: supabaseReady, session, status, requestRun, remaining, refresh, ensureSignedIn, pay, paying,
    openLogin: () => { setLoginTool(undefined); setLoginReason(undefined); setLoginOpen(true); },
    openSubscribe: tool => setSubscribeTool(tool),
    signOut: async () => { await supabase?.auth.signOut(); setStatus({ signed_in: false }); },
  };

  return (
    <AccessContext.Provider value={value}>
      {children}
      {loginOpen && <LoginModal toolLabel={loginTool ? TOOL_LABELS[loginTool] : undefined} reason={loginReason} onClose={onLoginClosed} onDone={onLoggedIn} />}
      {subscribeTool !== null && (
        <SubscribeModal tool={subscribeTool} email={status.email ?? session?.user.email ?? ''} userId={session?.user.id}
          onClose={() => setSubscribeTool(null)} />
      )}
      {payResult && <PaymentResultModal result={payResult} onClose={() => setPayResult(null)} />}
    </AccessContext.Provider>
  );
};
