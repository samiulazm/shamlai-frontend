-- ============================================================================
-- TABLE: hrm_leaves
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS hrm_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE hrm_leaves ADD CONSTRAINT hrm_leaves_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE hrm_leaves ADD CONSTRAINT hrm_leaves_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES hrm_employees(id) ON DELETE CASCADE;

ALTER TABLE hrm_leaves ADD CONSTRAINT hrm_leaves_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_shop_id ON hrm_leaves(shop_id);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_employee_id ON hrm_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_status ON hrm_leaves(status);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_dates ON hrm_leaves(start_date, end_date);
