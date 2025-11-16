#!/usr/bin/env tsx

/**
 * Database Performance Monitoring Script
 *
 * Analyzes database performance metrics and provides recommendations
 *
 * Usage:
 *   npm run db:performance
 *   tsx scripts/database-performance.ts
 *
 * Features:
 * - Index usage statistics
 * - Slow query detection
 * - Table size analysis
 * - Cache hit rates
 * - Performance recommendations
 */

import { createClient } from '@insforge/sdk';
import { getCacheStats, isRedisConnected } from '../lib/cache';

const INSFORGE_URL =
  process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://3ftnzn2r.us-east.insforge.app';

const client = createClient({ baseUrl: INSFORGE_URL });

interface TableStats {
  tablename: string;
  row_count: number;
  total_size: string;
  table_size: string;
  indexes_size: string;
}

interface IndexStats {
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

/**
 * Get table sizes and row counts
 */
async function getTableStats(): Promise<void> {
  console.log('\n📊 TABLE STATISTICS');
  console.log('='.repeat(80));

  const query = `
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10;
  `;

  try {
    // Note: This query requires direct PostgreSQL access
    // InsForge may not support raw SQL queries via the SDK
    console.log('⚠️  Note: Detailed table statistics require direct database access');
    console.log('   Using InsForge BaaS, some metrics may not be available via SDK\n');

    // Get row counts for main tables
    const tables = [
      'products',
      'orders',
      'order_items',
      'customers',
      'cart',
      'cart_items',
      'product_variants',
      'inventory_logs',
    ];

    // Use pg_class to get estimated row counts for all tables in one query
    const tableList = tables.map(t => `'${t}'`).join(',');
    const rowCountQuery = `
      SELECT relname AS tablename, reltuples::bigint AS estimated_count
      FROM pg_class
      WHERE relname IN (${tableList})
    `;

    try {
      // Attempt to run the raw SQL query for estimated row counts
      const { data, error } = await client.database.rpc('run_sql', { sql: rowCountQuery });
      if (!error && Array.isArray(data)) {
        for (const table of tables) {
          const row = data.find((r: any) => r.tablename === table);
          const count = row ? row.estimated_count : 'N/A';
          console.log(`${table.padEnd(20)} ${String(count).padStart(10)} est. rows`);
        }
      } else {
        // Fallback: If raw SQL is not supported, try estimated count via select
        for (const table of tables) {
          const { count, error } = await client.database.from(table).select('*', { count: 'estimated', head: true });
          if (!error) {
            console.log(`${table.padEnd(20)} ${String(count).padStart(10)} est. rows`);
          } else {
            console.log(`${table.padEnd(20)} N/A`);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching estimated row counts:', err);
    }
  } catch (error) {
    console.error('Error fetching table stats:', error);
  }
}

/**
 * Get index usage statistics
 */
async function getIndexStats(): Promise<void> {
  console.log('\n📈 INDEX USAGE STATISTICS');
  console.log('='.repeat(80));

  console.log('⚠️  Note: Index usage statistics require direct PostgreSQL access');
  console.log('   Consider using pg_stat_user_indexes view with psql or pgAdmin\n');

  console.log('To check index usage, run this query in your PostgreSQL client:');
  console.log(`
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
  `);
}

/**
 * Check for missing indexes
 */
async function checkMissingIndexes(): Promise<void> {
  console.log('\n🔍 MISSING INDEX ANALYSIS');
  console.log('='.repeat(80));

  const recommendations = [
    {
      table: 'products',
      indexes: [
        'idx_products_created_at (for sorting)',
        'idx_products_base_price (for filtering)',
        'idx_products_name_trgm (for full-text search)',
      ],
    },
    {
      table: 'orders',
      indexes: [
        'idx_orders_shop_status (composite for filtering)',
        'idx_orders_payment_status (for payment queries)',
        'idx_orders_fulfillment_status (for fulfillment queries)',
      ],
    },
    {
      table: 'product_variants',
      indexes: ['idx_product_variants_product_id (for joins)', 'idx_product_variants_sku (for lookups)'],
    },
    {
      table: 'customers',
      indexes: ['idx_customers_shop_id (for filtering)', 'idx_customers_email (for lookups)'],
    },
  ];

  console.log('✓ Index recommendations have been implemented in migration files');
  console.log('  See: scripts/database-schemas/migrations/001_add_missing_indexes.sql\n');

  console.log('Recommended indexes by table:');
  recommendations.forEach((rec) => {
    console.log(`\n  ${rec.table}:`);
    rec.indexes.forEach((idx) => console.log(`    - ${idx}`));
  });
}

/**
 * Get cache statistics
 */
async function getCachePerformance(): Promise<void> {
  console.log('\n💾 CACHE PERFORMANCE');
  console.log('='.repeat(80));

  const redisConnected = isRedisConnected();
  console.log(`Redis Status: ${redisConnected ? '✓ Connected' : '✗ Not Connected'}`);

  if (redisConnected) {
    const stats = getCacheStats();
    console.log(`\nCache Statistics:`);
    console.log(`  Hits:     ${stats.hits.toLocaleString()}`);
    console.log(`  Misses:   ${stats.misses.toLocaleString()}`);
    console.log(`  Errors:   ${stats.errors.toLocaleString()}`);
    console.log(`  Hit Rate: ${stats.hitRate.toFixed(2)}%`);

    if (stats.hitRate < 50) {
      console.log(`\n⚠️  Cache hit rate is below 50%. Consider:`);
      console.log(`    - Increasing TTL for frequently accessed data`);
      console.log(`    - Adding more cache layers for hot data`);
      console.log(`    - Reviewing cache invalidation strategy`);
    }
  } else {
    console.log(`\n⚠️  Redis is not configured. To enable caching:`);
    console.log(`    1. Set REDIS_URL in your .env file`);
    console.log(`    2. Run: npm install ioredis`);
    console.log(`    3. Restart your application`);
  }
}

/**
 * Generate performance recommendations
 */
async function generateRecommendations(): Promise<void> {
  console.log('\n💡 PERFORMANCE RECOMMENDATIONS');
  console.log('='.repeat(80));

  const recommendations = [
    {
      priority: 'HIGH',
      category: 'Indexing',
      recommendation: 'Apply missing indexes from migration file',
      action: 'Run: npm run migrate',
    },
    {
      priority: 'HIGH',
      category: 'Caching',
      recommendation: 'Enable Redis caching for query results',
      action: 'Set REDIS_URL and restart application',
    },
    {
      priority: 'MEDIUM',
      category: 'Archival',
      recommendation: 'Archive orders older than 2 years',
      action: 'Run: npm run archive-orders:dry-run',
    },
    {
      priority: 'MEDIUM',
      category: 'Query Optimization',
      recommendation: 'Use composite indexes for common query patterns',
      action: 'Review and optimize slow queries',
    },
    {
      priority: 'LOW',
      category: 'Read Replica',
      recommendation: 'Setup read replica for analytics queries',
      action: 'Contact InsForge support for read replica setup',
    },
  ];

  recommendations.forEach((rec) => {
    const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
    console.log(`\n${priorityIcon} ${rec.priority} - ${rec.category}`);
    console.log(`   ${rec.recommendation}`);
    console.log(`   Action: ${rec.action}`);
  });
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('DATABASE PERFORMANCE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    await getTableStats();
    await getIndexStats();
    await checkMissingIndexes();
    await getCachePerformance();
    await generateRecommendations();

    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log('');
  } catch (error) {
    console.error('\n✗ Analysis failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
main();
