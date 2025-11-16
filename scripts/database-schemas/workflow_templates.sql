-- ============================================================================
-- TABLE: workflow_templates
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB,
  actions JSONB NOT NULL,
  is_system_template BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE workflow_templates ADD CONSTRAINT workflow_templates_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_trigger ON workflow_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
