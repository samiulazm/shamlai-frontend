import { NextRequest, NextResponse } from 'next/server';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

/**
 * Get cart
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get cart
    const { data: cart } = await insforgeClient.database
      .from('cart')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!cart) {
      return NextResponse.json({ items: [], total: 0 });
    }

    // Get cart items with product details
    const { data: items } = await insforgeClient.database
      .from('cart_items')
      .select(`
        *,
        product:products(id, name, price, image_url, stock_quantity)
      `)
      .eq('cart_id', cart.id);

    const total = items?.reduce((sum, item) => sum + parseFloat(item.subtotal.toString()), 0) || 0;

    return NextResponse.json({ items: items || [], total });
  } catch (error) {
    logger.error('Get cart error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 });
  }
}

/**
 * Add to cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, productId, variantId, quantity = 1 } = body;

    if (!sessionId || !productId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create cart
    let { data: cart } = await insforgeClient.database
      .from('cart')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!cart) {
      const { data: newCart, error: cartError } = await insforgeClient.database
        .from('cart')
        .insert({ session_id: sessionId })
        .select()
        .single();

      if (cartError) throw cartError;
      cart = newCart;
    }

    // Get product details
    const { data: product } = await insforgeClient.database
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check stock
    if (product.stock_quantity < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    const price = parseFloat(product.price.toString());
    const subtotal = price * quantity;

    // Check if item already exists in cart
    const { data: existingItem } = await insforgeClient.database
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId || null)
      .single();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      const newSubtotal = price * newQuantity;

      const { error } = await insforgeClient.database
        .from('cart_items')
        .update({ quantity: newQuantity, subtotal: newSubtotal })
        .eq('id', existingItem.id);

      if (error) throw error;
    } else {
      // Add new item
      const { error } = await insforgeClient.database.from('cart_items').insert({
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId || null,
        quantity,
        price,
        subtotal,
      });

      if (error) throw error;
    }

    // Update cart updated_at
    await insforgeClient.database
      .from('cart')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cart.id);

    return NextResponse.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    logger.error('Add to cart error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

/**
 * Update cart item
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (quantity <= 0) {
      // Remove item
      const { error } = await insforgeClient.database
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Item removed from cart' });
    }

    // Get cart item
    const { data: cartItem } = await insforgeClient.database
      .from('cart_items')
      .select('*')
      .eq('id', cartItemId)
      .single();

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    // Update quantity
    const newSubtotal = parseFloat(cartItem.price.toString()) * quantity;

    const { error } = await insforgeClient.database
      .from('cart_items')
      .update({ quantity, subtotal: newSubtotal })
      .eq('id', cartItemId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    logger.error('Update cart error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

/**
 * Clear cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get cart
    const { data: cart } = await insforgeClient.database
      .from('cart')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!cart) {
      return NextResponse.json({ success: true, message: 'Cart already empty' });
    }

    // Delete all cart items
    const { error } = await insforgeClient.database
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    logger.error('Clear cart error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}
