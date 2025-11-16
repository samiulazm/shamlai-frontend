-- ============================================================================
-- TABLE: wishlists
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  product_id UUID,
  variant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE wishlists ADD CONSTRAINT wishlists_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

ALTER TABLE wishlists ADD CONSTRAINT wishlists_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE wishlists ADD CONSTRAINT wishlists_variant_id_fkey 
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
