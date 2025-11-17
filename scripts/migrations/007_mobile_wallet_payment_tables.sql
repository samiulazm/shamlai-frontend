-- Migration: Mobile Wallet Payment Integration
-- Description: Add support for bKash, Nagad, Rocket mobile wallets
-- Date: 2025-11-16

-- Step 1: Extend payment_methods table with provider configuration
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add comment
COMMENT ON COLUMN payment_methods.provider IS 'Payment gateway provider (e.g., sslcommerz, aamarpay)';
COMMENT ON COLUMN payment_methods.provider_config IS 'Provider-specific configuration (fees, limits, etc.)';

-- Step 2: Create mobile_wallet_transactions table
CREATE TABLE IF NOT EXISTS mobile_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id),
  wallet_type VARCHAR(20) CHECK (wallet_type IN ('bkash', 'nagad', 'rocket', 'card')),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  gateway_transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BDT',
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  gateway_response JSONB,
  customer_phone VARCHAR(20),
  initiated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mobile_wallet_txn_order ON mobile_wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mobile_wallet_txn_status ON mobile_wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mobile_wallet_txn_gateway ON mobile_wallet_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_mobile_wallet_txn_wallet_type ON mobile_wallet_transactions(wallet_type);
CREATE INDEX IF NOT EXISTS idx_mobile_wallet_txn_created ON mobile_wallet_transactions(created_at DESC);

-- Add comments
COMMENT ON TABLE mobile_wallet_transactions IS 'Tracks mobile wallet payment transactions (bKash, Nagad, Rocket)';
COMMENT ON COLUMN mobile_wallet_transactions.transaction_id IS 'Internal transaction ID';
COMMENT ON COLUMN mobile_wallet_transactions.gateway_transaction_id IS 'Payment gateway transaction ID';
COMMENT ON COLUMN mobile_wallet_transactions.gateway_response IS 'Raw response from payment gateway';

-- Step 3: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mobile_wallet_txn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for updated_at
CREATE TRIGGER trigger_update_mobile_wallet_txn_timestamp
BEFORE UPDATE ON mobile_wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION update_mobile_wallet_txn_updated_at();

-- Step 5: Insert default mobile wallet payment methods
-- Note: These will be shop-specific in production, this is just a template
INSERT INTO payment_methods (name, type, provider, is_active, logo_url, description, instructions, provider_config)
VALUES
  (
    'bKash',
    'bkash',
    'sslcommerz',
    true,
    '/payment-logos/bkash.png',
    'Pay securely with bKash - Bangladesh''s leading mobile wallet',
    'You will be redirected to bKash payment page. Please have your bKash account ready.',
    '{"enabled": true, "fees": 1.8, "min_amount": 10, "max_amount": 25000}'::jsonb
  ),
  (
    'Nagad',
    'nagad',
    'sslcommerz',
    true,
    '/payment-logos/nagad.png',
    'Fast and secure payment with Nagad',
    'You will be redirected to Nagad payment page. Please have your Nagad account ready.',
    '{"enabled": true, "fees": 1.5, "min_amount": 10, "max_amount": 25000}'::jsonb
  ),
  (
    'Rocket',
    'rocket',
    'sslcommerz',
    true,
    '/payment-logos/rocket.png',
    'Pay with Dutch-Bangla Bank Rocket',
    'You will be redirected to Rocket payment page. Please have your Rocket account ready.',
    '{"enabled": true, "fees": 1.8, "min_amount": 10, "max_amount": 25000}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Step 6: Create view for payment analytics
CREATE OR REPLACE VIEW mobile_wallet_payment_analytics AS
SELECT
  wallet_type,
  status,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  DATE(created_at) as transaction_date
FROM mobile_wallet_transactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY wallet_type, status, DATE(created_at)
ORDER BY transaction_date DESC, wallet_type;

COMMENT ON VIEW mobile_wallet_payment_analytics IS 'Analytics view for mobile wallet payment performance';
