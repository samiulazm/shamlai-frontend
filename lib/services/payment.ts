import Stripe from 'stripe';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export interface CreateCheckoutSessionParams {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface ProcessPaymentParams {
  orderId: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
  customerEmail: string;
}

/**
 * Create a Stripe checkout session for an order
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: `Order #${params.orderId}`,
            },
            unit_amount: Math.round(params.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
      payment_intent_data: {
        metadata: {
          orderId: params.orderId,
        },
      },
    });

    return { session, error: null };
  } catch (error) {
    logger.error('Failed to create checkout session', error instanceof Error ? error : new Error(String(error)));
    return { session: null, error };
  }
}

/**
 * Process a direct payment with Stripe
 */
export async function processPayment(params: ProcessPaymentParams) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      payment_method: params.paymentMethodId,
      confirm: true,
      receipt_email: params.customerEmail,
      metadata: {
        orderId: params.orderId,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${params.orderId}`,
    });

    // Update payment record in database
    await insforgeClient.database
      .from('payments')
      .update({
        payment_status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        transaction_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', params.orderId);

    return { paymentIntent, error: null };
  } catch (error) {
    logger.error('Payment processing failed', error instanceof Error ? error : new Error(String(error)));
    return { paymentIntent: null, error };
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    return { success: true };
  } catch (error) {
    logger.error('Webhook handler error', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    logger.warn('Checkout session missing orderId', { sessionId: session.id });
    return;
  }

  // Update payment status
  await insforgeClient.database
    .from('payments')
    .update({
      payment_status: 'paid',
      transaction_id: session.payment_intent as string,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  // Update order status
  await insforgeClient.database
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // Add to order history
  await insforgeClient.database
    .from('order_status_history')
    .insert({
      order_id: orderId,
      status: 'processing',
      notes: 'Payment received via Stripe',
    });

  logger.info('Checkout session completed', { orderId, sessionId: session.id });
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    logger.warn('Payment intent missing orderId', { paymentIntentId: paymentIntent.id });
    return;
  }

  // Update payment status
  await insforgeClient.database
    .from('payments')
    .update({
      payment_status: 'paid',
      transaction_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  // Update order status
  await insforgeClient.database
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  logger.info('Payment intent succeeded', { orderId, paymentIntentId: paymentIntent.id });
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    logger.warn('Payment intent missing orderId', { paymentIntentId: paymentIntent.id });
    return;
  }

  // Update payment status
  await insforgeClient.database
    .from('payments')
    .update({
      payment_status: 'failed',
      transaction_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  // Add to order history
  await insforgeClient.database
    .from('order_status_history')
    .insert({
      order_id: orderId,
      status: 'pending',
      notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
    });

  logger.warn('Payment intent failed', { orderId, paymentIntentId: paymentIntent.id });
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    logger.warn('Charge missing payment_intent', { chargeId: charge.id });
    return;
  }

  // Find the payment record
  const { data: payment } = await insforgeClient.database
    .from('payments')
    .select('order_id')
    .eq('transaction_id', paymentIntentId)
    .single();

  if (!payment) {
    logger.warn('Payment not found for refunded charge', { chargeId: charge.id });
    return;
  }

  // Update payment status
  await insforgeClient.database
    .from('payments')
    .update({
      payment_status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', payment.order_id);

  // Update order status
  await insforgeClient.database
    .from('orders')
    .update({
      payment_status: 'refunded',
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.order_id);

  // Add to order history
  await insforgeClient.database
    .from('order_status_history')
    .insert({
      order_id: payment.order_id,
      status: 'refunded',
      notes: `Refund processed: $${(charge.amount_refunded / 100).toFixed(2)}`,
    });

  logger.info('Charge refunded', { orderId: payment.order_id, chargeId: charge.id });
}

/**
 * Create a refund for an order
 */
export async function createRefund(orderId: string, amount?: number) {
  try {
    // Get payment record
    const { data: payment, error: paymentError } = await insforgeClient.database
      .from('payments')
      .select('transaction_id, amount')
      .eq('order_id', orderId)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.transaction_id,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
    });

    logger.info('Refund created', { orderId, refundId: refund.id });

    return { refund, error: null };
  } catch (error) {
    logger.error('Refund creation failed', error instanceof Error ? error : new Error(String(error)));
    return { refund: null, error };
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return { event, error: null };
  } catch (error) {
    logger.error('Webhook signature verification failed', error instanceof Error ? error : new Error(String(error)));
    return { event: null, error };
  }
}
