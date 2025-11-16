-- ============================================================================
-- TABLE: ad_campaigns
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  platform TEXT,
  external_campaign_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  currency TEXT DEFAULT 'USD',
  spent NUMERIC DEFAULT 0.00,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0.00,
  roas NUMERIC,
  ctr NUMERIC,
  cpc NUMERIC,
  cpm NUMERIC,
  target_audience JSONB,
  ad_creative JSONB,
  landing_page_url TEXT,
  notes TEXT,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE ad_campaigns ADD CONSTRAINT ad_campaigns_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ad_campaigns ADD CONSTRAINT ad_campaigns_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_shop_id ON ad_campaigns(shop_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_type ON ad_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
