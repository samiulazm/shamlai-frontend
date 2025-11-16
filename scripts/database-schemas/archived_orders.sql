-- ============================================================================
-- TABLE: archived_orders
-- Purpose: Store orders older than 2 years for compliance and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS archived_orders (
  id UUID PRIMARY KEY,
  shop_id UUID,
  customer_id UUID,
  order_number VARCHAR(50) NOT NULL,
  status VARCHAR(50),
  payment_status VARCHAR(50),
  fulfillment_status VARCHAR(50),
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
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for archived orders
CREATE INDEX IF NOT EXISTS idx_archived_orders_shop_id ON archived_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_archived_orders_customer_id ON archived_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_archived_orders_created_at ON archived_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_orders_archived_at ON archived_orders(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_orders_order_number ON archived_orders(order_number);

-- Table for archived order items
CREATE TABLE IF NOT EXISTS archived_order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID,
  variant_id UUID,
  product_name VARCHAR(500),
  variant_name VARCHAR(255),
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for archived order items
CREATE INDEX IF NOT EXISTS idx_archived_order_items_order_id ON archived_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_archived_order_items_product_id ON archived_order_items(product_id);

-- Comment on tables
COMMENT ON TABLE archived_orders IS 'Archived orders older than 2 years for compliance and historical analytics';
COMMENT ON TABLE archived_order_items IS 'Order items for archived orders';
