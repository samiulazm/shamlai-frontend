'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { insforgeClient, CartService } from '@/lib/insforge';
import { getActiveTheme } from '@/lib/services/shop';
import { logger } from '@/lib/utils/logger';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeInjector } from '@/components/theme/ThemeInjector';
import Link from 'next/link';
import type { Theme } from '@/lib/types/database';
import { CART_UPDATED_EVENT } from '@/lib/constants';
import { getOrCreateCartSessionId } from '@/lib/utils/cart';

type CartDrawerItem = {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  price: number;
  product?: {
    name: string;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
  };
  variant?: {
    name: string;
  };
};

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const shopId = params.shop as string;
  const [shopName, setShopName] = useState('Shop');
  const [isOwner, setIsOwner] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartDrawerItem[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    fetchShopInfo();
    fetchTheme();
  }, [shopId]);

  const fetchShopInfo = async () => {
    try {
      // Get shop settings
      const { data: settings } = await insforgeClient.database
        .from('shop_settings')
        .select('shop_name')
        .eq('shop_id', shopId)
        .single();

      if (settings) {
        setShopName(settings.shop_name || 'Shop');
      }

      // Check if current user is the shop owner
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (user?.user?.id === shopId) {
        setIsOwner(true);
      }
    } catch (error) {
      logger.error(
        'Error fetching shop info',
        error instanceof Error ? error : new Error(String(error)),
        {
          shopId,
        }
      );
    }
  };

  const fetchCartSummary = useCallback(
    async (includeItems = false) => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        setCartLoading(includeItems);

        const sessionId = includeItems
          ? getOrCreateCartSessionId()
          : window.localStorage.getItem('session_id');
        if (!sessionId) {
          setCartItemCount(0);
          if (includeItems) {
            setCartItems([]);
            setCartSubtotal(0);
          }
          return;
        }

        const cart = await CartService.getOrCreateCart(undefined, sessionId);
        const cartWithItems = await CartService.getCartWithItems(cart.id);

        const itemCount = cartWithItems.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartItemCount(itemCount);

        if (includeItems) {
          setCartItems(cartWithItems.items || []);
          setCartSubtotal(cartWithItems.subtotal || 0);
        }
      } catch (error) {
        setCartItemCount(0);
        if (includeItems) {
          setCartItems([]);
          setCartSubtotal(0);
        }
      } finally {
        if (includeItems) {
          setCartLoading(false);
        }
      }
    },
    [shopId]
  );

  useEffect(() => {
    fetchCartSummary();
  }, [fetchCartSummary]);

  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartSummary();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
      return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    }
  }, [fetchCartSummary]);

  const fetchTheme = async () => {
    try {
      const activeTheme = await getActiveTheme(shopId);
      setTheme(activeTheme);
    } catch (error) {
      logger.error(
        'Error fetching theme',
        error instanceof Error ? error : new Error(String(error)),
        {
          shopId,
        }
      );
      // Continue with default theme (null)
    }
  };

  const openCartDrawer = async () => {
    await fetchCartSummary(true);
    setIsCartOpen(true);
  };

  const closeCartDrawer = () => setIsCartOpen(false);

  const drawerShipping = 80;
  const drawerTotal = cartSubtotal + drawerShipping;

  return (
    <ThemeProvider initialTheme={theme}>
      <ThemeInjector />
      <div className="min-h-screen bg-white">
        <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
          <div className="container-responsive h-16 flex items-center justify-between">
            <Link
              href={`/${shopId}`}
              className="font-bold text-lg text-gray-900 transition-colors"
              style={{ color: 'var(--theme-primary)' }}
            >
              {shopName}
            </Link>
            <nav className="flex items-center gap-6">
              <Link href={`/${shopId}`} className="text-sm text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link
                href={`/${shopId}#products`}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Products
              </Link>
              <button
                type="button"
                onClick={openCartDrawer}
                className="relative text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                data-testid="cart-button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span
                  className="inline-flex items-center justify-center rounded-full text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-800 min-w-[1.75rem]"
                  data-testid="cart-count"
                >
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              </button>
              <Link href={`/${shopId}/cart`} className="text-sm text-gray-600 hover:text-gray-900">
                View Cart
              </Link>
              {isOwner && (
                <Link href="/dashboard" className="btn btn-primary text-sm">
                  📊 Dashboard
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <footer className="border-t bg-gray-50 py-8">
          <div className="container-responsive text-center">
            <p className="text-sm text-gray-600">
              Powered by{' '}
              <span className="font-semibold" style={{ color: 'var(--theme-primary)' }}>
                Shamlai
              </span>
            </p>
            {isOwner && (
              <p className="text-xs text-gray-500 mt-2">You're viewing your shop as the owner</p>
            )}
          </div>
        </footer>
        {isCartOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/30"
              aria-label="Close cart"
              onClick={closeCartDrawer}
            />
            <div
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
              data-testid="cart-drawer"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Your Cart</p>
                  <p className="text-sm text-gray-500">{cartItemCount} item(s)</p>
                </div>
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="text-gray-500 hover:text-gray-900"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartLoading ? (
                  <div className="text-center text-gray-500">Loading cart...</div>
                ) : cartItems.length === 0 ? (
                  <div className="text-center text-gray-500">Your cart is empty.</div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4" data-testid="cart-item">
                      <div className="h-16 w-16 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        {(() => {
                          const images = item.product?.product_images;
                          const primaryImage = images?.find((img) => img.is_primary) || images?.[0];
                          return primaryImage?.image_url ? (
                            <img
                              src={primaryImage.image_url}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.product?.name || 'Product'}</p>
                        {item.variant?.name && (
                          <p className="text-xs text-gray-500">{item.variant.name}</p>
                        )}
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-semibold text-sm">
                        ৳{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>৳{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span>৳{drawerShipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>৳{drawerTotal.toFixed(2)}</span>
                </div>
                <Link
                  href={`/${shopId}/checkout`}
                  className="btn btn-primary w-full text-center"
                  data-testid="checkout-button"
                  onClick={closeCartDrawer}
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href={`/${shopId}/cart`}
                  className="btn btn-outline w-full text-center"
                  onClick={closeCartDrawer}
                >
                  View Full Cart
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
