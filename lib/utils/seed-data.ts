// Seed Data Utilities - Generate sample data for testing
import { insforgeClient, STORAGE_BUCKETS } from '../insforge';
import type {
  Category,
  Product,
  ProductVariant,
  Customer,
  DiscountCode,
  ShippingMethod,
  PaymentMethod,
  ShopSettings
} from '../types/database';
import { generateSlug } from './validation';

// ============================================================================
// Sample Data Generators
// ============================================================================

/**
 * Generate random price
 */
function randomPrice(min: number = 10, max: number = 500): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Generate random integer
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random items from array
 */
function pickRandom<T>(array: T[], count: number = 1): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ============================================================================
// Shop Settings Seed
// ============================================================================

export async function seedShopSettings(shopId: string): Promise<ShopSettings> {
  try {
    const settingsData = {
      shop_name: 'Demo E-Commerce Store',
      shop_description: 'Your one-stop shop for amazing products',
      shop_email: 'support@demoshop.com',
      shop_phone: '+1 (555) 123-4567',
      currency: 'USD',
      timezone: 'America/New_York',
      weight_unit: 'kg',
      address1: '123 Commerce Street',
      city: 'New York',
      country: 'United States',
      meta_title: 'Demo E-Commerce Store - Quality Products',
      meta_description: 'Shop the best quality products at great prices',
      enable_reviews: true,
      enable_guest_checkout: true
    };

    // Check if shop settings already exist
    const { data: existing } = await insforgeClient.database
      .from('shop_settings')
      .select('*')
      .eq('shop_id', shopId)
      .single();

    if (existing) {
      // Update existing settings
      const { data, error } = await insforgeClient.database
        .from('shop_settings')
        .update(settingsData)
        .eq('shop_id', shopId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Shop settings updated');
      return data;
    } else {
      // Create new settings
      const { data, error } = await insforgeClient.database
        .from('shop_settings')
        .insert([{ shop_id: shopId, ...settingsData }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Shop settings created');
      return data;
    }
  } catch (error: any) {
    console.error('Error seeding shop settings:', error);
    throw error;
  }
}

// ============================================================================
// Categories Seed
// ============================================================================

const SAMPLE_CATEGORIES = [
  { name: 'Electronics', description: 'Latest electronics and gadgets' },
  { name: 'Clothing', description: 'Fashion and apparel for everyone' },
  { name: 'Home & Garden', description: 'Everything for your home and garden' },
  { name: 'Sports & Outdoors', description: 'Gear for your active lifestyle' },
  { name: 'Books', description: 'Books and reading materials' },
  { name: 'Toys & Games', description: 'Fun for all ages' },
  { name: 'Beauty & Health', description: 'Personal care and wellness' },
  { name: 'Food & Beverages', description: 'Gourmet foods and drinks' }
];

export async function seedCategories(): Promise<Category[]> {
  try {
    // Check if categories already exist
    const { data: existing } = await insforgeClient.database
      .from('categories')
      .select('*');

    if (existing && existing.length > 0) {
      console.log(`ℹ️  ${existing.length} categories already exist, skipping...`);
      return existing;
    }

    const categories = SAMPLE_CATEGORIES.map((cat, index) => ({
      name: cat.name,
      slug: generateSlug(cat.name),
      description: cat.description,
      is_active: true,
      sort_order: index,
      parent_id: null
    }));

    const { data, error } = await insforgeClient.database
      .from('categories')
      .insert(categories)
      .select();

    if (error) throw error;
    console.log(`✅ ${data.length} categories created`);
    return data;
  } catch (error: any) {
    console.error('Error seeding categories:', error);
    throw error;
  }
}

// ============================================================================
// Products Seed
// ============================================================================

const SAMPLE_PRODUCTS = [
  { name: 'Wireless Bluetooth Headphones', category: 'Electronics', shortDesc: 'Premium sound quality' },
  { name: 'Laptop Computer 15"', category: 'Electronics', shortDesc: 'Powerful and portable' },
  { name: 'Smart Watch', category: 'Electronics', shortDesc: 'Track your fitness' },
  { name: 'Men\'s T-Shirt', category: 'Clothing', shortDesc: '100% cotton comfort' },
  { name: 'Women\'s Yoga Pants', category: 'Clothing', shortDesc: 'Flexible and comfortable' },
  { name: 'Designer Jeans', category: 'Clothing', shortDesc: 'Classic style' },
  { name: 'Coffee Maker', category: 'Home & Garden', shortDesc: 'Brew perfect coffee' },
  { name: 'Desk Lamp', category: 'Home & Garden', shortDesc: 'Adjustable LED light' },
  { name: 'Indoor Plant Pot Set', category: 'Home & Garden', shortDesc: 'Stylish planters' },
  { name: 'Running Shoes', category: 'Sports & Outdoors', shortDesc: 'Lightweight and durable' },
  { name: 'Camping Tent', category: 'Sports & Outdoors', shortDesc: 'Sleeps 4 people' },
  { name: 'Yoga Mat', category: 'Sports & Outdoors', shortDesc: 'Non-slip surface' },
  { name: 'Mystery Novel', category: 'Books', shortDesc: 'Best seller' },
  { name: 'Cookbook - Italian Cuisine', category: 'Books', shortDesc: 'Authentic recipes' },
  { name: 'Board Game - Strategy', category: 'Toys & Games', shortDesc: 'Fun for families' },
  { name: 'Puzzle 1000 Pieces', category: 'Toys & Games', shortDesc: 'Challenging and fun' },
  { name: 'Facial Cleanser', category: 'Beauty & Health', shortDesc: 'Gentle and effective' },
  { name: 'Protein Powder', category: 'Beauty & Health', shortDesc: 'Build muscle naturally' },
  { name: 'Organic Coffee Beans', category: 'Food & Beverages', shortDesc: 'Fair trade certified' },
  { name: 'Gourmet Chocolate Box', category: 'Food & Beverages', shortDesc: 'Luxury assortment' }
];

export async function seedProducts(
  shopId: string,
  categories: Category[]
): Promise<Product[]> {
  try {
    // Check if products already exist for this shop
    const { data: existing } = await insforgeClient.database
      .from('products')
      .select('*')
      .eq('shop_id', shopId);

    if (existing && existing.length > 0) {
      console.log(`ℹ️  ${existing.length} products already exist, skipping...`);
      return existing;
    }

    const products = SAMPLE_PRODUCTS.map((product) => {
      const category = categories.find(c => c.name === product.category);
      const basePrice = randomPrice(10, 500);

      return {
        shop_id: shopId,
        name: product.name,
        slug: generateSlug(product.name),
        description: `High-quality ${product.name.toLowerCase()}. ${product.shortDesc}. Perfect for your needs.`,
        short_description: product.shortDesc,
        category_id: category?.id,
        base_price: basePrice,
        compare_at_price: basePrice * 1.2,
        cost_per_item: basePrice * 0.6,
        sku: `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`,
        track_inventory: true,
        inventory_quantity: randomInt(10, 100),
        allow_backorder: false,
        weight: randomPrice(0.1, 5),
        weight_unit: 'kg',
        is_active: true,
        is_featured: Math.random() > 0.7,
        has_variants: Math.random() > 0.6,
        meta_title: product.name,
        meta_description: product.shortDesc
      };
    });

    const { data, error } = await insforgeClient.database
      .from('products')
      .insert(products)
      .select();

    if (error) throw error;
    console.log(`✅ ${data.length} products created`);
    return data;
  } catch (error: any) {
    console.error('Error seeding products:', error);
    throw error;
  }
}

// ============================================================================
// Product Variants Seed
// ============================================================================

const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'X-Large'];
const COLOR_OPTIONS = ['Black', 'White', 'Blue', 'Red', 'Green'];

export async function seedProductVariants(products: Product[]): Promise<ProductVariant[]> {
  try {
    const allVariants: any[] = [];

    for (const product of products) {
      if (product.has_variants) {
        const sizes = pickRandom(SIZE_OPTIONS, 3);
        const colors = pickRandom(COLOR_OPTIONS, 2);

        for (const size of sizes) {
          for (const color of colors) {
            const priceModifier = 1 + (Math.random() * 0.2 - 0.1); // ±10%
            
            allVariants.push({
              product_id: product.id,
              name: `${color} - ${size}`,
              sku: `${product.sku}-${color.substring(0, 3).toUpperCase()}-${size.substring(0, 1)}`,
              price: Math.round(product.base_price * priceModifier * 100) / 100,
              compare_at_price: product.compare_at_price,
              cost_per_item: product.cost_per_item,
              inventory_quantity: randomInt(5, 50),
              weight: product.weight,
              option1_name: 'Color',
              option1_value: color,
              option2_name: 'Size',
              option2_value: size,
              is_active: true
            });
          }
        }
      }
    }

    if (allVariants.length > 0) {
      const { data, error } = await insforgeClient.database
        .from('product_variants')
        .insert(allVariants)
        .select();

      if (error) throw error;
      console.log(`✅ ${data.length} product variants created`);
      return data;
    }

    return [];
  } catch (error: any) {
    console.error('Error seeding product variants:', error);
    throw error;
  }
}

// ============================================================================
// Discount Codes Seed
// ============================================================================

export async function seedDiscountCodes(shopId: string): Promise<DiscountCode[]> {
  try {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const discounts = [
      {
        shop_id: shopId,
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        discount_type: 'percentage' as const,
        discount_value: 10,
        minimum_purchase: 50,
        usage_limit: 100,
        usage_count: 0,
        usage_limit_per_customer: 1,
        expires_at: nextMonth.toISOString(),
        is_active: true,
        applies_to: 'all' as const
      },
      {
        shop_id: shopId,
        code: 'SAVE20',
        description: 'Save $20 on orders over $100',
        discount_type: 'fixed_amount' as const,
        discount_value: 20,
        minimum_purchase: 100,
        usage_limit: 50,
        usage_count: 0,
        expires_at: nextMonth.toISOString(),
        is_active: true,
        applies_to: 'all' as const
      },
      {
        shop_id: shopId,
        code: 'FREESHIP',
        description: 'Free shipping on all orders',
        discount_type: 'free_shipping' as const,
        discount_value: 0,
        minimum_purchase: 75,
        usage_count: 0,
        expires_at: nextMonth.toISOString(),
        is_active: true,
        applies_to: 'all' as const
      }
    ];

    const { data, error } = await insforgeClient.database
      .from('discount_codes')
      .insert(discounts)
      .select();

    if (error) throw error;
    console.log(`✅ ${data.length} discount codes created`);
    return data;
  } catch (error: any) {
    console.error('Error seeding discount codes:', error);
    throw error;
  }
}

// ============================================================================
// Shipping Methods Seed
// ============================================================================

export async function seedShippingMethods(shopId: string): Promise<ShippingMethod[]> {
  try {
    const methods = [
      {
        shop_id: shopId,
        name: 'Standard Shipping',
        description: 'Delivery in 5-7 business days',
        base_cost: 5.99,
        cost_per_kg: 1.5,
        free_shipping_threshold: 75,
        estimated_days_min: 5,
        estimated_days_max: 7,
        is_active: true,
        available_countries: ['United States', 'Canada']
      },
      {
        shop_id: shopId,
        name: 'Express Shipping',
        description: 'Delivery in 2-3 business days',
        base_cost: 12.99,
        cost_per_kg: 2.5,
        estimated_days_min: 2,
        estimated_days_max: 3,
        is_active: true,
        available_countries: ['United States', 'Canada']
      },
      {
        shop_id: shopId,
        name: 'Overnight Shipping',
        description: 'Next business day delivery',
        base_cost: 24.99,
        cost_per_kg: 4,
        estimated_days_min: 1,
        estimated_days_max: 1,
        is_active: true,
        available_countries: ['United States']
      }
    ];

    const { data, error } = await insforgeClient.database
      .from('shipping_methods')
      .insert(methods)
      .select();

    if (error) throw error;
    console.log(`✅ ${data.length} shipping methods created`);
    return data;
  } catch (error: any) {
    console.error('Error seeding shipping methods:', error);
    throw error;
  }
}

// ============================================================================
// Payment Methods Seed
// ============================================================================

export async function seedPaymentMethods(shopId: string): Promise<PaymentMethod[]> {
  try {
    const methods = [
      {
        shop_id: shopId,
        provider: 'stripe' as const,
        name: 'Credit Card',
        is_active: true,
        settings: {
          acceptedCards: ['visa', 'mastercard', 'amex'],
          testMode: true
        }
      },
      {
        shop_id: shopId,
        provider: 'paypal' as const,
        name: 'PayPal',
        is_active: true,
        settings: {
          testMode: true
        }
      },
      {
        shop_id: shopId,
        provider: 'cash_on_delivery' as const,
        name: 'Cash on Delivery',
        is_active: true,
        settings: {}
      }
    ];

    const { data, error } = await insforgeClient.database
      .from('payment_methods')
      .insert(methods)
      .select();

    if (error) throw error;
    console.log(`✅ ${data.length} payment methods created`);
    return data;
  } catch (error: any) {
    console.error('Error seeding payment methods:', error);
    throw error;
  }
}

// ============================================================================
// Main Seed Function
// ============================================================================

/**
 * Seed all demo data
 */
export async function seedAllData(shopId: string): Promise<void> {
  try {
    console.log('🌱 Starting to seed database...');

    // 1. Shop Settings
    await seedShopSettings(shopId);

    // 2. Categories
    const categories = await seedCategories();

    // 3. Products
    const products = await seedProducts(shopId, categories);

    // 4. Product Variants
    await seedProductVariants(products);

    // 5. Discount Codes
    await seedDiscountCodes(shopId);

    // 6. Shipping Methods
    await seedShippingMethods(shopId);

    // 7. Payment Methods
    await seedPaymentMethods(shopId);

    console.log('✅ Database seeding completed successfully!');
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

/**
 * Clear all data for a shop (for testing)
 */
export async function clearShopData(shopId: string): Promise<void> {
  try {
    console.log('🗑️  Clearing shop data...');

    // Delete in reverse order of dependencies
    const tables = [
      'order_status_history',
      'order_items',
      'orders',
      'cart_items',
      'cart',
      'discount_code_usage',
      'discount_code_categories',
      'discount_code_products',
      'discount_codes',
      'wishlists',
      'review_images',
      'product_reviews',
      'inventory_logs',
      'product_variants',
      'product_images',
      'products',
      'categories',
      'payment_methods',
      'shipping_methods',
      'tax_rates',
      'shop_settings'
    ];

    for (const table of tables) {
      const { error } = await insforgeClient.database
        .from(table)
        .delete()
        .eq('shop_id', shopId);

      if (error && error.code !== 'PGRST116') {
        console.warn(`Warning deleting from ${table}:`, error);
      }
    }

    console.log('✅ Shop data cleared');
  } catch (error: any) {
    console.error('Error clearing shop data:', error);
    throw error;
  }
}





