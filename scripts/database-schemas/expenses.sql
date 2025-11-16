-- ============================================================================
-- TABLE: expenses
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  account_id UUID,
  expense_category TEXT NOT NULL,
  expense_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  expense_date DATE NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  vendor_name TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE expenses ADD CONSTRAINT expenses_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE expenses ADD CONSTRAINT expenses_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE expenses ADD CONSTRAINT expenses_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_shop_id ON expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
