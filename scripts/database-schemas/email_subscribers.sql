-- ============================================================================
-- TABLE: email_subscribers
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'subscribed',
  tags TEXT[],
  source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, email)
);

-- Foreign Keys
ALTER TABLE email_subscribers ADD CONSTRAINT email_subscribers_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;
