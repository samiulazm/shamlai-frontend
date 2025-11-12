'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { insforgeClient, CartService } from "@/lib/insforge";
import { logger } from "@/lib/utils/logger";

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

export default function Cart(){
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

      // Get or create cart (using session for guest checkout)
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') || `session_${Date.now()}` : `session_${Date.now()}`;
      if (typeof window !== 'undefined' && !localStorage.getItem('session_id')) {
        localStorage.setItem('session_id', sessionId);
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
    const primaryImage = images.find(img => img.is_primary) || images[0];
    return primaryImage?.image_url;
  };

  if (loading) {
    return (
      <div className="container-responsive py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--theme-primary)' }}></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  const total = subtotal + shipping;

  return (
    <div className="container-responsive py-10">
      <h1 className="text-2xl font-bold">Your Cart</h1>
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6">Add some products to get started!</p>
              <Link href={`/${shopId}`} className="btn btn-primary">Continue Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-0">
                  <div className="h-16 w-16 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                    {getItemImage(item) ? (
                      <img src={getItemImage(item)!} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.product.name}</div>
                    {item.variant && (
                      <div className="text-sm text-gray-600">{item.variant.name}</div>
                    )}
                    <div className="text-sm font-semibold mt-1">৳{getItemPrice(item).toFixed(2)}</div>
                  </div>
                  <div className="w-24">
                    <input 
                      className="input text-center" 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      min={1}
                      disabled={updating === item.id}
                    />
                  </div>
                  <div className="w-24 text-right font-semibold">
                    ৳{(getItemPrice(item) * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border p-4 h-fit">
          <div className="font-semibold mb-4">Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>৳{shipping.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
          </div>
          {cartItems.length > 0 && (
            <Link href={`/${shopId}/checkout`} className="btn btn-primary mt-4 w-full">
              Checkout
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
