-- ============================================================================
-- TABLE: themes
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  primary_color VARCHAR(20) DEFAULT '#000000',
  secondary_color VARCHAR(20) DEFAULT '#666666',
  accent_color VARCHAR(20) DEFAULT '#0066cc',
  background_color VARCHAR(20) DEFAULT '#ffffff',
  text_color VARCHAR(20) DEFAULT '#000000',
  heading_font VARCHAR(100) DEFAULT 'Inter',
  body_font VARCHAR(100) DEFAULT 'Inter',
  header_style VARCHAR(50) DEFAULT 'standard',
  footer_style VARCHAR(50) DEFAULT 'standard',
  product_card_style VARCHAR(50) DEFAULT 'standard',
  custom_css TEXT,
  custom_js TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE themes ADD CONSTRAINT themes_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;
