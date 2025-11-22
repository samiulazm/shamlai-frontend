/**
 * Tenant Service
 * Handles multi-tenant operations and context management
 */

import { createClient } from '@/utils/supabase/server';
import { createBrowserClient } from '@/utils/supabase/client';
import {
  UserRole,
  Permission,
  TenantContext,
  UserShop,
  TenantStats,
  CreateTenantRequest,
  InviteUserRequest,
  RemoveUserRequest,
  ChangeUserRoleRequest,
  roleHasPermission,
  ShopUser
} from '@/lib/types/multi-tenant';
import { logger } from '@/lib/utils/logger';

// =====================================================
// TENANT CONTEXT
// =====================================================

/**
 * Get all shops a user has access to
 */
export async function getUserShops(userId: string): Promise<UserShop[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .rpc('get_user_shops', { user_uuid: userId });

    if (error) {
      logger.error('Error getting user shops', { error, userId });
      throw error;
    }

    // Get shop details
    if (!data || data.length === 0) {
      return [];
    }

    const shopIds = data.map((row: any) => row.shop_id);

    const { data: shops, error: shopsError } = await supabase
      .from('shop_settings')
      .select('id, shop_name')
      .in('id', shopIds);

    if (shopsError) {
      logger.error('Error fetching shop details', { error: shopsError, shopIds });
      throw shopsError;
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('shop_users')
      .select('shop_id, role, is_active')
      .eq('user_id', userId)
      .in('shop_id', shopIds);

    if (rolesError) {
      logger.error('Error fetching user roles', { error: rolesError, userId });
      throw rolesError;
    }

    // Combine data
    const userShops: UserShop[] = shops.map(shop => {
      const role = userRoles.find(r => r.shop_id === shop.id);
      return {
        shop_id: shop.id,
        shop_name: shop.shop_name,
        role: (role?.role as UserRole) || 'read_only',
        is_active: role?.is_active ?? false
      };
    });

    return userShops;
  } catch (error) {
    logger.error('getUserShops failed', { error, userId });
    return [];
  }
}

/**
 * Check if user has access to a specific shop
 */
export async function userHasShopAccess(userId: string, shopId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .rpc('user_has_shop_access', {
        user_uuid: userId,
        check_shop_id: shopId
      });

    if (error) {
      logger.error('Error checking shop access', { error, userId, shopId });
      return false;
    }

    return data === true;
  } catch (error) {
    logger.error('userHasShopAccess failed', { error, userId, shopId });
    return false;
  }
}

/**
 * Get user's role in a shop
 */
export async function getUserRole(userId: string, shopId: string): Promise<UserRole | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .rpc('get_user_role', {
        user_uuid: userId,
        check_shop_id: shopId
      });

    if (error) {
      logger.error('Error getting user role', { error, userId, shopId });
      return null;
    }

    return data as UserRole;
  } catch (error) {
    logger.error('getUserRole failed', { error, userId, shopId });
    return null;
  }
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(
  userId: string,
  shopId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .rpc('user_has_permission', {
        user_uuid: userId,
        check_shop_id: shopId,
        required_permission: permission
      });

    if (error) {
      logger.error('Error checking permission', { error, userId, shopId, permission });
      return false;
    }

    return data === true;
  } catch (error) {
    logger.error('userHasPermission failed', { error, userId, shopId, permission });
    return false;
  }
}

/**
 * Get full tenant context for a user in a shop
 */
export async function getTenantContext(userId: string, shopId: string): Promise<TenantContext | null> {
  try {
    const supabase = createClient();

    // Get user role
    const role = await getUserRole(userId, shopId);
    if (!role) {
      logger.warn('No role found for user in shop', { userId, shopId });
      return null;
    }

    // Get shop details
    const { data: shop, error: shopError } = await supabase
      .from('shop_settings')
      .select('id, shop_name, organization_id')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      logger.error('Error fetching shop', { error: shopError, shopId });
      return null;
    }

    // Get permissions for role
    const { data: permissions, error: permError } = await supabase
      .from('shop_users')
      .select('permissions')
      .eq('user_id', userId)
      .eq('shop_id', shopId)
      .single();

    if (permError) {
      logger.error('Error fetching permissions', { error: permError, userId, shopId });
    }

    // Build context
    const context: TenantContext = {
      shopId: shop.id,
      userId,
      role,
      permissions: getRolePermissions(role),
      shopName: shop.shop_name,
      organizationId: shop.organization_id
    };

    return context;
  } catch (error) {
    logger.error('getTenantContext failed', { error, userId, shopId });
    return null;
  }
}

/**
 * Get permissions for a role (from static mapping)
 */
function getRolePermissions(role: UserRole): Permission[] {
  const { getRolePermissions } = require('@/lib/types/multi-tenant');
  return getRolePermissions(role);
}

// =====================================================
// TENANT MANAGEMENT
// =====================================================

/**
 * Create a new tenant (shop)
 */
export async function createTenant(data: CreateTenantRequest): Promise<string> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase
      .rpc('create_tenant', {
        p_user_id: data.user_id,
        p_shop_name: data.shop_name,
        p_shop_username: data.shop_username,
        p_subdomain: data.subdomain
      });

    if (error) {
      logger.error('Error creating tenant', { error, data });
      throw error;
    }

    logger.info('Tenant created successfully', { shopId: result, data });
    return result;
  } catch (error) {
    logger.error('createTenant failed', { error, data });
    throw error;
  }
}

/**
 * Invite a user to a shop
 */
export async function inviteUserToShop(
  data: InviteUserRequest,
  invitedBy: string
): Promise<string> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase
      .rpc('invite_user_to_shop', {
        p_shop_id: data.shop_id,
        p_user_email: data.user_email,
        p_role: data.role,
        p_invited_by: invitedBy
      });

    if (error) {
      logger.error('Error inviting user', { error, data, invitedBy });
      throw error;
    }

    logger.info('User invited successfully', { invitationId: result, data });
    return result;
  } catch (error) {
    logger.error('inviteUserToShop failed', { error, data, invitedBy });
    throw error;
  }
}

/**
 * Remove a user from a shop
 */
export async function removeUserFromShop(
  data: RemoveUserRequest,
  removedBy: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase
      .rpc('remove_user_from_shop', {
        p_shop_id: data.shop_id,
        p_user_id: data.user_id,
        p_removed_by: removedBy
      });

    if (error) {
      logger.error('Error removing user', { error, data, removedBy });
      throw error;
    }

    logger.info('User removed successfully', { data, removedBy });
    return result === true;
  } catch (error) {
    logger.error('removeUserFromShop failed', { error, data, removedBy });
    throw error;
  }
}

/**
 * Change a user's role in a shop
 */
export async function changeUserRole(
  data: ChangeUserRoleRequest,
  changedBy: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase
      .rpc('change_user_role', {
        p_shop_id: data.shop_id,
        p_user_id: data.user_id,
        p_new_role: data.new_role,
        p_changed_by: changedBy
      });

    if (error) {
      logger.error('Error changing user role', { error, data, changedBy });
      throw error;
    }

    logger.info('User role changed successfully', { data, changedBy });
    return result === true;
  } catch (error) {
    logger.error('changeUserRole failed', { error, data, changedBy });
    throw error;
  }
}

/**
 * Get tenant usage statistics
 */
export async function getTenantStats(shopId: string): Promise<TenantStats> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .rpc('get_tenant_stats', { p_shop_id: shopId });

    if (error) {
      logger.error('Error getting tenant stats', { error, shopId });
      throw error;
    }

    return data as TenantStats;
  } catch (error) {
    logger.error('getTenantStats failed', { error, shopId });
    throw error;
  }
}

/**
 * Get all users in a shop
 */
export async function getShopUsers(shopId: string): Promise<ShopUser[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('shop_users')
      .select(`
        id,
        shop_id,
        user_id,
        role,
        permissions,
        is_active,
        invitation_accepted,
        invited_by,
        invited_at,
        joined_at,
        created_at,
        updated_at
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting shop users', { error, shopId });
      throw error;
    }

    return data as ShopUser[];
  } catch (error) {
    logger.error('getShopUsers failed', { error, shopId });
    throw error;
  }
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Ensure user has access to shop (throws error if not)
 */
export async function ensureShopAccess(userId: string, shopId: string): Promise<void> {
  const hasAccess = await userHasShopAccess(userId, shopId);
  if (!hasAccess) {
    throw new Error('Access denied: User does not have access to this shop');
  }
}

/**
 * Ensure user has specific permission (throws error if not)
 */
export async function ensurePermission(
  userId: string,
  shopId: string,
  permission: Permission
): Promise<void> {
  const hasPermission = await userHasPermission(userId, shopId, permission);
  if (!hasPermission) {
    throw new Error(`Access denied: Missing permission ${permission}`);
  }
}

/**
 * Ensure user has specific role (throws error if not)
 */
export async function ensureRole(
  userId: string,
  shopId: string,
  allowedRoles: UserRole[]
): Promise<void> {
  const role = await getUserRole(userId, shopId);
  if (!role || !allowedRoles.includes(role)) {
    throw new Error(`Access denied: Insufficient role (required: ${allowedRoles.join(', ')})`);
  }
}

// =====================================================
// CLIENT-SIDE HELPERS (Browser)
// =====================================================

/**
 * Client-side: Get user shops
 */
export async function getUserShopsClient(userId: string): Promise<UserShop[]> {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .rpc('get_user_shops', { user_uuid: userId });

    if (error) {
      logger.error('Error getting user shops (client)', { error, userId });
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const shopIds = data.map((row: any) => row.shop_id);

    const { data: shops, error: shopsError } = await supabase
      .from('shop_settings')
      .select('id, shop_name')
      .in('id', shopIds);

    if (shopsError) {
      logger.error('Error fetching shop details (client)', { error: shopsError });
      return [];
    }

    const { data: userRoles, error: rolesError } = await supabase
      .from('shop_users')
      .select('shop_id, role, is_active')
      .eq('user_id', userId)
      .in('shop_id', shopIds);

    if (rolesError) {
      logger.error('Error fetching user roles (client)', { error: rolesError });
      return [];
    }

    const userShops: UserShop[] = shops.map(shop => {
      const role = userRoles.find(r => r.shop_id === shop.id);
      return {
        shop_id: shop.id,
        shop_name: shop.shop_name,
        role: (role?.role as UserRole) || 'read_only',
        is_active: role?.is_active ?? false
      };
    });

    return userShops;
  } catch (error) {
    logger.error('getUserShopsClient failed', { error, userId });
    return [];
  }
}

/**
 * Client-side: Get tenant context
 */
export async function getTenantContextClient(
  userId: string,
  shopId: string
): Promise<TenantContext | null> {
  try {
    const supabase = createBrowserClient();

    const { data: role } = await supabase
      .rpc('get_user_role', {
        user_uuid: userId,
        check_shop_id: shopId
      });

    if (!role) {
      return null;
    }

    const { data: shop } = await supabase
      .from('shop_settings')
      .select('id, shop_name, organization_id')
      .eq('id', shopId)
      .single();

    if (!shop) {
      return null;
    }

    const context: TenantContext = {
      shopId: shop.id,
      userId,
      role: role as UserRole,
      permissions: getRolePermissions(role as UserRole),
      shopName: shop.shop_name,
      organizationId: shop.organization_id
    };

    return context;
  } catch (error) {
    logger.error('getTenantContextClient failed', { error, userId, shopId });
    return null;
  }
}
