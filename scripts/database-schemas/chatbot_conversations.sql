-- ============================================================================
-- TABLE: chatbot_conversations
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  customer_id UUID,
  session_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE chatbot_conversations ADD CONSTRAINT chatbot_conversations_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chatbot_conversations ADD CONSTRAINT chatbot_conversations_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
