-- ============================================================================
-- TABLE: followups
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  order_id UUID,
  customer_id UUID,
  followup_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  created_by UUID,
  followup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  outcome TEXT,
  next_followup_date TIMESTAMP WITH TIME ZONE,
  contact_method TEXT,
  contact_result TEXT,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE followups ADD CONSTRAINT followups_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE followups ADD CONSTRAINT followups_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE followups ADD CONSTRAINT followups_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE followups ADD CONSTRAINT followups_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE followups ADD CONSTRAINT followups_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_followups_shop_id ON followups(shop_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_date ON followups(followup_date);
CREATE INDEX IF NOT EXISTS idx_followups_customer_id ON followups(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_followups_order_id ON followups(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_followups_assigned_to ON followups(assigned_to) WHERE assigned_to IS NOT NULL;
