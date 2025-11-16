-- ============================================================================
-- AUTOMATION TABLES MIGRATION
-- Migration: 004_automation_tables
-- Description: Creates tables for workflow automation (workflows, templates, executions)
-- ============================================================================

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('order_created', 'order_status_changed', 'payment_received', 'customer_created', 'product_low_stock', 'custom')),
  trigger_conditions JSONB, -- Conditions that must be met to trigger workflow
  actions JSONB NOT NULL, -- Array of actions to execute
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT CHECK (category IN ('orders', 'marketing', 'inventory', 'customer', 'other')),
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB,
  actions JSONB NOT NULL,
  is_system_template BOOLEAN DEFAULT false, -- System templates vs user-created
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions table (log of workflow runs)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  trigger_data JSONB, -- Data that triggered the workflow
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,
  actions_executed JSONB, -- Log of actions that were executed
  error_message TEXT,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_shop_id ON workflows(shop_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_trigger ON workflow_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_shop_id ON workflow_executions(shop_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started ON workflow_executions(started_at DESC);

-- Comments
COMMENT ON TABLE workflows IS 'Custom workflow definitions for automation';
COMMENT ON TABLE workflow_templates IS 'Reusable workflow templates';
COMMENT ON TABLE workflow_executions IS 'Execution log for workflow runs';

