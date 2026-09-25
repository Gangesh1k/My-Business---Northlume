# NorthLume AI — switch on Razorpay payments (about 20 minutes)

Prices (edit any time in Supabase → Table Editor → price_plans; the website reads them live):

| Plan | INR | USD | Gives |
|---|---|---|---|
| Pro — monthly | ₹1,000 | $10 | Unlimited website tools for 31 days |
| Pro — yearly (12 × monthly − 10%) | ₹10,800 | $108 | Unlimited website tools for 366 days |
| Starter Automation | ₹49,999 | $599 | Project + 12 months website access |
| Business Automation | ₹1,49,999 | $1,799 | Project + 12 months website access |
| Intelligent Operations | ₹3,49,999 | $4,199 | Project + 12 months website access |
| Custom AI Solutions — scoping deposit | ₹25,000 | $299 | Deposit, adjusted in final quote |

## 1. Database (2 min)
Supabase → SQL Editor → New query → paste all of `supabase/payments.sql` → Run → "Success".

## 2. Razorpay keys (3 min)
Razorpay Dashboard (Live mode) → Account & Settings → API Keys → Generate Key.
Copy the Key ID (rzp_live_…) and Key Secret — the secret is shown only once.

## 3. Secrets in Supabase (3 min) — you paste these yourself
Supabase → Edge Functions → Secrets → Add:
- RAZORPAY_KEY_ID = rzp_live_…
- RAZORPAY_KEY_SECRET = the key secret
- RAZORPAY_WEBHOOK_SECRET = any long random phrase you make up (you'll type the same one in step 5)

## 4. Three Edge Functions (6 min)
Supabase → Edge Functions → Deploy a new function → Via Editor. For each:
- name razorpay-order → paste supabase/functions/razorpay-order/index.ts → Deploy
- name razorpay-verify → paste supabase/functions/razorpay-verify/index.ts → Deploy
- name razorpay-webhook → paste supabase/functions/razorpay-webhook/index.ts → Deploy
Then open each function → Details/Settings → turn OFF "Verify JWT" (Enforce JWT verification) → Save.
(The functions check the signed-in user and Razorpay's signature themselves.)

## 5. Webhook in Razorpay (3 min)
Razorpay → Account & Settings → Webhooks → Add New Webhook:
- URL: https://bxktwvntdgqerzlxypvo.supabase.co/functions/v1/razorpay-webhook
- Secret: the same phrase as RAZORPAY_WEBHOOK_SECRET
- Events: payment.captured and order.paid → Create

## 6. Razorpay settings to check
- Account & Settings → Payment capture → Automatic.
- For USD: Account & Settings → International payments → enable (Razorpay reviews this; until approved, pay in INR works and USD shows an error).

## 7. Website
Upload to GitHub: the `src` folder, the `supabase` folder, `tsconfig.json`, `PAYMENTS-SETUP.md` → Commit.

## 8. Test with a real ₹1,000 payment
Incognito → northlumeai.com → Services → Pay & activate Pro (monthly) → sign in → pay with UPI.
You should see "Payment successful"; your account chip shows PRO; admin dashboard → Payments shows it.
Then refund it from Razorpay → Transactions → Payments → Refund.

Notes: prices are charged exactly as listed (no GST added on top). If you are GST-registered, either treat
prices as GST-inclusive or raise them in price_plans. Razorpay's own receipt email goes to the customer.
