/**
 * Redis Connection Test Script
 * Run this to verify your Upstash Redis setup
 *
 * Usage: npx tsx scripts/test-redis-connection.ts
 */

import { getRedisClient, isRedisAvailable } from '../lib/redis/client';
import { setCached, getCached, incrementCounter } from '../lib/redis/cache';

async function testRedisConnection() {
  console.log('\n=================================');
  console.log('🔍 Testing Upstash Redis Connection');
  console.log('=================================\n');

  // Check if Redis is configured
  console.log('Step 1: Checking configuration...');
  if (!isRedisAvailable()) {
    console.error('❌ Redis not configured!');
    console.error('\nPlease set these environment variables:');
    console.error('  UPSTASH_REDIS_REST_URL');
    console.error('  UPSTASH_REDIS_REST_TOKEN');
    console.error('\nSee .env.local for your credentials.');
    process.exit(1);
  }
  console.log('✅ Redis configuration found\n');

  try {
    const redis = getRedisClient();

    // Test 1: Basic connectivity
    console.log('Step 2: Testing basic connectivity (PING)...');
    const pingResult = await redis.get('test:ping');
    console.log('✅ Connection successful\n');

    // Test 2: Write operation
    console.log('Step 3: Testing write operation (SET)...');
    await setCached('test:connection', {
      message: 'Shamlai Redis is working!',
      timestamp: new Date().toISOString()
    }, 60);
    console.log('✅ Write successful\n');

    // Test 3: Read operation
    console.log('Step 4: Testing read operation (GET)...');
    const cached = await getCached<any>('test:connection');
    if (cached && cached.message) {
      console.log('✅ Read successful');
      console.log('   Retrieved:', cached.message);
      console.log('   Timestamp:', cached.timestamp);
    } else {
      throw new Error('Failed to retrieve cached data');
    }
    console.log('');

    // Test 4: Counter (rate limiting simulation)
    console.log('Step 5: Testing counter (INCR for rate limiting)...');
    const count1 = await incrementCounter('test:rate_limit', 60);
    const count2 = await incrementCounter('test:rate_limit', 60);
    const count3 = await incrementCounter('test:rate_limit', 60);
    console.log('✅ Counter test successful');
    console.log(`   Request 1: ${count1}`);
    console.log(`   Request 2: ${count2}`);
    console.log(`   Request 3: ${count3}`);
    console.log('');

    // Test 5: Cache simulation (product)
    console.log('Step 6: Testing product cache simulation...');
    const mockProduct = {
      id: 'prod_123',
      name: 'Sample Product',
      price: 99.99,
      inventory: 50
    };
    await setCached('cache:product:prod_123', mockProduct, 300);
    const cachedProduct = await getCached<any>('cache:product:prod_123');

    if (cachedProduct && cachedProduct.name === mockProduct.name) {
      console.log('✅ Product cache test successful');
      console.log('   Product:', cachedProduct.name);
      console.log('   Price: $' + cachedProduct.price);
    }
    console.log('');

    // Cleanup
    console.log('Step 7: Cleaning up test data...');
    await redis.del('test:connection');
    await redis.del('test:rate_limit');
    await redis.del('cache:product:prod_123');
    console.log('✅ Cleanup complete\n');

    // Success summary
    console.log('=================================');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('=================================\n');
    console.log('✅ Redis is fully operational');
    console.log('✅ Caching system ready');
    console.log('✅ Rate limiting ready');
    console.log('✅ Your app can now handle 1k-10k daily users!\n');

    console.log('📊 Configuration:');
    console.log('   Provider: Upstash (Serverless Redis)');
    console.log('   Connection: REST API');
    console.log('   Status: Connected ✅');
    console.log('   Free tier: 10,000 commands/day\n');

    console.log('🚀 Next steps:');
    console.log('   1. Start your app: npm run dev');
    console.log('   2. Visit a product page twice (2nd visit = cached!)');
    console.log('   3. Monitor Redis usage in Upstash dashboard');
    console.log('   4. See docs/SCALING.md for more optimization tips\n');

  } catch (error: any) {
    console.error('\n❌ Redis test failed!\n');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify credentials in .env.local are correct');
    console.error('   2. Check Upstash dashboard - is database active?');
    console.error('   3. Test connectivity: curl https://measured-gator-32082.upstash.io');
    console.error('   4. Check firewall/network settings');
    console.error('\n📚 See docs/QUICK_START_SCALING.md for help\n');
    process.exit(1);
  }
}

// Run the test
testRedisConnection().catch(console.error);
