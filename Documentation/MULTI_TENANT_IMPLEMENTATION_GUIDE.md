# Multi-Tenant Implementation Guide
## Shamlai E-Commerce Platform

**Version**: 1.0
**Last Updated**: 2025-11-22

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Running the Migration](#running-the-migration)
3. [Using Tenant Context in API Routes](#using-tenant-context-in-api-routes)
4. [Using Tenant Context in Components](#using-tenant-context-in-components)
5. [Permission-Based Access Control](#permission-based-access-control)
6. [Managing Shop Users](#managing-shop-users)
7. [Testing Multi-Tenancy](#testing-multi-tenancy)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Run the Migration

```bash
# Option 1: Using the API endpoint
curl -X POST http://localhost:3000/api/migrations/run

# Option 2: Using npm script
npm run migrate

# Option 3: Direct SQL execution
psql -h your-db-host -U your-user -d your-db -f migrations/002_multi_tenant_setup.sql
```

### 2. Verify Migration

Check that the following tables exist:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'shop_users');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
```

### 3. Create Your First Tenant

```typescript
import { createTenant } from '@/lib/services/tenant';

const shopId = await createTenant({
  user_id: currentUser.id,
  shop_name: 'My First Shop',
  shop_username: 'myfirstshop',
  subdomain: 'myfirstshop'
});
```

---

## Running the Migration

### Prerequisites

- PostgreSQL database (Supabase)
- Database connection credentials
- Supabase service role key (for RLS bypass during migration)

### Step-by-Step Migration

**1. Backup Your Database**

```bash
# Always backup before migrations!
pg_dump -h your-host -U your-user -d your-db > backup_$(date +%Y%m%d).sql
```

**2. Run Migration File**

```bash
# Using Supabase CLI
supabase db push

# Or using psql
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f migrations/002_multi_tenant_setup.sql
```

**3. Verify Tables Created**

```sql
-- Check organizations table
SELECT * FROM organizations LIMIT 1;

-- Check shop_users table
SELECT * FROM shop_users LIMIT 1;

-- Check RLS functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%user%shop%';
```

**4. Test RLS Policies**

```sql
-- Set user context (simulate authenticated user)
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';

-- Try to query shop_settings (should only return user's shops)
SELECT * FROM shop_settings;
```

**5. Migrate Existing Data (Optional)**

If you have existing shops with single-user ownership:

```sql
-- Populate shop_users for existing shops
INSERT INTO shop_users (shop_id, user_id, role, is_active, invitation_accepted, joined_at)
SELECT id, user_id, 'shop_owner', true, true, created_at
FROM shop_settings
WHERE user_id IS NOT NULL
ON CONFLICT (shop_id, user_id) DO NOTHING;
```

---

## Using Tenant Context in API Routes

### Pattern 1: Ensure Shop Access

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ensureShopAccess } from '@/lib/services/tenant';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get shopId from request
  const shopId = request.nextUrl.searchParams.get('shopId');
  if (!shopId) {
    return NextResponse.json({ error: 'shopId required' }, { status: 400 });
  }

  // Ensure user has access to this shop
  try {
    await ensureShopAccess(user.id, shopId);
  } catch (error) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // User has access, proceed with query
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId); // RLS will enforce this automatically

  return NextResponse.json({ products });
}
```

### Pattern 2: Check Specific Permission

```typescript
// app/api/products/route.ts
import { ensurePermission } from '@/lib/services/tenant';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const { shop_id, ...productData } = body;

  // Ensure user has products.write permission
  try {
    await ensurePermission(user.id, shop_id, 'products.write');
  } catch (error) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // User has permission, create product
  const { data, error } = await supabase
    .from('products')
    .insert({ ...productData, shop_id, created_by: user.id })
    .select()
    .single();

  return NextResponse.json({ product: data });
}
```

### Pattern 3: Get Tenant Context

```typescript
// app/api/dashboard/route.ts
import { getTenantContext } from '@/lib/services/tenant';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const shopId = request.nextUrl.searchParams.get('shopId');

  // Get full tenant context
  const context = await getTenantContext(user.id, shopId);
  if (!context) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Use context for conditional logic
  const canViewFinancials = context.permissions.includes('accounting.read');
  const isAdmin = context.role === 'shop_owner' || context.role === 'shop_manager';

  return NextResponse.json({
    context,
    features: {
      canViewFinancials,
      isAdmin
    }
  });
}
```

---

## Using Tenant Context in Components

### Pattern 1: Basic Tenant Context Hook

```tsx
'use client';

import { useTenantContext } from '@/hooks/useTenant';
import { useEffect, useState } from 'react';

export default function DashboardPage({ params }: { params: { shopId: string } }) {
  const [userId, setUserId] = useState<string | null>(null);
  const { context, loading, hasPermission } = useTenantContext(userId, params.shopId);

  useEffect(() => {
    // Get current user
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    }
    loadUser();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!context) return <div>Access Denied</div>;

  return (
    <div>
      <h1>Welcome to {context.shopName}</h1>
      <p>Your role: {context.role}</p>

      {hasPermission('products.write') && (
        <button>Create Product</button>
      )}

      {hasPermission('settings.write') && (
        <button>Manage Settings</button>
      )}
    </div>
  );
}
```

### Pattern 2: Permission Guard

```tsx
'use client';

import { usePermissionGuard } from '@/hooks/useTenant';

export function CreateProductButton({ userId, shopId }: Props) {
  const { allowed, loading } = usePermissionGuard(userId, shopId, 'products.write');

  if (loading) return <div>Loading...</div>;
  if (!allowed) return null; // Hide button if no permission

  return <button>Create Product</button>;
}
```

### Pattern 3: Role Guard

```tsx
'use client';

import { useRoleGuard } from '@/hooks/useTenant';

export function AdminPanel({ userId, shopId }: Props) {
  const { allowed, loading } = useRoleGuard(userId, shopId, ['shop_owner', 'shop_manager']);

  if (loading) return <div>Loading...</div>;
  if (!allowed) return <div>Access Denied</div>;

  return (
    <div className="admin-panel">
      {/* Admin-only content */}
    </div>
  );
}
```

---

## Permission-Based Access Control

### Available Permissions

```typescript
type Permission =
  | 'products.read'
  | 'products.write'
  | 'orders.read'
  | 'orders.write'
  | 'customers.read'
  | 'customers.write'
  | 'accounting.read'
  | 'accounting.write'
  | 'settings.read'
  | 'settings.write'
  | 'users.read'
  | 'users.write'
  | 'reports.read'
  | 'analytics.read';
```

### Role-Permission Matrix

| Role | Products | Orders | Customers | Accounting | Settings | Users | Reports |
|------|----------|--------|-----------|------------|----------|-------|---------|
| **shop_owner** | RW | RW | RW | RW | RW | RW | RW |
| **shop_manager** | RW | RW | RW | RW | RW | RW | RW |
| **shop_staff** | R | RW | RW | - | - | - | R |
| **accountant** | - | R | - | RW | - | - | R |
| **inventory_manager** | RW | R | - | - | - | - | R |
| **customer_support** | R | RW | RW | - | - | - | R |
| **read_only** | R | R | R | R | R | R | R |

*R = Read, W = Write*

### Checking Permissions in Code

```typescript
import { roleHasPermission, canPerformAction } from '@/lib/types/multi-tenant';

// Check if role has permission
const canEdit = roleHasPermission('shop_staff', 'products.write'); // false

// Check if role can perform action
const canViewOrders = canPerformAction('shop_staff', 'orders', 'read'); // true
const canEditSettings = canPerformAction('shop_staff', 'settings', 'write'); // false
```

---

## Managing Shop Users

### Invite User to Shop

```typescript
import { useShopUsers } from '@/hooks/useTenant';

export function TeamManagement({ shopId }: { shopId: string }) {
  const { users, inviteUser, loading } = useShopUsers(shopId);

  const handleInvite = async () => {
    try {
      await inviteUser('newuser@example.com', 'shop_staff');
      alert('User invited successfully!');
    } catch (error) {
      alert('Failed to invite user');
    }
  };

  return (
    <div>
      <h2>Team Members</h2>
      <button onClick={handleInvite}>Invite User</button>

      {users.map(user => (
        <div key={user.id}>
          {user.user_id} - {user.role}
        </div>
      ))}
    </div>
  );
}
```

### Remove User from Shop

```typescript
const { removeUser } = useShopUsers(shopId);

const handleRemove = async (userId: string) => {
  if (confirm('Remove this user?')) {
    try {
      await removeUser(userId);
      alert('User removed successfully');
    } catch (error) {
      alert('Failed to remove user');
    }
  }
};
```

### Change User Role

```typescript
const { changeRole } = useShopUsers(shopId);

const handleChangeRole = async (userId: string, newRole: UserRole) => {
  try {
    await changeRole(userId, newRole);
    alert('Role changed successfully');
  } catch (error) {
    alert('Failed to change role');
  }
};
```

---

## Testing Multi-Tenancy

### Test 1: Create Two Tenants

```typescript
const shop1 = await createTenant({
  user_id: user1.id,
  shop_name: 'Shop 1',
  shop_username: 'shop1',
  subdomain: 'shop1'
});

const shop2 = await createTenant({
  user_id: user2.id,
  shop_name: 'Shop 2',
  shop_username: 'shop2',
  subdomain: 'shop2'
});
```

### Test 2: Verify Data Isolation

```typescript
// As user1, create product in shop1
const { data: product1 } = await supabase
  .from('products')
  .insert({
    shop_id: shop1,
    name: 'Product 1',
    price: 100
  })
  .select()
  .single();

// As user1, try to query shop2's products (should return empty)
const { data: shop2Products } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', shop2);

console.assert(shop2Products.length === 0, 'Data isolation failed!');
```

### Test 3: Test RLS Policies

```sql
-- Connect as user1
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'user1-uuid';

-- Should only see shop1 products
SELECT * FROM products; -- Returns only shop1 products

-- Try to insert into shop2 (should fail)
INSERT INTO products (shop_id, name, price)
VALUES ('shop2-uuid', 'Hack Product', 999); -- ERROR: RLS policy violation
```

### Test 4: Test Multi-User Access

```typescript
// User2 invites User1 to shop2 as shop_staff
await inviteUserToShop({
  shop_id: shop2,
  user_email: user1.email,
  role: 'shop_staff'
}, user2.id);

// User1 should now see shop2 in their shops list
const user1Shops = await getUserShops(user1.id);
console.assert(user1Shops.length === 2, 'User should have access to 2 shops');

// User1 can read shop2 products
const { data: shop2Products } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', shop2);
console.assert(shop2Products.length > 0, 'User1 should see shop2 products');

// User1 cannot edit shop2 settings (shop_staff role)
const hasSettingsPermission = await userHasPermission(user1.id, shop2, 'settings.write');
console.assert(hasSettingsPermission === false, 'shop_staff should not have settings.write');
```

---

## Common Patterns

### Pattern 1: Multi-Shop Dashboard

```tsx
'use client';

import { useUserShops } from '@/hooks/useTenant';
import { useState } from 'react';

export function MultiShopDashboard({ userId }: { userId: string }) {
  const { shops, loading } = useUserShops(userId);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);

  if (loading) return <div>Loading shops...</div>;

  return (
    <div>
      <select onChange={(e) => setSelectedShop(e.target.value)}>
        <option>Select a shop</option>
        {shops.map(shop => (
          <option key={shop.shop_id} value={shop.shop_id}>
            {shop.shop_name} ({shop.role})
          </option>
        ))}
      </select>

      {selectedShop && (
        <ShopDashboard shopId={selectedShop} userId={userId} />
      )}
    </div>
  );
}
```

### Pattern 2: Conditional UI Based on Permissions

```tsx
export function ProductActions({ product, context }: Props) {
  const canEdit = context.permissions.includes('products.write');
  const isAdmin = context.role === 'shop_owner' || context.role === 'shop_manager';

  return (
    <div>
      <button>View</button>

      {canEdit && (
        <button>Edit</button>
      )}

      {isAdmin && (
        <button>Delete</button>
      )}
    </div>
  );
}
```

### Pattern 3: Tenant-Scoped Queries with Service Layer

```typescript
// lib/services/products.ts
export async function getProducts(shopId: string, userId: string) {
  const supabase = createClient();

  // Ensure user has access
  await ensureShopAccess(userId, shopId);

  // RLS will automatically filter by shop_id
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId) // Explicit filter (RLS also enforces)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

---

## Troubleshooting

### Issue 1: RLS Policy Denies Access

**Symptom**: Queries return empty results or "insufficient privileges" error

**Solution**:

```typescript
// Check if user has shop access
const hasAccess = await userHasShopAccess(userId, shopId);
console.log('Has access:', hasAccess);

// Check user's role
const role = await getUserRole(userId, shopId);
console.log('User role:', role);

// Check shop_users table
const { data } = await supabase
  .from('shop_users')
  .select('*')
  .eq('user_id', userId)
  .eq('shop_id', shopId);
console.log('Shop user record:', data);
```

### Issue 2: Function Not Found

**Symptom**: `function get_user_shops() does not exist`

**Solution**:

```sql
-- Verify functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%user%shop%';

-- Re-run migration if functions missing
\i migrations/002_multi_tenant_setup.sql
```

### Issue 3: Service Role Needed

**Symptom**: Need to bypass RLS for system operations

**Solution**:

```typescript
import { createClient } from '@supabase/supabase-js';

// Use service role client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only!
  { auth: { persistSession: false } }
);

// Now queries bypass RLS
const { data } = await supabaseAdmin
  .from('products')
  .select('*'); // Returns ALL products across ALL tenants
```

### Issue 4: Permissions Not Working

**Symptom**: User has permission but still denied

**Solution**:

```typescript
// Check permission function directly
const { data: hasPermission } = await supabase
  .rpc('user_has_permission', {
    user_uuid: userId,
    check_shop_id: shopId,
    required_permission: 'products.write'
  });

console.log('Has permission:', hasPermission);

// Check RLS policy
const { data: policies } = await supabase
  .rpc('pg_policies')
  .eq('tablename', 'products');

console.log('Active policies:', policies);
```

---

## Next Steps

1. ✅ Migration complete
2. ⬜ Update existing API routes to use tenant context
3. ⬜ Add tenant selection UI in dashboard
4. ⬜ Implement team management page
5. ⬜ Add audit logging to critical operations
6. ⬜ Set up monitoring for RLS violations
7. ⬜ Test with multiple users and shops
8. ⬜ Deploy to production

---

## Support

For issues or questions:

1. Check the [Database Schema Documentation](./MULTI_TENANT_DATABASE_SCHEMA.md)
2. Review migration file: `/migrations/002_multi_tenant_setup.sql`
3. Check function definitions in database
4. Enable debug logging in application

---

**Congratulations!** You now have a production-ready multi-tenant database schema with comprehensive access control.
