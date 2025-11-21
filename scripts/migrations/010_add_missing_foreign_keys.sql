-- Migration 010: Add Missing Foreign Key Constraints
-- Purpose: Add FK constraints that were missing in the original schema
-- Date: 2025-11-21

-- IMPORTANT: This migration assumes sessions table exists (run 009 first)

-- ===================================================================
-- SECTION 1: Add Foreign Keys to Sessions Table
-- ===================================================================

-- First, we need to migrate existing session_id values to the new sessions table
-- For cart table
DO $$
BEGIN
    -- Insert unique session_ids from cart into sessions table (for guest users)
    INSERT INTO sessions (session_token, expires_at, created_at)
    SELECT DISTINCT
        session_id,
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        CURRENT_TIMESTAMP
    FROM cart
    WHERE session_id IS NOT NULL
    AND session_id NOT IN (SELECT session_token FROM sessions)
    ON CONFLICT (session_token) DO NOTHING;

    -- Insert unique session_ids from analytics_events
    INSERT INTO sessions (session_token, expires_at, created_at)
    SELECT DISTINCT
        session_id,
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        CURRENT_TIMESTAMP
    FROM analytics_events
    WHERE session_id IS NOT NULL
    AND session_id NOT IN (SELECT session_token FROM sessions)
    ON CONFLICT (session_token) DO NOTHING;

    -- Insert unique session_ids from discount_code_usage
    INSERT INTO sessions (session_token, expires_at, created_at)
    SELECT DISTINCT
        session_id,
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        CURRENT_TIMESTAMP
    FROM discount_code_usage
    WHERE session_id IS NOT NULL
    AND session_id NOT IN (SELECT session_token FROM sessions)
    ON CONFLICT (session_token) DO NOTHING;

    RAISE NOTICE 'Migrated existing session_ids to sessions table';
END $$;

-- Now we need to update the session_id columns to reference the sessions.id instead of session_token
-- But first, let's add a new column for the UUID reference

-- Cart table: Add session_uuid column and migrate data
ALTER TABLE cart ADD COLUMN IF NOT EXISTS session_uuid UUID REFERENCES sessions(id) ON DELETE CASCADE;

UPDATE cart c
SET session_uuid = s.id
FROM sessions s
WHERE c.session_id = s.session_token;

-- Analytics events: Add session_uuid column and migrate data
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS session_uuid UUID REFERENCES sessions(id) ON DELETE SET NULL;

UPDATE analytics_events ae
SET session_uuid = s.id
FROM sessions s
WHERE ae.session_id = s.session_token;

-- Discount code usage: Add session_uuid column and migrate data
ALTER TABLE discount_code_usage ADD COLUMN IF NOT EXISTS session_uuid UUID REFERENCES sessions(id) ON DELETE SET NULL;

UPDATE discount_code_usage dcu
SET session_uuid = s.id
FROM sessions s
WHERE dcu.session_id = s.session_token;

-- Add comments for new columns
COMMENT ON COLUMN cart.session_uuid IS 'Foreign key reference to sessions table (replaces session_id string)';
COMMENT ON COLUMN analytics_events.session_uuid IS 'Foreign key reference to sessions table (replaces session_id string)';
COMMENT ON COLUMN discount_code_usage.session_uuid IS 'Foreign key reference to sessions table (replaces session_id string)';

-- Add indexes for the new FK columns
CREATE INDEX IF NOT EXISTS idx_cart_session_uuid ON cart(session_uuid);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_uuid ON analytics_events(session_uuid);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_session_uuid ON discount_code_usage(session_uuid);

-- Note: The old session_id VARCHAR columns are kept for backward compatibility
-- To fully migrate, you would need to:
-- 1. Update application code to use session_uuid instead of session_id
-- 2. Run: ALTER TABLE cart DROP COLUMN session_id;
-- 3. Run: ALTER TABLE analytics_events DROP COLUMN session_id;
-- 4. Run: ALTER TABLE discount_code_usage DROP COLUMN session_id;
-- 5. Rename session_uuid to session_id if desired

-- ===================================================================
-- SECTION 2: Fix inventory_logs reference_id
-- ===================================================================

-- Add reference_type column if it doesn't exist
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50) CHECK (reference_type IN ('order', 'product', 'variant', 'adjustment', 'return', 'damage', 'transfer'));

-- Add specific reference columns for type safety
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS order_reference_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS product_reference_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS variant_reference_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- Migrate existing data if reference_id contains valid UUIDs
-- This is a best-effort migration - you may need to adjust based on your data
DO $$
BEGIN
    -- Try to match reference_id with orders
    UPDATE inventory_logs il
    SET
        order_reference_id = o.id,
        reference_type = 'order'
    FROM orders o
    WHERE il.reference_id = o.id::text
    AND il.reference_type IS NULL;

    -- Try to match reference_id with products
    UPDATE inventory_logs il
    SET
        product_reference_id = p.id,
        reference_type = 'product'
    FROM products p
    WHERE il.reference_id = p.id::text
    AND il.reference_type IS NULL;

    -- Try to match reference_id with product_variants
    UPDATE inventory_logs il
    SET
        variant_reference_id = pv.id,
        reference_type = 'variant'
    FROM product_variants pv
    WHERE il.reference_id = pv.id::text
    AND il.reference_type IS NULL;

    -- Set remaining as 'adjustment' type
    UPDATE inventory_logs
    SET reference_type = 'adjustment'
    WHERE reference_type IS NULL;

    RAISE NOTICE 'Migrated inventory_logs reference_id to typed references';
END $$;

-- Add indexes for new reference columns
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order_ref ON inventory_logs(order_reference_id) WHERE order_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_ref ON inventory_logs(product_reference_id) WHERE product_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant_ref ON inventory_logs(variant_reference_id) WHERE variant_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_reference_type ON inventory_logs(reference_type);

-- Add comments
COMMENT ON COLUMN inventory_logs.reference_type IS 'Type of reference: order, product, variant, adjustment, return, damage, transfer';
COMMENT ON COLUMN inventory_logs.order_reference_id IS 'FK to orders table when reference_type is order';
COMMENT ON COLUMN inventory_logs.product_reference_id IS 'FK to products table when reference_type is product';
COMMENT ON COLUMN inventory_logs.variant_reference_id IS 'FK to product_variants table when reference_type is variant';

-- ===================================================================
-- SECTION 3: Fix hrm_activities reference_id
-- ===================================================================

-- Add reference_type column if it doesn't exist
ALTER TABLE hrm_activities ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50) CHECK (reference_type IN ('leave', 'attendance', 'task', 'employee', 'other'));

-- Add specific reference columns
ALTER TABLE hrm_activities ADD COLUMN IF NOT EXISTS leave_reference_id UUID REFERENCES hrm_leaves(id) ON DELETE CASCADE;
ALTER TABLE hrm_activities ADD COLUMN IF NOT EXISTS attendance_reference_id UUID REFERENCES hrm_attendance(id) ON DELETE CASCADE;
ALTER TABLE hrm_activities ADD COLUMN IF NOT EXISTS task_reference_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE hrm_activities ADD COLUMN IF NOT EXISTS employee_reference_id UUID REFERENCES hrm_employees(id) ON DELETE CASCADE;

-- Migrate existing data
DO $$
BEGIN
    -- Try to match with leaves
    UPDATE hrm_activities ha
    SET
        leave_reference_id = l.id,
        reference_type = 'leave'
    FROM hrm_leaves l
    WHERE ha.reference_id = l.id::text
    AND ha.reference_type IS NULL;

    -- Try to match with attendance
    UPDATE hrm_activities ha
    SET
        attendance_reference_id = a.id,
        reference_type = 'attendance'
    FROM hrm_attendance a
    WHERE ha.reference_id = a.id::text
    AND ha.reference_type IS NULL;

    -- Try to match with tasks
    UPDATE hrm_activities ha
    SET
        task_reference_id = t.id,
        reference_type = 'task'
    FROM tasks t
    WHERE ha.reference_id = t.id::text
    AND ha.reference_type IS NULL;

    -- Try to match with employees
    UPDATE hrm_activities ha
    SET
        employee_reference_id = e.id,
        reference_type = 'employee'
    FROM hrm_employees e
    WHERE ha.reference_id = e.id::text
    AND ha.reference_type IS NULL;

    -- Set remaining as 'other'
    UPDATE hrm_activities
    SET reference_type = 'other'
    WHERE reference_type IS NULL;

    RAISE NOTICE 'Migrated hrm_activities reference_id to typed references';
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_hrm_activities_leave_ref ON hrm_activities(leave_reference_id) WHERE leave_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hrm_activities_attendance_ref ON hrm_activities(attendance_reference_id) WHERE attendance_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hrm_activities_task_ref ON hrm_activities(task_reference_id) WHERE task_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hrm_activities_employee_ref ON hrm_activities(employee_reference_id) WHERE employee_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hrm_activities_reference_type ON hrm_activities(reference_type);

-- Add comments
COMMENT ON COLUMN hrm_activities.reference_type IS 'Type of reference: leave, attendance, task, employee, other';
COMMENT ON COLUMN hrm_activities.leave_reference_id IS 'FK to hrm_leaves when reference_type is leave';
COMMENT ON COLUMN hrm_activities.attendance_reference_id IS 'FK to hrm_attendance when reference_type is attendance';
COMMENT ON COLUMN hrm_activities.task_reference_id IS 'FK to tasks when reference_type is task';
COMMENT ON COLUMN hrm_activities.employee_reference_id IS 'FK to hrm_employees when reference_type is employee';

-- ===================================================================
-- Migration Complete
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Migration 010 completed successfully!';
    RAISE NOTICE 'Added foreign key constraints for:';
    RAISE NOTICE '  - cart.session_uuid -> sessions';
    RAISE NOTICE '  - analytics_events.session_uuid -> sessions';
    RAISE NOTICE '  - discount_code_usage.session_uuid -> sessions';
    RAISE NOTICE '  - inventory_logs typed references';
    RAISE NOTICE '  - hrm_activities typed references';
    RAISE NOTICE '===========================================';
END $$;
