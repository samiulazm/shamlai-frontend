-- ============================================================================
-- TABLE: analytics_events
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(255),
  customer_id UUID,
  product_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
