-- ============================================================================
-- TABLE: hrm_activities
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS hrm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_title TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE hrm_activities ADD CONSTRAINT hrm_activities_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE hrm_activities ADD CONSTRAINT hrm_activities_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES hrm_employees(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hrm_activities_shop_id ON hrm_activities(shop_id);
CREATE INDEX IF NOT EXISTS idx_hrm_activities_employee_id ON hrm_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_activities_date ON hrm_activities(activity_date DESC);
