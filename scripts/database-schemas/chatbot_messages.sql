-- ============================================================================
-- TABLE: chatbot_messages
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  sender_type VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE chatbot_messages ADD CONSTRAINT chatbot_messages_conversation_id_fkey 
  FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations(id) ON DELETE CASCADE;
