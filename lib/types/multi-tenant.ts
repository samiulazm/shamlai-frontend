/**
 * Multi-Tenant Database Types
 * Generated for Shamlai E-Commerce Platform
 * Version: 1.0
 */

// =====================================================
// ENUMS
// =====================================================

export type UserRole =
  | 'super_admin'        // Platform admin (Shamlai team)
  | 'org_owner'          // Organization owner
  | 'org_admin'          // Organization administrator
  | 'shop_owner'         // Shop owner
  | 'shop_manager'       // Shop manager (full access except billing)
  | 'shop_staff'         // Shop staff (limited access)
  | 'accountant'         // Accounting access
  | 'inventory_manager'  // Inventory management
  | 'customer_support'   // Customer service
  | 'read_only';         // View-only access

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'suspended';

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'canceled';

// =====================================================
// PERMISSIONS
// =====================================================

export type Permission =
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

export const RolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    'products.read', 'products.write',
    'orders.read', 'orders.write',
    'customers.read', 'customers.write',
    'accounting.read', 'accounting.write',
    'settings.read', 'settings.write',
    'users.read', 'users.write',
    'reports.read', 'analytics.read'
  ],
  org_owner: [
    'products.read', 'products.write',
    'orders.read', 'orders.write',
    'customers.read', 'customers.write',
    'accounting.read', 'accounting.write',
    'settings.read', 'settings.write',
    'users.read', 'users.write',
    'reports.read', 'analytics.read'
  ],
  org_admin: [
    'products.read', 'products.write',
    'orders.read', 'orders.write',
    'customers.read', 'customers.write',
    'accounting.read', 'accounting.write',
    'settings.read', 'settings.write',
    'users.read', 'users.write',
    'reports.read', 'analytics.read'
  ],
  shop_owner: [
    'products.read', 'products.write',
    'orders.read', 'orders.write',
    'customers.read', 'customers.write',
    'accounting.read', 'accounting.write',
    'settings.read', 'settings.write',
    'users.read', 'users.write',
    'reports.read', 'analytics.read'
  ],
  shop_manager: [
    'products.read', 'products.write',
    'orders.read', 'orders.write',
    'customers.read', 'customers.write',
    'accounting.read', 'accounting.write',
    'settings.read', 'settings.write',
    'users.read', 'users.write',
    'reports.read', 'analytics.read'
  ],
  shop_staff: [
    'products.read',
    'orders.read', 'orders.write',
    'customers.read', 'customers.write',
    'reports.read'
  ],
  accountant: [
    'orders.read',
    'accounting.read', 'accounting.write',
    'reports.read'
  ],
  inventory_manager: [
    'products.read', 'products.write',
    'orders.read',
    'reports.read'
  ],
  customer_support: [
    'products.read',
    'orders.read', 'orders.write',
    'customers.read', 'customers.write',
    'reports.read'
  ],
  read_only: [
    'products.read',
    'orders.read',
    'customers.read',
    'accounting.read',
    'settings.read',
    'users.read',
    'reports.read',
    'analytics.read'
  ]
};

// =====================================================
// DATABASE TABLES
// =====================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;

  // Billing & Subscription
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_start_date?: string;
  subscription_end_date?: string;
  billing_email?: string;

  // Limits & Features
  max_shops: number;
  max_users_per_shop: number;
  max_products: number;
  max_orders_per_month: number;
  features: Record<string, any>;

  // Contact & Metadata
  owner_user_id?: string;
  contact_email?: string;
  contact_phone?: string;
  country?: string;
  timezone: string;

  // Settings
  settings: Record<string, any>;
  metadata: Record<string, any>;

  // Audit
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ShopUser {
  id: string;
  shop_id: string;
  user_id: string;
  role: UserRole;

  // Permissions
  permissions: Record<string, any>;

  // Status
  is_active: boolean;
  invitation_accepted: boolean;
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;

  // Audit
  created_at: string;
  updated_at: string;
}

export interface TenantStats {
  products_count: number;
  active_products_count: number;
  orders_count: number;
  customers_count: number;
  users_count: number;
  storage_used_mb: number;
  created_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateTenantRequest {
  user_id: string;
  shop_name: string;
  shop_username: string;
  subdomain: string;
}

export interface CreateTenantResponse {
  shop_id: string;
  message: string;
}

export interface InviteUserRequest {
  shop_id: string;
  user_email: string;
  role: UserRole;
}

export interface InviteUserResponse {
  invitation_id: string;
  message: string;
}

export interface RemoveUserRequest {
  shop_id: string;
  user_id: string;
}

export interface ChangeUserRoleRequest {
  shop_id: string;
  user_id: string;
  new_role: UserRole;
}

export interface GetTenantStatsRequest {
  shop_id: string;
}

export interface GetTenantStatsResponse {
  stats: TenantStats;
}

// =====================================================
// TENANT CONTEXT
// =====================================================

export interface TenantContext {
  shopId: string;
  userId: string;
  role: UserRole;
  permissions: Permission[];
  shopName?: string;
  organizationId?: string;
}

export interface UserShop {
  shop_id: string;
  shop_name: string;
  role: UserRole;
  is_active: boolean;
}

// =====================================================
// HELPER FUNCTIONS TYPES
// =====================================================

export interface TenantHelpers {
  getUserShops: (userId: string) => Promise<UserShop[]>;
  userHasShopAccess: (userId: string, shopId: string) => Promise<boolean>;
  getUserRole: (userId: string, shopId: string) => Promise<UserRole | null>;
  userHasPermission: (userId: string, shopId: string, permission: Permission) => Promise<boolean>;
  getTenantStats: (shopId: string) => Promise<TenantStats>;
  createTenant: (data: CreateTenantRequest) => Promise<string>;
  inviteUser: (data: InviteUserRequest) => Promise<string>;
  removeUser: (data: RemoveUserRequest) => Promise<boolean>;
  changeUserRole: (data: ChangeUserRoleRequest) => Promise<boolean>;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return RolePermissions[role] ?? [];
}

/**
 * Check if a role can perform an action on a resource
 */
export function canPerformAction(
  role: UserRole,
  resource: 'products' | 'orders' | 'customers' | 'accounting' | 'settings' | 'users' | 'reports' | 'analytics',
  action: 'read' | 'write'
): boolean {
  const permission = `${resource}.${action}` as Permission;
  return roleHasPermission(role, permission);
}

/**
 * Check if user is admin (super_admin, org_owner, org_admin, shop_owner, shop_manager)
 */
export function isAdmin(role: UserRole): boolean {
  return ['super_admin', 'org_owner', 'org_admin', 'shop_owner', 'shop_manager'].includes(role);
}

/**
 * Check if user is owner (super_admin, org_owner, shop_owner)
 */
export function isOwner(role: UserRole): boolean {
  return ['super_admin', 'org_owner', 'shop_owner'].includes(role);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    org_owner: 'Organization Owner',
    org_admin: 'Organization Admin',
    shop_owner: 'Shop Owner',
    shop_manager: 'Shop Manager',
    shop_staff: 'Shop Staff',
    accountant: 'Accountant',
    inventory_manager: 'Inventory Manager',
    customer_support: 'Customer Support',
    read_only: 'Read Only'
  };
  return displayNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    super_admin: 'Full platform access (Shamlai team)',
    org_owner: 'Owner of the organization with full access',
    org_admin: 'Administrator of the organization',
    shop_owner: 'Owner of the shop with full access',
    shop_manager: 'Manager with full access except billing',
    shop_staff: 'Staff member with limited access',
    accountant: 'Access to accounting and financial data',
    inventory_manager: 'Manage products and inventory',
    customer_support: 'Handle customer inquiries and orders',
    read_only: 'View-only access to all data'
  };
  return descriptions[role] || '';
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Validate subscription tier
 */
export function isValidSubscriptionTier(tier: string): tier is SubscriptionTier {
  return ['free', 'starter', 'professional', 'enterprise'].includes(tier);
}

/**
 * Validate user role
 */
export function isValidUserRole(role: string): role is UserRole {
  return [
    'super_admin', 'org_owner', 'org_admin', 'shop_owner', 'shop_manager',
    'shop_staff', 'accountant', 'inventory_manager', 'customer_support', 'read_only'
  ].includes(role);
}

/**
 * Get subscription tier features
 */
export function getSubscriptionFeatures(tier: SubscriptionTier): {
  max_shops: number;
  max_users_per_shop: number;
  max_products: number;
  max_orders_per_month: number;
  features: string[];
} {
  const features = {
    free: {
      max_shops: 1,
      max_users_per_shop: 2,
      max_products: 50,
      max_orders_per_month: 100,
      features: ['Basic analytics', 'Standard support']
    },
    starter: {
      max_shops: 1,
      max_users_per_shop: 5,
      max_products: 500,
      max_orders_per_month: 1000,
      features: ['Advanced analytics', 'Priority support', 'Custom domain', 'Email marketing']
    },
    professional: {
      max_shops: 3,
      max_users_per_shop: 15,
      max_products: 5000,
      max_orders_per_month: 10000,
      features: ['Advanced analytics', 'Priority support', 'Custom domain', 'Email marketing', 'API access', 'Multi-shop']
    },
    enterprise: {
      max_shops: 999,
      max_users_per_shop: 999,
      max_products: 999999,
      max_orders_per_month: 999999,
      features: ['Advanced analytics', 'Dedicated support', 'Custom domain', 'Email marketing', 'API access', 'Multi-shop', 'White label', 'SLA']
    }
  };

  return features[tier];
}
