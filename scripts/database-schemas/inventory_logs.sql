-- ============================================================================
-- TABLE: inventory_logs
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  variant_id UUID,
  change_type VARCHAR(50) NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes (added 2025-11-16)
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant_id ON inventory_logs(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_change_type ON inventory_logs(change_type);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_created ON inventory_logs(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant_created ON inventory_logs(variant_id, created_at DESC) WHERE variant_id IS NOT NULL;
