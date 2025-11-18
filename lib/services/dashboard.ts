// Dashboard Service - Enhanced analytics and statistics
import { insforgeClient } from '../insforge';
import { logger } from '../utils/logger';
import type { Order, OrderItem, Product } from '../types/database';

export interface DashboardStats {
  todayOrders: number;
  todayOrdersChange: number; // % change vs yesterday
  totalRevenue: number;
  revenueChange: number; // % change vs previous period
  profit: number;
  profitChange: number; // % change vs previous period
  totalOrders: number;
  pendingOrders: number;
  pendingWebOrders: number;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number; // percentage change
}

/**
 * Calculate percentage change between two values
 */
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get dashboard statistics with period comparison
 */
export async function getDashboardStats(
  shopId: string,
  dateRange?: { start: Date; end: Date }
): Promise<DashboardStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = dateRange?.start || today;
    const endDate = dateRange?.end || new Date();
    endDate.setHours(23, 59, 59, 999);

    // Previous period (same length as current period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = new Date(startDate);
    previousEnd.setHours(23, 59, 59, 999);

    // Optimize: Use database filters instead of fetching all orders
    // Fetch only orders we need for calculations (today, yesterday, current period, previous period)
    const earliestDate = new Date(Math.min(previousStart.getTime(), yesterday.getTime()));

    const { data: filteredOrders, error: ordersError } = await insforgeClient.database
      .from('orders')
      .select('*, order_items(*)')
      .eq('shop_id', shopId)
      .gte('created_at', earliestDate.toISOString());

    if (ordersError) throw ordersError;

    // Filter orders by specific date ranges
    const todayOrders =
      filteredOrders?.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      }) || [];

    const yesterdayOrders =
      filteredOrders?.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= yesterday && orderDate < today;
      }) || [];

    const currentPeriodOrders =
      filteredOrders?.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      }) || [];

    const previousPeriodOrders =
      filteredOrders?.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= previousStart && orderDate < previousEnd;
      }) || [];

    // Calculate today's orders
    const todayOrdersCount = todayOrders.length;
    const yesterdayOrdersCount = yesterdayOrders.length;
    const todayOrdersChange = calculateChange(todayOrdersCount, yesterdayOrdersCount);

    // Calculate revenue
    const currentRevenue = currentPeriodOrders.reduce(
      (sum, order) => sum + parseFloat(order.total?.toString() || '0'),
      0
    );
    const previousRevenue = previousPeriodOrders.reduce(
      (sum, order) => sum + parseFloat(order.total?.toString() || '0'),
      0
    );
    const revenueChange = calculateChange(currentRevenue, previousRevenue);

    // Calculate profit (revenue - cost)
    const currentProfit = await calculateProfit(currentPeriodOrders);
    const previousProfit = await calculateProfit(previousPeriodOrders);
    const profitChange = calculateChange(currentProfit, previousProfit);

    // Optimize: Fetch total and pending orders counts with specific queries
    const [totalResult, pendingResult, pendingWebResult] = await Promise.all([
      insforgeClient.database
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId),
      insforgeClient.database
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('status', 'pending'),
      insforgeClient.database
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('status', 'pending')
        .eq('source', 'web'),
    ]);

    const totalOrders = totalResult.count || 0;
    const pendingOrders = pendingResult.count || 0;
    const pendingWebOrders = pendingWebResult.count || 0;

    return {
      todayOrders: todayOrdersCount,
      todayOrdersChange,
      totalRevenue: currentRevenue,
      revenueChange,
      profit: currentProfit,
      profitChange,
      totalOrders,
      pendingOrders,
      pendingWebOrders,
    };
  } catch (error: any) {
    logger.error(
      'Error fetching dashboard stats',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
        dateRange,
      }
    );
    throw error;
  }
}

/**
 * Calculate profit from orders (revenue - cost)
 * Optimized to batch fetch costs
 */
async function calculateProfit(orders: Order[]): Promise<number> {
  try {
    if (orders.length === 0) return 0;

    let totalRevenue = 0;
    let totalCost = 0;

    // Collect all order IDs
    const orderIds = orders.map((order) => order.id);

    // Fetch all order items at once
    const { data: allItems } = await insforgeClient.database
      .from('order_items')
      .select('order_id, product_id, variant_id, quantity')
      .in('order_id', orderIds);

    if (!allItems || allItems.length === 0) {
      // If no items, just return revenue
      return orders.reduce((sum, order) => sum + parseFloat(order.total?.toString() || '0'), 0);
    }

    // Collect unique product and variant IDs
    const productIds = new Set<string>();
    const variantIds = new Set<string>();

    allItems.forEach((item) => {
      if (item.product_id) productIds.add(item.product_id);
      if (item.variant_id) variantIds.add(item.variant_id);
    });

    // Batch fetch product costs
    const productCosts = new Map<string, number>();
    if (productIds.size > 0) {
      const { data: products } = await insforgeClient.database
        .from('products')
        .select('id, cost_per_item')
        .in('id', Array.from(productIds));

      products?.forEach((product) => {
        if (product.cost_per_item) {
          productCosts.set(product.id, product.cost_per_item);
        }
      });
    }

    // Batch fetch variant costs
    const variantCosts = new Map<string, number>();
    if (variantIds.size > 0) {
      const { data: variants } = await insforgeClient.database
        .from('product_variants')
        .select('id, cost_per_item')
        .in('id', Array.from(variantIds));

      variants?.forEach((variant) => {
        if (variant.cost_per_item) {
          variantCosts.set(variant.id, variant.cost_per_item);
        }
      });
    }

    // Calculate revenue and cost
    orders.forEach((order) => {
      totalRevenue += parseFloat(order.total?.toString() || '0');
    });

    allItems.forEach((item) => {
      const quantity = item.quantity || 0;
      let costPerItem = 0;

      if (item.variant_id && variantCosts.has(item.variant_id)) {
        costPerItem = variantCosts.get(item.variant_id) || 0;
      } else if (item.product_id && productCosts.has(item.product_id)) {
        costPerItem = productCosts.get(item.product_id) || 0;
      }

      totalCost += costPerItem * quantity;
    });

    return totalRevenue - totalCost;
  } catch (error: any) {
    logger.error(
      'Error calculating profit',
      error instanceof Error ? error : new Error(String(error))
    );
    // Return revenue if cost calculation fails
    return orders.reduce((sum, order) => sum + parseFloat(order.total?.toString() || '0'), 0);
  }
}

/**
 * Get web order report data
 */
export interface WebOrderReport {
  total: number;
  processing: number;
  complete: number;
  cancelled: number;
  incomplete: number;
}

export async function getWebOrderReport(
  shopId: string,
  dateRange: 'today' | 'yesterday' | '30d' = 'today'
): Promise<WebOrderReport> {
  try {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    const { data: orders } = await insforgeClient.database
      .from('orders')
      .select('status')
      .eq('shop_id', shopId)
      .eq('source', 'web')
      .gte('created_at', startDate.toISOString());

    const report: WebOrderReport = {
      total: orders?.length || 0,
      processing: orders?.filter((o) => o.status === 'processing').length || 0,
      complete: orders?.filter((o) => o.status === 'delivered').length || 0,
      cancelled: orders?.filter((o) => o.status === 'cancelled').length || 0,
      incomplete: orders?.filter((o) => ['pending', 'processing'].includes(o.status)).length || 0,
    };

    return report;
  } catch (error: any) {
    logger.error(
      'Error fetching web order report',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      total: 0,
      processing: 0,
      complete: 0,
      cancelled: 0,
      incomplete: 0,
    };
  }
}

/**
 * Get orders by source
 */
export interface OrdersBySource {
  source: string;
  count: number;
  revenue: number;
}

export async function getOrdersBySource(
  shopId: string,
  dateRange: 'today' | 'yesterday' | '30d' = 'today'
): Promise<OrdersBySource[]> {
  try {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    const { data: orders } = await insforgeClient.database
      .from('orders')
      .select('source, total')
      .eq('shop_id', shopId)
      .gte('created_at', startDate.toISOString());

    const sourceMap = new Map<string, { count: number; revenue: number }>();

    orders?.forEach((order) => {
      const source = (order as any).source || 'manual';
      const current = sourceMap.get(source) || { count: 0, revenue: 0 };
      sourceMap.set(source, {
        count: current.count + 1,
        revenue: current.revenue + parseFloat(order.total?.toString() || '0'),
      });
    });

    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      ...data,
    }));
  } catch (error: any) {
    logger.error(
      'Error fetching orders by source',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}
