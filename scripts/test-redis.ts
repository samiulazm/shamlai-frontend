#!/usr/bin/env tsx
/**
 * Redis Connection Test Script
 *
 * Tests Redis connectivity using Upstash Redis REST API
 *
 * Usage:
 *   npm run test:redis
 *   or
 *   tsx scripts/test-redis.ts
 */

async function testRedis() {
  console.log('🔍 Testing Redis Connection...\n');

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Check if environment variables are set
  if (!redisUrl || !redisToken) {
    console.error('❌ Redis environment variables are not configured!\n');
    console.log('Please set the following environment variables in your .env.local file:');
    console.log('  UPSTASH_REDIS_REST_URL=your-redis-url');
    console.log('  UPSTASH_REDIS_REST_TOKEN=your-redis-token\n');
    console.log('To get these values:');
    console.log('  1. Sign up at https://upstash.com');
    console.log('  2. Create a Redis database');
    console.log('  3. Copy the REST URL and Token from the dashboard\n');
    process.exit(1);
  }

  console.log('✅ Environment variables found\n');

  try {
    // Test 1: PING command
    console.log('1️⃣  Testing PING command...');
    const pingResponse = await fetch(redisUrl + '/ping', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([]),
    });

    if (!pingResponse.ok) {
      const errorText = await pingResponse.text();
      throw new Error(`PING failed: ${pingResponse.status} ${errorText}`);
    }

    const pingResult = await pingResponse.json();
    console.log(`   ✅ PING successful: ${pingResult.result}\n`);

    // Test 2: SET command
    console.log('2️⃣  Testing SET command...');
    const testKey = `test:${Date.now()}`;
    const testValue = 'Hello Redis!';

    const setResponse = await fetch(redisUrl + '/set', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([testKey, testValue]),
    });

    if (!setResponse.ok) {
      const errorText = await setResponse.text();
      throw new Error(`SET failed: ${setResponse.status} ${errorText}`);
    }

    const setResult = await setResponse.json();
    console.log(`   ✅ SET successful: ${setResult.result}\n`);

    // Test 3: GET command
    console.log('3️⃣  Testing GET command...');
    const getResponse = await fetch(redisUrl + '/get', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([testKey]),
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`GET failed: ${getResponse.status} ${errorText}`);
    }

    const getResult = await getResponse.json();

    if (getResult.result !== testValue) {
      throw new Error(`GET returned unexpected value: ${getResult.result}`);
    }

    console.log(`   ✅ GET successful: ${getResult.result}\n`);

    // Test 4: DEL command (cleanup)
    console.log('4️⃣  Testing DEL command (cleanup)...');
    const delResponse = await fetch(redisUrl + '/del', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([testKey]),
    });

    if (!delResponse.ok) {
      const errorText = await delResponse.text();
      throw new Error(`DEL failed: ${delResponse.status} ${errorText}`);
    }

    const delResult = await delResponse.json();
    console.log(`   ✅ DEL successful: ${delResult.result} key(s) deleted\n`);

    // Test 5: Check latency
    console.log('5️⃣  Measuring latency...');
    const startTime = Date.now();
    const latencyResponse = await fetch(redisUrl + '/ping', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([]),
    });
    const latency = Date.now() - startTime;

    if (!latencyResponse.ok) {
      throw new Error('Latency test failed');
    }

    console.log(`   ✅ Average latency: ~${latency}ms\n`);

    // Summary
    console.log('='.repeat(60));
    console.log('🎉 ALL REDIS TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Redis connection is working correctly');
    console.log(`   URL: ${redisUrl.replace(/\/.*$/, '/***')}`);
    console.log(`   Latency: ~${latency}ms`);
    console.log('\n💡 You can now use Redis for rate limiting and caching!\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Redis test failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n⚠️  Authentication error. Please check your UPSTASH_REDIS_REST_TOKEN.');
    } else if (error.message.includes('404')) {
      console.error('\n⚠️  Redis endpoint not found. Please check your UPSTASH_REDIS_REST_URL.');
    } else if (error.message.includes('fetch')) {
      console.error('\n⚠️  Network error. Please check your internet connection and Redis URL.');
    }

    console.error('\n');
    process.exit(1);
  }
}

// Run the test
testRedis();
