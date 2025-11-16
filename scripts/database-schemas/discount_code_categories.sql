-- ============================================================================
-- TABLE: discount_code_categories
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_code_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE discount_code_categories ADD CONSTRAINT discount_code_categories_discount_code_id_fkey 
  FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE CASCADE;

ALTER TABLE discount_code_categories ADD CONSTRAINT discount_code_categories_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
