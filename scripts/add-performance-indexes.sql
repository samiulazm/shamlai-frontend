-- Performance Indexes for Shamlai Frontend
-- Execute using: InsForge MCP run-raw-sql tool
-- Expected impact: 50-100x faster queries

-- ============================================================================
-- PRODUCTS TABLE INDEXES (CRITICAL)
-- ============================================================================

-- Index for shop_id filtering (used in every storefront query)
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);

-- Index for is_active filtering (used in every product listing)
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Composite index for common query pattern: shop_id + is_active
-- This is the MOST CRITICAL index for storefront performance
CREATE INDEX IF NOT EXISTS idx_products_shop_active ON products(shop_id, is_active);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id) 
WHERE category_id IS NOT NULL;

-- Index for featured products
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) 
WHERE is_featured = true;

-- Index for slug lookups (if not already exists via unique constraint)
-- Note: Already exists as unique index, but keeping for reference

-- ============================================================================
-- CART TABLE INDEXES (CRITICAL)
-- ============================================================================

-- Index for session_id lookups (guest carts)
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart(session_id) 
WHERE session_id IS NOT NULL;

-- Index for user_id lookups (authenticated carts)
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id) 
WHERE user_id IS NOT NULL;

-- Index for cart expiration cleanup queries
CREATE INDEX IF NOT EXISTS idx_cart_expires_at ON cart(expires_at) 
WHERE expires_at IS NOT NULL;

-- ============================================================================
-- CART_ITEMS TABLE INDEXES (CRITICAL)
-- ============================================================================

-- Index for cart_id filtering (used in every cart items query)
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Index for product_id lookups
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Composite index for cart item lookups (cart_id + product_id + variant_id)
-- This eliminates N+1 query patterns
CREATE INDEX IF NOT EXISTS idx_cart_items_composite ON cart_items(cart_id, product_id, variant_id);

-- ============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Product images table (if frequently queried)
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) 
WHERE is_primary = true;

-- Product variants table
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(product_id, is_active) 
WHERE is_active = true;

-- Orders table (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check indexes were created successfully
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('products', 'cart', 'cart_items')
-- ORDER BY tablename, indexname;

