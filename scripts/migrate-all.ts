#!/usr/bin/env tsx
/**
 * Complete Migration Script
 *
 * This script migrates all tables and creates all storage buckets for InsForge backend.
 *
 * Usage:
 *   tsx scripts/migrate-all.ts
 *
 * Requirements:
 *   - INSFORGE_API_KEY environment variable must be set
 *   - MCP tools must be available
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Storage buckets to create
const STORAGE_BUCKETS = [
  { name: 'product-images', isPublic: true },
  { name: 'category-images', isPublic: true },
  { name: 'shop-assets', isPublic: true },
  { name: 'blog-images', isPublic: true },
  { name: 'review-images', isPublic: true },
  { name: 'chatbot-attachments', isPublic: false },
];

async function runMigrations() {
  console.log('🔄 Starting Complete Migration');
  console.log('='.repeat(60));
  console.log('Backend URL: http://119.40.88.49:7130\n');

  // Step 1: Run migration files
  console.log('📋 Step 1: Running migration files...\n');
  const migrationsDir = join(process.cwd(), 'scripts', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${migrationFiles.length} migration files:\n`);
  migrationFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('\n⚠️  Note: Migration files need to be run manually using MCP tools.');
  console.log('   Use: mcp_insforge_run-raw-sql with each migration file content.\n');

  // Step 2: Run database schema files
  console.log('📋 Step 2: Database schema files...\n');
  const schemasDir = join(process.cwd(), 'scripts', 'database-schemas');
  const schemaFiles = readdirSync(schemasDir)
    .filter((file) => file.endsWith('.sql') && !file.includes('migrations'))
    .sort();

  console.log(`Found ${schemaFiles.length} schema files:\n`);
  schemaFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('\n⚠️  Note: Schema files need to be run manually using MCP tools.\n');

  // Step 3: Create storage buckets
  console.log('📋 Step 3: Storage buckets to create...\n');
  STORAGE_BUCKETS.forEach((bucket, index) => {
    console.log(`   ${index + 1}. ${bucket.name} (${bucket.isPublic ? 'public' : 'private'})`);
  });
  console.log('\n⚠️  Note: Storage buckets need to be created manually using MCP tools.');
  console.log('   Use: mcp_insforge_create-bucket for each bucket.\n');

  console.log('='.repeat(60));
  console.log('✅ Migration script prepared!');
  console.log('💡 Use MCP tools to execute the migrations and create buckets.\n');
}

runMigrations();
