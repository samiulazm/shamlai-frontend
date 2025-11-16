-- ============================================================================
-- TABLE: order_items
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  product_id UUID,
  variant_id UUID,
  product_name VARCHAR(500) NOT NULL,
  variant_name VARCHAR(255),
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE order_items ADD CONSTRAINT order_items_variant_id_fkey 
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
