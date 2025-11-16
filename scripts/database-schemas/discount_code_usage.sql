-- ============================================================================
-- TABLE: discount_code_usage
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID,
  order_id UUID,
  customer_id UUID,
  discount_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE discount_code_usage ADD CONSTRAINT discount_code_usage_discount_code_id_fkey 
  FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE CASCADE;

ALTER TABLE discount_code_usage ADD CONSTRAINT discount_code_usage_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE discount_code_usage ADD CONSTRAINT discount_code_usage_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
