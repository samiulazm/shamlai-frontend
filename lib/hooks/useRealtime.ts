// React hooks for real-time subscriptions
'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeToTable } from '../supabase';
import { logger } from '../utils/logger';

/**
 * Hook to subscribe to real-time updates for a table
 * @param table - Table name to subscribe to
 * @param filter - Optional filter (e.g., 'shop_id=eq.123')
 * @param enabled - Whether the subscription is enabled (default: true)
 */
export function useRealtimeSubscription<T = any>(
  table: string,
  filter?: string,
  enabled: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    try {
      const subscription = subscribeToTable(table, filter, (payload: any) => {
        try {
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            setData((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item: any) => (item.id === payload.new.id ? payload.new : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((item: any) => item.id !== payload.old.id));
          }
        } catch (err) {
          logger.error(
            'Error processing real-time update',
            err instanceof Error ? err : new Error(String(err))
          );
          setError('Failed to process update');
        }
      });

      subscriptionRef.current = subscription;

      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
      };
    } catch (err) {
      logger.error(
        'Error setting up real-time subscription',
        err instanceof Error ? err : new Error(String(err))
      );
      setError('Failed to set up subscription');
    }
  }, [table, filter, enabled]);

  return { data, error };
}

/**
 * Hook to subscribe to order updates in real-time
 * @param shopId - Shop ID to filter orders
 * @param enabled - Whether the subscription is enabled
 */
export function useRealtimeOrders(shopId: string, enabled: boolean = true) {
  return useRealtimeSubscription('orders', `shop_id=eq.${shopId}`, enabled);
}

/**
 * Hook to subscribe to inventory updates in real-time
 * @param productId - Product ID to filter inventory logs
 * @param enabled - Whether the subscription is enabled
 */
export function useRealtimeInventory(productId: string, enabled: boolean = true) {
  return useRealtimeSubscription('inventory_logs', `product_id=eq.${productId}`, enabled);
}

/**
 * Hook to subscribe to cart updates in real-time
 * @param cartId - Cart ID to filter updates
 * @param enabled - Whether the subscription is enabled
 */
export function useRealtimeCart(cartId: string, enabled: boolean = true) {
  return useRealtimeSubscription('cart_items', `cart_id=eq.${cartId}`, enabled);
}
