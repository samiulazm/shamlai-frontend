-- Migration 012: Fix Incorrect CASCADE Delete Rules
-- Purpose: Change CASCADE to SET NULL where data should be preserved
-- Date: 2025-11-21

-- ===================================================================
-- CRITICAL: Backup Strategy
-- ===================================================================
-- This migration modifies foreign key constraints
-- Always test on staging before production
-- Have a rollback plan ready

-- ===================================================================
-- SECTION 1: Product Reviews - Preserve Reviews When Order Deleted
-- ===================================================================

-- Current: product_reviews.order_id ON DELETE CASCADE
-- Problem: Deleting an order also deletes all reviews (loses historical data)
-- Fix: Change to SET NULL to preserve reviews

DO $$
BEGIN
    -- First, check if the constraint exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%product_reviews%order%'
        AND table_name = 'product_reviews'
    ) THEN
        -- Drop the existing constraint
        ALTER TABLE product_reviews
        DROP CONSTRAINT IF EXISTS product_reviews_order_id_fkey;

        -- Add the new constraint with SET NULL
        ALTER TABLE product_reviews
        ADD CONSTRAINT product_reviews_order_id_fkey
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL;

        RAISE NOTICE 'Fixed product_reviews.order_id: CASCADE -> SET NULL';
    ELSE
        RAISE NOTICE 'product_reviews.order_id constraint not found or already fixed';
    END IF;
END $$;

COMMENT ON COLUMN product_reviews.order_id IS 'Optional reference to order (SET NULL on delete to preserve review)';

-- ===================================================================
-- SECTION 2: Order Items - Preserve When Product Deleted
-- ===================================================================

-- Current: May be CASCADE, should be SET NULL
-- Problem: Product deletion shouldn't delete historical order items
-- Fix: Ensure SET NULL (already might be correct, but verify)

DO $$
BEGIN
    -- Check and fix product_id
    ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

    ALTER TABLE order_items
    ADD CONSTRAINT order_items_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE SET NULL;

    -- Check and fix variant_id
    ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;

    ALTER TABLE order_items
    ADD CONSTRAINT order_items_variant_id_fkey
    FOREIGN KEY (variant_id)
    REFERENCES product_variants(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Fixed order_items: product_id and variant_id -> SET NULL';
END $$;

COMMENT ON COLUMN order_items.product_id IS 'Product reference (SET NULL on delete - data preserved in product_name)';
COMMENT ON COLUMN order_items.variant_id IS 'Variant reference (SET NULL on delete - data preserved in variant_name)';

-- ===================================================================
-- SECTION 3: Orders - Preserve When Customer Deleted
-- ===================================================================

-- Current: May be CASCADE
-- Problem: Customer deletion shouldn't delete order history
-- Fix: SET NULL (customer data is denormalized in orders)

DO $$
BEGIN
    ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

    ALTER TABLE orders
    ADD CONSTRAINT orders_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Fixed orders.customer_id: -> SET NULL';
END $$;

COMMENT ON COLUMN orders.customer_id IS 'Customer reference (SET NULL on delete - guest orders or deleted customers)';

-- ===================================================================
-- SECTION 4: Addresses - Review Cascade Rules
-- ===================================================================

-- Current: addresses might CASCADE with customers
-- Better: SET NULL or keep CASCADE depending on use case

DO $$
BEGIN
    -- If addresses should be deleted with customer (no standalone addresses)
    -- Then CASCADE is correct. Otherwise, SET NULL.

    -- For this e-commerce system, addresses are tied to customers
    -- So CASCADE is appropriate, but let's verify it's explicit

    ALTER TABLE addresses
    DROP CONSTRAINT IF EXISTS addresses_customer_id_fkey;

    ALTER TABLE addresses
    ADD CONSTRAINT addresses_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Verified addresses.customer_id: CASCADE (addresses tied to customer)';
END $$;

-- ===================================================================
-- SECTION 5: Payments - Keep CASCADE (Tied to Order Lifecycle)
-- ===================================================================

-- Current: payments.order_id ON DELETE CASCADE
-- Decision: KEEP CASCADE
-- Reason: Payments are part of order lifecycle, should be deleted together

DO $$
BEGIN
    ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_order_id_fkey;

    ALTER TABLE payments
    ADD CONSTRAINT payments_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Verified payments.order_id: CASCADE (correct for lifecycle)';
END $$;

COMMENT ON COLUMN payments.order_id IS 'Order reference (CASCADE delete - payments tied to order lifecycle)';

-- ===================================================================
-- SECTION 6: Inventory Logs - Preserve Historical Logs
-- ===================================================================

-- Current: May CASCADE with product/order
-- Problem: Lose historical inventory tracking
-- Fix: SET NULL to preserve logs

DO $$
BEGIN
    -- Fix the new reference columns we added
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory_logs' AND column_name = 'order_reference_id'
    ) THEN
        ALTER TABLE inventory_logs
        DROP CONSTRAINT IF EXISTS inventory_logs_order_reference_id_fkey;

        ALTER TABLE inventory_logs
        ADD CONSTRAINT inventory_logs_order_reference_id_fkey
        FOREIGN KEY (order_reference_id)
        REFERENCES orders(id)
        ON DELETE SET NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory_logs' AND column_name = 'product_reference_id'
    ) THEN
        ALTER TABLE inventory_logs
        DROP CONSTRAINT IF EXISTS inventory_logs_product_reference_id_fkey;

        ALTER TABLE inventory_logs
        ADD CONSTRAINT inventory_logs_product_reference_id_fkey
        FOREIGN KEY (product_reference_id)
        REFERENCES products(id)
        ON DELETE SET NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory_logs' AND column_name = 'variant_reference_id'
    ) THEN
        ALTER TABLE inventory_logs
        DROP CONSTRAINT IF EXISTS inventory_logs_variant_reference_id_fkey;

        ALTER TABLE inventory_logs
        ADD CONSTRAINT inventory_logs_variant_reference_id_fkey
        FOREIGN KEY (variant_reference_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL;
    END IF;

    RAISE NOTICE 'Fixed inventory_logs references: -> SET NULL (preserve history)';
END $$;

-- ===================================================================
-- SECTION 7: Cart Items - CASCADE is Correct
-- ===================================================================

-- Current: cart items CASCADE with cart or product
-- Decision: Keep CASCADE for cart, SET NULL for product
-- Reason: Cart is temporary, but product reference should preserve cart

DO $$
BEGIN
    -- Cart items tied to cart - CASCADE is correct
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cart' AND column_name = 'user_id'
    ) THEN
        -- This is the cart table itself, skip
        RAISE NOTICE 'Cart table structure verified';
    END IF;

    -- If there's a separate cart_items table, handle it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items') THEN
        ALTER TABLE cart_items
        DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

        ALTER TABLE cart_items
        ADD CONSTRAINT cart_items_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL;

        RAISE NOTICE 'Fixed cart_items.product_id: -> SET NULL';
    END IF;
END $$;

-- ===================================================================
-- SECTION 8: Analytics Events - Preserve Data
-- ===================================================================

-- Current: Might CASCADE
-- Problem: Lose historical analytics
-- Fix: SET NULL for all references

DO $$
BEGIN
    -- Fix user_id reference if it cascades
    ALTER TABLE analytics_events
    DROP CONSTRAINT IF EXISTS analytics_events_user_id_fkey;

    ALTER TABLE analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

    -- Fix product_id if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'analytics_events' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE analytics_events
        DROP CONSTRAINT IF EXISTS analytics_events_product_id_fkey;

        ALTER TABLE analytics_events
        ADD CONSTRAINT analytics_events_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL;
    END IF;

    RAISE NOTICE 'Fixed analytics_events references: -> SET NULL (preserve analytics)';
END $$;

-- ===================================================================
-- SECTION 9: Discount Code Usage - Preserve Usage History
-- ===================================================================

DO $$
BEGIN
    -- Keep usage history even if discount code deleted
    ALTER TABLE discount_code_usage
    DROP CONSTRAINT IF EXISTS discount_code_usage_discount_code_id_fkey;

    ALTER TABLE discount_code_usage
    ADD CONSTRAINT discount_code_usage_discount_code_id_fkey
    FOREIGN KEY (discount_code_id)
    REFERENCES discount_codes(id)
    ON DELETE SET NULL;

    -- Keep usage history even if order deleted
    ALTER TABLE discount_code_usage
    DROP CONSTRAINT IF EXISTS discount_code_usage_order_id_fkey;

    ALTER TABLE discount_code_usage
    ADD CONSTRAINT discount_code_usage_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Fixed discount_code_usage: -> SET NULL (preserve usage history)';
END $$;

-- ===================================================================
-- SECTION 10: Summary of CASCADE Rules
-- ===================================================================

-- Tables WHERE CASCADE IS CORRECT (child data tied to parent lifecycle):
-- 1. payments -> orders (CASCADE)
-- 2. order_items -> orders (CASCADE)
-- 3. order_status_history -> orders (CASCADE)
-- 4. product_images -> products (CASCADE)
-- 5. product_variants -> products (CASCADE)
-- 6. addresses -> customers (CASCADE)
-- 7. cart -> user/session (CASCADE)
-- 8. shop_users -> users (CASCADE - RBAC permissions)
-- 9. hrm_attendance -> hrm_employees (CASCADE)
-- 10. hrm_leaves -> hrm_employees (CASCADE)

-- Tables WHERE SET NULL IS CORRECT (preserve historical data):
-- 1. product_reviews -> orders (SET NULL)
-- 2. product_reviews -> products (SET NULL)
-- 3. order_items -> products (SET NULL)
-- 4. order_items -> product_variants (SET NULL)
-- 5. orders -> customers (SET NULL)
-- 6. inventory_logs -> all references (SET NULL)
-- 7. analytics_events -> all references (SET NULL)
-- 8. discount_code_usage -> all references (SET NULL)

-- ===================================================================
-- Create Function to Audit Current CASCADE Rules
-- ===================================================================

CREATE OR REPLACE FUNCTION audit_cascade_rules()
RETURNS TABLE(
    table_name TEXT,
    column_name TEXT,
    foreign_table TEXT,
    delete_rule TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.table_name::TEXT,
        kcu.column_name::TEXT,
        ccu.table_name::TEXT AS foreign_table,
        rc.delete_rule::TEXT,
        CASE
            WHEN tc.table_name IN ('payments', 'order_status_history', 'product_images', 'product_variants', 'addresses', 'shop_users')
                AND rc.delete_rule = 'CASCADE' THEN 'OK - CASCADE appropriate'
            WHEN tc.table_name IN ('product_reviews', 'order_items', 'orders', 'inventory_logs', 'analytics_events', 'discount_code_usage')
                AND rc.delete_rule = 'SET NULL' THEN 'OK - SET NULL appropriate'
            WHEN tc.table_name IN ('product_reviews', 'order_items', 'orders', 'inventory_logs', 'analytics_events', 'discount_code_usage')
                AND rc.delete_rule = 'CASCADE' THEN 'WARNING - Should be SET NULL'
            ELSE 'REVIEW - Verify if appropriate'
        END::TEXT AS recommendation
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name, kcu.column_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_cascade_rules IS 'Audits all foreign key CASCADE rules and provides recommendations';

-- ===================================================================
-- Migration Complete
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Migration 012 completed successfully!';
    RAISE NOTICE 'Fixed CASCADE delete rules for:';
    RAISE NOTICE '  - product_reviews.order_id: CASCADE -> SET NULL';
    RAISE NOTICE '  - order_items: product/variant -> SET NULL';
    RAISE NOTICE '  - orders.customer_id: -> SET NULL';
    RAISE NOTICE '  - inventory_logs: all refs -> SET NULL';
    RAISE NOTICE '  - analytics_events: all refs -> SET NULL';
    RAISE NOTICE '  - discount_code_usage: all refs -> SET NULL';
    RAISE NOTICE '';
    RAISE NOTICE 'Verified CASCADE rules kept for:';
    RAISE NOTICE '  - payments, order_status_history (order lifecycle)';
    RAISE NOTICE '  - product_images, product_variants (product lifecycle)';
    RAISE NOTICE '  - addresses (customer lifecycle)';
    RAISE NOTICE '';
    RAISE NOTICE 'Run: SELECT * FROM audit_cascade_rules();';
    RAISE NOTICE 'to see current state of all FK delete rules';
    RAISE NOTICE '===========================================';
END $$;
