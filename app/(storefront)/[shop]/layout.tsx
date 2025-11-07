'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { insforgeClient, CartService } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

export default function StorefrontLayout({ children }: { children: React.ReactNode }){
  const params = useParams();
  const router = useRouter();
  const shopId = params.shop as string;
  const [shopName, setShopName] = useState('Shop');
  const [isOwner, setIsOwner] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    fetchShopInfo();
    fetchCartCount();
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
      logger.error('Error fetching shop info', error instanceof Error ? error : new Error(String(error)), {
        shopId,
      });
    }
  };

  const fetchCartCount = async () => {
    try {
      // Get or create cart (using session for guest checkout)
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
      if (!sessionId) {
        setCartItemCount(0);
        return;
      }

      const cart = await CartService.getOrCreateCart(undefined, sessionId);
      const cartWithItems = await CartService.getCartWithItems(cart.id);
      
      const itemCount = cartWithItems.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartItemCount(itemCount);
    } catch (error) {
      // Silently fail - cart might not exist yet
      setCartItemCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container-responsive h-16 flex items-center justify-between">
          <Link href={`/${shopId}`} className="font-bold text-lg text-gray-900 hover:text-indigo-600 transition-colors">
            {shopName}
          </Link>
          <nav className="flex items-center gap-6">
            <Link href={`/${shopId}`} className="text-sm text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href={`/${shopId}#products`} className="text-sm text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link href={`/${shopId}/cart`} className="relative text-sm text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>
            {isOwner && (
              <Link 
                href="/dashboard" 
                className="btn btn-primary text-sm"
              >
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
            Powered by <span className="font-semibold text-indigo-600">Shamlai</span>
          </p>
          {isOwner && (
            <p className="text-xs text-gray-500 mt-2">
              You're viewing your shop as the owner
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
