import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

/**
 * Get products with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    const offset = (page - 1) * pageSize;

    let query = supabaseClient
      .from('products')
      .select('*', { count: 'exact' })
      .eq('shop_id', shopId)
      .eq('is_active', true);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    });
  } catch (error) {
    logger.error('Get products error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to get products' }, { status: 500 });
  }
}

/**
 * Create product
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const { data } = await supabaseClient.auth.getUser();

    if (!data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;

    const body = await request.json();
    const {
      name,
      description,
      price,
      categoryId,
      stockQuantity,
      sku,
      barcode,
      imageUrl,
      isActive = true,
    } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const { data: product, error } = await supabaseClient
      .from('products')
      .insert({
        shop_id: user.id,
        name,
        description,
        price,
        category_id: categoryId,
        stock_quantity: stockQuantity || 0,
        sku,
        barcode,
        image_url: imageUrl,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Product created', { productId: product.id });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    logger.error('Create product error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
