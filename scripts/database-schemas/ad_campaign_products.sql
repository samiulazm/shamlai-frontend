-- ============================================================================
-- TABLE: ad_campaign_products
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS ad_campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, product_id)
);

-- Foreign Keys
ALTER TABLE ad_campaign_products ADD CONSTRAINT ad_campaign_products_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE CASCADE;

ALTER TABLE ad_campaign_products ADD CONSTRAINT ad_campaign_products_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_campaign_products_campaign ON ad_campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaign_products_product ON ad_campaign_products(product_id);
