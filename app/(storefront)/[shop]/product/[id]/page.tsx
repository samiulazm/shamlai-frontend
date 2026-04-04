import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cacheGetOrSet, CACHE_TTL, REDIS_KEYS } from '@/lib/cache/redis';
import { supabaseClient } from '@/lib/supabase';
import ProductDetails from '@/components/storefront/ProductDetails';
import { logger } from '@/lib/utils/logger';

// FORCE STATIC GENERATION (ISR)
export const revalidate = 60; // Revalidate every 60 seconds

interface PageProps {
  params: Promise<{
    shop: string; // user_id
    id: string; // product_id
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id: productId, shop: userId } = await params;

  let product: any = null;
  let variants: any[] = [];
  let images: any[] = [];
  let error: string | null = null;

  try {
    // 1. Get Product (Cached)
    product = await cacheGetOrSet(
      REDIS_KEYS.PRODUCT(productId),
      async () => {
        const { data, error } = await supabaseClient
          .from('products')
          .select(
            `
            *,
            product_images (
              id,
              image_url,
              is_primary,
              sort_order,
              alt_text
            ),
            product_variants (
                 id,
                 name,
                 price,
                 sku,
                 inventory_quantity,
                 is_active,
                 sort_order
            )
          `
          )
          .eq('id', productId)
          .single();

        if (error) throw error;

        // Filter variants carefully
        if (data && data.product_variants) {
          data.product_variants = data.product_variants
            .filter((v: any) => v.is_active !== false)
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        }

        return data;
      },
      { ttl: CACHE_TTL.PRODUCT }
    );

    if (!product) {
      return notFound();
    }

    images = product.product_images || [];
    variants = product.product_variants || [];
  } catch (err: any) {
    logger.error('Error fetching product', err instanceof Error ? err : new Error(String(err)));
    error = err.message || 'Failed to load product';
  }

  if (error || !product) {
    return (
      <div className="container-responsive py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || 'This product does not exist or is no longer available.'}
          </p>
          <Link href={`/${userId}`} className="btn btn-outline">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return <ProductDetails product={product} variants={variants} images={images} shopId={userId} />;
}
