-- ============================================================================
-- TABLE: liabilities
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  account_id UUID,
  liability_type TEXT NOT NULL,
  creditor_name TEXT NOT NULL,
  principal_amount NUMERIC NOT NULL,
  outstanding_amount NUMERIC NOT NULL,
  interest_rate NUMERIC,
  currency TEXT DEFAULT 'USD',
  due_date DATE,
  payment_frequency TEXT,
  next_payment_date DATE,
  next_payment_amount NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE liabilities ADD CONSTRAINT liabilities_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE liabilities ADD CONSTRAINT liabilities_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_liabilities_shop_id ON liabilities(shop_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_due_date ON liabilities(due_date);
