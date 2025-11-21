#!/usr/bin/env tsx
/**
 * Test Token Validation Script
 *
 * Tests if the backend's /api/auth/user endpoint accepts a valid token
 */

import { createClient } from '@insforge/sdk';

const BACKEND_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';

console.log('🧪 Testing Token Validation');
console.log('='.repeat(60));
console.log(`Backend URL: ${BACKEND_URL}\n`);

async function testTokenValidation() {
  try {
    // Step 1: Login to get a valid token
    console.log('1️⃣  Logging in to get access token...');
    const client = createClient({ baseUrl: BACKEND_URL });

    const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
      email: 'test@shamlai.com',
      password: 'Test123456!',
    });

    if (loginError || !loginData?.accessToken) {
      console.log(`   ❌ Login failed: ${loginError?.message || 'No access token'}`);
      return false;
    }

    const token = loginData.accessToken;
    console.log(`   ✅ Login successful`);
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // Step 2: Test the backend /api/auth/user endpoint directly
    console.log('\n2️⃣  Testing backend /api/auth/user endpoint...');
    const response = await fetch(`${BACKEND_URL}/api/auth/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Request failed`);
      console.log(`   Response: ${errorText}`);
      return false;
    }

    const userData = await response.json();
    console.log(`   ✅ Request successful`);
    console.log(`   User ID: ${userData?.user?.id}`);
    console.log(`   User Email: ${userData?.user?.email}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Token validation test passed!');
    console.log('='.repeat(60));

    return true;
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    return false;
  }
}

testTokenValidation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
