-- ============================================================================
-- TABLE: hrm_employees
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS hrm_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  user_id UUID,
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  designation TEXT,
  department TEXT,
  joining_date DATE NOT NULL,
  salary NUMERIC,
  currency TEXT DEFAULT 'USD',
  employment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, employee_code)
);

-- Foreign Keys
ALTER TABLE hrm_employees ADD CONSTRAINT hrm_employees_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE hrm_employees ADD CONSTRAINT hrm_employees_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE hrm_employees ADD CONSTRAINT hrm_employees_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hrm_employees_shop_id ON hrm_employees(shop_id);
CREATE INDEX IF NOT EXISTS idx_hrm_employees_status ON hrm_employees(status);
CREATE INDEX IF NOT EXISTS idx_hrm_employees_user_id ON hrm_employees(user_id) WHERE user_id IS NOT NULL;
