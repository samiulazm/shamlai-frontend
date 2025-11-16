-- ============================================================================
-- TABLE: blocked_ips
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  reason TEXT,
  block_type TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN DEFAULT true,
  blocked_by UUID,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  unblocked_at TIMESTAMP WITH TIME ZONE,
  unblocked_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, ip_address)
);

-- Foreign Keys
ALTER TABLE blocked_ips ADD CONSTRAINT blocked_ips_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE blocked_ips ADD CONSTRAINT blocked_ips_blocked_by_fkey 
  FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE NO ACTION;

ALTER TABLE blocked_ips ADD CONSTRAINT blocked_ips_unblocked_by_fkey 
  FOREIGN KEY (unblocked_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_ips_shop_id ON blocked_ips(shop_id);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON blocked_ips(expires_at) WHERE expires_at IS NOT NULL;
