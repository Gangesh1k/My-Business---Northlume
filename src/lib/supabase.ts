import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config/supabase';

// Values come from src/config/supabase.ts, or (if set) from Vercel environment variables.
// The publishable/anon key is designed to be public; all data is protected by row-level security in supabase/schema.sql.
const env = import.meta.env as Record<string, string | undefined>;
const clean = (v?: string) => (v ?? '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
const url = clean(env.VITE_SUPABASE_URL) || clean(SUPABASE_URL);
const anonKey = clean(env.VITE_SUPABASE_ANON_KEY) || clean(env.VITE_SUPABASE_PUBLISHABLE_KEY) || clean(SUPABASE_PUBLISHABLE_KEY);

/** true once the site is connected to Supabase. Until then the site works as before (no sign-in, no limits). */
export const supabaseReady = /^https:\/\/[^/]+\.supabase\.(co|in)$/.test(url) && anonKey.length > 20 && !anonKey.startsWith('PASTE_');
if (!supabaseReady && typeof window !== 'undefined') console.info('[NorthLume] Supabase not connected — add your Project URL and publishable key in src/config/supabase.ts');

export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  : null;

export type ToolId =
  | 'email-automation' | 'excel-automation' | 'reporting-automation'
  | 'ai-business-insights' | 'workflow-automation' | 'ai-agents';

export const TOOL_LABELS: Record<ToolId, string> = {
  'email-automation': 'Email Automation',
  'excel-automation': 'Excel Automation',
  'reporting-automation': 'Reporting Automation',
  'ai-business-insights': 'AI Business Insights',
  'workflow-automation': 'Workflow Automation',
  'ai-agents': 'AI Operational Agents',
};
