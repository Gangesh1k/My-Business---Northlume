# NorthLume AI — turn on visitor tracking, free trial & subscriptions

The site works as before until you finish these steps. Once the two keys are in Vercel,
the free-trial gate, visitor tracking and admin dashboard switch on automatically.

## 1. Create the database (5 min)
1. Go to https://supabase.com → sign in with gangesh@northlumeai.com → **New project**.
2. Name `northlume`, region **South Asia (Mumbai)**, set a database password (keep it in your password manager).
3. When it's ready: **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**. If Supabase warns about
   "destructive operations", click **Run this query** (it only replaces its own policies). You should see "Success. No rows returned".
4. Check: **Table Editor** now lists `app_settings, leads, profiles, subscription_requests, tool_runs, visits`.

## 2. Email login with a 6-digit code
1. **Authentication → Sign In / Providers → Email**: Email enabled, "Confirm email" on.
2. **Authentication → Email Templates → Magic Link** — replace the body with:
   ```
   <h2>Your NorthLume AI code</h2>
   <p>Enter this code on the website to continue:</p>
   <p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
   <p>It expires in 1 hour. If you didn't request it, ignore this email.</p>
   ```
   Do the same for **Confirm signup** (new users get this one). Subject: `Your NorthLume AI code`.
3. **Authentication → URL Configuration**: Site URL `https://northlumeai.com`.
4. **Project Settings → Authentication → SMTP**: turn on custom SMTP so codes come from your domain
   (Supabase's built-in sender only allows a few emails an hour):
   - Host `smtp.gmail.com`, port `465`, user `gangesh@northlumeai.com`
   - Password: a Google **App password** (Google Account → Security → 2-Step Verification → App passwords)
   - Sender name `NorthLume AI`, sender email `gangesh@northlumeai.com`

## 3. Connect the website
1. Supabase **Project Settings → API**: copy the **Project URL** and the **anon public** key
   (newer projects call it the **Publishable key**, starting `sb_publishable_` — either works).
   Never use the `service_role` / **Secret** key — that one must stay private.
2. Vercel → project **northlume** → **Settings → Environment Variables** → add for Production + Preview:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
3. Vercel → **Analytics** tab → **Enable** Web Analytics (free, cookie-free page counts).
4. Upload the changed files to GitHub (list below) — Vercel redeploys automatically.
   If you added the env vars after the last deploy, use **Deployments → ⋯ → Redeploy**.

## 4. Use it
- **Admin dashboard:** https://northlumeai.com/#admin → sign in with gangesh@northlumeai.com (code by email).
  Visitors, sources (LinkedIn, Google, direct, UTM campaigns), most-viewed sections, demo runs,
  registered users, subscription requests, leads and an Excel export.
- **Activating a paying client:** after the invoice is paid, click **Activate Pro** (or **Business**) next to
  their request or user row — access lasts 12 months. "Set free" removes it.
- **Change the free allowance:** SQL Editor → `update app_settings set value='2' where key='free_runs_per_tool';`
- **Add another admin:** `update app_settings set value='["gangesh@northlumeai.com","other@northlumeai.com"]' where key='admin_emails';`
- **Track a campaign:** add `?utm_source=linkedin&utm_campaign=bpo-sept` to links you post; it shows under "Where visitors come from".

## How the free trial works
- Sample demos: free and unlimited for everyone, no sign-up.
- Own files/data (all 6 tools — Reporting, Workflow and the reconciliation agent via their "use my data" switch): first run asks for a work email + 6-digit code;
  each email gets **1 free run per tool**; the next attempt shows the Subscribe form (Pro / Business).
- Files never leave the visitor's browser — only the fact that a run happened is recorded.
- Subscription requests land in the dashboard; you email pricing and an invoice, then click Activate.

## Uploading to GitHub (what to upload)
Open github.com/Gangesh1k/My-Business---Northlume → **Add file → Upload files**, then drag in, from
`Downloads/My-Business---Northlume-main 2`:
- the **`src`** folder (whole folder)
- the **`supabase`** folder
- **`package.json`**, **`package-lock.json`**, **`SUPABASE-SETUP.md`**

Don't upload `node_modules`, `dist` or `.env`. Commit message: "Free trial, tracking, admin dashboard, own-data tools".
Vercel redeploys in about a minute.
