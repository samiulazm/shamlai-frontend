-- ============================================================================
-- DELIVERY METHODS TABLE MIGRATION
-- Migration: 008_delivery_methods_table
-- Description: Creates delivery_methods table to manage shipping/delivery services
-- ============================================================================

-- Delivery methods table
CREATE TABLE IF NOT EXISTS delivery_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pathao', 'steadfast', 'redx', 'paperfly', 'office', 'other')),
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by shop_id
CREATE INDEX IF NOT EXISTS idx_delivery_methods_shop_id ON delivery_methods(shop_id);

-- Create index for active delivery methods
CREATE INDEX IF NOT EXISTS idx_delivery_methods_active ON delivery_methods(shop_id, is_active);

-- Enable Row Level Security
ALTER TABLE delivery_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Shop owners can read own delivery methods" ON delivery_methods;
DROP POLICY IF EXISTS "Shop owners can insert own delivery methods" ON delivery_methods;
DROP POLICY IF EXISTS "Shop owners can update own delivery methods" ON delivery_methods;
DROP POLICY IF EXISTS "Shop owners can delete own delivery methods" ON delivery_methods;

-- Allow shop owners to read their own delivery methods
CREATE POLICY "Shop owners can read own delivery methods" ON delivery_methods
  FOR SELECT
  USING (shop_id = auth.uid());

-- Allow shop owners to insert their own delivery methods
CREATE POLICY "Shop owners can insert own delivery methods" ON delivery_methods
  FOR INSERT
  WITH CHECK (shop_id = auth.uid());

-- Allow shop owners to update their own delivery methods
CREATE POLICY "Shop owners can update own delivery methods" ON delivery_methods
  FOR UPDATE
  USING (shop_id = auth.uid());

-- Allow shop owners to delete their own delivery methods
CREATE POLICY "Shop owners can delete own delivery methods" ON delivery_methods
  FOR DELETE
  USING (shop_id = auth.uid());

-- Add comment
COMMENT ON TABLE delivery_methods IS 'Delivery service integrations for each shop. Supports various courier services like Pathao, Steadfast, RedX, etc.';
