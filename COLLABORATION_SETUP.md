# Supabase Online Collaboration Setup Guide

FinanceFlow now features **real-time collaborative multi-user bookkeeping** powered by **Supabase**. You and your business partner can both view, record, edit, and upload receipts simultaneously from separate computers or browsers.

---

## 3-Minute Setup Instructions

### Step 1: Create a Free Supabase Project
1. Visit [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **"New Project"**, choose a name (e.g. `FinanceFlow-Business`), set a database password, and select your closest region (e.g. *Singapore* or *Mumbai*).
3. Wait about 1-2 minutes for Supabase to provision your PostgreSQL database.

---

### Step 2: Initialize Database Tables & Receipt Storage
1. In your Supabase project dashboard, click **"SQL Editor"** on the left menu.
2. In FinanceFlow, go to **Data & Settings** and click **"Copy Setup SQL Script"** (or open [`supabase/schema.sql`](./supabase/schema.sql)).
3. In Supabase's SQL Editor, click **"New query"**, paste the script, and click **"Run"**.

> **Note:**
> This script automatically sets up:
> - `transactions`: Income/expense bookkeeping with invoice numbers and receipt links.
> - `subscriptions`: Recurring software & vendor contracts.
> - `upcoming_items`: Bills and incoming client remittances.
> - `business_settings`: Shared currency and organization preferences.
> - `receipts` Storage Bucket: Cloud storage for uploaded invoice receipts and images.
> - `supabase_realtime`: Instant live socket broadcasts so when your partner records an entry, it appears on your screen in real time with zero delay.

---

### Step 3: Connect FinanceFlow to Supabase
1. In Supabase, click **Project Settings** (gear icon at the bottom left) -> **API**.
2. Copy:
   - **Project URL** (e.g., `https://xyzabcdefg.supabase.co`)
   - **`anon` `public` Key** (e.g., `eyJhbGciOi...`)
3. Open FinanceFlow -> **Data & Settings**:
   - Paste the **Project URL** and **Anon Public Key**.
   - Click **"Connect & Test"**.
4. You will see a green badge **"Live Sync Connected"**!

---

### Step 4: Sync Existing Local Data (Optional)
If you already recorded entries while working offline, click **"Sync Local Data to Cloud"** in Settings. This will push your local records directly to Supabase so your partner can see them immediately.

---

## How Your Business Partner Connects

There are two easy ways for your partner to collaborate:

### Option A: Sharing the Web App (Recommended for Production)
If you deploy this application (e.g. on [Vercel](https://vercel.com), [Netlify](https://netlify.com), or [Cloudflare Pages](https://pages.cloudflare.com)):
1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the deployment Environment Variables.
2. Share the web link with your partner. The app will automatically connect to Supabase on startup for both of you!

### Option B: Direct Credential Sharing
If your partner is running the app or accessing it locally:
1. They open the app in their browser.
2. Go to **Data & Settings**.
3. Paste the same **Supabase Project URL** and **Anon Key** and click **Connect & Test**.
4. Both of you are now connected to the exact same database with live sync!
