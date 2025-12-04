/**
 * Authentication and Authorization middleware
 * Implements RBAC (Role-Based Access Control)
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors/api-errors';
import { ERROR_MESSAGES } from '@/lib/errors/error-messages';
import { logger } from '@/lib/utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  shopIds: string[]; // Shops this user has access to
  permissions: Permission[];
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SHOP_OWNER = 'shop_owner',
  SHOP_MANAGER = 'shop_manager',
  SHOP_STAFF = 'shop_staff',
  CUSTOMER = 'customer',
}

export enum Permission {
  // Product permissions
  PRODUCT_CREATE = 'product:create',
  PRODUCT_READ = 'product:read',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',

  // Order permissions
  ORDER_CREATE = 'order:create',
  ORDER_READ = 'order:read',
  ORDER_UPDATE = 'order:update',
  ORDER_DELETE = 'order:delete',
  ORDER_FULFILL = 'order:fulfill',
  ORDER_REFUND = 'order:refund',

  // Customer permissions
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',

  // Shop permissions
  SHOP_READ = 'shop:read',
  SHOP_UPDATE = 'shop:update',
  SHOP_DELETE = 'shop:delete',
  SHOP_SETTINGS = 'shop:settings',

  // Discount permissions
  DISCOUNT_CREATE = 'discount:create',
  DISCOUNT_READ = 'discount:read',
  DISCOUNT_UPDATE = 'discount:update',
  DISCOUNT_DELETE = 'discount:delete',

  // Analytics permissions
  ANALYTICS_VIEW = 'analytics:view',

  // Staff management
  STAFF_CREATE = 'staff:create',
  STAFF_READ = 'staff:read',
  STAFF_UPDATE = 'staff:update',
  STAFF_DELETE = 'staff:delete',
}

/**
 * Role to permissions mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [UserRole.SHOP_OWNER]: [
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_FULFILL,
    Permission.ORDER_REFUND,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    Permission.SHOP_READ,
    Permission.SHOP_UPDATE,
    Permission.SHOP_SETTINGS,
    Permission.DISCOUNT_CREATE,
    Permission.DISCOUNT_READ,
    Permission.DISCOUNT_UPDATE,
    Permission.DISCOUNT_DELETE,
    Permission.ANALYTICS_VIEW,
    Permission.STAFF_CREATE,
    Permission.STAFF_READ,
    Permission.STAFF_UPDATE,
    Permission.STAFF_DELETE,
  ],

  [UserRole.SHOP_MANAGER]: [
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_FULFILL,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.SHOP_READ,
    Permission.DISCOUNT_READ,
    Permission.ANALYTICS_VIEW,
    Permission.STAFF_READ,
  ],

  [UserRole.SHOP_STAFF]: [
    Permission.PRODUCT_READ,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.CUSTOMER_READ,
    Permission.SHOP_READ,
  ],

  [UserRole.CUSTOMER]: [
    Permission.ORDER_READ, // Own orders only
    Permission.PRODUCT_READ,
  ],
};

/**
 * Get authentication token from request
 */
export function getAuthToken(request: NextRequest): string | null {
  // Priority 1: Cookie (most secure)
  const cookieToken = request.cookies.get('supabase_access_token')?.value;
  if (cookieToken) return cookieToken;

  // Priority 2: Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = getAuthToken(request);
  if (!token) return null;

  try {
    const client = getSupabaseClient();

    // For Supabase, we need to set the session or create a client with the token
    // Create a temporary client with the token for validation
    const { createClient } = await import('@supabase/supabase-js');
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data, error } = await tempClient.auth.getUser();

    if (error || !data?.user) {
      logger.warn(
        'Failed to get current user',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }

    const user = data.user;

    // Get user's shop associations and role
    const { data: userShops } = await client
      .from('shop_users')
      .select('shop_id, role')
      .eq('user_id', user.id);

    const role = (userShops?.[0]?.role as UserRole) || UserRole.CUSTOMER;
    const shopIds = userShops?.map((s: any) => s.shop_id) || [];
    const permissions = ROLE_PERMISSIONS[role] || [];

    return {
      id: user.id,
      email: user.email || '',
      role,
      shopIds,
      permissions,
    };
  } catch (error) {
    logger.error(
      'Error getting current user',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new UnauthorizedError(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
  }

  return user;
}

/**
 * Require specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (!user.permissions.includes(permission) && user.role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenError(ERROR_MESSAGES.AUTH.FORBIDDEN);
  }

  return user;
}

/**
 * Require specific role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (!allowedRoles.includes(user.role) && user.role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenError(ERROR_MESSAGES.AUTH.FORBIDDEN);
  }

  return user;
}

/**
 * Check if user owns a resource in a specific shop
 */
export async function requireShopAccess(user: AuthUser, shopId: string): Promise<void> {
  if (user.role === UserRole.SUPER_ADMIN) {
    return; // Super admin has access to all shops
  }

  if (!user.shopIds.includes(shopId)) {
    throw new ForbiddenError('You do not have access to this shop');
  }
}

/**
 * Verify user owns a specific resource
 */
export async function requireResourceOwnership(
  request: NextRequest,
  resourceType: 'product' | 'order' | 'customer' | 'shop',
  resourceId: string
): Promise<AuthUser> {
  const user = await requireAuth(request);
  const client = getSupabaseClient();

  // Super admin can access everything
  if (user.role === UserRole.SUPER_ADMIN) {
    return user;
  }

  // Check if resource belongs to user's shop
  const { data: resource, error } = await client
    .from(resourceType === 'shop' ? 'shop_settings' : `${resourceType}s`)
    .select('shop_id')
    .eq('id', resourceId)
    .single();

  if (error || !resource) {
    throw new NotFoundError(`${resourceType} not found`);
  }

  await requireShopAccess(user, resource.shop_id);

  return user;
}

/**
 * Check if user has permission
 */
export function hasPermission(user: AuthUser, permission: Permission): boolean {
  return user.role === UserRole.SUPER_ADMIN || user.permissions.includes(permission);
}

/**
 * Check if user has role
 */
export function hasRole(user: AuthUser, role: UserRole): boolean {
  return user.role === UserRole.SUPER_ADMIN || user.role === role;
}

/**
 * Get user's primary shop ID (first shop they have access to)
 */
export function getPrimaryShopId(user: AuthUser): string | null {
  return user.shopIds[0] || null;
}

/**
 * Middleware wrapper for protected routes
 */
export function withAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const user = await requireAuth(request);
    return handler(request, user);
  };
}

/**
 * Middleware wrapper for permission-based routes
 */
export function withPermission(
  permission: Permission,
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const user = await requirePermission(request, permission);
    return handler(request, user);
  };
}

/**
 * Middleware wrapper for role-based routes
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const user = await requireRole(request, allowedRoles);
    return handler(request, user);
  };
}
