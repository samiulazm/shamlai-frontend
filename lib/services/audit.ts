/**
 * Audit Logging Service
 * Track all critical data changes for compliance and debugging
 */

import { getInsforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  FAILED_LOGIN = 'failed_login',
  EXPORT = 'export',
  IMPORT = 'import',
}

export enum AuditResourceType {
  PRODUCT = 'product',
  ORDER = 'order',
  CUSTOMER = 'customer',
  USER = 'user',
  SHOP = 'shop',
  DISCOUNT = 'discount',
  TAX_RATE = 'tax_rate',
  PAYMENT = 'payment',
  SHIPMENT = 'shipment',
  SETTINGS = 'settings',
}

export interface AuditLogEntry {
  id?: string;
  shopId: string;
  userId: string;
  userEmail?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  metadata?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
    [key: string]: any;
  };
  timestamp: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  const client = getInsforgeClient();

  try {
    await client.database.from('audit_logs').insert({
      shop_id: entry.shopId,
      user_id: entry.userId,
      user_email: entry.userEmail,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      resource_name: entry.resourceName,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      created_at: new Date().toISOString(),
    });

    logger.info('Audit log created', {
      shopId: entry.shopId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
    });
  } catch (error) {
    // Don't throw - audit logging failures shouldn't break the main operation
    logger.error('Failed to create audit log', { error, entry });
  }
}

/**
 * Log product changes
 */
export async function auditProductChange(
  shopId: string,
  userId: string,
  action: AuditAction,
  productId: string,
  productName: string,
  changes?: { before?: any; after?: any },
  metadata?: any
): Promise<void> {
  await createAuditLog({
    shopId,
    userId,
    action,
    resourceType: AuditResourceType.PRODUCT,
    resourceId: productId,
    resourceName: productName,
    changes: changes ? {
      before: changes.before,
      after: changes.after,
      fields: changes.before && changes.after ? getChangedFields(changes.before, changes.after) : undefined,
    } : undefined,
    metadata,
  });
}

/**
 * Log order changes
 */
export async function auditOrderChange(
  shopId: string,
  userId: string,
  action: AuditAction,
  orderId: string,
  orderNumber?: string,
  changes?: { before?: any; after?: any },
  metadata?: any
): Promise<void> {
  await createAuditLog({
    shopId,
    userId,
    action,
    resourceType: AuditResourceType.ORDER,
    resourceId: orderId,
    resourceName: orderNumber,
    changes: changes ? {
      before: changes.before,
      after: changes.after,
      fields: changes.before && changes.after ? getChangedFields(changes.before, changes.after) : undefined,
    } : undefined,
    metadata,
  });
}

/**
 * Log customer changes
 */
export async function auditCustomerChange(
  shopId: string,
  userId: string,
  action: AuditAction,
  customerId: string,
  customerName: string,
  changes?: { before?: any; after?: any },
  metadata?: any
): Promise<void> {
  await createAuditLog({
    shopId,
    userId,
    action,
    resourceType: AuditResourceType.CUSTOMER,
    resourceId: customerId,
    resourceName: customerName,
    changes: changes ? {
      before: sanitizeCustomerData(changes.before),
      after: sanitizeCustomerData(changes.after),
      fields: changes.before && changes.after ? getChangedFields(changes.before, changes.after) : undefined,
    } : undefined,
    metadata,
  });
}

/**
 * Log authentication events
 */
export async function auditAuthEvent(
  action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.FAILED_LOGIN,
  userId: string,
  userEmail: string,
  metadata?: { ip?: string; userAgent?: string; reason?: string }
): Promise<void> {
  await createAuditLog({
    shopId: 'system', // Auth events are system-level
    userId,
    userEmail,
    action,
    resourceType: AuditResourceType.USER,
    metadata,
  });
}

/**
 * Log payment events
 */
export async function auditPaymentEvent(
  shopId: string,
  userId: string,
  action: AuditAction,
  paymentId: string,
  amount: number,
  orderId?: string,
  metadata?: any
): Promise<void> {
  await createAuditLog({
    shopId,
    userId,
    action,
    resourceType: AuditResourceType.PAYMENT,
    resourceId: paymentId,
    resourceName: `Payment ${amount}`,
    metadata: {
      ...metadata,
      amount,
      orderId,
    },
  });
}

/**
 * Log settings changes
 */
export async function auditSettingsChange(
  shopId: string,
  userId: string,
  changes: { before: any; after: any },
  metadata?: any
): Promise<void> {
  await createAuditLog({
    shopId,
    userId,
    action: AuditAction.UPDATE,
    resourceType: AuditResourceType.SETTINGS,
    changes: {
      before: changes.before,
      after: changes.after,
      fields: getChangedFields(changes.before, changes.after),
    },
    metadata,
  });
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
  shopId: string;
  userId?: string;
  resourceType?: AuditResourceType;
  resourceId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const client = getInsforgeClient();

  try {
    let query = client.database
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('shop_id', filters.shopId);

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    if (filters.resourceId) {
      query = query.eq('resource_id', filters.resourceId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    query = query
      .order('created_at', { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const logs: AuditLogEntry[] = (data || []).map((log: any) => ({
      id: log.id,
      shopId: log.shop_id,
      userId: log.user_id,
      userEmail: log.user_email,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      resourceName: log.resource_name,
      changes: log.changes ? JSON.parse(log.changes) : undefined,
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
      timestamp: log.created_at,
    }));

    return { logs, total: count || 0 };
  } catch (error) {
    logger.error('Failed to fetch audit logs', { error, filters });
    return { logs: [], total: 0 };
  }
}

/**
 * Get changed fields between two objects
 */
function getChangedFields(before: any, after: any): string[] {
  if (!before || !after) return [];

  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }

  return changed;
}

/**
 * Sanitize customer data for audit logs (remove sensitive fields)
 */
function sanitizeCustomerData(data: any): any {
  if (!data) return data;

  const sanitized = { ...data };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.payment_methods;
  delete sanitized.credit_card;

  // Mask email (keep first 3 chars and domain)
  if (sanitized.email) {
    const [local, domain] = sanitized.email.split('@');
    sanitized.email = `${local.substring(0, 3)}***@${domain}`;
  }

  // Mask phone (keep last 4 digits)
  if (sanitized.phone) {
    sanitized.phone = `***${sanitized.phone.slice(-4)}`;
  }

  return sanitized;
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsToCSV(filters: {
  shopId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<string> {
  const { logs } = await getAuditLogs({
    ...filters,
    limit: 10000, // Max export
  });

  const headers = [
    'Timestamp',
    'User Email',
    'Action',
    'Resource Type',
    'Resource ID',
    'Resource Name',
    'Changed Fields',
    'IP Address',
  ];

  const rows = logs.map((log) => [
    log.timestamp,
    log.userEmail || '',
    log.action,
    log.resourceType,
    log.resourceId || '',
    log.resourceName || '',
    log.changes?.fields?.join(', ') || '',
    log.metadata?.ip || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}

/**
 * Clean up old audit logs (data retention)
 */
export async function cleanupOldAuditLogs(shopId: string, daysToKeep: number = 90): Promise<number> {
  const client = getInsforgeClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const { data, error } = await client.database
      .from('audit_logs')
      .delete()
      .eq('shop_id', shopId)
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (error) {
      throw error;
    }

    const deletedCount = data?.length || 0;
    logger.info('Cleaned up old audit logs', { shopId, deletedCount, cutoffDate });

    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup audit logs', { error, shopId });
    return 0;
  }
}
