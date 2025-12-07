import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import { cacheGetOrSet, cacheDelete, REDIS_KEYS, CACHE_TTL } from '@/lib/cache/redis';

/**
 * Get single product
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const product = await cacheGetOrSet(
      REDIS_KEYS.PRODUCT(id),
      async () => {
        const { data, error } = await supabaseClient
          .from('products')
          .select(
            `
            *,
            category:categories(id, name),
            images:product_images(*),
            variants:product_variants(*)
          `
          )
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      },
      { ttl: CACHE_TTL.PRODUCT }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    logger.error('Get product error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to get product' }, { status: 500 });
  }
}

/**
 * Update product
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Get current user
    const { data } = await supabaseClient.auth.getUser();

    if (!data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;

    // Fetch shop_id for the current user
    const { data: shop, error: shopError } = await supabaseClient
      .from('shop_settings')
      .select('shop_id')
      .eq('user_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: product } = await supabaseClient
      .from('products')
      .select('shop_id')
      .eq('id', id)
      .single();

    if (!product || product.shop_id !== shop.shop_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProduct, error } = await supabaseClient
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate product cache
    await cacheDelete(REDIS_KEYS.PRODUCT(id));

    logger.info('Product updated', { productId: id });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    logger.error('Update product error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

/**
 * Delete product
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Get current user
    const { data } = await supabaseClient.auth.getUser();

    if (!data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;

    // Fetch shop_id for the current user
    const { data: shop, error: shopError } = await supabaseClient
      .from('shop_settings')
      .select('shop_id')
      .eq('user_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: product } = await supabaseClient
      .from('products')
      .select('shop_id')
      .eq('id', id)
      .single();

    if (!product || product.shop_id !== shop.shop_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete (mark as inactive)
    const { error } = await supabaseClient
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // Invalidate product cache
    await cacheDelete(REDIS_KEYS.PRODUCT(id));

    logger.info('Product deleted', { productId: id });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    logger.error('Delete product error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
