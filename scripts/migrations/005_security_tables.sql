-- ============================================================================
-- SECURITY TABLES MIGRATION
-- Migration: 005_security_tables
-- Description: Creates tables for security features (blocked IPs, blocked mobiles)
-- ============================================================================

-- Blocked IPs table
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  reason TEXT,
  block_type TEXT NOT NULL DEFAULT 'manual' CHECK (block_type IN ('manual', 'automatic', 'abuse', 'fraud')),
  is_active BOOLEAN DEFAULT true,
  blocked_by UUID REFERENCES users(id),
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means permanent
  unblocked_at TIMESTAMP WITH TIME ZONE,
  unblocked_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, ip_address)
);

-- Blocked mobiles table
CREATE TABLE IF NOT EXISTS blocked_mobiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile_number TEXT NOT NULL,
  reason TEXT,
  block_type TEXT NOT NULL DEFAULT 'manual' CHECK (block_type IN ('manual', 'automatic', 'abuse', 'fraud', 'spam')),
  is_active BOOLEAN DEFAULT true,
  blocked_by UUID REFERENCES users(id),
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means permanent
  unblocked_at TIMESTAMP WITH TIME ZONE,
  unblocked_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, mobile_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocked_ips_shop_id ON blocked_ips(shop_id);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON blocked_ips(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocked_mobiles_shop_id ON blocked_mobiles(shop_id);
CREATE INDEX IF NOT EXISTS idx_blocked_mobiles_number ON blocked_mobiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_blocked_mobiles_active ON blocked_mobiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_blocked_mobiles_expires ON blocked_mobiles(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON TABLE blocked_ips IS 'IP address blocking for security and abuse prevention';
COMMENT ON TABLE blocked_mobiles IS 'Mobile number blocking for spam and abuse prevention';

