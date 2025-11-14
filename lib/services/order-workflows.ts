import { insforgeClient } from '../insforge';
import { logger } from '../utils/logger';
import {
  createOrder as createOrderBase,
  updateOrderStatus as updateOrderStatusBase,
  cancelOrder as cancelOrderBase,
  getOrderById,
} from './orders';
import { sendOrderConfirmationEmail, sendShipmentNotificationEmail } from './email';
import {
  sendOrderConfirmationSMS,
  sendShipmentNotificationSMS,
  sendDeliveryNotificationSMS,
  sendOrderStatusUpdateSMS,
} from './sms';
import type { OrderInsert, OrderItem, OrderStatus } from '../types/database';

/**
 * Complete order creation workflow with payment, inventory, and notifications
 */
export async function processNewOrder(
  orderData: Omit<OrderInsert, 'order_number'>,
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[],
  options?: {
    sendEmail?: boolean;
    sendSMS?: boolean;
    paymentMethod?: 'stripe' | 'paypal' | 'cod';
    paymentIntentId?: string;
  }
) {
  try {
    // 1. Create order (this handles inventory deduction)
    const order = await createOrderBase(orderData, items);

    // 2. Create payment record
    const { error: paymentError } = await insforgeClient.database.from('payments').insert({
      order_id: order.id,
      amount: order.total,
      payment_method: options?.paymentMethod || 'cod',
      payment_status: options?.paymentMethod === 'cod' ? 'pending' : 'paid',
      transaction_id: options?.paymentIntentId,
    });

    if (paymentError) {
      logger.error('Failed to create payment record', paymentError);
    }

    // 3. Get shop settings for notifications
    const { data: shopSettings } = await insforgeClient.database
      .from('shop_settings')
      .select('shop_name, shop_email')
      .eq('shop_id', order.shop_id)
      .single();

    const shopName = shopSettings?.shop_name || 'Shop';
    const shopEmail = shopSettings?.shop_email || 'noreply@example.com';

    // 4. Get customer details
    const { data: customer } = await insforgeClient.database
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    // 5. Get order items with product details
    const { data: orderItems } = await insforgeClient.database
      .from('order_items')
      .select(`
        *,
        product:products(name)
      `)
      .eq('order_id', order.id);

    // 6. Send email confirmation
    if (options?.sendEmail !== false && customer) {
      const items =
        orderItems?.map((item: any) => ({
          name: item.product?.name || 'Product',
          quantity: item.quantity,
          price: parseFloat(item.price.toString()),
        })) || [];

      await sendOrderConfirmationEmail({
        to: customer.email,
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: `${customer.first_name} ${customer.last_name}`,
        items,
        subtotal: parseFloat(order.subtotal.toString()),
        shipping: parseFloat(order.shipping_cost.toString()),
        tax: parseFloat(order.tax_amount.toString()),
        total: parseFloat(order.total.toString()),
        shippingAddress: {
          name: `${customer.first_name} ${customer.last_name}`,
          street: order.shipping_address1 || '',
          city: order.shipping_city || '',
          state: order.shipping_state || '',
          zip: order.shipping_postal_code || '',
          country: order.shipping_country || '',
        },
        shopName,
        shopEmail,
      });
    }

    // 7. Send SMS confirmation
    if (options?.sendSMS !== false && customer?.phone) {
      await sendOrderConfirmationSMS(
        customer.phone,
        order.order_number,
        parseFloat(order.total.toString()),
        shopName
      );
    }

    logger.info('Order processed successfully', {
      orderId: order.id,
      orderNumber: order.order_number,
    });

    return { order, success: true };
  } catch (error) {
    logger.error('Order processing failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Update order status with automated workflows
 */
export async function updateOrderWithWorkflow(
  orderId: string,
  newStatus: OrderStatus,
  options?: {
    comment?: string;
    notifyCustomer?: boolean;
    userId?: string;
    trackingNumber?: string;
    courierName?: string;
  }
) {
  try {
    // 1. Update order status
    const order = await updateOrderStatusBase(
      orderId,
      newStatus,
      options?.comment,
      options?.notifyCustomer !== false,
      options?.userId
    );

    // 2. Get order details, customer, and shop info
    const [orderWithDetails, { data: shopSettings }] = await Promise.all([
      getOrderById(orderId),
      insforgeClient.database
        .from('shop_settings')
        .select('shop_name, shop_email')
        .eq('shop_id', order.shop_id)
        .single(),
    ]);

    const shopName = shopSettings?.shop_name || 'Shop';
    const shopEmail = shopSettings?.shop_email || 'noreply@example.com';
    const customer = orderWithDetails.customer;

    if (!customer) {
      logger.warn('Customer not found for order', { orderId });
      return { order, success: true };
    }

    // 3. Handle status-specific workflows
    switch (newStatus) {
      case 'shipped':
        // Update tracking info if provided
        if (options?.trackingNumber) {
          await insforgeClient.database
            .from('orders')
            .update({
              tracking_number: options.trackingNumber,
              courier_name: options.courierName,
            })
            .eq('id', orderId);
        }

        // Send shipment notifications
        if (options?.trackingNumber && options?.courierName) {
          const trackingUrl = getTrackingUrl(options.courierName, options.trackingNumber);

          // Email
          if (options?.notifyCustomer !== false) {
            await sendShipmentNotificationEmail({
              to: customer.email,
              orderId: order.id,
              orderNumber: order.order_number,
              customerName: `${customer.first_name} ${customer.last_name}`,
              trackingNumber: options.trackingNumber,
              trackingUrl,
              courier: options.courierName,
              shopName,
            });
          }

          // SMS
          if (customer.phone && options?.notifyCustomer !== false) {
            await sendShipmentNotificationSMS(
              customer.phone,
              order.order_number,
              options.trackingNumber,
              options.courierName,
              trackingUrl
            );
          }
        }
        break;

      case 'delivered':
        // Send delivery confirmation
        if (customer.phone && options?.notifyCustomer !== false) {
          await sendDeliveryNotificationSMS(customer.phone, order.order_number, shopName);
        }
        break;

      case 'cancelled':
        // Inventory is already restored by cancelOrder function
        if (customer.phone && options?.notifyCustomer !== false) {
          await sendOrderStatusUpdateSMS(customer.phone, order.order_number, 'cancelled', shopName);
        }
        break;

      case 'refunded':
        if (customer.phone && options?.notifyCustomer !== false) {
          await sendOrderStatusUpdateSMS(customer.phone, order.order_number, 'refunded', shopName);
        }
        break;
    }

    logger.info('Order status updated with workflow', {
      orderId,
      status: newStatus,
    });

    return { order, success: true };
  } catch (error) {
    logger.error('Order workflow update failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Cancel order with full workflow (inventory restoration, refund, notifications)
 */
export async function cancelOrderWithWorkflow(
  orderId: string,
  reason: string,
  options?: {
    userId?: string;
    processRefund?: boolean;
    notifyCustomer?: boolean;
  }
) {
  try {
    // 1. Get order details before cancellation
    const orderBefore = await getOrderById(orderId);

    // 2. Cancel order (this restores inventory)
    const order = await cancelOrderBase(orderId, reason, options?.userId);

    // 3. Process refund if requested and payment was made
    if (options?.processRefund && orderBefore.payment_status === 'paid') {
      const { data: payment } = await insforgeClient.database
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (payment && payment.payment_method === 'stripe' && payment.transaction_id) {
        // Import payment service dynamically to avoid circular dependencies
        const { createRefund } = await import('./payment');
        await createRefund(orderId);
      }
    }

    // 4. Send notifications
    if (options?.notifyCustomer !== false && orderBefore.customer) {
      const { data: shopSettings } = await insforgeClient.database
        .from('shop_settings')
        .select('shop_name')
        .eq('shop_id', order.shop_id)
        .single();

      const shopName = shopSettings?.shop_name || 'Shop';

      if (orderBefore.customer.phone) {
        await sendOrderStatusUpdateSMS(
          orderBefore.customer.phone,
          order.order_number,
          'cancelled',
          shopName
        );
      }
    }

    logger.info('Order cancelled with workflow', {
      orderId,
      reason,
      refundProcessed: options?.processRefund,
    });

    return { order, success: true };
  } catch (error) {
    logger.error('Order cancellation workflow failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Batch update orders (e.g., mark all pending as processing)
 */
export async function batchUpdateOrderStatus(
  orderIds: string[],
  newStatus: OrderStatus,
  options?: {
    comment?: string;
    userId?: string;
  }
) {
  const results = [];

  for (const orderId of orderIds) {
    try {
      const result = await updateOrderWithWorkflow(orderId, newStatus, {
        comment: options?.comment,
        userId: options?.userId,
        notifyCustomer: false, // Don't send individual notifications for batch operations
      });
      results.push({ orderId, success: true, order: result.order });
    } catch (error) {
      logger.error('Batch update failed for order', error instanceof Error ? error : new Error(String(error)), {
        orderId,
      });
      results.push({ orderId, success: false, error });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  logger.info('Batch order status update completed', {
    total: orderIds.length,
    successful: successCount,
    failed: orderIds.length - successCount,
  });

  return results;
}

/**
 * Auto-transition orders based on business rules
 */
export async function autoTransitionOrders(shopId: string) {
  try {
    // Example: Auto-mark paid orders as processing
    const { data: paidOrders } = await insforgeClient.database
      .from('orders')
      .select('id')
      .eq('shop_id', shopId)
      .eq('status', 'pending')
      .eq('payment_status', 'paid');

    if (paidOrders && paidOrders.length > 0) {
      const orderIds = paidOrders.map((o) => o.id);
      await batchUpdateOrderStatus(orderIds, 'processing', {
        comment: 'Auto-transitioned: Payment confirmed',
      });
    }

    // Example: Auto-mark old pending orders as cancelled
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: oldPendingOrders } = await insforgeClient.database
      .from('orders')
      .select('id')
      .eq('shop_id', shopId)
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .lt('created_at', threeDaysAgo.toISOString());

    if (oldPendingOrders && oldPendingOrders.length > 0) {
      for (const order of oldPendingOrders) {
        await cancelOrderWithWorkflow(order.id, 'Auto-cancelled: Payment not received within 3 days', {
          processRefund: false,
          notifyCustomer: true,
        });
      }
    }

    logger.info('Auto-transition completed', {
      shopId,
      paidToProcessing: paidOrders?.length || 0,
      pendingToCancelled: oldPendingOrders?.length || 0,
    });

    return { success: true };
  } catch (error) {
    logger.error('Auto-transition failed', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

/**
 * Helper: Get tracking URL based on courier
 */
function getTrackingUrl(courier: string, trackingNumber: string): string {
  const courierUrls: Record<string, string> = {
    redx: `https://redx.com.bd/track-parcel?trackingId=${trackingNumber}`,
    pathao: `https://merchant.pathao.com/tracking?trackingNumber=${trackingNumber}`,
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
  };

  return (
    courierUrls[courier.toLowerCase()] ||
    `${process.env.NEXT_PUBLIC_APP_URL}/track/${trackingNumber}`
  );
}
