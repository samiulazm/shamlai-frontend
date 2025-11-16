-- ============================================================================
-- TABLE: product_variants
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  cost_per_item NUMERIC,
  inventory_quantity INTEGER DEFAULT 0,
  weight NUMERIC,
  option1_name VARCHAR(100),
  option1_value VARCHAR(100),
  option2_name VARCHAR(100),
  option2_value VARCHAR(100),
  option3_name VARCHAR(100),
  option3_value VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE product_variants ADD CONSTRAINT product_variants_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
