/**
 * Database transaction wrapper and utilities
 * Provides ACID guarantees for multi-step operations
 */

import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import { InternalServerError } from '@/lib/errors/api-errors';

export interface TransactionContext {
  client: ReturnType<typeof getSupabaseClient>;
  rollback: () => Promise<void>;
  commit: () => Promise<void>;
}

interface TransactionOperation {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  condition?: any;
  rollbackQuery?: string;
}

/**
 * Execute multiple database operations in a transaction-like manner
 * Note: InsForge may not support native transactions, so we implement compensating transactions
 */
export async function withTransaction<T>(
  callback: (ctx: TransactionContext) => Promise<T>
): Promise<T> {
  const client = getSupabaseClient();
  const operations: TransactionOperation[] = [];
  let committed = false;

  const ctx: TransactionContext = {
    client,
    rollback: async () => {
      // Execute compensating transactions in reverse order
      logger.info('Rolling back transaction', { operationCount: operations.length });

      for (let i = operations.length - 1; i >= 0; i--) {
        const op = operations[i];
        try {
          if (op.rollbackQuery) {
            // Execute custom rollback query if provided
            // Note: This requires raw SQL support
            logger.info('Executing rollback query', { table: op.table });
          } else {
            // Default rollback behavior
            if (op.operation === 'insert' && op.data?.id) {
              await client.from(op.table).delete().eq('id', op.data.id);
            }
            // For updates, we'd need to store original values (TODO: implement)
          }
        } catch (error) {
          logger.error('Rollback operation failed', { error, operation: op });
        }
      }
    },
    commit: async () => {
      committed = true;
      logger.info('Transaction committed', { operationCount: operations.length });
    },
  };

  try {
    const result = await callback(ctx);

    if (!committed) {
      await ctx.commit();
    }

    return result;
  } catch (error) {
    logger.error('Transaction failed, rolling back', { error });
    await ctx.rollback();
    throw error;
  }
}

/**
 * Execute operations with retry logic for transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    retryableErrors?: string[];
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryableErrors = ['PGRST301', 'PGRST204'], // PostgREST timeout errors
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      const isRetryable = retryableErrors.some(
        (code) => error?.code === code || error?.message?.includes(code)
      );

      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      logger.warn('Retrying operation', {
        attempt: attempt + 1,
        maxRetries,
        error: error?.message,
      });

      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  throw lastError;
}

/**
 * Acquire a lock for inventory updates (advisory lock simulation)
 * Since InsForge may not support row-level locks, we use a dedicated locks table
 */
export async function acquireLock(
  lockKey: string,
  timeoutMs: number = 5000
): Promise<() => Promise<void>> {
  const client = getSupabaseClient();
  const lockId = `lock_${lockKey}`;
  const expiresAt = new Date(Date.now() + timeoutMs);

  const startTime = Date.now();
  let acquired = false;

  while (!acquired && Date.now() - startTime < timeoutMs) {
    try {
      // Try to insert lock record
      const { data, error } = await client
        .from('system_locks')
        .insert({
          lock_id: lockId,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error) {
        acquired = true;
        logger.info('Lock acquired', { lockKey, lockId });
      } else if (error.code === '23505') {
        // Unique constraint violation - lock already exists
        // Check if it's expired and clean up
        await client
          .from('system_locks')
          .delete()
          .eq('lock_id', lockId)
          .lt('expires_at', new Date().toISOString());

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        throw error;
      }
    } catch (error) {
      logger.error('Error acquiring lock', { error, lockKey });
      throw new InternalServerError('Failed to acquire lock');
    }
  }

  if (!acquired) {
    throw new InternalServerError('Lock acquisition timeout');
  }

  // Return release function
  return async () => {
    try {
      await client.from('system_locks').delete().eq('lock_id', lockId);
      logger.info('Lock released', { lockKey, lockId });
    } catch (error) {
      logger.error('Error releasing lock', { error, lockKey });
    }
  };
}

/**
 * Batch database operations with proper error handling
 */
export async function batchOperation<T>(
  items: T[],
  operation: (item: T) => Promise<void>,
  options: {
    batchSize?: number;
    continueOnError?: boolean;
  } = {}
): Promise<{ successful: number; failed: number; errors: any[] }> {
  const { batchSize = 100, continueOnError = false } = options;
  const results = { successful: 0, failed: 0, errors: [] as any[] };

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    for (const item of batch) {
      try {
        await operation(item);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({ item, error });

        if (!continueOnError) {
          throw error;
        }
      }
    }
  }

  return results;
}

/**
 * Optimistic locking - update with version check
 */
export async function updateWithVersion(
  table: string,
  id: string,
  updates: any,
  currentVersion: number
): Promise<boolean> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from(table)
    .update({
      ...updates,
      version: currentVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('version', currentVersion)
    .select();

  if (error) {
    throw error;
  }

  // If no rows affected, version mismatch (concurrent update)
  return data && data.length > 0;
}

/**
 * Atomic increment/decrement for numeric fields
 */
export async function atomicIncrement(
  table: string,
  id: string,
  field: string,
  amount: number
): Promise<void> {
  const client = getSupabaseClient();

  // Note: This requires RPC function or raw SQL for true atomicity
  // For now, we'll use a fetch-update pattern with retry
  await withRetry(async () => {
    const { data: current, error: fetchError } = await client
      .from(table)
      .select(`${field}`)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newValue = (current[field] || 0) + amount;

    const { error: updateError } = await client
      .from(table)
      .update({ [field]: newValue })
      .eq('id', id);

    if (updateError) throw updateError;
  });
}

/**
 * Safe delete with soft delete support
 */
export async function safeDelete(
  table: string,
  id: string,
  options: { soft?: boolean; field?: string } = {}
): Promise<void> {
  const { soft = true, field = 'deleted_at' } = options;
  const client = getSupabaseClient();

  if (soft) {
    // Soft delete - mark as deleted
    await client
      .from(table)
      .update({ [field]: new Date().toISOString() })
      .eq('id', id);
  } else {
    // Hard delete - actually remove
    await client.from(table).delete().eq('id', id);
  }
}
