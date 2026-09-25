// NorthLume AI — confirm a payment right after checkout and switch access on.
// Supabase → Edge Functions → Deploy a new function → name: razorpay-verify → paste this file → Deploy.
// Needs secret RAZORPAY_KEY_SECRET.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const safeEqual = (a: string, b: string) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) return json({ error: 'Payments are not configured yet.' }, 500);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return json({ error: 'Missing payment details.' }, 400);

    const expected = await hmacHex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!safeEqual(expected, String(razorpay_signature))) return json({ error: 'Payment signature did not match.' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data, error } = await admin.rpc('apply_payment', { p_order_id: razorpay_order_id, p_payment_id: razorpay_payment_id, p_raw: { source: 'checkout' } });
    if (error) return json({ error: error.message }, 500);
    return json(data);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
