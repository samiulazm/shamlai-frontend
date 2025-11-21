-- ============================================================================
-- Backend Restructure Migration
-- Adds tables for: audit logging, system locks, RBAC, and tax rates
-- ============================================================================

-- 1. System Locks Table (for inventory locking and preventing race conditions)
CREATE TABLE IF NOT EXISTS system_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_locks_lock_id ON system_locks(lock_id);
CREATE INDEX IF NOT EXISTS idx_system_locks_expires_at ON system_locks(expires_at);

-- Auto-cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM system_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 2. Audit Logs Table (for tracking all critical operations)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- create, update, delete, login, etc.
  resource_type VARCHAR(50) NOT NULL, -- product, order, customer, etc.
  resource_id UUID,
  resource_name VARCHAR(255),
  changes JSONB, -- {before: {...}, after: {...}, fields: [...]}
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_shop_id ON audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 3. Shop Users Table (for RBAC - Role-Based Access Control)
CREATE TABLE IF NOT EXISTS shop_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'shop_owner', -- super_admin, shop_owner, shop_manager, shop_staff, customer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_users_shop_id ON shop_users(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_users_user_id ON shop_users(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_users_role ON shop_users(role);

-- 4. Tax Rates Table (for dynamic region-based tax calculation)
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g., "VAT", "Sales Tax", "GST"
  rate DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000 (0% to 100%)
  country VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2 country code
  province VARCHAR(100), -- State/province (optional)
  postal_code VARCHAR(20), -- Specific postal code (optional)
  taxable_categories UUID[], -- Array of category IDs (null = all categories)
  priority INTEGER DEFAULT 0, -- Higher priority applied first
  is_compound BOOLEAN DEFAULT false, -- For cascading taxes (e.g., Canada GST + PST)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT rate_between_0_and_1 CHECK (rate >= 0 AND rate <= 1),
  CONSTRAINT priority_non_negative CHECK (priority >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tax_rates_shop_id ON tax_rates(shop_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_country ON tax_rates(country);
CREATE INDEX IF NOT EXISTS idx_tax_rates_province ON tax_rates(province);
CREATE INDEX IF NOT EXISTS idx_tax_rates_priority ON tax_rates(priority DESC);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active);

-- 5. Add missing columns to existing tables (if they don't exist)

-- Add version column to products for optimistic locking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'products' AND column_name = 'version') THEN
    ALTER TABLE products ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add track_inventory column to products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'products' AND column_name = 'track_inventory') THEN
    ALTER TABLE products ADD COLUMN track_inventory BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add taxable column to products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'products' AND column_name = 'taxable') THEN
    ALTER TABLE products ADD COLUMN taxable BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add tax fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'tax_name') THEN
    ALTER TABLE orders ADD COLUMN tax_name VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'tax_rate') THEN
    ALTER TABLE orders ADD COLUMN tax_rate DECIMAL(5, 4);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'discount_code_id') THEN
    ALTER TABLE orders ADD COLUMN discount_code_id UUID REFERENCES discount_codes(id);
  END IF;
END $$;

-- Add unique constraint to cart.session_id for upsert operations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_session_id_unique') THEN
    ALTER TABLE cart ADD CONSTRAINT cart_session_id_unique UNIQUE (session_id);
  END IF;
END $$;

-- 6. Create helper functions

-- Function to get user's shops
CREATE OR REPLACE FUNCTION get_user_shops(p_user_id UUID)
RETURNS TABLE(shop_id UUID, role VARCHAR(50)) AS $$
BEGIN
  RETURN QUERY
  SELECT su.shop_id, su.role
  FROM shop_users su
  WHERE su.user_id = p_user_id AND su.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user has access to shop
CREATE OR REPLACE FUNCTION user_has_shop_access(p_user_id UUID, p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shop_users
    WHERE user_id = p_user_id
      AND shop_id = p_shop_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate order total with tax
CREATE OR REPLACE FUNCTION calculate_order_total(
  p_subtotal DECIMAL,
  p_shipping_cost DECIMAL,
  p_tax_amount DECIMAL,
  p_discount_amount DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN p_subtotal - p_discount_amount + p_shipping_cost + p_tax_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Create triggers for updated_at timestamps

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to shop_users
DROP TRIGGER IF EXISTS update_shop_users_updated_at ON shop_users;
CREATE TRIGGER update_shop_users_updated_at
  BEFORE UPDATE ON shop_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to tax_rates
DROP TRIGGER IF EXISTS update_tax_rates_updated_at ON tax_rates;
CREATE TRIGGER update_tax_rates_updated_at
  BEFORE UPDATE ON tax_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert default tax rates (optional - can be commented out)

-- Bangladesh VAT (15%)
INSERT INTO tax_rates (shop_id, name, rate, country, priority)
SELECT id, 'VAT', 0.15, 'BD', 0
FROM shop_settings
WHERE NOT EXISTS (
  SELECT 1 FROM tax_rates WHERE name = 'VAT' AND country = 'BD'
)
ON CONFLICT DO NOTHING;

-- 9. Create views for common queries

-- View: Active tax rates by shop
CREATE OR REPLACE VIEW v_active_tax_rates AS
SELECT
  tr.*,
  ss.shop_name
FROM tax_rates tr
JOIN shop_settings ss ON tr.shop_id = ss.id
WHERE tr.is_active = true
ORDER BY tr.priority DESC, tr.created_at DESC;

-- View: Audit log summary
CREATE OR REPLACE VIEW v_audit_log_summary AS
SELECT
  shop_id,
  resource_type,
  action,
  COUNT(*) as count,
  MAX(created_at) as last_action
FROM audit_logs
GROUP BY shop_id, resource_type, action;

-- 10. Grant permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Run cleanup function once to remove any existing expired locks
SELECT cleanup_expired_locks();
