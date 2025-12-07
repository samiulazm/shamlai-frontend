'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseClient } from '@/lib/supabase';
import * as CartService from '@/lib/services/cart';
import type { Product, ProductVariant, ProductImage } from '@/lib/types/database';
import { logger } from '@/lib/utils/logger';
import { getOrCreateCartSessionId, dispatchCartUpdatedEvent } from '@/lib/utils/cart';

interface ProductDetailsProps {
  product: Product;
  variants: ProductVariant[];
  images: ProductImage[];
  shopId: string;
}

export default function ProductDetails({ product, variants, images, shopId }: ProductDetailsProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants.length > 0 ? variants[0].id : ''
  );
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const currentPrice =
    selectedVariant && variants.length > 0
      ? variants.find((v) => v.id === selectedVariant)?.price || product.base_price
      : product.base_price;
  const currencySymbol = '৳';

  const handleAddToCart = async () => {
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

  return (
    <div className="container-responsive py-10 grid gap-8 md:grid-cols-2">
      <div className="aspect-square rounded-xl border overflow-hidden bg-gray-100 relative">
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
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
