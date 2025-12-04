/**
 * Script to create a test user account
 * Run this file to create a test user for development
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const { data: authData, error: signupError } = await supabaseClient.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    });

    let userId: string;

    if (signupError) {
      // User might already exist, try to login instead
      if (
        signupError.message?.includes('already exists') ||
        signupError.message?.includes('ALREADY_EXISTS')
      ) {
        console.log('⚠️  User already exists, attempting to login...');
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword(
          {
            email: testUser.email,
            password: testUser.password,
          }
        );

        if (loginError || !loginData?.user) {
          console.error('❌ Login failed:', loginError);
          return;
        }

        userId = loginData.user.id;
        console.log('✅ Logged in successfully!');
        console.log('   User ID:', userId);
        console.log('   Email:', loginData.user.email);
      } else {
        console.error('❌ Signup failed:', signupError);
        return;
      }
    } else if (authData?.user) {
      userId = authData.user.id;
      console.log('✅ User created successfully!');
      console.log('   User ID:', userId);
      console.log('   Email:', authData.user.email);
    } else {
      console.error('❌ No user data received');
      return;
    }

    // 2. Update user profile with additional info (only if user was just created)
    if (!signupError || !signupError.message?.includes('already exists')) {
      console.log('\n📝 Setting up user profile...');
      const { data: profileData, error: profileError } = await supabaseClient.auth.updateUser({
        data: {
          nickname: 'Test User',
          bio: 'Test account for development',
        },
      });

      if (profileError) {
        console.error('❌ Profile update failed:', profileError);
      } else {
        console.log('✅ Profile created successfully!');
      }
    }

    // 3. Create initial shop settings for this user
    console.log('\n📝 Checking shop settings...');

    // Generate a unique numeric shop_id (8-10 digits)
    const generateNumericShopId = (): string => {
      const length = Math.floor(Math.random() * 3) + 8; // 8-10 digits
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      return String(Math.floor(Math.random() * (max - min + 1)) + min);
    };

    let shopId = generateNumericShopId();
    let attempts = 0;

    // Check if shop settings already exist
    const { data: existingShop } = await supabaseClient
      .from('shop_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingShop) {
      console.log('✅ Shop settings already exist!');
      console.log('   Shop ID:', existingShop.shop_id);
      console.log('   Shop Name:', existingShop.shop_name);
    } else {
      console.log('📝 Creating shop settings...');

      // Ensure uniqueness
      while (attempts < 100) {
        const { data: existing } = await supabaseClient
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

      const { data: shopData, error: shopError } = await supabaseClient
        .from('shop_settings')
        .insert([
          {
            user_id: userId,
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
        console.log('   Shop ID:', shopData.shop_id);
      }
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
    await supabaseClient.auth.signOut();
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
