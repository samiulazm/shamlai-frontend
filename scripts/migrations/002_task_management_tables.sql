-- ============================================================================
-- TASK MANAGEMENT TABLES MIGRATION
-- Migration: 002_task_management_tables
-- Description: Creates tables for task and follow-up management
-- ============================================================================

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('general', 'order', 'customer', 'inventory', 'marketing', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5, 2),
  actual_hours DECIMAL(5, 2),
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-ups table
CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  followup_type TEXT NOT NULL CHECK (followup_type IN ('order', 'customer', 'payment', 'delivery', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'resolved', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  followup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  outcome TEXT,
  next_followup_date TIMESTAMP WITH TIME ZONE,
  contact_method TEXT CHECK (contact_method IN ('phone', 'email', 'sms', 'whatsapp', 'other')),
  contact_result TEXT,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task configurations table (for auto task creation)
CREATE TABLE IF NOT EXISTS task_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  config_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('order_created', 'order_pending', 'order_delivered', 'payment_received', 'customer_created', 'custom')),
  task_template JSONB NOT NULL, -- Contains title, description, priority, due_date_offset, etc.
  is_active BOOLEAN DEFAULT true,
  conditions JSONB, -- Additional conditions for when to create task
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, config_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_shop_id ON tasks(shop_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_followups_shop_id ON followups(shop_id);
CREATE INDEX IF NOT EXISTS idx_followups_order_id ON followups(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_followups_customer_id ON followups(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_followups_assigned_to ON followups(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_followups_date ON followups(followup_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_task_configs_shop_id ON task_configs(shop_id);
CREATE INDEX IF NOT EXISTS idx_task_configs_trigger ON task_configs(trigger_event);

-- Comments
COMMENT ON TABLE tasks IS 'General task management for shop operations';
COMMENT ON TABLE followups IS 'Customer and order follow-up tracking';
COMMENT ON TABLE task_configs IS 'Automated task creation configurations based on events';

