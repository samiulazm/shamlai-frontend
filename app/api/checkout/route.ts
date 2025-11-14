import { NextRequest, NextResponse } from 'next/server';
import { insforgeClient } from '@/lib/insforge';
import { processNewOrder } from '@/lib/services/order-workflows';
import { getOrCreateCustomer } from '@/lib/services/orders';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      shippingAddress,
      billingAddress,
      items,
      shippingMethodId,
      discountCode,
      notes,
      paymentMethod = 'cod',
    } = body;

    // Validate required fields
    if (!shopId || !customerEmail || !customerFirstName || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create customer
    const customer = await getOrCreateCustomer(
      shopId,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone
    );

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Get product details
      const { data: product } = await insforgeClient.database
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single();

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      // Check stock
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const price = item.variantId
        ? await getVariantPrice(item.productId, item.variantId)
        : parseFloat(product.price.toString());

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name: product.name,
        variant_name: item.variantName,
        sku: product.sku,
        quantity: item.quantity,
        price,
        discount_amount: 0,
        total: itemTotal,
        image_url: product.image_url,
      });
    }

    // Get shipping cost
    let shippingCost = 0;
    if (shippingMethodId) {
      const { data: shippingMethod } = await insforgeClient.database
        .from('shipping_methods')
        .select('cost')
        .eq('id', shippingMethodId)
        .single();

      shippingCost = shippingMethod ? parseFloat(shippingMethod.cost.toString()) : 0;
    }

    // Apply discount
    let discountAmount = 0;
    if (discountCode) {
      const { data: discount } = await insforgeClient.database
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .single();

      if (discount) {
        const now = new Date();
        const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
        const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

        if (
          (!validFrom || now >= validFrom) &&
          (!validUntil || now <= validUntil) &&
          (discount.usage_limit === null || discount.usage_count < discount.usage_limit) &&
          subtotal >= (discount.minimum_purchase || 0)
        ) {
          if (discount.discount_type === 'percentage') {
            discountAmount = (subtotal * parseFloat(discount.discount_value.toString())) / 100;
            if (discount.maximum_discount) {
              discountAmount = Math.min(discountAmount, parseFloat(discount.maximum_discount.toString()));
            }
          } else if (discount.discount_type === 'fixed_amount') {
            discountAmount = parseFloat(discount.discount_value.toString());
          } else if (discount.discount_type === 'free_shipping') {
            shippingCost = 0;
          }

          // Update discount usage
          await insforgeClient.database
            .from('discount_codes')
            .update({ usage_count: discount.usage_count + 1 })
            .eq('id', discount.id);
        }
      }
    }

    // Calculate tax (assuming 10% for simplicity - should be based on region)
    const taxRate = 0.1;
    const taxAmount = (subtotal - discountAmount) * taxRate;

    const total = subtotal - discountAmount + shippingCost + taxAmount;

    // Create order
    const orderData = {
      shop_id: shopId,
      customer_id: customer.id,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_first_name: customerFirstName,
      shipping_last_name: customerLastName,
      shipping_phone: customerPhone,
      shipping_address1: shippingAddress?.street || '',
      shipping_city: shippingAddress?.city || '',
      shipping_state: shippingAddress?.state || '',
      shipping_postal_code: shippingAddress?.zip || '',
      shipping_country: shippingAddress?.country || 'US',
      billing_first_name: customerFirstName,
      billing_last_name: customerLastName,
      billing_address1: billingAddress?.street || shippingAddress?.street || '',
      billing_city: billingAddress?.city || shippingAddress?.city || '',
      billing_state: billingAddress?.state || shippingAddress?.state || '',
      billing_postal_code: billingAddress?.zip || shippingAddress?.zip || '',
      billing_country: billingAddress?.country || shippingAddress?.country || 'US',
      subtotal,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
      status: 'pending' as const,
      payment_status: paymentMethod === 'cod' ? ('pending' as const) : ('paid' as const),
      fulfillment_status: 'unfulfilled' as const,
      notes,
    };

    const { order, success } = await processNewOrder(orderData, orderItems, {
      sendEmail: true,
      sendSMS: true,
      paymentMethod,
    });

    if (!success || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    logger.info('Checkout completed', { orderId: order.id, orderNumber: order.order_number });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: order.total,
        status: order.status,
      },
    });
  } catch (error) {
    logger.error('Checkout API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get variant price
 */
async function getVariantPrice(productId: string, variantId: string): Promise<number> {
  const { data: variant } = await insforgeClient.database
    .from('product_variants')
    .select('price')
    .eq('product_id', productId)
    .eq('id', variantId)
    .single();

  return variant ? parseFloat(variant.price.toString()) : 0;
}
