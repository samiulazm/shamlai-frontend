/**
 * Script to create a test user account
 * Run this file to create a test user for development
 */

import { createClient } from '@insforge/sdk';

const insforgeClient = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130',
});

async function createTestUser() {
  console.log('🚀 Creating test user...\n');

  // Test user credentials
  const testUser = {
    email: 'test@shamlai.com',
    password: 'Test123456!',
  };

  try {
    // 1. Sign up the user
    console.log('📝 Signing up user:', testUser.email);
    const { data: authData, error: signupError } = await insforgeClient.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    });

    if (signupError || !authData?.user) {
      console.error('❌ Signup failed:', signupError);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // 2. Update user profile with additional info
    console.log('\n📝 Setting up user profile...');
    const { data: profileData, error: profileError } = await insforgeClient.auth.setProfile({
      nickname: 'Test User',
      bio: 'Test account for development',
    });

    if (profileError) {
      console.error('❌ Profile update failed:', profileError);
    } else {
      console.log('✅ Profile created successfully!');
    }

    // 3. Create initial shop settings for this user
    if (!authData?.user?.id) {
      console.error('❌ Cannot create shop settings: User ID not available');
      return;
    }

    console.log('\n📝 Creating shop settings...');

    // Generate a unique numeric shop_id (8-10 digits)
    const generateNumericShopId = (): string => {
      const length = Math.floor(Math.random() * 3) + 8; // 8-10 digits
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      return String(Math.floor(Math.random() * (max - min + 1)) + min);
    };

    let shopId = generateNumericShopId();
    let attempts = 0;

    // Ensure uniqueness
    while (attempts < 100) {
      const { data: existing } = await insforgeClient.database
        .from('shop_settings')
        .select('id')
        .eq('shop_id', shopId)
        .limit(1);

      if (!existing || existing.length === 0) {
        break; // Shop ID is unique
      }
      shopId = generateNumericShopId();
      attempts++;
    }

    const subdomain = 'test-shop';
    const shopUsername = 'test-shop';

    const { data: shopData, error: shopError } = await insforgeClient.database
      .from('shop_settings')
      .insert([
        {
          user_id: authData.user.id,
          shop_id: shopId,
          shop_username: shopUsername,
          subdomain: subdomain,
          shop_name: 'Test Shop',
          shop_description: 'A test e-commerce shop',
          shop_email: testUser.email,
          currency: 'USD',
          timezone: 'UTC',
          weight_unit: 'kg',
          enable_reviews: true,
          enable_wishlists: true,
          enable_guest_checkout: true,
        },
      ])
      .select()
      .single();

    if (shopError) {
      console.error('❌ Shop settings failed:', shopError);
    } else {
      console.log('✅ Shop settings created successfully!');
    }

    // Print login credentials
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📧 Login Credentials:');
    console.log('   Email:    ', testUser.email);
    console.log('   Password: ', testUser.password);
    console.log('\n🔗 Login URL: http://localhost:3000/login');
    console.log('\n💡 Tip: Save these credentials for testing!\n');

    // Sign out to clean up
    await insforgeClient.auth.signOut();
  } catch (error) {
    console.error('\n❌ Error creating test user:', error);
    console.log('\n💡 Note: If user already exists, you can use the credentials above to login.');
  }
}

// Run the script
createTestUser()
  .then(() => {
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
