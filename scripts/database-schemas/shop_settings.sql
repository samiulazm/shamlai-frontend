-- ============================================================================
-- TABLE: shop_settings
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id VARCHAR(10) UNIQUE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  shop_username VARCHAR(50) UNIQUE NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  shop_description TEXT,
  shop_email VARCHAR(255),
  shop_phone VARCHAR(50),
  logo_url TEXT,
  favicon_url TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(100) DEFAULT 'UTC',
  weight_unit VARCHAR(10) DEFAULT 'kg',
  address1 VARCHAR(255),
  address2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  google_analytics_id VARCHAR(100),
  facebook_pixel_id VARCHAR(100),
  terms_of_service TEXT,
  privacy_policy TEXT,
  refund_policy TEXT,
  shipping_policy TEXT,
  enable_reviews BOOLEAN DEFAULT true,
  enable_wishlists BOOLEAN DEFAULT true,
  enable_guest_checkout BOOLEAN DEFAULT true,
  require_account_for_checkout BOOLEAN DEFAULT false,
  auto_approve_reviews BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE shop_settings ADD CONSTRAINT shop_settings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Allow shop owners to read their own settings
CREATE POLICY "Shop owners can read own settings" ON shop_settings
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow shop owners to update their own settings
CREATE POLICY "Shop owners can update own settings" ON shop_settings
  FOR UPDATE
  USING (user_id = auth.uid());

-- Allow authenticated users to insert their own shop settings during signup
CREATE POLICY "Users can insert own shop settings" ON shop_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Note: Subdomain availability checks are performed server-side using service role credentials
-- which bypass RLS policies, eliminating the need for public read access
