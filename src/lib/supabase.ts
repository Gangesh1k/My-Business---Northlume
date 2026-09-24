import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Set these two in Vercel → Project → Settings → Environment Variables.
// The anon key is designed to be public; all data is protected by row-level security in supabase/schema.sql.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true once the site is connected to Supabase. Until then the site works as before (no sign-in, no limits). */
export const supabaseReady = Boolean(url && anonKey);

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
