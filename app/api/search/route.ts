import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

/**
 * Global search endpoint for products, orders, and customers
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data } = await supabaseClient.auth.getUser();

    if (!data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'products', 'orders', 'customers', or 'all'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results: any = {
      products: [],
      orders: [],
      customers: [],
    };

    // Search products
    if (!type || type === 'products' || type === 'all') {
      const { data: products } = await supabaseClient
        .from('products')
        .select('id, name, sku, barcode, price, stock_quantity, image_url')
        .eq('shop_id', user.id)
        .or(
          `name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%,description.ilike.%${query}%`
        )
        .limit(limit);

      results.products = products || [];
    }

    // Search orders
    if (!type || type === 'orders' || type === 'all') {
      const { data: orders } = await supabaseClient
        .from('orders')
        .select('id, order_number, customer_email, total, status, created_at')
        .eq('shop_id', user.id)
        .or(
          `order_number.ilike.%${query}%,customer_email.ilike.%${query}%,customer_first_name.ilike.%${query}%,customer_last_name.ilike.%${query}%,customer_phone.ilike.%${query}%`
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      results.orders = orders || [];
    }

    // Search customers
    if (!type || type === 'customers' || type === 'all') {
      const { data: customers } = await supabaseClient
        .from('customers')
        .select('id, first_name, last_name, email, phone, total_orders, total_spent')
        .eq('shop_id', user.id)
        .or(
          `email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`
        )
        .limit(limit);

      results.customers = customers || [];
    }

    logger.info('Search completed', {
      query,
      type,
      resultsCount: {
        products: results.products.length,
        orders: results.orders.length,
        customers: results.customers.length,
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Search error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
