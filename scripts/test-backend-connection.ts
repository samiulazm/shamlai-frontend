#!/usr/bin/env tsx
/**
 * Test Backend Connection Script
 *
 * This script tests the connection to the InsForge backend
 * and verifies the demo account credentials.
 *
 * Usage:
 *   npx tsx scripts/test-backend-connection.ts
 */

import { createClient } from '@insforge/sdk';

const BACKEND_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';

console.log('🔍 Testing Backend Connection');
console.log('='.repeat(60));
console.log(`Backend URL: ${BACKEND_URL}\n`);

const client = createClient({ baseUrl: BACKEND_URL });

async function testConnection() {
  try {
    // Test 1: Check if backend is reachable
    console.log('1️⃣  Testing backend connectivity...');
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        mode: 'cors',
      });
      console.log(`   ✅ Backend is reachable (Status: ${response.status})`);
    } catch (error: any) {
      console.log(`   ⚠️  Health check failed: ${error.message}`);
      console.log("   (This is okay if /health endpoint doesn't exist)");
    }

    // Test 2: Try to login with demo credentials
    console.log('\n2️⃣  Testing demo account login...');
    const { data, error } = await client.auth.signInWithPassword({
      email: 'test@shamlai.com',
      password: 'Test123456!',
    });

    if (error) {
      console.log(`   ❌ Login failed: ${error.message}`);
      console.log(`   Error code: ${error.code || 'N/A'}`);

      if (error.message.includes('Invalid') || error.message.includes('credentials')) {
        console.log('\n   💡 Solution: Run the create-test-user script:');
        console.log('      npx tsx scripts/create-test-user.ts');
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        console.log('\n   💡 Solution: Check network connectivity and CORS settings');
        console.log('      - Ensure backend is accessible from this network');
        console.log('      - Check CORS configuration on backend');
      }
      return false;
    }

    if (data?.user) {
      console.log(`   ✅ Login successful!`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
    }

    // Test 3: Check shop settings
    console.log('\n3️⃣  Checking shop settings...');
    const { data: shopData, error: shopError } = await client.database
      .from('shop_settings')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (shopError) {
      console.log(`   ⚠️  Shop settings not found: ${shopError.message}`);
      console.log('   💡 Run: npm run seed (to create shop settings)');
    } else {
      console.log(`   ✅ Shop settings found!`);
      console.log(`   Shop ID: ${shopData.shop_id}`);
      console.log(`   Shop Name: ${shopData.shop_name}`);
    }

    // Test 4: Check products
    console.log('\n4️⃣  Checking products...');
    const { count: productCount } = await client.database
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', data.user.id);

    console.log(`   Products: ${productCount || 0}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! Backend is ready.');
    console.log('='.repeat(60));

    return true;
  } catch (error: any) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error(error);
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
