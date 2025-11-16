-- ============================================================================
-- ACCOUNTING TABLES MIGRATION
-- Migration: 001_accounting_tables
-- Description: Creates tables for accounting module (accounts, expenses, income, liabilities)
-- ============================================================================

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  account_number TEXT,
  bank_name TEXT,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  expense_category TEXT NOT NULL CHECK (expense_category IN ('advertising', 'rent', 'utilities', 'salaries', 'supplies', 'other')),
  expense_type TEXT NOT NULL CHECK (expense_type IN ('ad', 'regular', 'recurring')),
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  expense_date DATE NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  vendor_name TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income table
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  income_source TEXT NOT NULL CHECK (income_source IN ('sales', 'other', 'refund', 'adjustment')),
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  income_date DATE NOT NULL,
  payment_method TEXT,
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('order', 'refund', 'other')),
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Liabilities table
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  liability_type TEXT NOT NULL CHECK (liability_type IN ('loan', 'credit_card', 'accounts_payable', 'other')),
  creditor_name TEXT NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  outstanding_amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2),
  currency TEXT DEFAULT 'USD',
  due_date DATE,
  payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'quarterly', 'yearly', 'one_time')),
  next_payment_date DATE,
  next_payment_amount DECIMAL(15, 2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_shop_id ON accounts(shop_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_expenses_shop_id ON expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category);
CREATE INDEX IF NOT EXISTS idx_income_shop_id ON income(shop_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(income_date DESC);
CREATE INDEX IF NOT EXISTS idx_liabilities_shop_id ON liabilities(shop_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_due_date ON liabilities(due_date);

-- Comments
COMMENT ON TABLE accounts IS 'Financial accounts for tracking assets, liabilities, equity, revenue, and expenses';
COMMENT ON TABLE expenses IS 'Track all business expenses including advertising, rent, utilities, etc.';
COMMENT ON TABLE income IS 'Track all income sources including sales, refunds, and other revenue';
COMMENT ON TABLE liabilities IS 'Track outstanding debts, loans, and payables';

