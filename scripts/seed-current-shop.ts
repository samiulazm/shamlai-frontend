/**
 * Seed products to currently logged-in user's shop
 */

import { createClient } from '@insforge/sdk';
import { seedAllData } from '../lib/utils/seed-data';

const insforgeClient = createClient({ 
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://3ftnzn2r.us-east.insforge.app'
});

async function main() {
  console.log('🌱 Seeding Current User\'s Shop\n');

  try {
    // Login with test credentials
    console.log('Logging in as test@shamlai.com...');
    const { data: authData, error: authError } = await insforgeClient.auth.signInWithPassword({
      email: 'test@shamlai.com',
      password: 'Test123456!'
    });

    if (authError || !authData?.user) {
      console.error('❌ Login failed:', authError?.message);
      process.exit(1);
    }

    const shopId = authData.user.id;
    console.log(`✅ Logged in successfully!`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Shop ID: ${shopId}\n`);

    // Seed data to this shop
    console.log('🌱 Adding products to your shop...\n');
    await seedAllData(shopId);

    console.log('\n✨ Done! Your shop now has products!');
    console.log(`\n🛍️  Visit: http://localhost:3000/${shopId}`);
    console.log(`   Or use: http://localhost:3000/demo\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

