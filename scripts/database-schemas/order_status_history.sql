-- ============================================================================
-- TABLE: order_status_history
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  status VARCHAR(50) NOT NULL,
  comment TEXT,
  notify_customer BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE order_status_history ADD CONSTRAINT order_status_history_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_status_history ADD CONSTRAINT order_status_history_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION;
