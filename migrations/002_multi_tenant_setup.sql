-- =====================================================
-- Migration: Multi-Tenant Database Schema
-- Version: 002
-- Description: Comprehensive multi-tenancy implementation
-- Author: Claude
-- Date: 2025-11-22
-- =====================================================

-- =====================================================
-- PART 1: CREATE ENUM TYPES
-- =====================================================

-- User roles for RBAC
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',        -- Platform admin (Shamlai team)
    'org_owner',          -- Organization owner
    'org_admin',          -- Organization administrator
    'shop_owner',         -- Shop owner
    'shop_manager',       -- Shop manager (full access except billing)
    'shop_staff',         -- Shop staff (limited access)
    'accountant',         -- Accounting access
    'inventory_manager',  -- Inventory management
    'customer_support',   -- Customer service
    'read_only'           -- View-only access
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Subscription tiers
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'free',
    'starter',
    'professional',
    'enterprise'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Subscription status
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PART 2: CREATE ORGANIZATIONS TABLE (OPTIONAL)
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Billing & Subscription
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  billing_email VARCHAR(255),

  -- Limits & Features
  max_shops INTEGER DEFAULT 1,
  max_users_per_shop INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 100,
  max_orders_per_month INTEGER DEFAULT 1000,
  features JSONB DEFAULT '{}',

  -- Contact & Metadata
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  country VARCHAR(2),
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Settings
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Audit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_status, subscription_tier) WHERE deleted_at IS NULL;

-- Organizations updated_at trigger
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 3: ENHANCE SHOP_SETTINGS TABLE
-- =====================================================

-- Add new columns to shop_settings
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tenant_tier VARCHAR(50) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_orders_per_month INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 500,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Shop settings indexes
CREATE INDEX IF NOT EXISTS idx_shop_settings_organization ON shop_settings(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_settings_tenant_status ON shop_settings(tenant_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_settings_subdomain ON shop_settings(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_settings_username ON shop_settings(shop_username) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_settings_user ON shop_settings(user_id) WHERE deleted_at IS NULL;

-- =====================================================
-- PART 4: ENHANCE/CREATE SHOP_USERS TABLE (RBAC)
-- =====================================================

-- Create shop_users table if not exists (migration 001 may have created it)
CREATE TABLE IF NOT EXISTS shop_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'shop_staff',

  -- Permissions (optional granular control)
  permissions JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  invitation_accepted BOOLEAN DEFAULT false,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(shop_id, user_id)
);

-- Shop users indexes
CREATE INDEX IF NOT EXISTS idx_shop_users_shop ON shop_users(shop_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shop_users_user ON shop_users(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shop_users_role ON shop_users(shop_id, role) WHERE is_active = true;

-- Shop users updated_at trigger
DROP TRIGGER IF EXISTS update_shop_users_updated_at ON shop_users;
CREATE TRIGGER update_shop_users_updated_at
  BEFORE UPDATE ON shop_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 5: ADD TENANT FIELDS TO EXISTING TABLES
-- =====================================================

-- Products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Other tables (add as needed)
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =====================================================
-- PART 6: CREATE TENANT-AWARE INDEXES
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_shop_status ON products(shop_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_shop_category ON products(shop_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_shop_created ON products(shop_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(shop_id, sku) WHERE deleted_at IS NULL AND sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by) WHERE deleted_at IS NULL;

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders(shop_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shop_customer ON orders(shop_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shop_date ON orders(shop_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_assigned ON orders(assigned_to) WHERE deleted_at IS NULL AND assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by) WHERE deleted_at IS NULL;

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_shop_email ON customers(shop_id, email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_shop_phone ON customers(shop_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id) WHERE user_id IS NOT NULL;

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_shop ON audit_logs(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(shop_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(shop_id, action, created_at DESC);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id) WHERE deleted_at IS NULL;

-- Discount codes indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_shop ON discount_codes(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(shop_id, code) WHERE deleted_at IS NULL;

-- =====================================================
-- PART 7: RLS HELPER FUNCTIONS
-- =====================================================

-- Get all shops a user has access to
CREATE OR REPLACE FUNCTION get_user_shops(user_uuid UUID)
RETURNS TABLE(shop_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT su.shop_id
  FROM shop_users su
  WHERE su.user_id = user_uuid
    AND su.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has access to specific shop
CREATE OR REPLACE FUNCTION user_has_shop_access(user_uuid UUID, check_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM shop_users
    WHERE user_id = user_uuid
      AND shop_id = check_shop_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's role in shop
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID, check_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role_value TEXT;
BEGIN
  SELECT role::TEXT INTO user_role_value
  FROM shop_users
  WHERE user_id = user_uuid
    AND shop_id = check_shop_id
    AND is_active = true
  LIMIT 1;

  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_uuid UUID,
  check_shop_id UUID,
  required_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_value TEXT;
BEGIN
  user_role_value := get_user_role(user_uuid, check_shop_id);

  -- No access if not a member
  IF user_role_value IS NULL THEN
    RETURN false;
  END IF;

  -- Super admin and shop owner have all permissions
  IF user_role_value IN ('super_admin', 'shop_owner') THEN
    RETURN true;
  END IF;

  -- Check role-based permissions
  CASE required_permission
    WHEN 'products.write' THEN
      RETURN user_role_value IN ('shop_manager', 'inventory_manager');
    WHEN 'products.read' THEN
      RETURN user_role_value IN ('shop_manager', 'shop_staff', 'inventory_manager', 'read_only', 'customer_support', 'accountant');
    WHEN 'orders.write' THEN
      RETURN user_role_value IN ('shop_manager', 'customer_support');
    WHEN 'orders.read' THEN
      RETURN user_role_value IN ('shop_manager', 'shop_staff', 'customer_support', 'accountant', 'read_only');
    WHEN 'customers.write' THEN
      RETURN user_role_value IN ('shop_manager', 'customer_support');
    WHEN 'customers.read' THEN
      RETURN user_role_value IN ('shop_manager', 'shop_staff', 'customer_support', 'read_only', 'accountant');
    WHEN 'accounting.write' THEN
      RETURN user_role_value IN ('shop_manager', 'accountant');
    WHEN 'accounting.read' THEN
      RETURN user_role_value IN ('shop_manager', 'accountant', 'read_only');
    WHEN 'settings.write' THEN
      RETURN user_role_value = 'shop_manager';
    WHEN 'settings.read' THEN
      RETURN user_role_value IN ('shop_manager', 'read_only');
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PART 8: TENANT MANAGEMENT FUNCTIONS
-- =====================================================

-- Create new tenant (shop)
CREATE OR REPLACE FUNCTION create_tenant(
  p_user_id UUID,
  p_shop_name VARCHAR,
  p_shop_username VARCHAR,
  p_subdomain VARCHAR
)
RETURNS UUID AS $$
DECLARE
  new_shop_id UUID;
BEGIN
  -- Insert shop
  INSERT INTO shop_settings (user_id, shop_name, shop_username, subdomain, created_at, updated_at)
  VALUES (p_user_id, p_shop_name, p_shop_username, p_subdomain, NOW(), NOW())
  RETURNING id INTO new_shop_id;

  -- Add owner to shop_users
  INSERT INTO shop_users (shop_id, user_id, role, is_active, invitation_accepted, joined_at, created_at, updated_at)
  VALUES (new_shop_id, p_user_id, 'shop_owner', true, true, NOW(), NOW(), NOW());

  -- Log creation
  INSERT INTO audit_logs (shop_id, user_id, action, resource_type, resource_id, resource_name, created_at)
  VALUES (new_shop_id, p_user_id, 'create', 'shop', new_shop_id, p_shop_name, NOW());

  RETURN new_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Invite user to shop
CREATE OR REPLACE FUNCTION invite_user_to_shop(
  p_shop_id UUID,
  p_user_email VARCHAR,
  p_role TEXT,
  p_invited_by UUID
)
RETURNS UUID AS $$
DECLARE
  target_user_id UUID;
  invitation_id UUID;
BEGIN
  -- Check if inviter has permission
  IF NOT user_has_permission(p_invited_by, p_shop_id, 'settings.write') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Get user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_email;
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM shop_users
    WHERE shop_id = p_shop_id AND user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this shop';
  END IF;

  -- Insert shop_user
  INSERT INTO shop_users (shop_id, user_id, role, invited_by, invited_at, is_active, created_at, updated_at)
  VALUES (p_shop_id, target_user_id, p_role::user_role, p_invited_by, NOW(), true, NOW(), NOW())
  RETURNING id INTO invitation_id;

  -- Log invitation
  INSERT INTO audit_logs (shop_id, user_id, action, resource_type, resource_id, metadata, created_at)
  VALUES (p_shop_id, p_invited_by, 'invite', 'shop_user', invitation_id,
          jsonb_build_object('invited_email', p_user_email, 'role', p_role), NOW());

  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove user from shop
CREATE OR REPLACE FUNCTION remove_user_from_shop(
  p_shop_id UUID,
  p_user_id UUID,
  p_removed_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check permission
  IF NOT user_has_permission(p_removed_by, p_shop_id, 'settings.write') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Can't remove shop owner
  IF EXISTS (
    SELECT 1 FROM shop_users
    WHERE shop_id = p_shop_id AND user_id = p_user_id AND role = 'shop_owner'
  ) THEN
    RAISE EXCEPTION 'Cannot remove shop owner';
  END IF;

  -- Deactivate user
  UPDATE shop_users
  SET is_active = false, updated_at = NOW()
  WHERE shop_id = p_shop_id AND user_id = p_user_id;

  -- Log removal
  INSERT INTO audit_logs (shop_id, user_id, action, resource_type, metadata, created_at)
  VALUES (p_shop_id, p_removed_by, 'remove', 'shop_user',
          jsonb_build_object('removed_user_id', p_user_id), NOW());

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Change user role
CREATE OR REPLACE FUNCTION change_user_role(
  p_shop_id UUID,
  p_user_id UUID,
  p_new_role TEXT,
  p_changed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  old_role TEXT;
BEGIN
  -- Check permission
  IF NOT user_has_permission(p_changed_by, p_shop_id, 'settings.write') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Get current role
  SELECT role::TEXT INTO old_role
  FROM shop_users
  WHERE shop_id = p_shop_id AND user_id = p_user_id;

  -- Can't change shop owner role
  IF old_role = 'shop_owner' THEN
    RAISE EXCEPTION 'Cannot change shop owner role';
  END IF;

  -- Update role
  UPDATE shop_users
  SET role = p_new_role::user_role, updated_at = NOW()
  WHERE shop_id = p_shop_id AND user_id = p_user_id;

  -- Log change
  INSERT INTO audit_logs (shop_id, user_id, action, resource_type, metadata, created_at)
  VALUES (p_shop_id, p_changed_by, 'update', 'shop_user',
          jsonb_build_object('user_id', p_user_id, 'old_role', old_role, 'new_role', p_new_role), NOW());

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tenant usage statistics
CREATE OR REPLACE FUNCTION get_tenant_stats(p_shop_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'products_count', (SELECT COUNT(*) FROM products WHERE shop_id = p_shop_id AND deleted_at IS NULL),
    'active_products_count', (SELECT COUNT(*) FROM products WHERE shop_id = p_shop_id AND status = 'active' AND deleted_at IS NULL),
    'orders_count', (SELECT COUNT(*) FROM orders WHERE shop_id = p_shop_id AND deleted_at IS NULL),
    'customers_count', (SELECT COUNT(*) FROM customers WHERE shop_id = p_shop_id AND deleted_at IS NULL),
    'users_count', (SELECT COUNT(*) FROM shop_users WHERE shop_id = p_shop_id AND is_active = true),
    'storage_used_mb', 0,
    'created_at', (SELECT created_at FROM shop_settings WHERE id = p_shop_id)
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PART 9: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on tables
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 10: CREATE RLS POLICIES
-- =====================================================

-- ==================== SHOP SETTINGS ====================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "shop_settings_select" ON shop_settings;
DROP POLICY IF EXISTS "shop_settings_insert" ON shop_settings;
DROP POLICY IF EXISTS "shop_settings_update" ON shop_settings;
DROP POLICY IF EXISTS "shop_settings_delete" ON shop_settings;

-- Read: Users can read shops they have access to
CREATE POLICY "shop_settings_select" ON shop_settings
  FOR SELECT
  USING (
    id IN (SELECT get_user_shops(auth.uid()))
  );

-- Insert: Only authenticated users can create shops
CREATE POLICY "shop_settings_insert" ON shop_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Update: Only users with settings.write permission
CREATE POLICY "shop_settings_update" ON shop_settings
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), id, 'settings.write')
  );

-- Delete: Only owners and super admins
CREATE POLICY "shop_settings_delete" ON shop_settings
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid(), id) = 'super_admin'
  );

-- ==================== SHOP USERS ====================

DROP POLICY IF EXISTS "shop_users_select" ON shop_users;
DROP POLICY IF EXISTS "shop_users_insert" ON shop_users;
DROP POLICY IF EXISTS "shop_users_update" ON shop_users;
DROP POLICY IF EXISTS "shop_users_delete" ON shop_users;

CREATE POLICY "shop_users_select" ON shop_users
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
  );

CREATE POLICY "shop_users_insert" ON shop_users
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), shop_id, 'settings.write')
  );

CREATE POLICY "shop_users_update" ON shop_users
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), shop_id, 'settings.write')
  );

CREATE POLICY "shop_users_delete" ON shop_users
  FOR DELETE
  USING (
    user_has_permission(auth.uid(), shop_id, 'settings.write')
  );

-- ==================== PRODUCTS ====================

DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;

CREATE POLICY "products_select" ON products
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    AND deleted_at IS NULL
  );

CREATE POLICY "products_insert" ON products
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), shop_id, 'products.write')
    AND shop_id IN (SELECT get_user_shops(auth.uid()))
  );

CREATE POLICY "products_update" ON products
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), shop_id, 'products.write')
    AND shop_id IN (SELECT get_user_shops(auth.uid()))
  );

CREATE POLICY "products_delete" ON products
  FOR DELETE
  USING (
    get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
  );

-- ==================== ORDERS ====================

DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;
DROP POLICY IF EXISTS "orders_delete" ON orders;

CREATE POLICY "orders_select" ON orders
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    OR customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "orders_insert" ON orders
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), shop_id, 'orders.write')
    OR shop_id IN (SELECT get_user_shops(auth.uid()))
  );

CREATE POLICY "orders_update" ON orders
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), shop_id, 'orders.write')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "orders_delete" ON orders
  FOR DELETE
  USING (
    get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
  );

-- ==================== CUSTOMERS ====================

DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;

CREATE POLICY "customers_select" ON customers
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    OR user_id = auth.uid()
  );

CREATE POLICY "customers_insert" ON customers
  FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT get_user_shops(auth.uid()))
  );

CREATE POLICY "customers_update" ON customers
  FOR UPDATE
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    OR user_id = auth.uid()
  );

CREATE POLICY "customers_delete" ON customers
  FOR DELETE
  USING (
    get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
  );

-- ==================== PRODUCT VARIANTS ====================

DROP POLICY IF EXISTS "product_variants_select" ON product_variants;
DROP POLICY IF EXISTS "product_variants_insert" ON product_variants;
DROP POLICY IF EXISTS "product_variants_update" ON product_variants;
DROP POLICY IF EXISTS "product_variants_delete" ON product_variants;

CREATE POLICY "product_variants_select" ON product_variants
  FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products WHERE shop_id IN (SELECT get_user_shops(auth.uid()))
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "product_variants_insert" ON product_variants
  FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE shop_id IN (SELECT get_user_shops(auth.uid()))
        AND user_has_permission(auth.uid(), shop_id, 'products.write')
    )
  );

CREATE POLICY "product_variants_update" ON product_variants
  FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE shop_id IN (SELECT get_user_shops(auth.uid()))
        AND user_has_permission(auth.uid(), shop_id, 'products.write')
    )
  );

CREATE POLICY "product_variants_delete" ON product_variants
  FOR DELETE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE shop_id IN (SELECT get_user_shops(auth.uid()))
        AND get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
    )
  );

-- ==================== PRODUCT IMAGES ====================

DROP POLICY IF EXISTS "product_images_select" ON product_images;
DROP POLICY IF EXISTS "product_images_insert" ON product_images;
DROP POLICY IF EXISTS "product_images_update" ON product_images;
DROP POLICY IF EXISTS "product_images_delete" ON product_images;

CREATE POLICY "product_images_select" ON product_images
  FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products WHERE shop_id IN (SELECT get_user_shops(auth.uid()))
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "product_images_insert" ON product_images
  FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE shop_id IN (SELECT get_user_shops(auth.uid()))
        AND user_has_permission(auth.uid(), shop_id, 'products.write')
    )
  );

CREATE POLICY "product_images_update" ON product_images
  FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE shop_id IN (SELECT get_user_shops(auth.uid()))
        AND user_has_permission(auth.uid(), shop_id, 'products.write')
    )
  );

CREATE POLICY "product_images_delete" ON product_images
  FOR DELETE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE shop_id IN (SELECT get_user_shops(auth.uid()))
        AND get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
    )
  );

-- ==================== DISCOUNT CODES ====================

DROP POLICY IF EXISTS "discount_codes_select" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_insert" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_update" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_delete" ON discount_codes;

CREATE POLICY "discount_codes_select" ON discount_codes
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    AND deleted_at IS NULL
  );

CREATE POLICY "discount_codes_insert" ON discount_codes
  FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT get_user_shops(auth.uid()))
  );

CREATE POLICY "discount_codes_update" ON discount_codes
  FOR UPDATE
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
  );

CREATE POLICY "discount_codes_delete" ON discount_codes
  FOR DELETE
  USING (
    get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
  );

-- ==================== AUDIT LOGS ====================

DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;

CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
  );

-- Service role only for insert
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- PART 11: GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant table permissions
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON shop_settings TO authenticated;
GRANT ALL ON shop_users TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON product_images TO authenticated;
GRANT ALL ON discount_codes TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Multi-tenant database schema migration completed successfully';
  RAISE NOTICE 'Created: organizations table, enhanced shop_settings, shop_users RBAC';
  RAISE NOTICE 'Added: RLS policies, tenant indexes, helper functions';
  RAISE NOTICE 'Next steps: Update application layer to use tenant context';
END $$;
