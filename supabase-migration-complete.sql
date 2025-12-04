-- ============================================================================
-- Shamlai E-commerce Platform - Complete Supabase Migration
-- ============================================================================
-- This script creates all necessary tables and policies for Supabase
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. SHOP SETTINGS TABLE (Core table for signup)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id VARCHAR(10) UNIQUE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  shop_username VARCHAR(50) UNIQUE NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  shop_description TEXT,
  shop_email VARCHAR(255),
  shop_phone VARCHAR(50),
  logo_url TEXT,
  favicon_url TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(100) DEFAULT 'UTC',
  weight_unit VARCHAR(10) DEFAULT 'kg',
  address1 VARCHAR(255),
  address2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  google_analytics_id VARCHAR(100),
  facebook_pixel_id VARCHAR(100),
  terms_of_service TEXT,
  privacy_policy TEXT,
  refund_policy TEXT,
  shipping_policy TEXT,
  enable_reviews BOOLEAN DEFAULT true,
  enable_wishlists BOOLEAN DEFAULT true,
  enable_guest_checkout BOOLEAN DEFAULT true,
  require_account_for_checkout BOOLEAN DEFAULT false,
  auto_approve_reviews BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for shop_settings
CREATE INDEX IF NOT EXISTS idx_shop_settings_user_id ON shop_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_settings_subdomain ON shop_settings(subdomain);
CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_username ON shop_settings(shop_username);

-- Enable RLS on shop_settings
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_settings
CREATE POLICY "Shop owners can read own settings" ON shop_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Shop owners can update own settings" ON shop_settings
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own shop settings" ON shop_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_shop_id ON categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage categories" ON categories
  FOR ALL
  USING (shop_id IN (SELECT id FROM shop_settings WHERE user_id = auth.uid()));

CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- 3. PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  cost_per_item DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  track_inventory BOOLEAN DEFAULT true,
  taxable BOOLEAN DEFAULT true,
  weight DECIMAL(10, 2),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  version INTEGER DEFAULT 1,
  UNIQUE(shop_id, slug),
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_stock CHECK (stock_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage products" ON products
  FOR ALL
  USING (shop_id IN (SELECT id FROM shop_settings WHERE user_id = auth.uid()));

CREATE POLICY "Public can view active products" ON products
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- 4. PRODUCT IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage product images" ON product_images
  FOR ALL
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN shop_settings ss ON p.shop_id = ss.id
    WHERE ss.user_id = auth.uid()
  ));

CREATE POLICY "Public can view product images" ON product_images
  FOR SELECT
  USING (product_id IN (SELECT id FROM products WHERE is_active = true));

-- ============================================================================
-- 5. CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  accepts_marketing BOOLEAN DEFAULT false,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, email)
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage customers" ON customers
  FOR ALL
  USING (shop_id IN (SELECT id FROM shop_settings WHERE user_id = auth.uid()));

CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 6. CART TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_shop_id ON cart(shop_id);

ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart" ON cart
  FOR ALL
  USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', true));

-- ============================================================================
-- 7. CART ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  UNIQUE(cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL
  USING (cart_id IN (
    SELECT id FROM cart
    WHERE user_id = auth.uid() OR session_id = current_setting('app.session_id', true)
  ));

-- ============================================================================
-- 8. ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  billing_first_name VARCHAR(100),
  billing_last_name VARCHAR(100),
  billing_address1 VARCHAR(255),
  billing_address2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100),
  shipping_first_name VARCHAR(100),
  shipping_last_name VARCHAR(100),
  shipping_address1 VARCHAR(255),
  shipping_address2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT positive_totals CHECK (subtotal >= 0 AND total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage orders" ON orders
  FOR ALL
  USING (shop_id IN (SELECT id FROM shop_settings WHERE user_id = auth.uid()));

-- ============================================================================
-- 9. ORDER ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view order items" ON order_items
  FOR SELECT
  USING (order_id IN (
    SELECT o.id FROM orders o
    JOIN shop_settings ss ON o.shop_id = ss.id
    WHERE ss.user_id = auth.uid()
  ));

-- ============================================================================
-- 10. SYSTEM LOCKS TABLE (for inventory management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_locks_lock_id ON system_locks(lock_id);
CREATE INDEX IF NOT EXISTS idx_system_locks_expires_at ON system_locks(expires_at);

-- ============================================================================
-- 11. HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_updated_at
  BEFORE UPDATE ON cart
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM system_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. SUPABASE AUTH CONFIGURATION
-- ============================================================================

-- Note: These settings should be configured in Supabase Dashboard:
-- 1. Go to Authentication -> Settings
-- 2. Disable "Enable email confirmations" for testing (or configure email provider)
-- 3. Enable "Auto-confirm users" for development
-- 4. Set up OAuth providers if needed (Google, GitHub, etc.)

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- Verify the migration
SELECT 'Migration completed successfully!' as status;
SELECT 'Total tables created: ' || COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';
