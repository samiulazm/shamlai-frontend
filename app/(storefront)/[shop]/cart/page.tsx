'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import * as CartService from '@/lib/services/cart';
import { logger } from '@/lib/utils/logger';
import { getOrCreateCartSessionId, dispatchCartUpdatedEvent } from '@/lib/utils/cart';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    base_price: number;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
  };
}

export default function Cart() {
  const params = useParams();
  const shopId = params.shop as string;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = typeof window !== 'undefined' ? getOrCreateCartSessionId() : null;
      if (!sessionId) {
        setCartItems([]);
        setSubtotal(0);
        return;
      }

      const cart = await CartService.getOrCreateCart(undefined, sessionId);
      const cartWithItems = await CartService.getCartWithItems(cart.id);

      setCartItems(cartWithItems.items || []);
      setSubtotal(cartWithItems.subtotal || 0);
      setShipping(80); // Default shipping cost
    } catch (err: any) {
      logger.error('Error fetching cart', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    try {
      setUpdating(itemId);
      await CartService.updateCartItemQuantity(itemId, newQuantity);
      await fetchCart();
      dispatchCartUpdatedEvent({ action: 'update-item' });
    } catch (err: any) {
      logger.error('Error updating cart item', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      await CartService.removeFromCart(itemId);
      await fetchCart();
      dispatchCartUpdatedEvent({ action: 'remove-item' });
    } catch (err: any) {
      logger.error('Error removing cart item', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const getItemPrice = (item: CartItem) => {
    return item.variant?.price || item.product.base_price;
  };

  const getItemImage = (item: CartItem) => {
    const images = item.product.product_images || [];
    const primaryImage = images.find((img) => img.is_primary) || images[0];
    return primaryImage?.image_url;
  };

  if (loading) {
    return (
      <div className="container-responsive py-4 sm:py-6 md:py-10">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: 'var(--theme-primary)' }}
            ></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  const total = subtotal + shipping;

  return (
    <div className="container-responsive py-4 sm:py-6 md:py-10">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Your Cart</h1>
        <div className="text-sm sm:text-base text-gray-600">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </div>
      </div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        {/* Cart Items Section */}
        <div className="lg:col-span-2 card">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-5xl sm:text-6xl mb-4">🛒</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                Add some products to get started!
              </p>
              <Link href={`/${shopId}`} className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {cartItems.map((item) => (
                <div key={item.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Product Image - Responsive sizing */}
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                      {getItemImage(item) ? (
                        <img
                          src={getItemImage(item)!}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm sm:text-base line-clamp-2">
                            {item.product.name}
                          </h3>
                          {item.variant && (
                            <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                              {item.variant.name}
                            </div>
                          )}
                        </div>
                        {/* Remove button - Mobile optimized */}
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updating === item.id}
                          className="p-1.5 sm:p-2 -mt-1 -mr-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full disabled:opacity-50 transition-colors touch-manipulation"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        {/* Price */}
                        <div
                          className="text-sm sm:text-base font-semibold"
                          style={{ color: 'var(--theme-primary)' }}
                        >
                          ৳{getItemPrice(item).toFixed(2)}
                        </div>

                        {/* Quantity Controls - Touch-friendly */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updating === item.id || item.quantity <= 1}
                            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-2 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 sm:w-10 text-center font-medium text-sm sm:text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating === item.id}
                            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-2 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="font-bold text-sm sm:text-base min-w-[60px] sm:min-w-[80px] text-right">
                          ৳{(getItemPrice(item) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Summary Card - Sticky on mobile */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="card">
            <div className="p-4 sm:p-5">
              <div className="font-semibold text-lg sm:text-xl mb-3 sm:mb-4">Order Summary</div>
              <div className="space-y-2 sm:space-y-2.5 text-sm sm:text-base">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-medium">৳{shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 sm:pt-3 mt-2 flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span style={{ color: 'var(--theme-primary)' }}>৳{total.toFixed(2)}</span>
                </div>
              </div>
              {cartItems.length > 0 && (
                <Link
                  href={`/${shopId}/checkout`}
                  className="btn btn-primary mt-4 sm:mt-5 w-full text-sm sm:text-base font-semibold py-3 sm:py-3.5"
                >
                  Proceed to Checkout →
                </Link>
              )}
              <Link
                href={`/${shopId}`}
                className="btn btn-outline mt-2 sm:mt-2.5 w-full text-center text-sm"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
