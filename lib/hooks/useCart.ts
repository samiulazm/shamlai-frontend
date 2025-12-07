// React hooks for cart operations
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem, Product, ProductVariant } from '../types/database';
import * as cartService from '../services/cart';

interface CartWithItems extends Cart {
  items: (CartItem & {
    product: Product;
    variant?: ProductVariant;
  })[];
  subtotal: number;
  itemCount: number;
}

/**
 * Hook to manage shopping cart
 */
export function useCart(userId?: string, sessionId?: string, shopId?: string) {
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    // If shopID is missing, we can't fetch/create a valid cart in a multi-tenant system
    if (!shopId && (!userId && !sessionId)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Pass shopId to getOrCreateCart, and sessionId to both functions
      const cartData = await cartService.getOrCreateCart(userId, sessionId, shopId);
      const cartWithItems = await cartService.getCartWithItems(cartData.id, sessionId);
      setCart(cartWithItems);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, shopId]);

  // Initial fetch
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addItem = async (productId: string, quantity: number = 1, variantId?: string) => {
    if (!cart) return;

    try {
      setError(null);
      await cartService.addToCart(cart.id, productId, quantity, variantId, sessionId);
      await fetchCart(); // Refresh cart
    } catch (err: any) {
      setError(err.message || 'Failed to add item to cart');
      throw err;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setError(null);
      await cartService.updateCartItemQuantity(itemId, quantity, sessionId);
      await fetchCart(); // Refresh cart
    } catch (err: any) {
      setError(err.message || 'Failed to update quantity');
      throw err;
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      setError(null);
      await cartService.removeFromCart(itemId, sessionId);
      await fetchCart(); // Refresh cart
    } catch (err: any) {
      setError(err.message || 'Failed to remove item');
      throw err;
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!cart) return;

    try {
      setError(null);
      await cartService.clearCart(cart.id, sessionId);
      await fetchCart(); // Refresh cart
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart');
      throw err;
    }
  };

  // Validate cart
  const validateCart = async () => {
    if (!cart) return null;

    try {
      const validation = await cartService.validateCart(cart.id, sessionId);
      return validation;
    } catch (err: any) {
      setError(err.message || 'Failed to validate cart');
      return null;
    }
  };

  // Calculate totals
  const calculateTotals = async (shippingMethodId?: string, discountCode?: string) => {
    if (!cart) return null;

    try {
      const totals = await cartService.calculateCartTotals(cart.id, shippingMethodId, discountCode, sessionId);
      return totals;
    } catch (err: any) {
      setError(err.message || 'Failed to calculate totals');
      return null;
    }
  };

  return {
    cart,
    loading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    validateCart,
    calculateTotals,
    refreshCart: fetchCart
  };
}





