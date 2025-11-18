#!/usr/bin/env ts-node
/**
 * Create delivery_methods table
 *
 * This script provides instructions for creating the delivery_methods table.
 * The actual SQL should be run directly in the InsForge dashboard SQL editor.
 *
 * Usage:
 *   tsx scripts/create-delivery-methods-table.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function createDeliveryMethodsTable() {
  console.log('🔄 Creating delivery_methods table...\n');

  try {
    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      'scripts',
      'migrations',
      '008_delivery_methods_table.sql'
    );
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📋 Copy and run this SQL in your InsForge dashboard SQL editor:\n');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    console.log('\n✨ After running the SQL, you can add delivery methods from the dashboard.\n');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createDeliveryMethodsTable();
