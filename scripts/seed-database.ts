#!/usr/bin/env ts-node
/**
 * Database Seeding Script
 *
 * This script populates the database with sample data for testing and development.
 *
 * Usage:
 *   npm run seed
 *   or
 *   ts-node scripts/seed-database.ts
 */

import { supabaseClient } from '../lib/supabase';
import { seedAllData, clearShopData } from '../lib/utils/seed-data';

async function main() {
  console.log('🌱 Database Seeding Script');
  console.log('==========================\n');

  try {
    // 1. Authenticate with test credentials
    console.log('1️⃣  Authenticating with test credentials...');
    const testEmail = 'test@shamlai.com';
    const testPassword = 'Test123456!';

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError || !authData?.user) {
      console.error('❌ Authentication failed:', authError?.message);
      console.log('\n⚠️  The test user may not exist yet.');
      console.log('\nTo create the test user:');
      console.log('1. Run: npx tsx scripts/create-test-user.ts');
      console.log('   OR');
      console.log('2. Navigate to http://localhost:3000/signup');
      console.log('3. Create an account with:');
      console.log('   Email: test@shamlai.com');
      console.log('   Password: Test123456!');
      console.log('\nThen run this script again.');
      process.exit(1);
    }

    const shopId = authData.user.id;
    console.log(`✅ Authenticated as: ${authData.user.email}`);
    console.log(`   Shop ID: ${shopId}\n`);

    // 2. Ask if user wants to clear existing data
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear') || args.includes('-c');

    if (shouldClear) {
      console.log('2️⃣  Clearing existing shop data...');
      await clearShopData(shopId);
      console.log('✅ Existing data cleared\n');
    } else {
      console.log('2️⃣  Skipping data clearing (use --clear flag to clear existing data)\n');
    }

    // 3. Seed the database
    console.log('3️⃣  Seeding database with sample data...');
    console.log('   This may take a minute...\n');

    await seedAllData(shopId);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Shop settings configured');
    console.log('   - 8 categories created');
    console.log('   - 20 products added');
    console.log('   - Product variants generated');
    console.log('   - 3 discount codes created');
    console.log('   - 3 shipping methods configured');
    console.log('   - 3 payment methods set up');
    console.log('\n🎉 Your store is ready to use!');
    console.log('   Visit http://localhost:3000/dashboard to get started.\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
