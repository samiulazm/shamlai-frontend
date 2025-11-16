-- ============================================================================
-- TABLE: cart
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE cart ADD CONSTRAINT cart_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_expires_at ON cart(expires_at) WHERE expires_at IS NOT NULL;
