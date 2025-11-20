/**
 * InsForge Real-time Subscription Manager
 * Manage real-time database subscriptions with automatic reconnection
 */

import { getInsForgeManager } from './client-manager';
import { logger } from '@/lib/utils/logger';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface SubscriptionOptions {
  table: string;
  event: RealtimeEvent;
  filter?: string; // e.g., "shop_id=eq.123"
  callback: (payload: any) => void;
  onError?: (error: any) => void;
}

export interface Subscription {
  id: string;
  table: string;
  event: RealtimeEvent;
  channel: any;
  isActive: boolean;
  createdAt: Date;
}

class RealtimeManager {
  private static instance: RealtimeManager;
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts: number = 5;

  private constructor() {
    logger.info('RealtimeManager initialized');
  }

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  /**
   * Subscribe to table changes
   */
  public subscribe(options: SubscriptionOptions): string {
    const { table, event, filter, callback, onError } = options;
    const subscriptionId = `${table}:${event}:${filter || 'all'}`;

    if (this.subscriptions.has(subscriptionId)) {
      logger.warn('Subscription already exists', { subscriptionId });
      return subscriptionId;
    }

    try {
      const manager = getInsForgeManager();
      const client = manager['defaultClient']; // Access default client

      // Create channel
      const channelName = `realtime:${subscriptionId}`;
      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            ...(filter && { filter }),
          },
          (payload: any) => {
            logger.debug('Realtime event received', {
              subscriptionId,
              event: payload.eventType,
            });
            callback(payload);
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            logger.info('Subscription active', { subscriptionId });
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('Subscription error', { subscriptionId, status });
            this.handleSubscriptionError(subscriptionId, options);
            if (onError) {
              onError(new Error(`Subscription error: ${status}`));
            }
          } else if (status === 'TIMED_OUT') {
            logger.warn('Subscription timeout', { subscriptionId });
            this.handleSubscriptionTimeout(subscriptionId, options);
          }
        });

      const subscription: Subscription = {
        id: subscriptionId,
        table,
        event,
        channel,
        isActive: true,
        createdAt: new Date(),
      };

      this.subscriptions.set(subscriptionId, subscription);
      this.reconnectAttempts.set(subscriptionId, 0);

      logger.info('Subscription created', { subscriptionId, table, event });

      return subscriptionId;
    } catch (error) {
      logger.error('Failed to create subscription', { error, options });
      throw error;
    }
  }

  /**
   * Unsubscribe from table changes
   */
  public async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      logger.warn('Subscription not found', { subscriptionId });
      return false;
    }

    try {
      await subscription.channel.unsubscribe();
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      this.reconnectAttempts.delete(subscriptionId);

      logger.info('Subscription removed', { subscriptionId });

      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe', { subscriptionId, error });
      return false;
    }
  }

  /**
   * Unsubscribe from all
   */
  public async unsubscribeAll(): Promise<number> {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    let unsubscribed = 0;

    for (const id of subscriptionIds) {
      const success = await this.unsubscribe(id);
      if (success) {
        unsubscribed++;
      }
    }

    logger.info('All subscriptions removed', { count: unsubscribed });

    return unsubscribed;
  }

  /**
   * Get subscription status
   */
  public getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get all active subscriptions
   */
  public getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.isActive);
  }

  /**
   * Check if subscription is active
   */
  public isActive(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    return subscription?.isActive || false;
  }

  /**
   * Handle subscription error with reconnection
   */
  private handleSubscriptionError(
    subscriptionId: string,
    options: SubscriptionOptions
  ): void {
    const attempts = this.reconnectAttempts.get(subscriptionId) || 0;

    if (attempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, attempts), 30000);

      logger.info('Attempting to reconnect', {
        subscriptionId,
        attempt: attempts + 1,
        delay,
      });

      setTimeout(() => {
        this.reconnect(subscriptionId, options);
      }, delay);
    } else {
      logger.error('Max reconnect attempts reached', { subscriptionId });
      this.unsubscribe(subscriptionId);
    }
  }

  /**
   * Handle subscription timeout
   */
  private handleSubscriptionTimeout(
    subscriptionId: string,
    options: SubscriptionOptions
  ): void {
    logger.warn('Subscription timed out, reconnecting', { subscriptionId });
    this.reconnect(subscriptionId, options);
  }

  /**
   * Reconnect subscription
   */
  private async reconnect(
    subscriptionId: string,
    options: SubscriptionOptions
  ): Promise<void> {
    const attempts = this.reconnectAttempts.get(subscriptionId) || 0;
    this.reconnectAttempts.set(subscriptionId, attempts + 1);

    // Unsubscribe old
    await this.unsubscribe(subscriptionId);

    // Subscribe new
    try {
      this.subscribe(options);
      this.reconnectAttempts.set(subscriptionId, 0); // Reset on success
    } catch (error) {
      logger.error('Reconnection failed', { subscriptionId, error });
    }
  }

  /**
   * Get subscription stats
   */
  public getStats() {
    const subscriptions = Array.from(this.subscriptions.values());

    return {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.isActive).length,
      inactive: subscriptions.filter((s) => !s.isActive).length,
      byTable: subscriptions.reduce((acc, sub) => {
        acc[sub.table] = (acc[sub.table] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

/**
 * Get RealtimeManager instance
 */
export function getRealtimeManager(): RealtimeManager {
  return RealtimeManager.getInstance();
}

/**
 * Subscribe to table changes
 */
export function subscribeToTable(options: SubscriptionOptions): string {
  const manager = getRealtimeManager();
  return manager.subscribe(options);
}

/**
 * Unsubscribe from table changes
 */
export function unsubscribeFromTable(subscriptionId: string): Promise<boolean> {
  const manager = getRealtimeManager();
  return manager.unsubscribe(subscriptionId);
}

/**
 * Subscribe to product changes
 */
export function subscribeToProducts(
  shopId: string,
  callback: (payload: any) => void
): string {
  return subscribeToTable({
    table: 'products',
    event: '*',
    filter: `shop_id=eq.${shopId}`,
    callback,
  });
}

/**
 * Subscribe to order changes
 */
export function subscribeToOrders(
  shopId: string,
  callback: (payload: any) => void
): string {
  return subscribeToTable({
    table: 'orders',
    event: '*',
    filter: `shop_id=eq.${shopId}`,
    callback,
  });
}

/**
 * Subscribe to inventory changes
 */
export function subscribeToInventory(
  productIds: string[],
  callback: (payload: any) => void
): string {
  return subscribeToTable({
    table: 'products',
    event: 'UPDATE',
    filter: `id=in.(${productIds.join(',')})`,
    callback,
  });
}
