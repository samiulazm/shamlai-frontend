'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import * as CartService from '@/lib/services/cart';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    fetchShopInfo();
    fetchTheme();
  }, [shopId]);

  const fetchShopInfo = async () => {
    try {
      // Get shop settings
      const { data: settings } = await supabaseClient
        .from('shop_settings')
        .select('shop_name')
        .eq('shop_id', shopId)
        .single();

      if (settings) {
        setShopName(settings.shop_name || 'Shop');
      }

      // Check if current user is the shop owner
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (user?.id === shopId) {
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
        {/* Mobile-optimized header */}
        <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
          <div className="container-responsive h-14 sm:h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href={`/${shopId}`}
              className="font-bold text-base sm:text-lg text-gray-900 transition-colors truncate"
              style={{ color: 'var(--theme-primary)' }}
            >
              {shopName}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <Link
                href={`/${shopId}`}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <Link
                href={`/${shopId}#products`}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Products
              </Link>
              <Link
                href={`/${shopId}/cart`}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                View Cart
              </Link>
              <button
                type="button"
                onClick={openCartDrawer}
                className="relative text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
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
              {isOwner && (
                <Link href="/dashboard" className="btn btn-primary text-sm">
                  📊 Dashboard
                </Link>
              )}
            </nav>

            {/* Mobile: Cart button + Hamburger Menu */}
            <div className="flex md:hidden items-center gap-3">
              <button
                type="button"
                onClick={openCartDrawer}
                className="relative p-2 -mr-2 text-gray-600 hover:text-gray-900 touch-manipulation"
                data-testid="cart-button-mobile"
                aria-label="Open cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItemCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full text-xs font-bold px-1.5 py-0.5 min-w-[1.25rem] h-5 text-white"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                    data-testid="cart-count-mobile"
                  >
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900 touch-manipulation"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t bg-white">
              <nav className="container-responsive py-3 space-y-1">
                <Link
                  href={`/${shopId}`}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors touch-manipulation"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🏠 Home
                </Link>
                <Link
                  href={`/${shopId}#products`}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors touch-manipulation"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🛍️ Products
                </Link>
                <Link
                  href={`/${shopId}/cart`}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors touch-manipulation"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🛒 Cart {cartItemCount > 0 && `(${cartItemCount})`}
                </Link>
                {isOwner && (
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors touch-manipulation"
                    style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📊 Dashboard
                  </Link>
                )}
              </nav>
            </div>
          )}
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
        {/* Cart Drawer - Mobile Optimized */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              aria-label="Close cart"
              onClick={closeCartDrawer}
            />
            <div
              className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right"
              data-testid="cart-drawer"
            >
              <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <p className="text-lg sm:text-xl font-bold">Your Cart</p>
                  <p className="text-xs sm:text-sm text-gray-500">{cartItemCount} item(s)</p>
                </div>
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                  aria-label="Close cart"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {cartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600 mx-auto"></div>
                      <p className="mt-3 text-sm text-gray-500">Loading cart...</p>
                    </div>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full px-4">
                    <div className="text-center">
                      <div className="text-5xl mb-3">🛒</div>
                      <p className="text-gray-500">Your cart is empty</p>
                      <button onClick={closeCartDrawer} className="btn btn-primary mt-4">
                        Start Shopping
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                        data-testid="cart-item"
                      >
                        <div className="flex gap-3">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {(() => {
                              const images = item.product?.product_images;
                              const primaryImage =
                                images?.find((img) => img.is_primary) || images?.[0];
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
                            <p className="font-medium text-sm sm:text-base line-clamp-2">
                              {item.product?.name || 'Product'}
                            </p>
                            {item.variant?.name && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                {item.variant.name}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs sm:text-sm text-gray-600">
                                Qty: {item.quantity}
                              </p>
                              <p
                                className="font-bold text-sm sm:text-base"
                                style={{ color: 'var(--theme-primary)' }}
                              >
                                ৳{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t p-4 sm:p-5 space-y-3 bg-gray-50">
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">৳{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="font-medium">৳{drawerShipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t">
                    <span>Total</span>
                    <span style={{ color: 'var(--theme-primary)' }}>৳{drawerTotal.toFixed(2)}</span>
                  </div>
                </div>
                <Link
                  href={`/${shopId}/checkout`}
                  className="btn btn-primary w-full text-center text-sm sm:text-base font-semibold py-3 shadow-lg"
                  data-testid="checkout-button"
                  onClick={closeCartDrawer}
                >
                  Proceed to Checkout →
                </Link>
                <Link
                  href={`/${shopId}/cart`}
                  className="btn btn-outline w-full text-center text-sm"
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
