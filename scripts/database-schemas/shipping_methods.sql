-- ============================================================================
-- TABLE: shipping_methods
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_cost NUMERIC NOT NULL,
  cost_per_kg NUMERIC DEFAULT 0,
  free_shipping_threshold NUMERIC,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  available_countries TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE shipping_methods ADD CONSTRAINT shipping_methods_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;
