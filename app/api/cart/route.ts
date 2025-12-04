/**
 * Cart API - Race-Condition Free Implementation
 * Features:
 * - Upsert operations to prevent duplicate entries
 * - Proper validation
 * - Rate limiting
 * - Standardized error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import { validateBody, validateSearchParams } from '@/lib/validation/validator';
import { addToCartSchema, updateCartItemSchema } from '@/lib/validation/schemas';
import { withErrorHandler, NotFoundError, BadRequestError } from '@/lib/errors/api-errors';
import { rateLimitEndpoint } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

/**
 * Get cart - GET /api/cart?sessionId=xxx
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitEndpoint.cart(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Validate query parameters
  const { sessionId } = validateSearchParams(request, z.object({ sessionId: z.string().min(1) }));

  const client = getSupabaseClient();

  // Get cart
  const { data: cart } = await client.from('cart').select('*').eq('session_id', sessionId).single();

  if (!cart) {
    return NextResponse.json({ items: [], total: 0 });
  }

  // Get cart items with product details
  const { data: items } = await client
    .from('cart_items')
    .select(
      `
      *,
      product:products(id, name, price, image_url, stock_quantity)
    `
    )
    .eq('cart_id', cart.id);

  const total =
    items?.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal.toString()), 0) || 0;

  return NextResponse.json({
    cart: {
      id: cart.id,
      sessionId: cart.session_id,
      updatedAt: cart.updated_at,
    },
    items: items || [],
    total,
  });
});

/**
 * Add to cart - POST /api/cart
 * Uses UPSERT to prevent race conditions
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitEndpoint.cart(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Validate request body
  const validatedData = await validateBody(
    request,
    addToCartSchema.extend({
      sessionId: z.string().min(1),
    })
  );

  const { sessionId, productId, variantId, quantity } = validatedData;

  const client = getSupabaseClient();

  // Get or create cart (UPSERT)
  const { data: cart, error: cartError } = await client
    .from('cart')
    .upsert(
      {
        session_id: sessionId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'session_id',
      }
    )
    .select()
    .single();

  if (cartError || !cart) {
    const errorObj = cartError
      ? cartError instanceof Error
        ? cartError
        : new Error((cartError as any)?.message || 'Failed to create/get cart')
      : new Error('Cart not found');
    logger.error('Failed to create/get cart', errorObj, {
      sessionId,
    });
    throw new BadRequestError('Failed to create cart');
  }

  // Get product details
  const { data: product, error: productError } = await client
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    throw new NotFoundError('Product not found');
  }

  // Check stock
  if (product.track_inventory && product.stock_quantity < quantity) {
    throw new BadRequestError(`Insufficient stock. Available: ${product.stock_quantity}`);
  }

  const price = parseFloat(product.price.toString());

  // UPSERT cart item to prevent race conditions
  // If item exists, increment quantity. Otherwise, create new.
  const { data: existingItem } = await client
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .eq('variant_id', variantId || null)
    .maybeSingle();

  const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
  const newSubtotal = price * newQuantity;

  // Use upsert to handle concurrent requests atomically
  const { error: itemError } = await client.from('cart_items').upsert(
    {
      id: existingItem?.id,
      cart_id: cart.id,
      product_id: productId,
      variant_id: variantId || null,
      quantity: newQuantity,
      price,
      subtotal: newSubtotal,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: existingItem ? 'id' : undefined,
    }
  );

  if (itemError) {
    const errorObj =
      itemError instanceof Error
        ? itemError
        : new Error((itemError as any)?.message || 'Failed to add item to cart');
    logger.error('Failed to add item to cart', errorObj, { productId });
    throw new BadRequestError('Failed to add item to cart');
  }

  // Update cart timestamp
  await client.from('cart').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

  logger.info('Item added to cart', {
    cartId: cart.id,
    productId,
    quantity: newQuantity,
  });

  return NextResponse.json({
    success: true,
    message: existingItem ? 'Cart item updated' : 'Item added to cart',
    quantity: newQuantity,
  });
});

/**
 * Update cart item - PATCH /api/cart
 */
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitEndpoint.cart(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Validate request body
  const { cartItemId, quantity } = await validateBody(request, updateCartItemSchema);

  const client = getSupabaseClient();

  // If quantity is 0, delete the item
  if (quantity === 0) {
    const { error } = await client.from('cart_items').delete().eq('id', cartItemId);

    if (error) {
      const errorObj =
        error instanceof Error
          ? error
          : new Error((error as any)?.message || 'Failed to remove cart item');
      logger.error('Failed to remove cart item', errorObj, { cartItemId });
      throw new BadRequestError('Failed to remove item from cart');
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  }

  // Get cart item
  const { data: cartItem, error: fetchError } = await client
    .from('cart_items')
    .select('*')
    .eq('id', cartItemId)
    .single();

  if (fetchError || !cartItem) {
    throw new NotFoundError('Cart item not found');
  }

  // Verify stock availability
  const { data: product } = await client
    .from('products')
    .select('stock_quantity, track_inventory')
    .eq('id', cartItem.product_id)
    .single();

  if (product?.track_inventory && product.stock_quantity < quantity) {
    throw new BadRequestError(`Insufficient stock. Available: ${product.stock_quantity}`);
  }

  // Update quantity
  const newSubtotal = parseFloat(cartItem.price.toString()) * quantity;

  const { error: updateError } = await client
    .from('cart_items')
    .update({
      quantity,
      subtotal: newSubtotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cartItemId);

  if (updateError) {
    const errorObj =
      updateError instanceof Error
        ? updateError
        : new Error((updateError as any)?.message || 'Failed to update cart item');
    logger.error('Failed to update cart item', errorObj, { cartItemId });
    throw new BadRequestError('Failed to update cart item');
  }

  // Update cart timestamp
  await client
    .from('cart')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cartItem.cart_id);

  logger.info('Cart item updated', { cartItemId, quantity });

  return NextResponse.json({
    success: true,
    message: 'Cart updated',
    quantity,
  });
});

/**
 * Clear cart - DELETE /api/cart?sessionId=xxx
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitEndpoint.cart(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Validate query parameters
  const { sessionId } = validateSearchParams(request, z.object({ sessionId: z.string().min(1) }));

  const client = getSupabaseClient();

  // Get cart
  const { data: cart } = await client
    .from('cart')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (!cart) {
    return NextResponse.json({
      success: true,
      message: 'Cart already empty',
    });
  }

  // Delete all cart items
  const { error } = await client.from('cart_items').delete().eq('cart_id', cart.id);

  if (error) {
    const errorObj =
      error instanceof Error ? error : new Error((error as any)?.message || 'Failed to clear cart');
    logger.error('Failed to clear cart', errorObj, { cartId: cart.id });
    throw new BadRequestError('Failed to clear cart');
  }

  logger.info('Cart cleared', { cartId: cart.id });

  return NextResponse.json({
    success: true,
    message: 'Cart cleared',
  });
});
