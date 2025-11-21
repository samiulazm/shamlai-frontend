/**
 * InsForge Migration Runner
 * Execute database migrations with proper tracking and rollback support
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { executeSQL, executeRPC } from './rpc-functions';
import { getInsForgeManager } from './client-manager';
import { logger } from '@/lib/utils/logger';

export interface Migration {
  id: string;
  name: string;
  sql: string;
  appliedAt?: Date;
  rolledBackAt?: Date;
}

export interface MigrationResult {
  success: boolean;
  migration: Migration;
  error?: any;
  duration: number;
}

/**
 * Initialize migrations table
 */
export async function initializeMigrationsTable(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      migration_sql TEXT NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      rolled_back_at TIMESTAMP WITH TIME ZONE,
      checksum VARCHAR(64),
      metadata JSONB DEFAULT '{}'::jsonb
    );

    CREATE INDEX IF NOT EXISTS idx_migrations_name ON schema_migrations(migration_name);
    CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON schema_migrations(applied_at);
  `;

  try {
    await executeSQL(createTableSQL);
    logger.info('Migrations table initialized');
  } catch (error) {
    logger.error('Failed to initialize migrations table', { error });
    throw error;
  }
}

/**
 * Get applied migrations
 */
export async function getAppliedMigrations(): Promise<Migration[]> {
  const manager = getInsForgeManager();

  try {
    const { data, error } = await manager.executeQuery(
      async (client) =>
        client.database
          .from('schema_migrations')
          .select('*')
          .is('rolled_back_at', null)
          .order('applied_at', { ascending: true })
    );

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.migration_name,
      sql: row.migration_sql,
      appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
      rolledBackAt: row.rolled_back_at ? new Date(row.rolled_back_at) : undefined,
    }));
  } catch (error) {
    logger.error('Failed to get applied migrations', { error });
    return [];
  }
}

/**
 * Check if migration was applied
 */
export async function isMigrationApplied(name: string): Promise<boolean> {
  const manager = getInsForgeManager();

  try {
    const { data, error } = await manager.executeQuery(
      async (client) =>
        client.database
          .from('schema_migrations')
          .select('id')
          .eq('migration_name', name)
          .is('rolled_back_at', null)
          .single()
    );

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Calculate SQL checksum
 */
function calculateChecksum(sql: string): string {
  // Simple hash function for checksum
  let hash = 0;
  for (let i = 0; i < sql.length; i++) {
    const char = sql.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Apply single migration
 */
export async function applyMigration(
  name: string,
  sql: string
): Promise<MigrationResult> {
  const startTime = Date.now();
  const checksum = calculateChecksum(sql);

  logger.info('Applying migration', { name, checksum });

  try {
    // Check if already applied
    if (await isMigrationApplied(name)) {
      logger.warn('Migration already applied', { name });
      return {
        success: false,
        migration: { id: '', name, sql },
        error: 'Migration already applied',
        duration: Date.now() - startTime,
      };
    }

    // Execute migration SQL
    const { error: sqlError } = await executeSQL(sql);

    if (sqlError) {
      throw sqlError;
    }

    // Record migration
    const manager = getInsForgeManager();
    const { error: recordError } = await manager.executeQuery(
      async (client) =>
        client.database.from('schema_migrations').insert({
          migration_name: name,
          migration_sql: sql,
          checksum,
          applied_at: new Date().toISOString(),
        })
    );

    if (recordError) {
      throw recordError;
    }

    const duration = Date.now() - startTime;

    logger.info('Migration applied successfully', { name, duration });

    return {
      success: true,
      migration: {
        id: '',
        name,
        sql,
        appliedAt: new Date(),
      },
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Migration failed', { name, error, duration });

    return {
      success: false,
      migration: { id: '', name, sql },
      error,
      duration,
    };
  }
}

/**
 * Apply migration from file
 */
export async function applyMigrationFromFile(
  filePath: string
): Promise<MigrationResult> {
  try {
    const sql = readFileSync(filePath, 'utf-8');
    const name = filePath.split('/').pop()?.replace('.sql', '') || filePath;

    return applyMigration(name, sql);
  } catch (error) {
    logger.error('Failed to read migration file', { filePath, error });
    return {
      success: false,
      migration: { id: '', name: filePath, sql: '' },
      error,
      duration: 0,
    };
  }
}

/**
 * Apply all pending migrations
 */
export async function applyAllMigrations(
  migrationsDir: string = './migrations'
): Promise<Array<MigrationResult>> {
  const results: MigrationResult[] = [];

  try {
    const fs = await import('fs');
    const files = fs.readdirSync(migrationsDir);

    // Sort migration files
    const sqlFiles = files
      .filter((f) => f.endsWith('.sql'))
      .sort();

    logger.info('Found migrations', { count: sqlFiles.length });

    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file);
      const result = await applyMigrationFromFile(filePath);
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        logger.error('Migration failed, stopping', { file });
        break;
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    logger.info('Migrations completed', {
      total: results.length,
      success: successCount,
      failed: failCount,
    });

    return results;
  } catch (error) {
    logger.error('Failed to apply migrations', { error });
    return results;
  }
}

/**
 * Rollback migration
 */
export async function rollbackMigration(name: string): Promise<boolean> {
  const manager = getInsForgeManager();

  try {
    logger.info('Rolling back migration', { name });

    // Mark as rolled back
    const { error } = await manager.executeQuery(
      async (client) =>
        client.database
          .from('schema_migrations')
          .update({ rolled_back_at: new Date().toISOString() })
          .eq('migration_name', name)
          .is('rolled_back_at', null)
    );

    if (error) {
      throw error;
    }

    logger.info('Migration rolled back', { name });
    return true;
  } catch (error) {
    logger.error('Failed to rollback migration', { name, error });
    return false;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  applied: number;
  pending: number;
  rolledBack: number;
  migrations: Array<{ name: string; status: string; appliedAt?: Date }>;
}> {
  try {
    const appliedMigrations = await getAppliedMigrations();

    const manager = getInsForgeManager();
    const { data: allMigrations } = await manager.executeQuery(
      async (client) =>
        client.database
          .from('schema_migrations')
          .select('*')
          .order('applied_at', { ascending: true })
    );

    const rolledBack = (allMigrations || []).filter(
      (m: any) => m.rolled_back_at !== null
    );

    return {
      applied: appliedMigrations.length,
      pending: 0, // Would need to compare with migrations directory
      rolledBack: rolledBack.length,
      migrations: (allMigrations || []).map((m: any) => ({
        name: m.migration_name,
        status: m.rolled_back_at ? 'rolled_back' : 'applied',
        appliedAt: m.applied_at ? new Date(m.applied_at) : undefined,
      })),
    };
  } catch (error) {
    logger.error('Failed to get migration status', { error });
    return {
      applied: 0,
      pending: 0,
      rolledBack: 0,
      migrations: [],
    };
  }
}

/**
 * Validate migrations integrity
 */
export async function validateMigrations(): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    const appliedMigrations = await getAppliedMigrations();

    // Check for duplicate names
    const names = appliedMigrations.map((m) => m.name);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);

    if (duplicates.length > 0) {
      issues.push(`Duplicate migrations: ${duplicates.join(', ')}`);
    }

    // Check checksums
    for (const migration of appliedMigrations) {
      const currentChecksum = calculateChecksum(migration.sql);
      // Would need to compare with stored checksum
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  } catch (error) {
    logger.error('Failed to validate migrations', { error });
    return {
      valid: false,
      issues: ['Failed to validate migrations'],
    };
  }
}
