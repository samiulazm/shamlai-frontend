'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { insforgeClient } from '@/lib/insforge';
import * as CartService from '@/lib/services/cart';
import type { Product, ShopSettings } from '@/lib/types/database';
import { logger } from '@/lib/utils/logger';
import { getOrCreateCartSessionId, dispatchCartUpdatedEvent } from '@/lib/utils/cart';

export default function StoreHome() {
  const params = useParams();
  const shopId = params.shop as string;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchShopData();
  }, [shopId]);

  const fetchShopData = async () => {
    try {
      setLoading(true);

      // Fetch shop settings and products in parallel (performance optimization)
      const [settingsResult, productsResult] = await Promise.all([
        insforgeClient.database.from('shop_settings').select('*').eq('shop_id', shopId).single(),
        insforgeClient.database
          .from('products')
          .select(
            `
            *,
            product_images (
              id,
              image_url,
              is_primary,
              sort_order
            )
          `
          )
          .eq('shop_id', shopId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      setShopSettings(settingsResult.data);
      setProducts(productsResult.data || []);
    } catch (error) {
      logger.error(
        'Error fetching shop data',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (product: Product) => {
    if (addingProductId) return;

    if (product.inventory_quantity !== null && product.inventory_quantity <= 0) {
      setCartFeedback('This product is out of stock.');
      return;
    }

    try {
      setCartFeedback(null);
      setAddingProductId(product.id);

      const sessionId = getOrCreateCartSessionId();
      const cart = await CartService.getOrCreateCart(undefined, sessionId);

      let variantId: string | undefined;
      if (product.has_variants) {
        const { data: variant } = await insforgeClient.database
          .from('product_variants')
          .select('id')
          .eq('product_id', product.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(1)
          .single();

        variantId = variant?.id;

        if (!variantId) {
          window.location.href = `/${shopId}/product/${product.id}`;
          return;
        }
      }

      await CartService.addToCart(cart.id, product.id, 1, variantId);
      dispatchCartUpdatedEvent({ productId: product.id });
      setCartFeedback('Item added to cart');
    } catch (error: any) {
      logger.error(
        'Quick add to cart failed',
        error instanceof Error ? error : new Error(String(error))
      );
      setCartFeedback(error?.message || 'Failed to add item to cart');
    } finally {
      setAddingProductId(null);
      setTimeout(() => setCartFeedback(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="container-responsive py-20">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: 'var(--theme-primary)' }}
          ></div>
          <p className="mt-4 text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
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

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product: Product) => (
                <div
                  key={product.id}
                  className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  data-testid="product-card"
                >
                  <Link href={`/${shopId}/product/${product.id}`} className="block">
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {(() => {
                        const images = (product as any).product_images as
                          | Array<{ image_url: string; is_primary: boolean }>
                          | undefined;
                        const primaryImage = images?.find((img) => img.is_primary) || images?.[0];
                        return primaryImage?.image_url ? (
                          <img
                            src={primaryImage.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-16 h-16"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        );
                      })()}
                      {product.inventory_quantity !== null &&
                        product.inventory_quantity <= 5 &&
                        product.inventory_quantity > 0 && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                            Only {product.inventory_quantity} left
                          </div>
                        )}
                      {product.inventory_quantity === 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          Out of stock
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 transition-colors line-clamp-2 group-hover:[color:var(--theme-primary)]">
                        {product.name}
                      </h3>
                      {product.short_description && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                          {product.short_description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            {currencySymbol}
                            {product.base_price.toFixed(2)}
                          </span>
                          {product.compare_at_price &&
                            product.compare_at_price > product.base_price && (
                              <span className="ml-2 text-sm text-gray-400 line-through">
                                {currencySymbol}
                                {product.compare_at_price.toFixed(2)}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <button
                      className="btn btn-primary w-full text-sm"
                      onClick={() => handleQuickAdd(product)}
                      disabled={
                        addingProductId === product.id ||
                        (product.inventory_quantity !== null && product.inventory_quantity === 0)
                      }
                      data-testid="add-to-cart"
                    >
                      {product.inventory_quantity === 0
                        ? 'Out of Stock'
                        : addingProductId === product.id
                          ? 'Adding...'
                          : 'Add to Cart'}
                    </button>
                    <Link
                      href={`/${shopId}/product/${product.id}`}
                      className="btn btn-outline w-full text-sm mt-2 text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
