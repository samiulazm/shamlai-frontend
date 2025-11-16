#!/usr/bin/env ts-node
/**
 * Generate SQL Files for All Database Tables
 *
 * This script generates individual SQL files for each table in the database.
 * Each file contains the complete CREATE TABLE statement with all columns, indexes, and constraints.
 *
 * Usage:
 *   tsx scripts/generate-all-table-schemas.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// List of all tables from backend metadata
const allTables = [
  'accounts',
  'ad_campaign_products',
  'ad_campaigns',
  'addresses',
  'analytics_events',
  'blocked_ips',
  'blocked_mobiles',
  'blog_posts',
  'cart',
  'cart_items',
  'categories',
  'chatbot_conversations',
  'chatbot_messages',
  'custom_domains',
  'customers',
  'discount_code_categories',
  'discount_code_products',
  'discount_code_usage',
  'discount_codes',
  'email_subscribers',
  'expenses',
  'followups',
  'hrm_activities',
  'hrm_attendance',
  'hrm_employees',
  'hrm_leaves',
  'income',
  'inventory_logs',
  'liabilities',
  'menu_items',
  'navigation_menus',
  'notifications',
  'order_items',
  'order_status_history',
  'orders',
  'pages',
  'payment_methods',
  'payments',
  'product_images',
  'product_reviews',
  'product_variants',
  'products',
  'review_images',
  'shipping_methods',
  'shop_settings',
  'task_configs',
  'tasks',
  'tax_rates',
  'themes',
  'users',
  'wishlists',
  'workflow_executions',
  'workflow_templates',
  'workflows',
];

interface Column {
  columnName: string;
  dataType: string;
  characterMaximumLength: number | null;
  isNullable: string;
  columnDefault: string | null;
}

interface Index {
  indexname: string;
  indexdef: string;
  isUnique: boolean;
  isPrimary: boolean;
}

interface ForeignKey {
  constraintName: string;
  columnName: string;
  foreignTableName: string;
  foreignColumnName: string;
  deleteRule: string;
  updateRule: string;
}

function generateCreateTableSQL(
  tableName: string,
  columns: Column[],
  indexes: Index[],
  foreignKeys: ForeignKey[]
): string {
  let sql = `-- ============================================================================\n`;
  sql += `-- TABLE: ${tableName}\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- ============================================================================\n\n`;

  // CREATE TABLE statement
  sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

  const columnDefs: string[] = [];

  for (const col of columns) {
    let colDef = `  ${col.columnName} `;

    // Data type
    if (col.dataType === 'character varying') {
      colDef += `VARCHAR(${col.characterMaximumLength || 255})`;
    } else if (col.dataType === 'uuid') {
      colDef += 'UUID';
    } else if (col.dataType === 'text') {
      colDef += 'TEXT';
    } else if (col.dataType === 'numeric') {
      colDef += 'NUMERIC';
    } else if (col.dataType === 'integer') {
      colDef += 'INTEGER';
    } else if (col.dataType === 'boolean') {
      colDef += 'BOOLEAN';
    } else if (col.dataType === 'timestamp with time zone') {
      colDef += 'TIMESTAMP WITH TIME ZONE';
    } else if (col.dataType === 'ARRAY') {
      colDef += 'TEXT[]';
    } else if (col.dataType === 'date') {
      colDef += 'DATE';
    } else {
      colDef += col.dataType.toUpperCase();
    }

    // Nullable
    if (col.isNullable === 'NO') {
      colDef += ' NOT NULL';
    }

    // Default value
    if (col.columnDefault) {
      colDef += ` DEFAULT ${col.columnDefault}`;
    }

    columnDefs.push(colDef);
  }

  sql += columnDefs.join(',\n');
  sql += '\n);\n\n';

  // Foreign keys
  if (foreignKeys.length > 0) {
    sql += `-- Foreign Keys\n`;
    for (const fk of foreignKeys) {
      const deleteRule =
        fk.deleteRule === 'CASCADE'
          ? 'ON DELETE CASCADE'
          : fk.deleteRule === 'SET NULL'
            ? 'ON DELETE SET NULL'
            : fk.deleteRule === 'RESTRICT'
              ? 'ON DELETE RESTRICT'
              : '';

      sql += `ALTER TABLE ${tableName} ADD CONSTRAINT ${fk.constraintName} `;
      sql += `FOREIGN KEY (${fk.columnName}) `;
      sql += `REFERENCES ${fk.foreignTableName}(${fk.foreignColumnName}) `;
      sql += `${deleteRule};\n`;
    }
    sql += '\n';
  }

  // Indexes (excluding primary key which is already in CREATE TABLE)
  const nonPrimaryIndexes = indexes.filter((idx) => !idx.isPrimary);
  if (nonPrimaryIndexes.length > 0) {
    sql += `-- Indexes\n`;
    for (const idx of nonPrimaryIndexes) {
      // Extract index definition, but use CREATE INDEX IF NOT EXISTS
      const indexDef = idx.indexdef.replace('CREATE INDEX', 'CREATE INDEX IF NOT EXISTS');
      sql += `${indexDef};\n`;
    }
    sql += '\n';
  }

  sql += `-- End of table: ${tableName}\n`;

  return sql;
}

async function main() {
  console.log('📋 Generating SQL files for all database tables...\n');

  const outputDir = join(process.cwd(), 'scripts', 'database-schemas');

  // Create output directory
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  console.log(`📁 Output directory: ${outputDir}\n`);
  console.log(`📊 Total tables to process: ${allTables.length}\n`);
  console.log('⚠️  Note: This script generates template files.');
  console.log('   To get actual schemas, use MCP tools: mcp_insforge_get-table-schema\n');
  console.log('📝 Generating SQL files...\n');

  // Generate a file for each table
  for (const tableName of allTables) {
    const fileName = `${tableName}.sql`;
    const filePath = join(outputDir, fileName);

    // Create a template SQL file
    const templateSQL = `-- ============================================================================
-- TABLE: ${tableName}
-- Generated: ${new Date().toISOString()}
-- 
-- To get the actual schema, use:
--   mcp_insforge_get-table-schema with tableName: "${tableName}"
-- ============================================================================

-- TODO: Replace this with actual CREATE TABLE statement from get-table-schema
-- Example structure:
-- CREATE TABLE IF NOT EXISTS ${tableName} (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   ...
-- );

-- To generate the actual schema:
-- 1. Use MCP tool: mcp_insforge_get-table-schema
-- 2. Convert the schema JSON to CREATE TABLE SQL
-- 3. Replace this template with the actual SQL

`;

    writeFileSync(filePath, templateSQL, 'utf-8');
    console.log(`✅ Created: ${fileName}`);
  }

  console.log(`\n✨ Generated ${allTables.length} SQL template files in: ${outputDir}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Use MCP tools to get actual schemas for each table');
  console.log('   2. Replace template files with actual CREATE TABLE statements');
  console.log('   3. Or use the generated files as reference\n');
}

main().catch(console.error);
