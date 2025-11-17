#!/usr/bin/env tsx

/**
 * Order Archival Script
 *
 * Archives orders older than 2 years to the archived_orders table
 * This helps maintain database performance by moving old data to archive tables
 *
 * Usage:
 *   npm run archive-orders
 *   tsx scripts/archive-old-orders.ts
 *
 * Options:
 *   --dry-run  - Show what would be archived without actually archiving
 *   --force    - Skip confirmation prompt
 */

import { createClient } from '@insforge/sdk';

const INSFORGE_URL =
  process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://3ftnzn2r.us-east.insforge.app';
const ARCHIVE_AGE_YEARS = 2;

interface Order {
  id: string;
  shop_id: string;
  customer_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  customer_email: string;
  customer_phone: string | null;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_company: string | null;
  shipping_address1: string | null;
  shipping_address2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  shipping_phone: string | null;
  billing_first_name: string | null;
  billing_last_name: string | null;
  billing_company: string | null;
  billing_address1: string | null;
  billing_address2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  billing_phone: string | null;
  notes: string | null;
  tags: string[] | null;
  discount_code: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

const client = createClient({ baseUrl: INSFORGE_URL });

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

/**
 * Get orders older than specified years
 */
async function getOldOrders(years: number): Promise<Order[]> {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years);

  console.log(`Fetching orders older than ${cutoffDate.toISOString()}...`);

  const { data, error } = await client.database
    .from('orders')
    .select('*')
    .lt('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch old orders: ${error.message}`);
  }

  return (data as Order[]) || [];
}

/**
 * Get order items for given order IDs
 */
async function getOrderItems(orderIds: string[]): Promise<OrderItem[]> {
  if (orderIds.length === 0) {
    return [];
  }

  console.log(`Fetching order items for ${orderIds.length} orders...`);

  const { data, error } = await client.database
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (error) {
    throw new Error(`Failed to fetch order items: ${error.message}`);
  }

  return (data as OrderItem[]) || [];
}

/**
 * Archive orders to archived_orders table
 */
async function archiveOrders(orders: Order[], orderItems: OrderItem[]): Promise<void> {
  console.log(`Archiving ${orders.length} orders and ${orderItems.length} order items...`);

  // Insert into archived_orders
  const { error: ordersError } = await client.database.from('archived_orders').insert(orders);

  if (ordersError) {
    throw new Error(`Failed to insert archived orders: ${ordersError.message}`);
  }

  console.log(`✓ Inserted ${orders.length} orders into archived_orders`);

  // Insert into archived_order_items
  if (orderItems.length > 0) {
    const { error: itemsError } = await client.database
      .from('archived_order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Failed to insert archived order items: ${itemsError.message}`);
    }

    console.log(`✓ Inserted ${orderItems.length} order items into archived_order_items`);
  }
}

/**
 * Delete archived orders from active tables
 */
async function deleteArchivedOrders(orderIds: string[]): Promise<void> {
  console.log(`Deleting ${orderIds.length} orders from active tables...`);

  // Delete order items first (foreign key constraint)
  const { error: itemsError } = await client.database
    .from('order_items')
    .delete()
    .in('order_id', orderIds);

  if (itemsError) {
    throw new Error(`Failed to delete order items: ${itemsError.message}`);
  }

  console.log(`✓ Deleted order items for ${orderIds.length} orders`);

  // Delete orders
  const { error: ordersError } = await client.database.from('orders').delete().in('id', orderIds);

  if (ordersError) {
    throw new Error(`Failed to delete orders: ${ordersError.message}`);
  }

  console.log(`✓ Deleted ${orderIds.length} orders from orders table`);
}

/**
 * Confirm archival with user
 */
async function confirmArchival(count: number): Promise<boolean> {
  if (isForce) {
    return true;
  }

  console.log(`\n⚠️  About to archive ${count} orders older than ${ARCHIVE_AGE_YEARS} years.`);
  console.log('This action will move these orders to the archived_orders table.');
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise((resolve) => setTimeout(resolve, 5000));
  return true;
}

/**
 * Main archival function
 */
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('Order Archival Script');
    console.log('='.repeat(60));
    console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    console.log(`Archive age: ${ARCHIVE_AGE_YEARS} years`);
    console.log('='.repeat(60));
    console.log('');

    // Step 1: Get old orders
    const oldOrders = await getOldOrders(ARCHIVE_AGE_YEARS);

    if (oldOrders.length === 0) {
      console.log('✓ No orders found to archive.');
      return;
    }

    console.log(`Found ${oldOrders.length} orders to archive`);

    // Step 2: Get order items
    const orderIds = oldOrders.map((order) => order.id);
    const orderItems = await getOrderItems(orderIds);

    // Step 3: Show statistics
    console.log('\nArchival Statistics:');
    console.log(`  Orders to archive: ${oldOrders.length}`);
    console.log(`  Order items to archive: ${orderItems.length}`);
    console.log(
      `  Date range: ${oldOrders[0]?.created_at} to ${oldOrders[oldOrders.length - 1]?.created_at}`
    );
    console.log('');

    if (isDryRun) {
      console.log('✓ DRY RUN COMPLETE - No changes made');
      console.log('\nSample orders to archive:');
      oldOrders.slice(0, 5).forEach((order) => {
        console.log(`  - ${order.order_number} (${order.created_at})`);
      });
      if (oldOrders.length > 5) {
        console.log(`  ... and ${oldOrders.length - 5} more`);
      }
      return;
    }

    // Step 4: Confirm archival
    const confirmed = await confirmArchival(oldOrders.length);
    if (!confirmed) {
      console.log('Archival cancelled.');
      return;
    }

    // Step 5: Archive orders
    await archiveOrders(oldOrders, orderItems);

    // Step 6: Delete from active tables
    await deleteArchivedOrders(orderIds);

    console.log('');
    console.log('='.repeat(60));
    console.log('✓ ORDER ARCHIVAL COMPLETE');
    console.log('='.repeat(60));
    console.log(`Archived ${oldOrders.length} orders and ${orderItems.length} order items`);
    console.log('');
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('✗ ARCHIVAL FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.error('');
    process.exit(1);
  }
}

// Run the script
main();
