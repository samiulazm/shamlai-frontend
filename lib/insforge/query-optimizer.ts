/**
 * InsForge Query Optimizer
 * High-performance query helpers and optimizations for InsForge
 */

import { getInsForgeManager } from './client-manager';
import { logger } from '@/lib/utils/logger';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{ item: any; error: any }>;
  stats: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

/**
 * Query Builder for InsForge
 */
export class InsForgeQueryBuilder<T = any> {
  private table: string;
  private selectColumns: string = '*';
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orderBy: Array<{ column: string; ascending: boolean }> = [];
  private limitValue?: number;
  private offsetValue?: number;
  private countEnabled: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string | string[]): this {
    this.selectColumns = Array.isArray(columns) ? columns.join(', ') : columns;
    return this;
  }

  eq(column: string, value: any): this {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any): this {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any): this {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any): this {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any): this {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any): this {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, pattern: string): this {
    this.filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  in(column: string, values: any[]): this {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  isNull(column: string): this {
    this.filters.push({ column, operator: 'is', value: null });
    return this;
  }

  order(column: string, ascending: boolean = true): this {
    this.orderBy.push({ column, ascending });
    return this;
  }

  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  withCount(): this {
    this.countEnabled = true;
    return this;
  }

  /**
   * Execute the query
   */
  async execute(): Promise<{ data: T[] | null; error: any; count?: number }> {
    const manager = getInsForgeManager();

    return manager.executeQuery(async (client) => {
      let query = client.database.from(this.table).select(
        this.selectColumns,
        this.countEnabled ? { count: 'exact' } : undefined
      );

      // Apply filters
      for (const filter of this.filters) {
        query = query[filter.operator](filter.column, filter.value);
      }

      // Apply ordering
      for (const order of this.orderBy) {
        query = query.order(order.column, { ascending: order.ascending });
      }

      // Apply limit and offset
      if (this.limitValue !== undefined) {
        if (this.offsetValue !== undefined) {
          query = query.range(
            this.offsetValue,
            this.offsetValue + this.limitValue - 1
          );
        } else {
          query = query.limit(this.limitValue);
        }
      }

      return query;
    });
  }

  /**
   * Execute and return first result
   */
  async single(): Promise<{ data: T | null; error: any }> {
    const result = await this.limit(1).execute();
    return {
      data: result.data?.[0] || null,
      error: result.error,
    };
  }
}

/**
 * Create query builder
 */
export function query<T = any>(table: string): InsForgeQueryBuilder<T> {
  return new InsForgeQueryBuilder<T>(table);
}

/**
 * Paginated query helper
 */
export async function paginatedQuery<T>(
  table: string,
  options: PaginationOptions,
  additionalFilters?: (builder: InsForgeQueryBuilder<T>) => InsForgeQueryBuilder<T>
): Promise<PaginatedResponse<T>> {
  const { page, limit, sortBy, sortOrder } = options;
  const offset = (page - 1) * limit;

  let builder = query<T>(table).limit(limit).offset(offset).withCount();

  if (sortBy) {
    builder = builder.order(sortBy, sortOrder === 'asc');
  }

  if (additionalFilters) {
    builder = additionalFilters(builder);
  }

  const { data, count, error } = await builder.execute();

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Bulk insert with batching
 */
export async function bulkInsert<T>(
  table: string,
  items: Partial<T>[],
  options: { batchSize?: number; continueOnError?: boolean } = {}
): Promise<BulkOperationResult<T>> {
  const { batchSize = 100, continueOnError = false } = options;
  const startTime = Date.now();

  const successful: T[] = [];
  const failed: Array<{ item: any; error: any }> = [];

  const manager = getInsForgeManager();

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    try {
      const { data, error } = await manager.executeQuery(
        async (client) =>
          client.database.from(table).insert(batch).select()
      );

      if (error) {
        if (continueOnError) {
          failed.push(...batch.map((item) => ({ item, error })));
        } else {
          throw error;
        }
      } else {
        successful.push(...(data || []));
      }
    } catch (error) {
      if (continueOnError) {
        failed.push(...batch.map((item) => ({ item, error })));
      } else {
        throw error;
      }
    }
  }

  const duration = Date.now() - startTime;

  logger.info('Bulk insert completed', {
    table,
    total: items.length,
    successful: successful.length,
    failed: failed.length,
    duration,
  });

  return {
    successful,
    failed,
    stats: {
      total: items.length,
      successful: successful.length,
      failed: failed.length,
      duration,
    },
  };
}

/**
 * Bulk update with batching
 */
export async function bulkUpdate<T>(
  table: string,
  updates: Array<{ id: string; data: Partial<T> }>,
  options: { batchSize?: number; continueOnError?: boolean } = {}
): Promise<BulkOperationResult<T>> {
  const { batchSize = 50, continueOnError = false } = options;
  const startTime = Date.now();

  const successful: T[] = [];
  const failed: Array<{ item: any; error: any }> = [];

  const manager = getInsForgeManager();

  // Process individually (InsForge doesn't support bulk updates easily)
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (update) => {
        try {
          const { data, error } = await manager.executeQuery(
            async (client) =>
              client.database
                .from(table)
                .update(update.data)
                .eq('id', update.id)
                .select()
                .single()
          );

          if (error) {
            throw error;
          }

          successful.push(data);
        } catch (error) {
          if (continueOnError) {
            failed.push({ item: update, error });
          } else {
            throw error;
          }
        }
      })
    );
  }

  const duration = Date.now() - startTime;

  logger.info('Bulk update completed', {
    table,
    total: updates.length,
    successful: successful.length,
    failed: failed.length,
    duration,
  });

  return {
    successful,
    failed,
    stats: {
      total: updates.length,
      successful: successful.length,
      failed: failed.length,
      duration,
    },
  };
}

/**
 * Bulk delete with batching
 */
export async function bulkDelete(
  table: string,
  ids: string[],
  options: { batchSize?: number } = {}
): Promise<{ deleted: number; errors: number }> {
  const { batchSize = 100 } = options;
  let deleted = 0;
  let errors = 0;

  const manager = getInsForgeManager();

  // Process in batches
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    try {
      const { error } = await manager.executeQuery(
        async (client) =>
          client.database.from(table).delete().in('id', batch)
      );

      if (error) {
        errors += batch.length;
      } else {
        deleted += batch.length;
      }
    } catch (error) {
      logger.error('Bulk delete batch failed', { error, batchSize: batch.length });
      errors += batch.length;
    }
  }

  return { deleted, errors };
}

/**
 * Upsert with conflict resolution
 */
export async function upsert<T>(
  table: string,
  data: Partial<T> | Partial<T>[],
  conflictColumn: string = 'id'
): Promise<{ data: T[] | null; error: any }> {
  const manager = getInsForgeManager();

  return manager.executeQuery(
    async (client) =>
      client.database
        .from(table)
        .upsert(data, { onConflict: conflictColumn })
        .select()
  );
}

/**
 * Soft delete (update deleted_at)
 */
export async function softDelete(
  table: string,
  ids: string | string[]
): Promise<{ count: number }> {
  const manager = getInsForgeManager();
  const idArray = Array.isArray(ids) ? ids : [ids];

  const { data, error } = await manager.executeQuery(
    async (client) =>
      client.database
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', idArray)
        .select('id')
  );

  if (error) {
    throw error;
  }

  return { count: data?.length || 0 };
}

/**
 * Count with filters
 */
export async function count(
  table: string,
  filters?: (builder: InsForgeQueryBuilder) => InsForgeQueryBuilder
): Promise<number> {
  let builder = query(table).select('id', true).withCount();

  if (filters) {
    builder = filters(builder);
  }

  const { count, error } = await builder.execute();

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Check if record exists
 */
export async function exists(
  table: string,
  filters: (builder: InsForgeQueryBuilder) => InsForgeQueryBuilder
): Promise<boolean> {
  const result = await count(table, filters);
  return result > 0;
}
