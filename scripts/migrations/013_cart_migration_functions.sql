-- Migration 013: Cart Migration Functions
-- Purpose: Handle guest cart to user cart transitions and cart management
-- Date: 2025-11-21

-- ===================================================================
-- SECTION 1: Guest Cart to User Cart Migration
-- ===================================================================

-- Function to merge guest cart into user cart when user logs in
CREATE OR REPLACE FUNCTION merge_guest_cart_on_login(
    p_user_id UUID,
    p_session_id VARCHAR,
    p_shop_id UUID DEFAULT NULL
) RETURNS TABLE(
    items_merged INTEGER,
    items_updated INTEGER,
    items_added INTEGER
) AS $$
DECLARE
    v_items_merged INTEGER := 0;
    v_items_updated INTEGER := 0;
    v_items_added INTEGER := 0;
    v_guest_item RECORD;
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL OR p_session_id IS NULL THEN
        RAISE EXCEPTION 'user_id and session_id cannot be NULL';
    END IF;

    -- Process each item in guest cart
    FOR v_guest_item IN
        SELECT
            product_id,
            variant_id,
            quantity,
            shop_id,
            metadata
        FROM cart
        WHERE session_id = p_session_id
        AND (p_shop_id IS NULL OR shop_id = p_shop_id)
    LOOP
        -- Check if user already has this item in cart
        IF EXISTS (
            SELECT 1 FROM cart
            WHERE user_id = p_user_id
            AND product_id = v_guest_item.product_id
            AND (variant_id = v_guest_item.variant_id OR (variant_id IS NULL AND v_guest_item.variant_id IS NULL))
            AND shop_id = v_guest_item.shop_id
        ) THEN
            -- Update existing cart item (add quantities)
            UPDATE cart
            SET
                quantity = cart.quantity + v_guest_item.quantity,
                updated_at = CURRENT_TIMESTAMP,
                metadata = COALESCE(cart.metadata, '{}'::jsonb) || COALESCE(v_guest_item.metadata, '{}'::jsonb)
            WHERE user_id = p_user_id
            AND product_id = v_guest_item.product_id
            AND (variant_id = v_guest_item.variant_id OR (variant_id IS NULL AND v_guest_item.variant_id IS NULL))
            AND shop_id = v_guest_item.shop_id;

            v_items_updated := v_items_updated + 1;
        ELSE
            -- Insert new cart item for user
            INSERT INTO cart (
                user_id,
                session_id,
                product_id,
                variant_id,
                quantity,
                shop_id,
                metadata,
                created_at,
                updated_at
            ) VALUES (
                p_user_id,
                NULL, -- Clear session_id for logged-in user
                v_guest_item.product_id,
                v_guest_item.variant_id,
                v_guest_item.quantity,
                v_guest_item.shop_id,
                v_guest_item.metadata,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );

            v_items_added := v_items_added + 1;
        END IF;

        v_items_merged := v_items_merged + 1;
    END LOOP;

    -- Delete guest cart items
    DELETE FROM cart
    WHERE session_id = p_session_id
    AND (p_shop_id IS NULL OR shop_id = p_shop_id);

    -- Return summary
    RETURN QUERY SELECT v_items_merged, v_items_updated, v_items_added;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION merge_guest_cart_on_login IS 'Merges guest cart into user cart when user logs in. Returns (items_merged, items_updated, items_added)';

-- ===================================================================
-- SECTION 2: Cart Cleanup Functions
-- ===================================================================

-- Function to clean up abandoned carts
CREATE OR REPLACE FUNCTION cleanup_abandoned_carts(
    p_days_old INTEGER DEFAULT 30
) RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete guest carts older than specified days
    DELETE FROM cart
    WHERE session_id IS NOT NULL
    AND user_id IS NULL
    AND updated_at < CURRENT_TIMESTAMP - (p_days_old || ' days')::INTERVAL;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_abandoned_carts IS 'Removes guest cart items not updated in specified days (default 30)';

-- Function to clean up empty carts
CREATE OR REPLACE FUNCTION cleanup_empty_carts()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete cart entries with zero or negative quantity
    DELETE FROM cart
    WHERE quantity <= 0;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_empty_carts IS 'Removes cart items with quantity <= 0';

-- ===================================================================
-- SECTION 3: Cart Validation Functions
-- ===================================================================

-- Function to validate cart item availability
CREATE OR REPLACE FUNCTION validate_cart_item_availability(
    p_cart_id UUID
) RETURNS TABLE(
    cart_id UUID,
    product_id UUID,
    variant_id UUID,
    requested_quantity INTEGER,
    available_quantity INTEGER,
    is_available BOOLEAN,
    message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS cart_id,
        c.product_id,
        c.variant_id,
        c.quantity AS requested_quantity,
        COALESCE(
            CASE
                WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                ELSE p.stock_quantity
            END,
            0
        ) AS available_quantity,
        CASE
            WHEN NOT p.is_active THEN false
            WHEN c.variant_id IS NOT NULL AND NOT pv.is_active THEN false
            WHEN c.quantity <= COALESCE(
                CASE
                    WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                    ELSE p.stock_quantity
                END,
                0
            ) THEN true
            ELSE false
        END AS is_available,
        CASE
            WHEN NOT p.is_active THEN 'Product is no longer available'
            WHEN c.variant_id IS NOT NULL AND NOT pv.is_active THEN 'Product variant is no longer available'
            WHEN c.quantity > COALESCE(
                CASE
                    WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                    ELSE p.stock_quantity
                END,
                0
            ) THEN 'Insufficient stock (available: ' || COALESCE(
                CASE
                    WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                    ELSE p.stock_quantity
                END,
                0
            )::TEXT || ')'
            ELSE 'Available'
        END AS message
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    LEFT JOIN product_variants pv ON c.variant_id = pv.id
    WHERE c.id = p_cart_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_cart_item_availability IS 'Validates if a cart item is available and in stock';

-- Function to validate entire user cart
CREATE OR REPLACE FUNCTION validate_user_cart(
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL
) RETURNS TABLE(
    cart_id UUID,
    product_name TEXT,
    variant_name TEXT,
    requested_quantity INTEGER,
    available_quantity INTEGER,
    is_available BOOLEAN,
    message TEXT
) AS $$
BEGIN
    IF p_user_id IS NULL AND p_session_id IS NULL THEN
        RAISE EXCEPTION 'Either user_id or session_id must be provided';
    END IF;

    RETURN QUERY
    SELECT
        c.id AS cart_id,
        p.name AS product_name,
        pv.name AS variant_name,
        c.quantity AS requested_quantity,
        COALESCE(
            CASE
                WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                ELSE p.stock_quantity
            END,
            0
        ) AS available_quantity,
        CASE
            WHEN NOT p.is_active THEN false
            WHEN c.variant_id IS NOT NULL AND NOT pv.is_active THEN false
            WHEN c.quantity <= COALESCE(
                CASE
                    WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                    ELSE p.stock_quantity
                END,
                0
            ) THEN true
            ELSE false
        END AS is_available,
        CASE
            WHEN NOT p.is_active THEN 'Product is no longer available'
            WHEN c.variant_id IS NOT NULL AND NOT pv.is_active THEN 'Variant is no longer available'
            WHEN c.quantity > COALESCE(
                CASE
                    WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                    ELSE p.stock_quantity
                END,
                0
            ) THEN 'Insufficient stock'
            ELSE 'Available'
        END AS message
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    LEFT JOIN product_variants pv ON c.variant_id = pv.id
    WHERE (p_user_id IS NOT NULL AND c.user_id = p_user_id)
    OR (p_session_id IS NOT NULL AND c.session_id = p_session_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_user_cart IS 'Validates all items in a user or guest cart';

-- ===================================================================
-- SECTION 4: Cart Summary Functions
-- ===================================================================

-- Function to get cart summary
CREATE OR REPLACE FUNCTION get_cart_summary(
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL,
    p_shop_id UUID DEFAULT NULL
) RETURNS TABLE(
    total_items BIGINT,
    total_quantity BIGINT,
    subtotal NUMERIC,
    available_items BIGINT,
    unavailable_items BIGINT
) AS $$
BEGIN
    IF p_user_id IS NULL AND p_session_id IS NULL THEN
        RAISE EXCEPTION 'Either user_id or session_id must be provided';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(DISTINCT c.id) AS total_items,
        COALESCE(SUM(c.quantity), 0) AS total_quantity,
        COALESCE(SUM(
            c.quantity * COALESCE(
                CASE
                    WHEN c.variant_id IS NOT NULL THEN pv.price
                    ELSE p.price
                END,
                0
            )
        ), 0) AS subtotal,
        COUNT(DISTINCT c.id) FILTER (
            WHERE p.is_active
            AND (c.variant_id IS NULL OR pv.is_active)
            AND c.quantity <= COALESCE(
                CASE
                    WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                    ELSE p.stock_quantity
                END,
                0
            )
        ) AS available_items,
        COUNT(DISTINCT c.id) FILTER (
            WHERE NOT p.is_active
            OR (c.variant_id IS NOT NULL AND NOT pv.is_active)
            OR c.quantity > COALESCE(
                CASE
                    WHEN c.variant_id IS NOT NULL THEN pv.stock_quantity
                    ELSE p.stock_quantity
                END,
                0
            )
        ) AS unavailable_items
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    LEFT JOIN product_variants pv ON c.variant_id = pv.id
    WHERE ((p_user_id IS NOT NULL AND c.user_id = p_user_id)
        OR (p_session_id IS NOT NULL AND c.session_id = p_session_id))
    AND (p_shop_id IS NULL OR c.shop_id = p_shop_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_cart_summary IS 'Returns summary of cart including totals and availability status';

-- ===================================================================
-- SECTION 5: Scheduled Cleanup Job Setup
-- ===================================================================

-- Create a function to be called by a cron job or scheduler
CREATE OR REPLACE FUNCTION scheduled_cart_cleanup()
RETURNS TABLE(
    abandoned_carts_removed INTEGER,
    empty_carts_removed INTEGER,
    expired_sessions_removed INTEGER
) AS $$
DECLARE
    v_abandoned INTEGER;
    v_empty INTEGER;
    v_sessions INTEGER;
BEGIN
    -- Clean up abandoned carts (30 days old)
    SELECT cleanup_abandoned_carts(30) INTO v_abandoned;

    -- Clean up empty carts
    SELECT cleanup_empty_carts() INTO v_empty;

    -- Clean up expired sessions
    SELECT cleanup_expired_sessions() INTO v_sessions;

    RETURN QUERY SELECT v_abandoned, v_empty, v_sessions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION scheduled_cart_cleanup IS 'Run this function daily to clean up abandoned carts, empty carts, and expired sessions';

-- ===================================================================
-- SECTION 6: Migration Session IDs to Sessions Table
-- ===================================================================

-- Helper function to migrate existing cart session_ids to sessions table
CREATE OR REPLACE FUNCTION migrate_cart_sessions_to_sessions_table()
RETURNS INTEGER AS $$
DECLARE
    v_migrated INTEGER := 0;
BEGIN
    -- Insert unique session_ids from cart that don't exist in sessions
    INSERT INTO sessions (session_token, expires_at, created_at, last_activity)
    SELECT DISTINCT
        c.session_id,
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        COALESCE(MIN(c.created_at), CURRENT_TIMESTAMP),
        COALESCE(MAX(c.updated_at), CURRENT_TIMESTAMP)
    FROM cart c
    WHERE c.session_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM sessions s WHERE s.session_token = c.session_id
    )
    GROUP BY c.session_id
    ON CONFLICT (session_token) DO NOTHING;

    GET DIAGNOSTICS v_migrated = ROW_COUNT;

    RETURN v_migrated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_cart_sessions_to_sessions_table IS 'One-time migration of cart session_ids to sessions table';

-- ===================================================================
-- Migration Complete
-- ===================================================================

DO $$
DECLARE
    v_migrated INTEGER;
BEGIN
    -- Run the migration
    SELECT migrate_cart_sessions_to_sessions_table() INTO v_migrated;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Migration 013 completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created cart management functions:';
    RAISE NOTICE '  - merge_guest_cart_on_login(user_id, session_id)';
    RAISE NOTICE '  - cleanup_abandoned_carts(days_old)';
    RAISE NOTICE '  - cleanup_empty_carts()';
    RAISE NOTICE '  - validate_cart_item_availability(cart_id)';
    RAISE NOTICE '  - validate_user_cart(user_id, session_id)';
    RAISE NOTICE '  - get_cart_summary(user_id, session_id, shop_id)';
    RAISE NOTICE '  - scheduled_cart_cleanup()';
    RAISE NOTICE '';
    RAISE NOTICE 'Migrated % existing cart sessions to sessions table', v_migrated;
    RAISE NOTICE '';
    RAISE NOTICE 'Usage examples:';
    RAISE NOTICE '  -- Merge guest cart on login:';
    RAISE NOTICE '  SELECT * FROM merge_guest_cart_on_login(''user-uuid'', ''session-token'');';
    RAISE NOTICE '';
    RAISE NOTICE '  -- Validate cart before checkout:';
    RAISE NOTICE '  SELECT * FROM validate_user_cart(''user-uuid'', NULL);';
    RAISE NOTICE '';
    RAISE NOTICE '  -- Get cart summary:';
    RAISE NOTICE '  SELECT * FROM get_cart_summary(''user-uuid'', NULL, NULL);';
    RAISE NOTICE '';
    RAISE NOTICE '  -- Run daily cleanup (add to cron):';
    RAISE NOTICE '  SELECT * FROM scheduled_cart_cleanup();';
    RAISE NOTICE '===========================================';
END $$;
