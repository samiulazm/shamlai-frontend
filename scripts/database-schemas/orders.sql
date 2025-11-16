-- ============================================================================
-- TABLE: orders
-- Generated from actual database schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  customer_id UUID,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
  subtotal NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  shipping_first_name VARCHAR(100),
  shipping_last_name VARCHAR(100),
  shipping_company VARCHAR(255),
  shipping_address1 VARCHAR(255),
  shipping_address2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100),
  shipping_phone VARCHAR(50),
  billing_first_name VARCHAR(100),
  billing_last_name VARCHAR(100),
  billing_company VARCHAR(255),
  billing_address1 VARCHAR(255),
  billing_address2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100),
  billing_phone VARCHAR(50),
  notes TEXT,
  tags TEXT[],
  discount_code VARCHAR(100),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foreign Keys
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE orders ADD CONSTRAINT orders_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
