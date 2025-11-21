/**
 * InsForge Database Utilities - Comprehensive & Optimized
 *
 * Enterprise-grade database utilities for InsForge BaaS:
 * - Connection pooling and client management
 * - Query optimization and helpers
 * - Batch operations
 * - RPC function wrappers
 * - Migration runner
 * - Storage management
 * - Real-time subscriptions
 *
 * Usage:
 * ```typescript
 * import { executeInsForgeQuery, query, bulkInsert } from '@/lib/insforge';
 *
 * // Execute optimized query with retry
 * const result = await executeInsForgeQuery((client) =>
 *   client.database.from('products').select('*')
 * );
 *
 * // Use query builder
 * const products = await query('products')
 *   .eq('shop_id', shopId)
 *   .gt('price', 100)
 *   .order('created_at', false)
 *   .limit(20)
 *   .execute();
 *
 * // Bulk operations
 * const result = await bulkInsert('products', items, { batchSize: 100 });
 * ```
 */

// Client Manager
export {
  getInsForgeManager,
  initializeInsForgeManager,
  executeInsForgeQuery,
  getInsforgeClient,
  type InsForgeClientConfig,
} from './client-manager';

// Query Optimizer
export {
  query,
  paginatedQuery,
  bulkInsert,
  bulkUpdate,
  bulkDelete,
  upsert,
  softDelete,
  count,
  exists,
  InsForgeQueryBuilder,
  type PaginationOptions,
  type PaginatedResponse,
  type BulkOperationResult,
} from './query-optimizer';

// RPC Functions
export {
  executeRPC,
  executeSQL,
  getUserShops,
  checkUserShopAccess,
  calculateOrderTotal,
  cleanupExpiredLocks,
  batchInventoryUpdate,
  getLowStockProducts,
  archiveOldAuditLogs,
  generateOrderNumber,
  calculateShopStats,
  type RPCResult,
} from './rpc-functions';

// Migration Runner
export {
  initializeMigrationsTable,
  getAppliedMigrations,
  isMigrationApplied,
  applyMigration,
  applyMigrationFromFile,
  applyAllMigrations,
  rollbackMigration,
  getMigrationStatus,
  validateMigrations,
  type Migration,
  type MigrationResult,
} from './migration-runner';

// Storage Helper
export {
  uploadFile,
  uploadMultipleFiles,
  downloadFile,
  deleteFile,
  listFiles,
  getPublicUrl,
  getSignedUrl,
  moveFile,
  copyFile,
  getBucketInfo,
  createBucket,
  deleteBucket,
  emptyBucket,
  type StorageUploadOptions,
  type StorageUploadResult,
  type StorageListOptions,
} from './storage-helper';

// Realtime Manager
export {
  getRealtimeManager,
  subscribeToTable,
  unsubscribeFromTable,
  subscribeToProducts,
  subscribeToOrders,
  subscribeToInventory,
  type RealtimeEvent,
  type SubscriptionOptions,
  type Subscription,
} from './realtime-manager';
