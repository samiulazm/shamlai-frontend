-- ============================================================================
-- TABLE: accounts
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_number TEXT,
  bank_name TEXT,
  balance NUMERIC DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE accounts ADD CONSTRAINT accounts_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_shop_id ON accounts(shop_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);
