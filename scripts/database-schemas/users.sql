-- ============================================================================
-- TABLE: users
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  birthday DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE users ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) REFERENCES _accounts(id) ON DELETE CASCADE;

-- Note: This table has RLS (Row Level Security) enabled with policies
-- RLS policies are managed by Insforge backend
