-- ============================================================================
-- TABLE: products
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id UUID,
  base_price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  cost_per_item NUMERIC,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  track_inventory BOOLEAN DEFAULT true,
  inventory_quantity INTEGER DEFAULT 0,
  allow_backorder BOOLEAN DEFAULT false,
  weight NUMERIC,
  weight_unit VARCHAR(10) DEFAULT 'kg',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  has_variants BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE products ADD CONSTRAINT products_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_shop_active ON products(shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
