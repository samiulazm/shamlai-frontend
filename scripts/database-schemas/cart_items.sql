-- ============================================================================
-- TABLE: cart_items
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID,
  product_id UUID,
  variant_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE cart_items ADD CONSTRAINT cart_items_cart_id_fkey 
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE;

ALTER TABLE cart_items ADD CONSTRAINT cart_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE cart_items ADD CONSTRAINT cart_items_variant_id_fkey 
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_composite ON cart_items(cart_id, product_id, variant_id);
