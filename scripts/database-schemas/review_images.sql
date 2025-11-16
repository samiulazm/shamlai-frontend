-- ============================================================================
-- TABLE: review_images
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID,
  image_url TEXT NOT NULL,
  image_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE review_images ADD CONSTRAINT review_images_review_id_fkey 
  FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE;
