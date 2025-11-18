// Cart Service - Shopping cart management functions
import { insforgeClient, executeWithRetry } from '../insforge';
import { logger } from '../utils/logger';
import { cacheAside, invalidateCache, CACHE_TTL, REDIS_KEYS } from '../redis';
import type { Cart, CartItem, Product, ProductVariant } from '../types/database';

// ============================================================================
// Cart Operations
// ============================================================================

/**
 * Get or create cart for user/session
 */
export async function getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart> {
  try {
    let query = insforgeClient.database.from('cart').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      throw new Error('Either userId or sessionId is required');
    }

    const { data: existingCart } = await query.single();

    // Return existing cart if not expired
    if (existingCart && new Date(existingCart.expires_at) > new Date()) {
      return existingCart;
    }

    // Create new cart
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Cart expires in 7 days

    const { data: newCart, error } = await insforgeClient.database
      .from('cart')
      .insert([
        {
          user_id: userId,
          session_id: sessionId,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return newCart;
  } catch (error: any) {
    logger.error(
      'Error getting or creating cart',
      error instanceof Error ? error : new Error(String(error)),
      {
        userId,
        sessionId,
      }
    );
    throw error;
  }
}

/**
 * Get cart with items and product details
 * Cached for 24 hours (carts don't change frequently for inactive users)
 */
export async function getCartWithItems(cartId: string): Promise<
  Cart & {
    items: (CartItem & {
      product: Product;
      variant?: ProductVariant;
    })[];
    subtotal: number;
    itemCount: number;
  }
> {
  try {
    const cacheKey = REDIS_KEYS.CART(cartId);

    return await cacheAside(
      cacheKey,
      async () => {
        // Get cart with retry logic
        const { data: cart, error: cartError } = await executeWithRetry(async () => {
          const result = await insforgeClient.database
            .from('cart')
            .select('*')
            .eq('id', cartId)
            .single();
          return result;
        });

        if (cartError || !cart) throw cartError || new Error('Cart not found');

        // Get cart items with product and variant details using joins (fixes N+1 query)
        const { data: items, error: itemsError } = await executeWithRetry(async () => {
          const result = await insforgeClient.database
            .from('cart_items')
            .select(
              `
              *,
              product:products(*),
              variant:product_variants(*)
            `
            )
            .eq('cart_id', cartId);
          return result;
        });

        if (itemsError) throw itemsError;

        // Transform items to match expected structure
        const itemsWithDetails = (items || []).map((item: any) => {
          const product = item.product;
          const variant = item.variant || undefined;

          if (!product) {
            throw new Error(`Product ${item.product_id} not found or has been deleted`);
          }

          return {
            ...item,
            product,
            variant,
          };
        });

        const subtotal = itemsWithDetails.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const itemCount = itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);

        return {
          ...cart,
          items: itemsWithDetails,
          subtotal,
          itemCount,
        };
      },
      CACHE_TTL.CART
    );
  } catch (error: any) {
    logger.error(
      'Error getting cart with items',
      error instanceof Error ? error : new Error(String(error)),
      {
        cartId,
      }
    );
    throw error;
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  cartId: string,
  productId: string,
  quantity: number = 1,
  variantId?: string
): Promise<CartItem> {
  try {
    // Get product/variant details including price and inventory
    let price: number;
    let availableQuantity: number;
    let trackInventory: boolean;

    if (variantId) {
      const { data: variant, error: variantError } = await insforgeClient.database
        .from('product_variants')
        .select('price, inventory_quantity, product_id')
        .eq('id', variantId)
        .single();

      if (variantError || !variant) {
        throw new Error(`Product variant ${variantId} not found`);
      }

      // Get product to check if inventory tracking is enabled
      const { data: product } = await insforgeClient.database
        .from('products')
        .select('track_inventory')
        .eq('id', variant.product_id)
        .single();

      price = variant.price;
      availableQuantity = variant.inventory_quantity;
      trackInventory = product?.track_inventory || false;
    } else {
      const { data: product, error: productError } = await insforgeClient.database
        .from('products')
        .select('base_price, inventory_quantity, track_inventory')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error(`Product ${productId} not found`);
      }
      price = product.base_price;
      availableQuantity = product.inventory_quantity;
      trackInventory = product.track_inventory;
    }

    // Validate inventory if tracking is enabled
    if (trackInventory && availableQuantity < quantity) {
      throw new Error(`Only ${availableQuantity} items available in stock`);
    }

    // Check if item already exists in cart
    let query = insforgeClient.database
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId);

    if (variantId) {
      query = query.eq('variant_id', variantId);
    } else {
      query = query.is('variant_id', null);
    }

    const { data: existingItem } = await query.single();

    let result: CartItem;

    if (existingItem) {
      // Update quantity if item exists
      const { data, error } = await insforgeClient.database
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Add new item
      const { data, error } = await insforgeClient.database
        .from('cart_items')
        .insert([
          {
            cart_id: cartId,
            product_id: productId,
            variant_id: variantId,
            quantity,
            price,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Invalidate cart cache
    await invalidateCache.cart(cartId);

    return result;
  } catch (error: any) {
    logger.error(
      'Error adding to cart',
      error instanceof Error ? error : new Error(String(error)),
      {
        cartId,
        productId,
        variantId,
      }
    );
    throw error;
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
  try {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      return await removeFromCart(itemId);
    }

    const { data, error } = await insforgeClient.database
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate cart cache
    await invalidateCache.cart(data.cart_id);

    return data;
  } catch (error: any) {
    logger.error(
      'Error updating cart item quantity',
      error instanceof Error ? error : new Error(String(error)),
      {
        itemId,
        quantity,
      }
    );
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<CartItem> {
  try {
    // Get cart_id before deleting
    const { data: item } = await insforgeClient.database
      .from('cart_items')
      .select('cart_id')
      .eq('id', itemId)
      .single();

    const { data, error } = await insforgeClient.database
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate cart cache
    if (item?.cart_id) {
      await invalidateCache.cart(item.cart_id);
    }

    return data;
  } catch (error: any) {
    logger.error(
      'Error removing from cart',
      error instanceof Error ? error : new Error(String(error)),
      {
        itemId,
      }
    );
    throw error;
  }
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<void> {
  try {
    const { error } = await insforgeClient.database
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw error;
  } catch (error: any) {
    logger.error('Error clearing cart', error instanceof Error ? error : new Error(String(error)), {
      cartId,
    });
    throw error;
  }
}

/**
 * Merge guest cart with user cart after login
 */
export async function mergeGuestCart(guestSessionId: string, userId: string): Promise<Cart> {
  try {
    // Get or create user cart
    const userCart = await getOrCreateCart(userId);

    // Get guest cart
    const { data: guestCart } = await insforgeClient.database
      .from('cart')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();

    if (!guestCart) {
      return userCart;
    }

    // Get guest cart items
    const { data: guestItems } = await insforgeClient.database
      .from('cart_items')
      .select('*')
      .eq('cart_id', guestCart.id);

    // Add guest items to user cart
    if (guestItems) {
      for (const item of guestItems) {
        await addToCart(userCart.id, item.product_id, item.quantity, item.variant_id);
      }
    }

    // Delete guest cart
    await insforgeClient.database.from('cart').delete().eq('id', guestCart.id);

    return userCart;
  } catch (error: any) {
    logger.error(
      'Error merging guest cart',
      error instanceof Error ? error : new Error(String(error)),
      {
        userId,
        guestSessionId,
      }
    );
    throw error;
  }
}

/**
 * Validate cart items (check availability and prices)
 */
export async function validateCart(cartId: string): Promise<{
  isValid: boolean;
  issues: Array<{
    itemId: string;
    productName: string;
    issue: string;
  }>;
}> {
  try {
    const cart = await getCartWithItems(cartId);
    const issues: Array<{ itemId: string; productName: string; issue: string }> = [];

    for (const item of cart.items) {
      // Check if product is active
      if (!item.product.is_active) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: 'Product is no longer available',
        });
        continue;
      }

      // Check inventory
      const availableQuantity = item.variant
        ? item.variant.inventory_quantity
        : item.product.inventory_quantity;

      if (item.product.track_inventory && availableQuantity < item.quantity) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: `Only ${availableQuantity} items available`,
        });
      }

      // Check if price has changed
      const currentPrice = item.variant ? item.variant.price : item.product.base_price;

      if (currentPrice !== item.price) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: `Price has changed from $${item.price} to $${currentPrice}`,
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  } catch (error: any) {
    logger.error(
      'Error validating cart',
      error instanceof Error ? error : new Error(String(error)),
      {
        cartId,
      }
    );
    throw error;
  }
}

/**
 * Calculate cart totals with tax and shipping
 */
export async function calculateCartTotals(
  cartId: string,
  shippingMethodId?: string,
  discountCode?: string
): Promise<{
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
}> {
  try {
    const cart = await getCartWithItems(cartId);
    const subtotal = cart.subtotal;
    let discountAmount = 0;
    let shippingCost = 0;
    let taxAmount = 0;

    // Calculate discount
    if (discountCode) {
      const { data: discount } = await insforgeClient.database
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode)
        .eq('is_active', true)
        .single();

      if (discount) {
        // Check validity
        const now = new Date();
        const isValid =
          (!discount.starts_at || new Date(discount.starts_at) <= now) &&
          (!discount.expires_at || new Date(discount.expires_at) >= now) &&
          (!discount.usage_limit || discount.usage_count < discount.usage_limit) &&
          (!discount.minimum_purchase || subtotal >= discount.minimum_purchase);

        if (isValid) {
          if (discount.discount_type === 'percentage') {
            discountAmount = subtotal * (discount.discount_value / 100);
          } else if (discount.discount_type === 'fixed_amount') {
            discountAmount = discount.discount_value;
          }

          // Apply maximum discount cap
          if (discount.maximum_discount && discountAmount > discount.maximum_discount) {
            discountAmount = discount.maximum_discount;
          }
        }
      }
    }

    // Calculate shipping
    if (shippingMethodId) {
      const { data: shippingMethod } = await insforgeClient.database
        .from('shipping_methods')
        .select('*')
        .eq('id', shippingMethodId)
        .single();

      if (shippingMethod) {
        shippingCost = shippingMethod.base_cost;

        // Check free shipping threshold
        if (
          shippingMethod.free_shipping_threshold &&
          subtotal >= shippingMethod.free_shipping_threshold
        ) {
          shippingCost = 0;
        } else if (shippingMethod.cost_per_kg) {
          // Calculate weight-based shipping
          const totalWeight = cart.items.reduce((sum, item) => {
            const weight = item.variant?.weight || item.product.weight || 0;
            return sum + weight * item.quantity;
          }, 0);
          shippingCost += totalWeight * shippingMethod.cost_per_kg;
        }
      }
    }

    // Calculate tax (simplified - in real app, use actual tax rules)
    // For now, assume 10% tax rate
    const taxableAmount = subtotal - discountAmount + shippingCost;
    taxAmount = taxableAmount * 0.1;

    const total = subtotal - discountAmount + shippingCost + taxAmount;

    return {
      subtotal,
      discountAmount,
      shippingCost,
      taxAmount,
      total,
    };
  } catch (error: any) {
    logger.error(
      'Error calculating cart totals',
      error instanceof Error ? error : new Error(String(error)),
      {
        cartId,
      }
    );
    throw error;
  }
}
