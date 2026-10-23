// SQL Setup Script for Supabase Database & Realtime
export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- FinanceFlow Business Bookkeeping — Supabase Database & Realtime Setup
-- ==============================================================================
-- Paste and run this script in your Supabase Dashboard:
-- 1. Go to your Supabase Project -> SQL Editor
-- 2. Click "New query" -> Paste this entire script -> Click "Run"
-- ==============================================================================

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    notes TEXT,
    invoice_no TEXT,
    receipt_url TEXT,
    receipt_path TEXT,
    receipt_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Recurring Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly')),
    category TEXT NOT NULL,
    renewal_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Upcoming Scheduled Items Table
CREATE TABLE IF NOT EXISTS public.upcoming_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    due_date DATE NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared')),
    notes TEXT,
    converted_transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Business Settings Table
CREATE TABLE IF NOT EXISTS public.business_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    currency TEXT NOT NULL DEFAULT 'LKR',
    theme TEXT NOT NULL DEFAULT 'dark',
    date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    business_name TEXT NOT NULL DEFAULT 'My Business',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default business settings row if not present
INSERT INTO public.business_settings (id, currency, theme, date_format, business_name)
VALUES ('default', 'LKR', 'dark', 'YYYY-MM-DD', 'My Business')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 5. Row Level Security (RLS) Policies
-- Allow collaborative team access for authenticated and anonymous app users
-- ==============================================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Allow full CRUD for transactions
DROP POLICY IF EXISTS "Allow team access for transactions" ON public.transactions;
CREATE POLICY "Allow team access for transactions"
    ON public.transactions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow full CRUD for subscriptions
DROP POLICY IF EXISTS "Allow team access for subscriptions" ON public.subscriptions;
CREATE POLICY "Allow team access for subscriptions"
    ON public.subscriptions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow full CRUD for upcoming items
DROP POLICY IF EXISTS "Allow team access for upcoming_items" ON public.upcoming_items;
CREATE POLICY "Allow team access for upcoming_items"
    ON public.upcoming_items FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow full CRUD for business settings
DROP POLICY IF EXISTS "Allow team access for business_settings" ON public.business_settings;
CREATE POLICY "Allow team access for business_settings"
    ON public.business_settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 6. Supabase Storage for Receipts and Invoices
-- Creates a public 'receipts' bucket so uploaded images/PDFs are accessible to both partners
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Allow any team member to view receipts
DROP POLICY IF EXISTS "Public receipts access" ON storage.objects;
CREATE POLICY "Public receipts access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts');

-- Storage RLS: Allow any team member to upload receipts
DROP POLICY IF EXISTS "Allow receipts upload" ON storage.objects;
CREATE POLICY "Allow receipts upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'receipts');

-- Storage RLS: Allow any team member to delete receipts
DROP POLICY IF EXISTS "Allow receipts delete" ON storage.objects;
CREATE POLICY "Allow receipts delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'receipts');

-- ==============================================================================
-- 7. Supabase Realtime Publication
-- Enables live instant updates between you and your partner across browsers
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upcoming_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_settings;
`
