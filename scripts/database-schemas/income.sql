-- ============================================================================
-- TABLE: income
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  account_id UUID,
  income_source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  income_date DATE NOT NULL,
  payment_method TEXT,
  reference_id UUID,
  reference_type TEXT,
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE income ADD CONSTRAINT income_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE income ADD CONSTRAINT income_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE income ADD CONSTRAINT income_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_shop_id ON income(shop_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(income_date DESC);
