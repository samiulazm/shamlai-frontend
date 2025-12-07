-- Comprehensive Multi-Tenancy & Security Policies (Type Corrected)
-- ----------------------------------------------------
-- This script enforces "System-Wide Multi-Tenancy" using `shop_id` (TEXT) as the tenant identifier.

BEGIN;

-- 1. Schema Standardization: Add missing `shop_id` columns (TEXT)
-- ==========================================================

-- Categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'shop_id') THEN
        ALTER TABLE public.categories ADD COLUMN shop_id TEXT REFERENCES public.shop_settings(shop_id) ON DELETE CASCADE;
        CREATE INDEX idx_categories_shop_id ON public.categories(shop_id);
    END IF;
END $$;

-- Cart
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'shop_id') THEN
        ALTER TABLE public.cart ADD COLUMN shop_id TEXT REFERENCES public.shop_settings(shop_id) ON DELETE CASCADE;
        CREATE INDEX idx_cart_shop_id ON public.cart(shop_id);
    END IF;
END $$;

-- 2. Data Integrity: Enforce FKs if missing (Optional but good)
DO $$
BEGIN
    -- Ensure products.shop_id references shop_settings.shop_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_shop_id_fkey') THEN
        -- Only add if data is clean. If check fails, we skip to avoid erroring the whole script, 
        -- but ideally we WANT this. Let's try adding it.
        ALTER TABLE public.products 
        ADD CONSTRAINT products_shop_id_fkey 
        FOREIGN KEY (shop_id) REFERENCES public.shop_settings(shop_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not add FK to products.shop_id, likely data mismatch. Skipping constraint.';
END $$;

-- 3. Enable RLS on All Tables
-- ==========================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- 4. Define Standard Policies (Multi-Tenant Isolation)
-- ==========================================================
-- NOTE: shop_id is TEXT. shop_settings.shop_id is TEXT. shop_settings.user_id is UUID.

-- Categories
DROP POLICY IF EXISTS "Shop owners can manage categories" ON public.categories;
CREATE POLICY "Shop owners can manage categories" ON public.categories
    FOR ALL USING (shop_id IN (SELECT shop_id FROM shop_settings WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- Cart
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart;
CREATE POLICY "Users can manage own cart" ON public.cart
    FOR ALL USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', true));

-- Products
DROP POLICY IF EXISTS "Shop owners can manage products" ON public.products;
CREATE POLICY "Shop owners can manage products" ON public.products
    FOR ALL USING (shop_id IN (SELECT shop_id FROM shop_settings WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Orders
DROP POLICY IF EXISTS "Shop owners can manage orders" ON public.orders;
CREATE POLICY "Shop owners can manage orders" ON public.orders
    FOR ALL USING (shop_id IN (SELECT shop_id FROM shop_settings WHERE user_id = auth.uid()));

-- Customers
DROP POLICY IF EXISTS "Shop owners can manage customers" ON public.customers;
CREATE POLICY "Shop owners can manage customers" ON public.customers
    FOR ALL USING (shop_id IN (SELECT shop_id FROM shop_settings WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view own data" ON public.customers;
CREATE POLICY "Customers can view own data" ON public.customers
    FOR SELECT USING (user_id = auth.uid());

-- Product Images
DROP POLICY IF EXISTS "Shop owners can manage product images" ON public.product_images;
CREATE POLICY "Shop owners can manage product images" ON public.product_images
    FOR ALL USING (
        product_id IN (
            SELECT id FROM products WHERE shop_id IN (
                SELECT shop_id FROM shop_settings WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT USING (
        product_id IN (SELECT id FROM products WHERE is_active = true)
    );

-- Product Variants
DROP POLICY IF EXISTS "Shop owners can manage product variants" ON public.product_variants;
CREATE POLICY "Shop owners can manage product variants" ON public.product_variants
    FOR ALL USING (
        product_id IN (
            SELECT id FROM products WHERE shop_id IN (
                SELECT shop_id FROM shop_settings WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants" ON public.product_variants
    FOR SELECT USING (
        product_id IN (SELECT id FROM products WHERE is_active = true)
    );

-- Cart Items
DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items" ON public.cart_items
    FOR ALL USING (
        cart_id IN (
            SELECT id FROM cart WHERE user_id = auth.uid() OR session_id = current_setting('app.session_id', true)
        )
    );

-- Order Items
DROP POLICY IF EXISTS "Shop owners can view order items" ON public.order_items;
CREATE POLICY "Shop owners can view order items" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE shop_id IN (
                SELECT shop_id FROM shop_settings WHERE user_id = auth.uid()
            )
        )
    );

COMMIT;
