-- ============================================================================
-- HRM (HUMAN RESOURCE MANAGEMENT) TABLES MIGRATION
-- Migration: 003_hrm_tables
-- Description: Creates tables for HRM module (employees, attendance, activities, leaves)
-- ============================================================================

-- HRM Employees table
CREATE TABLE IF NOT EXISTS hrm_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to auth user if applicable
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  designation TEXT,
  department TEXT,
  joining_date DATE NOT NULL,
  salary DECIMAL(15, 2),
  currency TEXT DEFAULT 'USD',
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, employee_code)
);

-- HRM Attendance table
CREATE TABLE IF NOT EXISTS hrm_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  work_hours DECIMAL(5, 2),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'leave', 'holiday')),
  leave_type TEXT CHECK (leave_type IN ('sick', 'casual', 'annual', 'unpaid', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- HRM Activities table
CREATE TABLE IF NOT EXISTS hrm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('task', 'order', 'customer', 'inventory', 'other')),
  activity_title TEXT NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference orders, tasks, etc.
  reference_type TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HRM Leaves table
CREATE TABLE IF NOT EXISTS hrm_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'annual', 'unpaid', 'maternity', 'paternity', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hrm_employees_shop_id ON hrm_employees(shop_id);
CREATE INDEX IF NOT EXISTS idx_hrm_employees_user_id ON hrm_employees(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hrm_employees_status ON hrm_employees(status);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_shop_id ON hrm_attendance(shop_id);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_employee_id ON hrm_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_date ON hrm_attendance(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_hrm_activities_shop_id ON hrm_activities(shop_id);
CREATE INDEX IF NOT EXISTS idx_hrm_activities_employee_id ON hrm_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_activities_date ON hrm_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_shop_id ON hrm_leaves(shop_id);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_employee_id ON hrm_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_status ON hrm_leaves(status);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_dates ON hrm_leaves(start_date, end_date);

-- Comments
COMMENT ON TABLE hrm_employees IS 'Employee master data for HRM module';
COMMENT ON TABLE hrm_attendance IS 'Daily attendance tracking for employees';
COMMENT ON TABLE hrm_activities IS 'Employee activity log for tracking work';
COMMENT ON TABLE hrm_leaves IS 'Leave requests and management';

