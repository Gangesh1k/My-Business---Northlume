// Razorpay checkout for NorthLume AI. Prices live in the Supabase table price_plans;
// the order is created server-side (Edge Function razorpay-order) so nobody can change the amount.
import { supabase } from './supabase';
import { track } from './track';

export type Currency = 'INR' | 'USD';
export type PlanId = 'pro_monthly' | 'pro_yearly' | 'starter' | 'business' | 'intelligent' | 'custom';
export interface PricePlan { id: PlanId; name: string; kind: 'subscription' | 'service'; inr_paise: number; usd_cents: number; period_days: number | null; blurb: string | null }

/** Shown until the live price list loads (and if it can't). Keep in step with supabase/payments.sql. */
export const DEFAULT_PLANS: PricePlan[] = [
  { id: 'pro_monthly', name: 'Pro — monthly', kind: 'subscription', inr_paise: 100000, usd_cents: 1000, period_days: 31, blurb: 'Unlimited runs of all 6 tools on your own files' },
  { id: 'pro_yearly', name: 'Pro — yearly (save 10%)', kind: 'subscription', inr_paise: 1080000, usd_cents: 10800, period_days: 366, blurb: '12 months for the price of 10.8' },
  { id: 'starter', name: 'Starter Automation', kind: 'service', inr_paise: 4999900, usd_cents: 59900, period_days: 365, blurb: 'One end-to-end workflow, live in 2 weeks' },
  { id: 'business', name: 'Business Automation', kind: 'service', inr_paise: 14999900, usd_cents: 179900, period_days: 365, blurb: 'Up to 3–5 connected workflows' },
  { id: 'intelligent', name: 'Intelligent Operations', kind: 'service', inr_paise: 34999900, usd_cents: 419900, period_days: 365, blurb: 'Full operations control tower' },
  { id: 'custom', name: 'Custom AI Solutions — scoping deposit', kind: 'service', inr_paise: 2500000, usd_cents: 29900, period_days: 365, blurb: 'Adjusted against the final quote' },
];

let cache: PricePlan[] | null = null;
export async function loadPlans(): Promise<PricePlan[]> {
  if (cache) return cache;
  if (supabase) {
    const { data } = await supabase.from('price_plans').select('id,name,kind,inr_paise,usd_cents,period_days,blurb').order('sort');
    if (data?.length) return (cache = data as PricePlan[]);
  }
  return DEFAULT_PLANS;
}

export const defaultCurrency = (): Currency => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return /Kolkata|Calcutta/.test(tz) || /-IN$/.test(navigator.language) ? 'INR' : 'USD';
  } catch { return 'INR'; }
};

export const price = (p: PricePlan | undefined, c: Currency) => {
  if (!p) return '';
  const v = (c === 'INR' ? p.inr_paise : p.usd_cents) / 100;
  return c === 'INR' ? `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

function loadScript(): Promise<void> {
  if ((window as any).Razorpay) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(); s.onerror = () => rej(new Error('Could not load Razorpay. Check your connection and try again.'));
    document.body.appendChild(s);
  });
}

export interface PayResult { ok: boolean; cancelled?: boolean; error?: string; plan_id?: string; access_until?: string | null }

/** Full flow: create order → Razorpay popup → verify signature server-side → access switched on. */
export async function checkout(planId: PlanId, currency: Currency, prefill: { email?: string; name?: string } = {}): Promise<PayResult> {
  if (!supabase) return { ok: false, error: 'Payments are not available right now.' };
  track('cta_click', 'checkout', `${planId}:${currency}`);
  const { data: order, error } = await supabase.functions.invoke('razorpay-order', { body: { plan_id: planId, currency } });
  if (error || !order?.order_id) {
    let msg = order?.error as string | undefined;
    try { msg = msg ?? (await (error as any)?.context?.json?.())?.error; } catch { /* ignore */ }
    return { ok: false, error: msg ?? 'Could not start the payment. Please try again or email us.' };
  }
  await loadScript();
  let lastError = '';
  return new Promise<PayResult>(resolve => {
    const rzp = new (window as any).Razorpay({
      key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency,
      name: 'NorthLume AI', description: order.plan_name, image: `${location.origin}/apple-touch-icon.png`,
      prefill: { email: prefill.email ?? order.email, name: prefill.name ?? '' },
      notes: { plan_id: planId }, theme: { color: '#0d9488' },
      modal: { ondismiss: () => resolve(lastError ? { ok: false, error: lastError } : { ok: false, cancelled: true }) },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const { data: v, error: ve } = await supabase!.functions.invoke('razorpay-verify', { body: r });
        if (ve || !v?.ok) {
          // money was taken; the webhook will still activate access — tell the customer clearly
          resolve({ ok: true, plan_id: planId, access_until: null, error: 'Payment received. Access is being switched on — refresh in a minute.' });
          return;
        }
        track('subscribe_request', planId, 'paid');
        resolve({ ok: true, plan_id: v.plan_id, access_until: v.access_until });
      },
    });
    rzp.on('payment.failed', (e: any) => { lastError = e?.error?.description ?? 'Payment failed. No money was taken.'; });
    rzp.open();
  });
}
