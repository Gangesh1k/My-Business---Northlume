// NorthLume AI — Razorpay webhook (backup: activates access even if the customer closed the browser).
// Supabase → Edge Functions → Deploy a new function → name: razorpay-webhook → paste → Deploy,
// then open the function's Details and turn OFF "Verify JWT" (Razorpay can't send a Supabase login).
// Needs secret RAZORPAY_WEBHOOK_SECRET (the secret you type when creating the webhook in Razorpay).
import { createClient } from 'npm:@supabase/supabase-js@2';

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const safeEqual = (a: string, b: string) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) return new Response('not configured', { status: 500 });

  const raw = await req.text();                                     // must verify the exact raw body
  const expected = await hmacHex(secret, raw);
  if (!safeEqual(expected, req.headers.get('X-Razorpay-Signature') ?? '')) return new Response('bad signature', { status: 400 });

  const evt = JSON.parse(raw);
  if (evt.event !== 'payment.captured' && evt.event !== 'order.paid') return new Response('ignored', { status: 200 });
  const p = evt.payload?.payment?.entity;
  const orderId = p?.order_id ?? evt.payload?.order?.entity?.id;
  if (!orderId) return new Response('no order', { status: 200 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } = await admin.rpc('apply_payment', { p_order_id: orderId, p_payment_id: p?.id ?? null, p_raw: { source: 'webhook', event: evt.event, method: p?.method, amount: p?.amount, currency: p?.currency } });
  if (error) return new Response(error.message, { status: 500 });                // Razorpay retries on non-2xx
  return new Response('ok', { status: 200 });
});
