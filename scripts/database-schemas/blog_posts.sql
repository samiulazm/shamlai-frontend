-- ============================================================================
-- TABLE: blog_posts
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  author_id UUID,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  tags TEXT[],
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
