// NorthLume AI — create a Razorpay order for a signed-in user.
// Supabase → Edge Functions → Deploy a new function → name: razorpay-order → paste this file → Deploy.
// Needs secrets RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (Edge Functions → Secrets).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID'), keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) return json({ error: 'Payments are not configured yet.' }, 500);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

    // who is paying (must be signed in on the website)
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user?.email) return json({ error: 'Please sign in first.' }, 401);

    const { plan_id, currency } = await req.json();
    const cur = currency === 'USD' ? 'USD' : 'INR';
    const { data: plan } = await admin.from('price_plans').select('*').eq('id', plan_id).eq('active', true).maybeSingle();
    if (!plan) return json({ error: 'Unknown plan.' }, 400);
    const amount = cur === 'USD' ? plan.usd_cents : plan.inr_paise;   // price always comes from the database, never the browser

    const receipt = `nl_${plan.id}_${Date.now()}`.slice(0, 40);
    const r = await fetch((Deno.env.get('RAZORPAY_API') ?? 'https://api.razorpay.com') + '/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`) },
      body: JSON.stringify({ amount, currency: cur, receipt, notes: { plan_id: plan.id, email: u.user.email, user_id: u.user.id } }),
    });
    const order = await r.json();
    if (!r.ok) return json({ error: order?.error?.description ?? 'Could not create the order.' }, 502);

    const { error } = await admin.from('payments').insert({
      user_id: u.user.id, email: u.user.email, plan_id: plan.id, currency: cur, amount, razorpay_order_id: order.id,
    });
    if (error) return json({ error: error.message }, 500);

    return json({ order_id: order.id, amount, currency: cur, key_id: keyId, plan_name: plan.name, email: u.user.email });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
