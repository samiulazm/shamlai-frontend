-- ============================================================================
-- TABLE: blocked_mobiles
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_mobiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  mobile_number TEXT NOT NULL,
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
  UNIQUE(shop_id, mobile_number)
);

-- Foreign Keys
ALTER TABLE blocked_mobiles ADD CONSTRAINT blocked_mobiles_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE blocked_mobiles ADD CONSTRAINT blocked_mobiles_blocked_by_fkey 
  FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE NO ACTION;

ALTER TABLE blocked_mobiles ADD CONSTRAINT blocked_mobiles_unblocked_by_fkey 
  FOREIGN KEY (unblocked_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_mobiles_shop_id ON blocked_mobiles(shop_id);
CREATE INDEX IF NOT EXISTS idx_blocked_mobiles_number ON blocked_mobiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_blocked_mobiles_active ON blocked_mobiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_blocked_mobiles_expires ON blocked_mobiles(expires_at) WHERE expires_at IS NOT NULL;
