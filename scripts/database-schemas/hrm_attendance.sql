-- ============================================================================
-- TABLE: hrm_attendance
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS hrm_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  work_hours NUMERIC,
  status TEXT NOT NULL DEFAULT 'present',
  leave_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, attendance_date)
);

-- Foreign Keys
ALTER TABLE hrm_attendance ADD CONSTRAINT hrm_attendance_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE hrm_attendance ADD CONSTRAINT hrm_attendance_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES hrm_employees(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_shop_id ON hrm_attendance(shop_id);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_employee_id ON hrm_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_date ON hrm_attendance(attendance_date DESC);
