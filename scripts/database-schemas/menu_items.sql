-- ============================================================================
-- TABLE: menu_items
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID,
  parent_id UUID,
  title VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  link_type VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE menu_items ADD CONSTRAINT menu_items_menu_id_fkey 
  FOREIGN KEY (menu_id) REFERENCES navigation_menus(id) ON DELETE CASCADE;

ALTER TABLE menu_items ADD CONSTRAINT menu_items_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE;
