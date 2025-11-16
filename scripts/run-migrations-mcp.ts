#!/usr/bin/env ts-node
/**
 * Database Migration Runner (MCP Version)
 *
 * This script runs all SQL migration files using Insforge MCP tools.
 * Run this script in an environment with MCP tools available.
 *
 * Usage:
 *   tsx scripts/run-migrations-mcp.ts
 *
 * Note: This script requires MCP tools to be available in the environment.
 * For manual execution, use the MCP tools directly with the SQL files.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface Migration {
  filename: string;
  path: string;
  content: string;
}

async function runMigrations() {
  console.log('🔄 Database Migration Runner (MCP)');
  console.log('==================================\n');

  try {
    // Get migrations directory
    const migrationsDir = join(process.cwd(), 'scripts', 'migrations');

    // Read all migration files
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort to ensure order

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found.');
      return;
    }

    console.log(`📋 Found ${migrationFiles.length} migration file(s):\n`);

    const migrations: Migration[] = migrationFiles.map((filename) => ({
      filename,
      path: join(migrationsDir, filename),
      content: readFileSync(join(migrationsDir, filename), 'utf-8'),
    }));

    // Display migrations to run
    migrations.forEach((migration, index) => {
      console.log(`   ${index + 1}. ${migration.filename}`);
    });

    console.log('\n📝 Instructions:');
    console.log('   1. Copy each SQL migration file content');
    console.log('   2. Use Insforge MCP tool: mcp_insforge_run-raw-sql');
    console.log('   3. Execute each migration in order\n');

    console.log('📄 Migration SQL Files:\n');

    migrations.forEach((migration, index) => {
      console.log(`\n--- Migration ${index + 1}: ${migration.filename} ---`);
      console.log(migration.content);
      console.log('\n--- End of Migration ---\n');
    });

    console.log('\n✅ Migration files prepared.');
    console.log('💡 Use MCP tools to execute these migrations.\n');
  } catch (error: any) {
    console.error('\n❌ Migration runner error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
