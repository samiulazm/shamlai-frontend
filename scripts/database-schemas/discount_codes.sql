-- ============================================================================
-- TABLE: discount_codes
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value NUMERIC NOT NULL,
  minimum_purchase NUMERIC,
  maximum_discount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  usage_limit_per_customer INTEGER DEFAULT 1,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  applies_to VARCHAR(20) DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE discount_codes ADD CONSTRAINT discount_codes_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;
