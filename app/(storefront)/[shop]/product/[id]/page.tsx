'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import * as CartService from '@/lib/services/cart';
import { logger } from '@/lib/utils/logger';
import type { Product, ProductVariant, ProductImage } from '@/lib/types/database';
import { getOrCreateCartSessionId, dispatchCartUpdatedEvent } from '@/lib/utils/cart';

export default function ProductPage({ params }: { params: { id: string } }) {
  const routerParams = useParams();
  const shopId = routerParams.shop as string;
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId, shopId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch product with images
      const { data: productData, error: productError } = await supabaseClient
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
          )
        `
        )
        .eq('id', productId)
        .eq('shop_id', shopId)
        .single();

      if (productError) throw productError;
      if (!productData) {
        setError('Product not found');
        return;
      }

      setProduct(productData);
      setImages((productData as any).product_images || []);

      // Fetch variants if product has variants
      if (productData.has_variants) {
        const { data: variantsData, error: variantsError } = await supabaseClient
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!variantsError && variantsData) {
          setVariants(variantsData);
          if (variantsData.length > 0) {
            setSelectedVariant(variantsData[0].id);
          }
        }
      }
    } catch (err: any) {
      logger.error('Error fetching product', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      setError(null);

      const sessionId = getOrCreateCartSessionId();
      const cart = await CartService.getOrCreateCart(undefined, sessionId);

      // Add item to cart
      await CartService.addToCart(cart.id, product.id, quantity, selectedVariant || undefined);
      dispatchCartUpdatedEvent({ productId: product.id });

      // Redirect to cart
      window.location.href = `/${shopId}/cart`;
    } catch (err: any) {
      logger.error('Error adding to cart', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container-responsive py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: 'var(--theme-primary)' }}
            ></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-responsive py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || 'This product does not exist or is no longer available.'}
          </p>
          <Link href={`/${shopId}`} className="btn btn-outline">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const currentPrice =
    selectedVariant && variants.length > 0
      ? variants.find((v) => v.id === selectedVariant)?.price || product.base_price
      : product.base_price;
  const currencySymbol = '৳';

  return (
    <div className="container-responsive py-10 grid gap-8 md:grid-cols-2">
      <div className="aspect-square rounded-xl border overflow-hidden bg-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        {product.short_description && (
          <p className="mt-2 text-gray-600">{product.short_description}</p>
        )}
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-semibold">
            {currencySymbol}
            {currentPrice.toFixed(2)}
          </span>
          {product.compare_at_price && product.compare_at_price > currentPrice && (
            <span className="text-xl text-gray-400 line-through">
              {currencySymbol}
              {product.compare_at_price.toFixed(2)}
            </span>
          )}
        </div>
        {product.description && (
          <div className="mt-6 prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
          </div>
        )}
        <div className="mt-6 grid gap-3">
          {variants.length > 0 && (
            <div>
              <label className="label">Variant</label>
              <select
                className="input"
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} - {currencySymbol}
                    {variant.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Quantity</label>
            <input
              className="input"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={product.inventory_quantity || 999}
            />
            {product.inventory_quantity !== null && (
              <p
                className="mt-1 text-sm text-gray-500"
                data-testid={product.inventory_quantity === 0 ? 'out-of-stock-message' : undefined}
              >
                {product.inventory_quantity > 0
                  ? `${product.inventory_quantity} in stock`
                  : 'Out of stock'}
              </p>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={
              addingToCart ||
              (product.inventory_quantity !== null && product.inventory_quantity === 0)
            }
            className="btn btn-primary w-full"
            data-testid="add-to-cart"
          >
            {addingToCart
              ? 'Adding...'
              : product.inventory_quantity === 0
                ? 'Out of Stock'
                : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
