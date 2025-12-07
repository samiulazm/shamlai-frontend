-- Database Repair Script
-- ----------------------
-- This script fixes discrepancies between the Codebase (expecting specific table names)
-- and the Current Database (using Views). It also hardens security by enabling RLS.

BEGIN;

-- 1. Handle "cart" table mismatch
--    Current: "carts" (Table), "cart" (View)
--    Goal: "cart" (Table)

-- Drop the view first
DROP VIEW IF EXISTS public.cart;

-- Rename the table if it exists as "carts"
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'carts') THEN
        ALTER TABLE public.carts RENAME TO cart;
    END IF;
END
$$;

-- 2. Handle "inventory_logs" mismatch
--    Current: "inventory_log" (Table), "inventory_logs" (View)
--    Goal: "inventory_logs" (Table)

-- Drop the view first
DROP VIEW IF EXISTS public.inventory_logs;

-- Rename the table if it exists as "inventory_log"
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'inventory_log') THEN
        ALTER TABLE public.inventory_log RENAME TO inventory_logs;
    END IF;
END
$$;

-- 3. Security Hardening: Enable RLS
ALTER TABLE public.system_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- 4. Apply RLS Policies

-- System Locks (Simple access for now, or restrict?)
-- Assuming public access is needed for now based on previous configuration
CREATE POLICY "Public access to system_locks" ON public.system_locks
    FOR ALL USING (true) WITH CHECK (true);

-- Cart Policies
-- Re-applying strict logical policy from migration file.
-- WARNING: This requires the application to set 'app.session_id' for anonymous access.
-- If 'app.session_id' is not set, anonymous users cannot see their cart.
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart;
DROP POLICY IF EXISTS "Users can view own cart" ON public.cart;
DROP POLICY IF EXISTS "Users can manage their cart" ON public.cart; -- Remote policy name
DROP POLICY IF EXISTS "Users can view their cart" ON public.cart; -- Remote policy name

CREATE POLICY "Users can manage own cart" ON public.cart
    FOR ALL
    USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', true));

-- Inventory Logs Policies
-- Allow shop owners (auth users) to view and insert logs.
DROP POLICY IF EXISTS "Shop owners can view inventory logs" ON public.inventory_logs;

CREATE POLICY "Shop owners can view inventory logs" ON public.inventory_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN shop_settings s ON s.shop_id = p.shop_id
            WHERE p.id = inventory_logs.product_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Shop owners can insert inventory logs" ON public.inventory_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM products p
            JOIN shop_settings s ON s.shop_id = p.shop_id
            WHERE p.id = inventory_logs.product_id
            AND s.user_id = auth.uid()
        )
    );

COMMIT;
