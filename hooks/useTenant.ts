/**
 * useTenant Hook
 * React hook for tenant context management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TenantContext,
  UserShop,
  Permission,
  UserRole,
  ShopUser,
  TenantStats
} from '@/lib/types/multi-tenant';
import { getUserShopsClient, getTenantContextClient } from '@/lib/services/tenant';
import { logger } from '@/lib/utils/logger';

// =====================================================
// TENANT CONTEXT HOOK
// =====================================================

export function useTenantContext(userId: string | null, shopId: string | null) {
  const [context, setContext] = useState<TenantContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadContext() {
      if (!userId || !shopId) {
        setContext(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const ctx = await getTenantContextClient(userId, shopId);
        setContext(ctx);
        setError(null);
      } catch (err) {
        logger.error('Error loading tenant context', { err, userId, shopId });
        setError(err as Error);
        setContext(null);
      } finally {
        setLoading(false);
      }
    }

    loadContext();
  }, [userId, shopId]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!context) return false;
      return context.permissions.includes(permission);
    },
    [context]
  );

  const hasRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!context) return false;
      return roles.includes(context.role);
    },
    [context]
  );

  const isAdmin = useCallback((): boolean => {
    if (!context) return false;
    return ['super_admin', 'org_owner', 'org_admin', 'shop_owner', 'shop_manager'].includes(context.role);
  }, [context]);

  const isOwner = useCallback((): boolean => {
    if (!context) return false;
    return ['super_admin', 'org_owner', 'shop_owner'].includes(context.role);
  }, [context]);

  return {
    context,
    loading,
    error,
    hasPermission,
    hasRole,
    isAdmin,
    isOwner
  };
}

// =====================================================
// USER SHOPS HOOK
// =====================================================

export function useUserShops(userId: string | null) {
  const [shops, setShops] = useState<UserShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadShops = useCallback(async () => {
    if (!userId) {
      setShops([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userShops = await getUserShopsClient(userId);
      setShops(userShops);
      setError(null);
    } catch (err) {
      logger.error('Error loading user shops', { err, userId });
      setError(err as Error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  return {
    shops,
    loading,
    error,
    reload: loadShops
  };
}

// =====================================================
// SHOP USERS HOOK
// =====================================================

export function useShopUsers(shopId: string | null) {
  const [users, setUsers] = useState<ShopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUsers = useCallback(async () => {
    if (!shopId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/tenant/users?shopId=${shopId}`);
      if (!response.ok) {
        throw new Error('Failed to load shop users');
      }
      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      logger.error('Error loading shop users', { err, shopId });
      setError(err as Error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const inviteUser = useCallback(
    async (email: string, role: UserRole) => {
      if (!shopId) throw new Error('No shop selected');

      const response = await fetch('/api/tenant/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId, user_email: email, role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to invite user');
      }

      await loadUsers();
      return response.json();
    },
    [shopId, loadUsers]
  );

  const removeUser = useCallback(
    async (userId: string) => {
      if (!shopId) throw new Error('No shop selected');

      const response = await fetch('/api/tenant/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId, user_id: userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove user');
      }

      await loadUsers();
      return response.json();
    },
    [shopId, loadUsers]
  );

  const changeRole = useCallback(
    async (userId: string, newRole: UserRole) => {
      if (!shopId) throw new Error('No shop selected');

      const response = await fetch('/api/tenant/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId, user_id: userId, new_role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change role');
      }

      await loadUsers();
      return response.json();
    },
    [shopId, loadUsers]
  );

  return {
    users,
    loading,
    error,
    reload: loadUsers,
    inviteUser,
    removeUser,
    changeRole
  };
}

// =====================================================
// TENANT STATS HOOK
// =====================================================

export function useTenantStats(shopId: string | null) {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadStats = useCallback(async () => {
    if (!shopId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/tenant/stats?shopId=${shopId}`);
      if (!response.ok) {
        throw new Error('Failed to load tenant stats');
      }
      const data = await response.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      logger.error('Error loading tenant stats', { err, shopId });
      setError(err as Error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    reload: loadStats
  };
}

// =====================================================
// PERMISSION GUARD HOOK
// =====================================================

/**
 * Hook to guard components based on permissions
 * Returns true if user has permission, false otherwise
 */
export function usePermissionGuard(
  userId: string | null,
  shopId: string | null,
  requiredPermission: Permission
): { allowed: boolean; loading: boolean } {
  const { context, loading } = useTenantContext(userId, shopId);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!loading && context) {
      setAllowed(context.permissions.includes(requiredPermission));
    } else {
      setAllowed(false);
    }
  }, [context, loading, requiredPermission]);

  return { allowed, loading };
}

// =====================================================
// ROLE GUARD HOOK
// =====================================================

/**
 * Hook to guard components based on roles
 * Returns true if user has one of the allowed roles, false otherwise
 */
export function useRoleGuard(
  userId: string | null,
  shopId: string | null,
  allowedRoles: UserRole[]
): { allowed: boolean; loading: boolean } {
  const { context, loading } = useTenantContext(userId, shopId);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!loading && context) {
      setAllowed(allowedRoles.includes(context.role));
    } else {
      setAllowed(false);
    }
  }, [context, loading, allowedRoles]);

  return { allowed, loading };
}
