-- ============================================================================
-- TABLE: payments
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  payment_method_id UUID,
  status VARCHAR(50) DEFAULT 'pending',
  amount NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  transaction_id VARCHAR(255),
  payment_provider VARCHAR(50),
  provider_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE payments ADD CONSTRAINT payments_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT payments_payment_method_id_fkey 
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;
