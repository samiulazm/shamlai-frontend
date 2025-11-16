-- ============================================================================
-- Migration: 007_shop_settings_rls
-- Description: Add Row Level Security (RLS) policies to shop_settings table
--              to allow public subdomain availability checks during signup
-- ============================================================================

-- Enable Row Level Security on shop_settings table
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public subdomain check" ON shop_settings;
DROP POLICY IF EXISTS "Shop owners can read own settings" ON shop_settings;
DROP POLICY IF EXISTS "Shop owners can update own settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can insert own shop settings" ON shop_settings;

-- Allow public read access to check subdomain availability during signup
-- This policy allows anyone to read the shop_settings table (needed for subdomain checks)
CREATE POLICY "Allow public subdomain check" ON shop_settings
  FOR SELECT
  USING (true);

-- Allow shop owners to read their own settings
CREATE POLICY "Shop owners can read own settings" ON shop_settings
  FOR SELECT
  USING (shop_id = auth.uid());

-- Allow shop owners to update their own settings
CREATE POLICY "Shop owners can update own settings" ON shop_settings
  FOR UPDATE
  USING (shop_id = auth.uid());

-- Allow authenticated users to insert their own shop settings during signup
CREATE POLICY "Users can insert own shop settings" ON shop_settings
  FOR INSERT
  WITH CHECK (shop_id = auth.uid());

-- Add comment explaining the policy
COMMENT ON TABLE shop_settings IS 'Shop configuration and settings. RLS enabled to allow public subdomain checks during signup while protecting sensitive data through application-level filtering.';
