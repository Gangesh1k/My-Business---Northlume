import React from 'react';
import { Gift, Crown } from 'lucide-react';
import { useAccess } from './AccessProvider';
import type { ToolId } from '../lib/supabase';

/** Small line under an "own data" control: explains the free-run rule and shows what's left. */
export const TrialBadge: React.FC<{ tool: ToolId }> = ({ tool }) => {
  const { ready, status, remaining, openSubscribe } = useAccess();
  if (!ready) return null;
  if (status.active_paid) return <p className="flex items-center gap-1.5 text-[11px] text-teal-700"><Crown className="w-3.5 h-3.5" /> {status.plan === 'business' ? 'Business' : 'Pro'} plan · unlimited runs</p>;
  const left = remaining(tool);
  if (!status.signed_in) return <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><Gift className="w-3.5 h-3.5 text-teal-600" /> Free: 1 run on your own data per email — register with a 6-digit code.</p>;
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
      <Gift className="w-3.5 h-3.5 text-teal-600" />
      {left ? `${left} free run left on your own data` : 'Free run used.'}
      {!left && <button type="button" onClick={() => openSubscribe(tool)} className="underline font-semibold text-slate-700">Subscribe</button>}
    </p>
  );
};
