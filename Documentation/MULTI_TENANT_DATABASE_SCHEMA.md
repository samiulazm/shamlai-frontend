# Comprehensive Multi-Tenant Database Schema
## Shamlai E-Commerce Platform

**Version**: 1.0
**Last Updated**: 2025-11-22
**Database**: PostgreSQL (Supabase)

---

## Table of Contents

1. [Overview](#overview)
2. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
3. [Tenancy Model](#tenancy-model)
4. [Schema Design](#schema-design)
5. [Row-Level Security (RLS)](#row-level-security-rls)
6. [Indexes Strategy](#indexes-strategy)
7. [Database Functions](#database-functions)
8. [Migration Strategy](#migration-strategy)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)

---

## Overview

Shamlai uses a **shared database, shared schema** multi-tenancy model with row-level isolation. Each tenant (shop/organization) shares the same database and tables, with data segregated using tenant identifiers and enforced through PostgreSQL Row-Level Security (RLS) policies.

### Key Characteristics

- **Tenant Identifier**: `shop_id` (UUID) - Primary tenant discriminator
- **Database**: Single PostgreSQL database (Supabase)
- **Isolation Level**: Row-level via RLS policies
- **Authentication**: Supabase Auth with JWT
- **Access Control**: Role-Based Access Control (RBAC) via `shop_users` table

---

## Multi-Tenancy Architecture

### Architecture Pattern: Shared Database + Shared Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Shared Tables                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  products   │  │   orders    │  │  customers  │   │  │
│  │  │             │  │             │  │             │   │  │
│  │  │ shop_id: A  │  │ shop_id: A  │  │ shop_id: A  │   │  │
│  │  │ shop_id: B  │  │ shop_id: B  │  │ shop_id: B  │   │  │
│  │  │ shop_id: C  │  │ shop_id: C  │  │ shop_id: C  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Row-Level Security (RLS) Policies             │  │
│  │   ┌───────────────────────────────────────────────┐   │  │
│  │   │ WHERE shop_id IN (user_accessible_shops())    │   │  │
│  │   └───────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Advantages

✅ **Cost Efficient**: Single database infrastructure
✅ **Easy Maintenance**: Schema changes applied once
✅ **Simplified Backups**: One database to backup
✅ **Resource Sharing**: Efficient resource utilization
✅ **Fast Tenant Provisioning**: No new database creation needed

### Considerations

⚠️ **Security**: Requires careful RLS implementation
⚠️ **Performance**: Indexes must include tenant_id
⚠️ **Testing**: Must verify tenant isolation thoroughly

---

## Tenancy Model

### Three-Tier Tenant Hierarchy

```
Organizations (Enterprise)
    └── Shops (Tenants)
        └── Users (Members with Roles)
```

### 1. Organizations (Optional - Enterprise Feature)

For enterprise customers managing multiple shops under one billing account.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Billing & Subscription
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, starter, professional, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, trialing, past_due, canceled
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  billing_email VARCHAR(255),

  -- Limits & Features
  max_shops INTEGER DEFAULT 1,
  max_users_per_shop INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 100,
  max_orders_per_month INTEGER DEFAULT 1000,
  features JSONB DEFAULT '{}', -- {"custom_domain": true, "advanced_analytics": true}

  -- Contact & Metadata
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  country VARCHAR(2), -- ISO country code
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

CREATE INDEX idx_organizations_owner ON organizations(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_subscription ON organizations(subscription_status, subscription_tier) WHERE deleted_at IS NULL;
```

### 2. Shops (Primary Tenant)

Represents individual stores/shops. This is the primary tenant entity.

**Enhancing existing `shop_settings` table**:

```sql
-- Add new columns to existing shop_settings
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_status VARCHAR(50) DEFAULT 'active', -- active, suspended, trial, canceled
  ADD COLUMN IF NOT EXISTS tenant_tier VARCHAR(50) DEFAULT 'free', -- free, starter, professional, enterprise
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_orders_per_month INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 500,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_settings_organization ON shop_settings(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_settings_tenant_status ON shop_settings(tenant_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_settings_subdomain ON shop_settings(subdomain) WHERE deleted_at IS NULL;
```

### 3. Shop Users (RBAC)

Multi-user access to shops with role-based permissions.

**Already exists in migration, enhanced version**:

```sql
-- Enhance existing shop_users table
CREATE TYPE user_role AS ENUM (
  'super_admin',    -- Platform admin (Shamlai team)
  'org_owner',      -- Organization owner
  'org_admin',      -- Organization administrator
  'shop_owner',     -- Shop owner
  'shop_manager',   -- Shop manager (full access except billing)
  'shop_staff',     -- Shop staff (limited access)
  'accountant',     -- Accounting access
  'inventory_manager', -- Inventory management
  'customer_support',  -- Customer service
  'read_only'       -- View-only access
);

CREATE TABLE IF NOT EXISTS shop_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'shop_staff',

  -- Permissions (optional granular control)
  permissions JSONB DEFAULT '{}', -- {"products": "write", "orders": "read"}

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

CREATE INDEX idx_shop_users_shop ON shop_users(shop_id) WHERE is_active = true;
CREATE INDEX idx_shop_users_user ON shop_users(user_id) WHERE is_active = true;
CREATE INDEX idx_shop_users_role ON shop_users(shop_id, role) WHERE is_active = true;
```

---

## Schema Design

### Core Tenant Tables

#### 1. Tenant Identification Pattern

**All tenant-scoped tables MUST include**:

```sql
shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE
```

**Foreign Key with CASCADE**:
- Ensures data integrity
- Automatic cleanup when shop deleted
- Prevents orphaned records

#### 2. Tenant Isolation Pattern

**Every query MUST filter by tenant**:

```sql
-- Application layer
SELECT * FROM products WHERE shop_id = $1;

-- RLS Policy enforces this automatically
CREATE POLICY "tenant_isolation" ON products
  FOR ALL
  USING (shop_id IN (SELECT get_user_shops(auth.uid())));
```

### Enhanced Table Schemas

#### Products Table (Enhanced)

```sql
-- Add tenant fields to existing products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Composite indexes for tenant queries
CREATE INDEX IF NOT EXISTS idx_products_shop_status ON products(shop_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_shop_category ON products(shop_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_shop_created ON products(shop_id, created_at DESC) WHERE deleted_at IS NULL;
```

#### Orders Table (Enhanced)

```sql
-- Add tenant fields
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id), -- Staff handling order
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders(shop_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shop_customer ON orders(shop_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shop_date ON orders(shop_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_assigned ON orders(assigned_to) WHERE deleted_at IS NULL AND assigned_to IS NOT NULL;
```

#### Customers Table (Enhanced)

```sql
-- Add tenant fields
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_shop_email ON customers(shop_id, email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_shop_phone ON customers(shop_id, phone) WHERE deleted_at IS NULL;
```

### Cross-Tenant Tables (Shared Across All Tenants)

Some tables are NOT tenant-scoped:

```sql
-- auth.users (Supabase Auth) - Global
-- categories (if global) - Shared catalog
-- countries - Global reference data
-- currencies - Global reference data
```

---

## Row-Level Security (RLS)

### RLS Strategy

PostgreSQL RLS provides automatic, database-level tenant isolation.

### Core RLS Functions

```sql
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in shop
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID, check_shop_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  user_role VARCHAR;
BEGIN
  SELECT role INTO user_role
  FROM shop_users
  WHERE user_id = user_uuid
    AND shop_id = check_shop_id
    AND is_active = true
  LIMIT 1;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_uuid UUID,
  check_shop_id UUID,
  required_permission VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR;
BEGIN
  user_role := get_user_role(user_uuid, check_shop_id);

  -- Super admin and shop owner have all permissions
  IF user_role IN ('super_admin', 'shop_owner') THEN
    RETURN true;
  END IF;

  -- Check role-based permissions
  CASE required_permission
    WHEN 'products.write' THEN
      RETURN user_role IN ('shop_manager', 'inventory_manager');
    WHEN 'products.read' THEN
      RETURN user_role IN ('shop_manager', 'shop_staff', 'inventory_manager', 'read_only');
    WHEN 'orders.write' THEN
      RETURN user_role IN ('shop_manager', 'customer_support');
    WHEN 'orders.read' THEN
      RETURN user_role IN ('shop_manager', 'shop_staff', 'customer_support', 'accountant', 'read_only');
    WHEN 'accounting.write' THEN
      RETURN user_role IN ('shop_manager', 'accountant');
    WHEN 'settings.write' THEN
      RETURN user_role IN ('shop_manager');
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies for Tables

#### Shop Settings RLS

```sql
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Read: Users can read shops they have access to
CREATE POLICY "shop_settings_select" ON shop_settings
  FOR SELECT
  USING (
    id IN (SELECT get_user_shops(auth.uid()))
  );

-- Insert: Only authenticated users can create shops (becomes owner)
CREATE POLICY "shop_settings_insert" ON shop_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id -- User must be the owner
  );

-- Update: Only owners and managers can update
CREATE POLICY "shop_settings_update" ON shop_settings
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), id, 'settings.write')
  );

-- Delete: Only owners can delete (soft delete recommended)
CREATE POLICY "shop_settings_delete" ON shop_settings
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid(), id) = 'super_admin'
  );
```

#### Products RLS

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Read: Users can read products from their shops
CREATE POLICY "products_select" ON products
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    AND deleted_at IS NULL
  );

-- Insert: Users with product write permission
CREATE POLICY "products_insert" ON products
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), shop_id, 'products.write')
    AND shop_id IN (SELECT get_user_shops(auth.uid()))
  );

-- Update: Users with product write permission
CREATE POLICY "products_update" ON products
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), shop_id, 'products.write')
    AND shop_id IN (SELECT get_user_shops(auth.uid()))
  );

-- Delete: Only owners and managers
CREATE POLICY "products_delete" ON products
  FOR DELETE
  USING (
    get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
  );
```

#### Orders RLS

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Read: Staff can read their shop's orders
CREATE POLICY "orders_select" ON orders
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    OR customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Insert: Staff with order write permission
CREATE POLICY "orders_insert" ON orders
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), shop_id, 'orders.write')
    OR shop_id IN (SELECT get_user_shops(auth.uid())) -- Any staff can create orders
  );

-- Update: Assigned staff or managers
CREATE POLICY "orders_update" ON orders
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), shop_id, 'orders.write')
    OR assigned_to = auth.uid()
  );

-- Delete: Only owners and managers (soft delete recommended)
CREATE POLICY "orders_delete" ON orders
  FOR DELETE
  USING (
    get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
  );
```

#### Customers RLS

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Read: Shop staff can read their customers
CREATE POLICY "customers_select" ON customers
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    OR user_id = auth.uid() -- Customers can read their own data
  );

-- Insert: Shop staff can create customers
CREATE POLICY "customers_insert" ON customers
  FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT get_user_shops(auth.uid()))
  );

-- Update: Shop staff or customer themselves
CREATE POLICY "customers_update" ON customers
  FOR UPDATE
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
    OR user_id = auth.uid()
  );

-- Delete: Only owners and managers
CREATE POLICY "customers_delete" ON customers
  FOR DELETE
  USING (
    get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin')
  );
```

#### Audit Logs RLS

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Read: Only shop staff can read audit logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT
  USING (
    shop_id IN (SELECT get_user_shops(auth.uid()))
  );

-- Insert: System can insert (service role)
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT
  WITH CHECK (true); -- Service role only

-- No update or delete allowed
```

### Template for Other Tables

```sql
-- Apply to: product_variants, product_images, order_items, cart, cart_items,
-- addresses, discount_codes, etc.

ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[table_name]_select" ON [table_name]
  FOR SELECT
  USING (shop_id IN (SELECT get_user_shops(auth.uid())));

CREATE POLICY "[table_name]_insert" ON [table_name]
  FOR INSERT
  WITH CHECK (shop_id IN (SELECT get_user_shops(auth.uid())));

CREATE POLICY "[table_name]_update" ON [table_name]
  FOR UPDATE
  USING (shop_id IN (SELECT get_user_shops(auth.uid())));

CREATE POLICY "[table_name]_delete" ON [table_name]
  FOR DELETE
  USING (get_user_role(auth.uid(), shop_id) IN ('shop_owner', 'shop_manager', 'super_admin'));
```

---

## Indexes Strategy

### Tenant-Scoped Composite Indexes

**Rule**: Every index on a tenant-scoped table MUST include `shop_id` as the first column.

```sql
-- ❌ BAD: Non-tenant index
CREATE INDEX idx_products_status ON products(status);

-- ✅ GOOD: Tenant-scoped index
CREATE INDEX idx_products_shop_status ON products(shop_id, status);
```

### Index Patterns

#### 1. Primary Tenant Lookup

```sql
-- Every tenant table needs this
CREATE INDEX idx_[table]_shop ON [table](shop_id) WHERE deleted_at IS NULL;
```

#### 2. Tenant + Status

```sql
CREATE INDEX idx_[table]_shop_status ON [table](shop_id, status) WHERE deleted_at IS NULL;
```

#### 3. Tenant + Foreign Key

```sql
CREATE INDEX idx_[table]_shop_fk ON [table](shop_id, foreign_key_id) WHERE deleted_at IS NULL;
```

#### 4. Tenant + Timestamp (for sorting)

```sql
CREATE INDEX idx_[table]_shop_created ON [table](shop_id, created_at DESC) WHERE deleted_at IS NULL;
```

#### 5. Partial Indexes (Performance)

```sql
-- Only index active records
CREATE INDEX idx_products_active ON products(shop_id, id)
  WHERE status = 'active' AND deleted_at IS NULL;

-- Only index pending orders
CREATE INDEX idx_orders_pending ON orders(shop_id, created_at DESC)
  WHERE status IN ('pending', 'processing') AND deleted_at IS NULL;
```

### Full Index List for Core Tables

```sql
-- shop_settings
CREATE INDEX idx_shop_settings_user ON shop_settings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shop_settings_subdomain ON shop_settings(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX idx_shop_settings_username ON shop_settings(shop_username) WHERE deleted_at IS NULL;
CREATE INDEX idx_shop_settings_organization ON shop_settings(organization_id) WHERE deleted_at IS NULL;

-- shop_users
CREATE INDEX idx_shop_users_shop ON shop_users(shop_id) WHERE is_active = true;
CREATE INDEX idx_shop_users_user ON shop_users(user_id) WHERE is_active = true;
CREATE INDEX idx_shop_users_role ON shop_users(shop_id, role) WHERE is_active = true;

-- products
CREATE INDEX idx_products_shop ON products(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_shop_status ON products(shop_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_shop_category ON products(shop_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_shop_created ON products(shop_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(shop_id, sku) WHERE deleted_at IS NULL;

-- orders
CREATE INDEX idx_orders_shop ON orders(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_shop_status ON orders(shop_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_shop_customer ON orders(shop_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_shop_date ON orders(shop_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_assigned ON orders(assigned_to) WHERE assigned_to IS NOT NULL;

-- customers
CREATE INDEX idx_customers_shop ON customers(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_shop_email ON customers(shop_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_shop_phone ON customers(shop_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_user ON customers(user_id) WHERE user_id IS NOT NULL;

-- audit_logs
CREATE INDEX idx_audit_shop ON audit_logs(shop_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(shop_id, resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_logs(shop_id, action, created_at DESC);
```

---

## Database Functions

### Tenant Management Functions

```sql
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
  INSERT INTO shop_settings (user_id, shop_name, shop_username, subdomain)
  VALUES (p_user_id, p_shop_name, p_shop_username, p_subdomain)
  RETURNING id INTO new_shop_id;

  -- Add owner to shop_users
  INSERT INTO shop_users (shop_id, user_id, role, is_active, invitation_accepted, joined_at)
  VALUES (new_shop_id, p_user_id, 'shop_owner', true, true, NOW());

  -- Log creation
  INSERT INTO audit_logs (shop_id, user_id, action, resource_type, resource_id, resource_name)
  VALUES (new_shop_id, p_user_id, 'create', 'shop', new_shop_id, p_shop_name);

  RETURN new_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Invite user to shop
CREATE OR REPLACE FUNCTION invite_user_to_shop(
  p_shop_id UUID,
  p_user_email VARCHAR,
  p_role VARCHAR,
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

  -- Get or create user
  SELECT id INTO target_user_id FROM auth.users WHERE email = p_user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insert shop_user
  INSERT INTO shop_users (shop_id, user_id, role, invited_by, invited_at, is_active)
  VALUES (p_shop_id, target_user_id, p_role::user_role, p_invited_by, NOW(), true)
  RETURNING id INTO invitation_id;

  -- Log invitation
  INSERT INTO audit_logs (shop_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (p_shop_id, p_invited_by, 'invite', 'shop_user', invitation_id,
          jsonb_build_object('invited_email', p_user_email, 'role', p_role));

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
  INSERT INTO audit_logs (shop_id, user_id, action, resource_type, metadata)
  VALUES (p_shop_id, p_removed_by, 'remove', 'shop_user',
          jsonb_build_object('removed_user_id', p_user_id));

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Change user role
CREATE OR REPLACE FUNCTION change_user_role(
  p_shop_id UUID,
  p_user_id UUID,
  p_new_role VARCHAR,
  p_changed_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check permission
  IF NOT user_has_permission(p_changed_by, p_shop_id, 'settings.write') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Can't change shop owner role
  IF EXISTS (
    SELECT 1 FROM shop_users
    WHERE shop_id = p_shop_id AND user_id = p_user_id AND role = 'shop_owner'
  ) THEN
    RAISE EXCEPTION 'Cannot change shop owner role';
  END IF;

  -- Update role
  UPDATE shop_users
  SET role = p_new_role::user_role, updated_at = NOW()
  WHERE shop_id = p_shop_id AND user_id = p_user_id;

  -- Log change
  INSERT INTO audit_logs (shop_id, user_id, action, resource_type, metadata)
  VALUES (p_shop_id, p_changed_by, 'update', 'shop_user',
          jsonb_build_object('user_id', p_user_id, 'new_role', p_new_role));

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Tenant Statistics

```sql
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
    'storage_used_mb', 0, -- TODO: Calculate from file storage
    'created_at', (SELECT created_at FROM shop_settings WHERE id = p_shop_id)
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migration Strategy

### Step-by-Step Migration Plan

#### Phase 1: Add Tenant Management Tables

```sql
-- 1. Create organizations table (optional)
-- 2. Enhance shop_settings with new columns
-- 3. Enhance shop_users table
-- 4. Create indexes
```

#### Phase 2: Add Tenant Fields to Existing Tables

```sql
-- Add audit fields to all tables
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Repeat for: orders, customers, product_variants, etc.
```

#### Phase 3: Create RLS Functions

```sql
-- Create all helper functions
-- get_user_shops(), user_has_shop_access(), get_user_role(), user_has_permission()
```

#### Phase 4: Enable RLS Policies

```sql
-- Enable RLS on each table
-- Create policies for SELECT, INSERT, UPDATE, DELETE
-- Test thoroughly
```

#### Phase 5: Create Composite Indexes

```sql
-- Add tenant-aware indexes to all tables
-- Drop old non-tenant indexes
```

#### Phase 6: Application Layer Updates

- Update queries to use tenant context
- Add tenant validation middleware
- Update API routes
- Add tenant switching UI

---

## Security Considerations

### 1. RLS Bypass Protection

```sql
-- Service role can bypass RLS
-- Use with caution, only for system operations
-- Never expose service role key to client
```

### 2. Tenant Switching

```sql
-- Validate user has access before switching context
-- Log all tenant switches in audit_logs
```

### 3. Data Isolation Testing

```sql
-- Test plan:
-- 1. Create two tenants
-- 2. Create test data for each
-- 3. Verify tenant A cannot access tenant B's data
-- 4. Verify queries return only tenant-scoped data
```

### 4. SQL Injection Prevention

```sql
-- Always use parameterized queries
-- Never concatenate user input into SQL
-- Supabase client handles this automatically
```

### 5. Rate Limiting per Tenant

```typescript
// Implement tenant-specific rate limits
const rateLimit = new RateLimit({
  key: `tenant:${shopId}:${endpoint}`,
  limit: 100,
  window: '1m'
});
```

---

## Performance Optimization

### 1. Index Maintenance

```sql
-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Remove unused indexes
-- Rebuild fragmented indexes
REINDEX TABLE products;
```

### 2. Query Optimization

```sql
-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM products
WHERE shop_id = 'xxx' AND status = 'active';

-- Should use: idx_products_shop_status
```

### 3. Partition Large Tables (Future)

```sql
-- When tenant data grows large, consider partitioning
CREATE TABLE orders (
  id UUID,
  shop_id UUID,
  ...
) PARTITION BY HASH (shop_id);
```

### 4. Caching Strategy

```typescript
// Cache tenant settings
const CACHE_KEYS = {
  SHOP_SETTINGS: (shopId: string) => `shop:${shopId}:settings`,
  USER_SHOPS: (userId: string) => `user:${userId}:shops`,
  SHOP_USERS: (shopId: string) => `shop:${shopId}:users`
};

// Cache TTL
const CACHE_TTL = {
  SHOP_SETTINGS: 3600,  // 1 hour
  USER_SHOPS: 1800,     // 30 minutes
  SHOP_USERS: 900       // 15 minutes
};
```

### 5. Connection Pooling

```typescript
// Supabase handles this automatically
// For direct PostgreSQL connections:
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Best Practices Summary

### ✅ DO

- Always include `shop_id` in queries
- Use RLS policies for automatic enforcement
- Create composite indexes with `shop_id` first
- Soft delete records (use `deleted_at`)
- Log all sensitive operations in `audit_logs`
- Validate tenant access in application layer
- Use transactions for multi-step operations
- Cache tenant settings and user permissions
- Monitor query performance per tenant
- Test tenant isolation thoroughly

### ❌ DON'T

- Rely solely on application-level filtering
- Create indexes without `shop_id`
- Hard delete tenant data
- Share database credentials across tenants
- Store tenant-specific configuration in code
- Allow cross-tenant queries in application
- Bypass RLS in application code
- Expose service role key to client
- Trust client-provided tenant identifiers
- Skip audit logging for compliance

---

## Conclusion

This multi-tenant database schema provides:

✅ **Security**: RLS-enforced tenant isolation
✅ **Scalability**: Indexed for tenant queries
✅ **Flexibility**: RBAC for multi-user access
✅ **Compliance**: Audit logging for all operations
✅ **Performance**: Optimized indexes and caching
✅ **Maintainability**: Single schema for all tenants

The schema is production-ready and follows PostgreSQL best practices for SaaS applications.
