#!/usr/bin/env ts-node
/**
 * Database Migration Runner
 *
 * This script runs all SQL migration files to create missing database tables.
 * Uses Insforge MCP tools to execute SQL.
 *
 * Usage:
 *   npm run migrate
 *   or
 *   tsx scripts/run-migrations.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface Migration {
  filename: string;
  path: string;
  content: string;
}

async function runMigrations() {
  console.log('🔄 Database Migration Runner');
  console.log('==========================\n');

  try {
    // Get API key
    const apiKey = process.env.INSFORGE_API_KEY;

    if (!apiKey) {
      console.error('❌ INSFORGE_API_KEY environment variable is required');
      process.exit(1);
    }

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

    console.log('\n🚀 Running migrations...\n');

    let successCount = 0;
    let errorCount = 0;

    // Run each migration
    for (const migration of migrations) {
      try {
        console.log(`▶️  Running: ${migration.filename}...`);

        // Note: This script should be run in an environment with MCP tools
        // For now, we'll use the API route approach
        // Execute SQL via API route
        const response = await fetch('http://localhost:3000/api/migrations/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-insforge-api-key': apiKey,
          },
          body: JSON.stringify({
            sql: migration.content,
            filename: migration.filename,
          }),
        });

        const result = await response.json();

        if (result.error) {
          // Check if error is "already exists" (table already created)
          if (
            result.error.message?.includes('already exists') ||
            result.error.message?.includes('duplicate')
          ) {
            console.log(`   ⚠️  ${migration.filename}: Tables may already exist (skipping)`);
            successCount++;
          } else {
            console.error(`   ❌ ${migration.filename}: ${result.error.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ ${migration.filename}: Success`);
          successCount++;
        }
      } catch (error: any) {
        // Check if error is "already exists"
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`   ⚠️  ${migration.filename}: Tables may already exist (skipping)`);
          successCount++;
        } else {
          console.error(`   ❌ ${migration.filename}: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📁 Total: ${migrations.length}`);

    if (errorCount === 0) {
      console.log('\n✨ All migrations completed successfully!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some migrations failed. Please review the errors above.\n');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Migration runner error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
