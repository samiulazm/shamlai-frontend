-- ============================================================================
-- TABLE: task_configs
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  config_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  task_template JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, config_name)
);

-- Foreign Keys
ALTER TABLE task_configs ADD CONSTRAINT task_configs_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE task_configs ADD CONSTRAINT task_configs_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_configs_shop_id ON task_configs(shop_id);
CREATE INDEX IF NOT EXISTS idx_task_configs_trigger ON task_configs(trigger_event);
