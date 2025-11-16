-- ============================================================================
-- TABLE: product_reviews
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  customer_id UUID,
  order_id UUID,
  rating INTEGER NOT NULL,
  title VARCHAR(255),
  review TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
