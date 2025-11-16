-- ============================================================================
-- TABLE: discount_code_products
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_code_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID,
  product_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE discount_code_products ADD CONSTRAINT discount_code_products_discount_code_id_fkey 
  FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE CASCADE;

ALTER TABLE discount_code_products ADD CONSTRAINT discount_code_products_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
