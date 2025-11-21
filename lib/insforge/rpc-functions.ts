/**
 * InsForge RPC Function Wrappers
 * Execute stored procedures and complex database operations
 */

import { getInsForgeManager } from './client-manager';
import { logger } from '@/lib/utils/logger';

export interface RPCResult<T = any> {
  data: T | null;
  error: any;
  duration: number;
}

/**
 * Execute RPC function
 */
export async function executeRPC<T = any>(
  functionName: string,
  params?: Record<string, any>
): Promise<RPCResult<T>> {
  const startTime = Date.now();
  const manager = getInsForgeManager();

  try {
    const { data, error } = await manager.executeQuery(
      async (client) => client.database.rpc(functionName, params || {})
    );

    const duration = Date.now() - startTime;

    if (error) {
      logger.error('RPC function failed', {
        functionName,
        params,
        error,
        duration,
      });
    } else {
      logger.debug('RPC function executed', {
        functionName,
        duration,
      });
    }

    return { data, error, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('RPC function exception', {
      functionName,
      error,
      duration,
    });

    return { data: null, error, duration };
  }
}

/**
 * Execute raw SQL (requires service key)
 */
export async function executeSQL(
  sql: string,
  params?: any[]
): Promise<RPCResult> {
  const startTime = Date.now();

  try {
    // This requires a custom RPC function in the database
    // CREATE OR REPLACE FUNCTION execute_sql(query text, args json)
    const result = await executeRPC('execute_sql', {
      query: sql,
      args: params || [],
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('SQL execution failed', { sql, error, duration });

    return { data: null, error, duration };
  }
}

/**
 * RPC: Get user shops
 */
export async function getUserShops(
  userId: string
): Promise<Array<{ shop_id: string; role: string }>> {
  const { data, error } = await executeRPC<Array<{ shop_id: string; role: string }>>(
    'get_user_shops',
    { p_user_id: userId }
  );

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * RPC: Check user shop access
 */
export async function checkUserShopAccess(
  userId: string,
  shopId: string
): Promise<boolean> {
  const { data, error } = await executeRPC<boolean>(
    'user_has_shop_access',
    {
      p_user_id: userId,
      p_shop_id: shopId,
    }
  );

  if (error) {
    return false;
  }

  return data || false;
}

/**
 * RPC: Calculate order total
 */
export async function calculateOrderTotal(
  subtotal: number,
  shippingCost: number,
  taxAmount: number,
  discountAmount: number
): Promise<number> {
  const { data, error } = await executeRPC<number>(
    'calculate_order_total',
    {
      p_subtotal: subtotal,
      p_shipping_cost: shippingCost,
      p_tax_amount: taxAmount,
      p_discount_amount: discountAmount,
    }
  );

  if (error) {
    // Fallback to JS calculation
    return subtotal - discountAmount + shippingCost + taxAmount;
  }

  return data || 0;
}

/**
 * RPC: Cleanup expired locks
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const { data, error } = await executeRPC<number>('cleanup_expired_locks');

  if (error) {
    logger.error('Failed to cleanup expired locks', { error });
    return 0;
  }

  return data || 0;
}

/**
 * RPC: Batch inventory update
 */
export async function batchInventoryUpdate(
  updates: Array<{ product_id: string; quantity_change: number }>
): Promise<{ updated: number; errors: number }> {
  try {
    // This requires a custom RPC function
    const { data, error } = await executeRPC<{ updated: number; errors: number }>(
      'batch_inventory_update',
      { updates }
    );

    if (error) {
      throw error;
    }

    return data || { updated: 0, errors: updates.length };
  } catch (error) {
    logger.error('Batch inventory update failed', { error });
    return { updated: 0, errors: updates.length };
  }
}

/**
 * RPC: Get product low stock alerts
 */
export async function getLowStockProducts(
  shopId: string,
  threshold: number = 10
): Promise<Array<{ id: string; name: string; stock_quantity: number }>> {
  try {
    const { data, error } = await executeRPC(
      'get_low_stock_products',
      {
        p_shop_id: shopId,
        p_threshold: threshold,
      }
    );

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to get low stock products', { error });
    return [];
  }
}

/**
 * RPC: Archive old audit logs
 */
export async function archiveOldAuditLogs(
  daysToKeep: number = 90
): Promise<number> {
  const { data, error } = await executeRPC<number>(
    'archive_old_audit_logs',
    { p_days_to_keep: daysToKeep }
  );

  if (error) {
    logger.error('Failed to archive audit logs', { error });
    return 0;
  }

  return data || 0;
}

/**
 * RPC: Generate order number
 */
export async function generateOrderNumber(
  shopId: string,
  prefix: string = 'ORD'
): Promise<string> {
  try {
    const { data, error } = await executeRPC<string>(
      'generate_order_number',
      {
        p_shop_id: shopId,
        p_prefix: prefix,
      }
    );

    if (error) {
      throw error;
    }

    return data || `${prefix}-${Date.now()}`;
  } catch (error) {
    // Fallback to timestamp-based
    return `${prefix}-${Date.now()}`;
  }
}

/**
 * RPC: Calculate shop statistics
 */
export async function calculateShopStats(
  shopId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  avgOrderValue: number;
}> {
  try {
    const { data, error } = await executeRPC(
      'calculate_shop_stats',
      {
        p_shop_id: shopId,
        p_start_date: startDate?.toISOString(),
        p_end_date: endDate?.toISOString(),
      }
    );

    if (error) {
      throw error;
    }

    return (
      data || {
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
      }
    );
  } catch (error) {
    logger.error('Failed to calculate shop stats', { error });
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      avgOrderValue: 0,
    };
  }
}
