-- ============================================================================
-- TABLE: tax_rates
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC NOT NULL,
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE tax_rates ADD CONSTRAINT tax_rates_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;
