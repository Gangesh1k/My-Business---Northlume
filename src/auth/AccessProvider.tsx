import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseReady, ToolId, TOOL_LABELS } from '../lib/supabase';
import { setTrackedUser, track, visitorId } from '../lib/track';
import { LoginModal } from './LoginModal';
import { SubscribeModal } from './SubscribeModal';

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
      setLoginTool(tool); setLoginOpen(true);
      const signedIn = await new Promise<boolean>(res => { pending.current = res; });
      if (!signedIn) return false;
    }
    return runCheck(tool, meta);
  }, [runCheck]);

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
    ready: supabaseReady, session, status, requestRun, remaining, refresh,
    openLogin: () => { setLoginTool(undefined); setLoginOpen(true); },
    openSubscribe: tool => setSubscribeTool(tool),
    signOut: async () => { await supabase?.auth.signOut(); setStatus({ signed_in: false }); },
  };

  return (
    <AccessContext.Provider value={value}>
      {children}
      {loginOpen && <LoginModal toolLabel={loginTool ? TOOL_LABELS[loginTool] : undefined} onClose={onLoginClosed} onDone={onLoggedIn} />}
      {subscribeTool !== null && (
        <SubscribeModal tool={subscribeTool} email={status.email ?? session?.user.email ?? ''} userId={session?.user.id}
          onClose={() => setSubscribeTool(null)} />
      )}
    </AccessContext.Provider>
  );
};
