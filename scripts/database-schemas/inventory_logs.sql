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
