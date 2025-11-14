import { NextRequest, NextResponse } from 'next/server';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

/**
 * Get single product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: product, error } = await insforgeClient.database
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

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
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get current user
    const { data: { user } } = await insforgeClient.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: product } = await insforgeClient.database
      .from('products')
      .select('shop_id')
      .eq('id', id)
      .single();

    if (!product || product.shop_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProduct, error } = await insforgeClient.database
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get current user
    const { data: { user } } = await insforgeClient.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: product } = await insforgeClient.database
      .from('products')
      .select('shop_id')
      .eq('id', id)
      .single();

    if (!product || product.shop_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete (mark as inactive)
    const { error } = await insforgeClient.database
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    logger.info('Product deleted', { productId: id });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    logger.error('Delete product error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
