import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductsByShop } from '@/lib/services/shop';
import ProductGrid from '@/components/storefront/ProductGrid';
import { supabaseClient } from '@/lib/supabase';

// FORCE STATIC GENERATION (ISR)
export const revalidate = 60; // Revalidate every 60 seconds

interface PageProps {
  params: {
    shop: string; // This is actually user_id in the current routing scheme
  };
}

export default async function StoreHome({ params }: PageProps) {
  const userId = params.shop;

  // 1. Get Shop Settings first to get the actual shop_id
  // We need to fetch this to resolve user_id -> shop_id
  // Note: We might want to cache this mapping too if it becomes a bottleneck,
  // but getShopSettings usually takes shop_id.

  // Let's do a direct DB call for the mapping for now.

  let shopSettings;
  let products = [];

  try {
    const { data: settings } = await supabaseClient
      .from('shop_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      return notFound();
    }

    shopSettings = settings;

    // 2. Fetch Products using the actual shop_id (Cached)
    // Now we have the shop_id, we can use our cached service
    products = await getProductsByShop(settings.shop_id);
  } catch (e) {
    console.error('Error loading shop:', e);
    return notFound();
  }

  const shopName = shopSettings?.shop_name || 'Demo Shop';
  const shopDescription = shopSettings?.shop_description || 'Welcome to our store';
  const currency = shopSettings?.currency || 'USD';
  const currencySymbol = currency === 'BDT' ? '৳' : '$';

  return (
    <div className="container-responsive py-10">
      <div
        className="rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 p-10 text-center border border-gray-200"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 5%, white), white, color-mix(in srgb, var(--theme-secondary) 5%, white))`,
          borderColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)',
        }}
      >
        <div className="text-3xl font-bold text-gray-900">{shopName}</div>
        <p className="mt-2 text-gray-600">{shopDescription}</p>
        {products.length > 0 && (
          <a href="#products" className="btn btn-primary mt-4 inline-block">
            Shop Now
          </a>
        )}
      </div>

      <div id="products" className="mt-10">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-600 mb-6">This shop is still setting up their products.</p>
            <Link
              href="/login"
              className="hover:underline"
              style={{ color: 'var(--theme-primary)' }}
            >
              Are you the owner? Login to add products →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Our Products</h2>
              <p className="text-sm text-gray-600">{products.length} products available</p>
            </div>

            <ProductGrid products={products} userId={userId} currencySymbol={currencySymbol} />
          </>
        )}
      </div>
    </div>
  );
}
