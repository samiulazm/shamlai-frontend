-- ============================================================================
-- AD CAMPAIGNS TABLE MIGRATION
-- Migration: 006_ad_campaigns_table
-- Description: Creates table for Meta Ads and ad campaign tracking
-- ============================================================================

-- Ad campaigns table
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('meta_ads', 'google_ads', 'other')),
  platform TEXT, -- 'facebook', 'instagram', 'google', etc.
  external_campaign_id TEXT, -- ID from external platform
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15, 2),
  currency TEXT DEFAULT 'USD',
  spent DECIMAL(15, 2) DEFAULT 0.00,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0.00,
  roas DECIMAL(10, 2), -- Return on Ad Spend
  ctr DECIMAL(5, 2), -- Click-through rate
  cpc DECIMAL(10, 2), -- Cost per click
  cpm DECIMAL(10, 2), -- Cost per mille (1000 impressions)
  target_audience JSONB,
  ad_creative JSONB,
  landing_page_url TEXT,
  notes TEXT,
  metadata JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Campaign products junction table (many-to-many)
CREATE TABLE IF NOT EXISTS ad_campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_shop_id ON ad_campaigns(shop_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_type ON ad_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_campaign_products_campaign ON ad_campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaign_products_product ON ad_campaign_products(product_id);

-- Comments
COMMENT ON TABLE ad_campaigns IS 'Ad campaign tracking for Meta Ads, Google Ads, and other platforms';
COMMENT ON TABLE ad_campaign_products IS 'Junction table linking campaigns to products';

