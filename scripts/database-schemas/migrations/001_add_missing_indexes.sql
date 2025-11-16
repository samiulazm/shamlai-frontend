-- ============================================================================
-- DATABASE OPTIMIZATION MIGRATION
-- Migration: 001_add_missing_indexes
-- Description: Add missing indexes to improve query performance
-- Date: 2025-11-16
-- ============================================================================

-- ============================================================================
-- PRODUCTS TABLE - Performance Indexes
-- ============================================================================

-- Index for sorting products by creation date (newest first)
CREATE INDEX IF NOT EXISTS idx_products_created_at
ON products(created_at DESC);

-- Index for filtering/sorting products by price
CREATE INDEX IF NOT EXISTS idx_products_base_price
ON products(base_price);

-- Composite index for price range queries within shop
CREATE INDEX IF NOT EXISTS idx_products_shop_price
ON products(shop_id, base_price)
WHERE is_active = true;

-- Full-text search index on product name and description
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
ON products USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_description_trgm
ON products USING gin(description gin_trgm_ops);

-- Index for SKU lookups (inventory management)
CREATE INDEX IF NOT EXISTS idx_products_sku
ON products(sku)
WHERE sku IS NOT NULL;

-- Composite index for common product listing queries
CREATE INDEX IF NOT EXISTS idx_products_shop_created
ON products(shop_id, created_at DESC)
WHERE is_active = true;


-- ============================================================================
-- ORDERS TABLE - Performance Indexes
-- ============================================================================

-- Composite index for filtering orders by shop and status
CREATE INDEX IF NOT EXISTS idx_orders_shop_status
ON orders(shop_id, status);

-- Composite index for filtering orders by shop and date (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_orders_shop_created
ON orders(shop_id, created_at DESC);

-- Index on payment status for payment management
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
ON orders(payment_status);

-- Index on fulfillment status for order fulfillment
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status
ON orders(fulfillment_status);

-- Composite index for customer order history
CREATE INDEX IF NOT EXISTS idx_orders_customer_created
ON orders(customer_id, created_at DESC)
WHERE customer_id IS NOT NULL;

-- Index for order archival (orders older than 2 years)
CREATE INDEX IF NOT EXISTS idx_orders_archival
ON orders(created_at)
WHERE created_at < (now() - INTERVAL '2 years');

-- Composite index for shop analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_shop_status_created
ON orders(shop_id, status, created_at DESC);


-- ============================================================================
-- PRODUCT_VARIANTS TABLE - Performance Indexes
-- ============================================================================

-- Index for joining variants with products
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
ON product_variants(product_id);

-- Composite index for active variants by product
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active
ON product_variants(product_id, is_active);

-- Index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_sku
ON product_variants(sku)
WHERE sku IS NOT NULL;

-- Index for filtering active variants
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active
ON product_variants(is_active)
WHERE is_active = true;


-- ============================================================================
-- CUSTOMERS TABLE - Performance Indexes
-- ============================================================================

-- Index for filtering customers by shop
CREATE INDEX IF NOT EXISTS idx_customers_shop_id
ON customers(shop_id);

-- Index for email lookups (customer search)
CREATE INDEX IF NOT EXISTS idx_customers_email
ON customers(email);

-- Composite index for unique shop+email queries
CREATE INDEX IF NOT EXISTS idx_customers_shop_email
ON customers(shop_id, email);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id
ON customers(user_id)
WHERE user_id IS NOT NULL;

-- Index for sorting customers by total spent (VIP customers)
CREATE INDEX IF NOT EXISTS idx_customers_shop_total_spent
ON customers(shop_id, total_spent DESC);

-- Index for filtering marketing subscribers
CREATE INDEX IF NOT EXISTS idx_customers_shop_marketing
ON customers(shop_id, accepts_marketing)
WHERE accepts_marketing = true;


-- ============================================================================
-- INVENTORY_LOGS TABLE - Performance Indexes
-- ============================================================================

-- Index for filtering logs by product
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id
ON inventory_logs(product_id);

-- Index for filtering logs by variant
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant_id
ON inventory_logs(variant_id)
WHERE variant_id IS NOT NULL;

-- Index for sorting logs by creation date
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at
ON inventory_logs(created_at DESC);

-- Index for filtering logs by change type
CREATE INDEX IF NOT EXISTS idx_inventory_logs_change_type
ON inventory_logs(change_type);

-- Composite index for product inventory history
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_created
ON inventory_logs(product_id, created_at DESC);

-- Composite index for variant inventory history
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant_created
ON inventory_logs(variant_id, created_at DESC)
WHERE variant_id IS NOT NULL;


-- ============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Index for product reviews (if querying by product frequently)
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id
ON product_reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_product_reviews_approved
ON product_reviews(is_approved, created_at DESC)
WHERE is_approved = true;

-- Index for discount codes (active codes lookup)
CREATE INDEX IF NOT EXISTS idx_discount_codes_code
ON discount_codes(code);

CREATE INDEX IF NOT EXISTS idx_discount_codes_shop_active
ON discount_codes(shop_id, is_active)
WHERE is_active = true;

-- Index for order items (analytics queries)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
ON order_items(product_id);


-- ============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable pg_trgm extension for full-text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify indexes were created, run:
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
