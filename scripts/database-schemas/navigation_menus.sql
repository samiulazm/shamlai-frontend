-- ============================================================================
-- TABLE: navigation_menus
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS navigation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE navigation_menus ADD CONSTRAINT navigation_menus_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;
