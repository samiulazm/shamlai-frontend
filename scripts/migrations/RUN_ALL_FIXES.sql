-- ===================================================================
-- MASTER MIGRATION SCRIPT - Database Fixes
-- ===================================================================
-- This script runs all database fix migrations in the correct order
-- Date: 2025-11-21
-- Purpose: Fix all identified database issues from audit
--
-- IMPORTANT:
-- 1. Test on staging/development environment first!
-- 2. Backup your database before running
-- 3. Review each migration file before executing
-- 4. Run during low-traffic period
-- ===================================================================

-- Enable verbose output
\set ON_ERROR_STOP on
\set VERBOSITY verbose

-- Start transaction (optional - remove if you want to run migrations without transaction)
-- BEGIN;

-- Create a migration tracking table
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'completed',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Function to log migration
CREATE OR REPLACE FUNCTION log_migration(
    p_migration_name VARCHAR,
    p_execution_time_ms INTEGER DEFAULT NULL,
    p_status VARCHAR DEFAULT 'completed',
    p_error_message TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO migration_history (
        migration_name,
        executed_at,
        execution_time_ms,
        status,
        error_message
    ) VALUES (
        p_migration_name,
        CURRENT_TIMESTAMP,
        p_execution_time_ms,
        p_status,
        p_error_message
    )
    ON CONFLICT (migration_name) DO UPDATE SET
        executed_at = CURRENT_TIMESTAMP,
        execution_time_ms = p_execution_time_ms,
        status = p_status,
        error_message = p_error_message;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- PRE-MIGRATION CHECKS
-- ===================================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_has_users BOOLEAN;
    v_has_products BOOLEAN;
    v_has_orders BOOLEAN;
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'PRE-MIGRATION CHECKS';
    RAISE NOTICE '===========================================';

    -- Check if critical tables exist
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public';

    RAISE NOTICE 'Found % tables in public schema', v_table_count;

    -- Check for critical tables
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') INTO v_has_users;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') INTO v_has_products;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') INTO v_has_orders;

    IF NOT v_has_users THEN
        RAISE EXCEPTION 'Critical table "users" not found! Aborting migration.';
    END IF;

    IF NOT v_has_products THEN
        RAISE WARNING 'Table "products" not found - some migrations may be skipped';
    END IF;

    IF NOT v_has_orders THEN
        RAISE WARNING 'Table "orders" not found - some migrations may be skipped';
    END IF;

    RAISE NOTICE 'Pre-migration checks passed!';
    RAISE NOTICE '';
END $$;

-- ===================================================================
-- MIGRATION 009: Create Sessions Table
-- ===================================================================

DO $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_duration_ms INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Running Migration 009: Create Sessions Table';
    RAISE NOTICE '===========================================';

    -- Check if already run
    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '009_create_sessions_table') THEN
        RAISE NOTICE 'Migration 009 already executed, skipping...';
    ELSE
        \i scripts/migrations/009_create_sessions_table.sql

        v_end_time := clock_timestamp();
        v_duration_ms := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;

        PERFORM log_migration('009_create_sessions_table', v_duration_ms, 'completed');
        RAISE NOTICE 'Migration 009 completed in %ms', v_duration_ms;
    END IF;

    RAISE NOTICE '';
END $$;

-- ===================================================================
-- MIGRATION 010: Add Missing Foreign Keys
-- ===================================================================

DO $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_duration_ms INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Running Migration 010: Add Missing Foreign Keys';
    RAISE NOTICE '===========================================';

    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '010_add_missing_foreign_keys') THEN
        RAISE NOTICE 'Migration 010 already executed, skipping...';
    ELSE
        \i scripts/migrations/010_add_missing_foreign_keys.sql

        v_end_time := clock_timestamp();
        v_duration_ms := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;

        PERFORM log_migration('010_add_missing_foreign_keys', v_duration_ms, 'completed');
        RAISE NOTICE 'Migration 010 completed in %ms', v_duration_ms;
    END IF;

    RAISE NOTICE '';
END $$;

-- ===================================================================
-- MIGRATION 011: Add UNIQUE Constraints
-- ===================================================================

DO $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_duration_ms INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Running Migration 011: Add UNIQUE Constraints';
    RAISE NOTICE '===========================================';

    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '011_add_unique_constraints') THEN
        RAISE NOTICE 'Migration 011 already executed, skipping...';
    ELSE
        \i scripts/migrations/011_add_unique_constraints.sql

        v_end_time := clock_timestamp();
        v_duration_ms := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;

        PERFORM log_migration('011_add_unique_constraints', v_duration_ms, 'completed');
        RAISE NOTICE 'Migration 011 completed in %ms', v_duration_ms;
    END IF;

    RAISE NOTICE '';
END $$;

-- ===================================================================
-- MIGRATION 012: Fix CASCADE Delete Rules
-- ===================================================================

DO $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_duration_ms INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Running Migration 012: Fix CASCADE Delete Rules';
    RAISE NOTICE '===========================================';

    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '012_fix_cascade_delete_rules') THEN
        RAISE NOTICE 'Migration 012 already executed, skipping...';
    ELSE
        \i scripts/migrations/012_fix_cascade_delete_rules.sql

        v_end_time := clock_timestamp();
        v_duration_ms := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;

        PERFORM log_migration('012_fix_cascade_delete_rules', v_duration_ms, 'completed');
        RAISE NOTICE 'Migration 012 completed in %ms', v_duration_ms;
    END IF;

    RAISE NOTICE '';
END $$;

-- ===================================================================
-- MIGRATION 013: Cart Migration Functions
-- ===================================================================

DO $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_duration_ms INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Running Migration 013: Cart Migration Functions';
    RAISE NOTICE '===========================================';

    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '013_cart_migration_functions') THEN
        RAISE NOTICE 'Migration 013 already executed, skipping...';
    ELSE
        \i scripts/migrations/013_cart_migration_functions.sql

        v_end_time := clock_timestamp();
        v_duration_ms := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;

        PERFORM log_migration('013_cart_migration_functions', v_duration_ms, 'completed');
        RAISE NOTICE 'Migration 013 completed in %ms', v_duration_ms;
    END IF;

    RAISE NOTICE '';
END $$;

-- ===================================================================
-- POST-MIGRATION VALIDATION
-- ===================================================================

DO $$
DECLARE
    v_sessions_count INTEGER;
    v_fk_count INTEGER;
    v_unique_constraints INTEGER;
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'POST-MIGRATION VALIDATION';
    RAISE NOTICE '===========================================';

    -- Check sessions table
    SELECT COUNT(*) INTO v_sessions_count
    FROM information_schema.tables
    WHERE table_name = 'sessions';

    IF v_sessions_count > 0 THEN
        RAISE NOTICE '✓ Sessions table created';
    ELSE
        RAISE WARNING '✗ Sessions table not found';
    END IF;

    -- Check foreign key count
    SELECT COUNT(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY';

    RAISE NOTICE '✓ Total foreign key constraints: %', v_fk_count;

    -- Check unique constraints
    SELECT COUNT(*) INTO v_unique_constraints
    FROM information_schema.table_constraints
    WHERE constraint_type = 'UNIQUE';

    RAISE NOTICE '✓ Total unique constraints: %', v_unique_constraints;

    -- Show CASCADE audit
    RAISE NOTICE '';
    RAISE NOTICE 'Running CASCADE delete rules audit...';
    RAISE NOTICE 'Run this query to see details:';
    RAISE NOTICE '  SELECT * FROM audit_cascade_rules();';

    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'ALL MIGRATIONS COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '===========================================';
END $$;

-- ===================================================================
-- MIGRATION SUMMARY
-- ===================================================================

SELECT
    migration_name,
    executed_at,
    execution_time_ms || 'ms' AS execution_time,
    status
FROM migration_history
ORDER BY executed_at DESC;

-- Commit transaction (if using transactions)
-- COMMIT;

-- ===================================================================
-- NEXT STEPS
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'NEXT STEPS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '';
    RAISE NOTICE '1. Review migration results above';
    RAISE NOTICE '2. Run validation queries:';
    RAISE NOTICE '   - SELECT * FROM audit_cascade_rules();';
    RAISE NOTICE '   - SELECT * FROM migration_history;';
    RAISE NOTICE '';
    RAISE NOTICE '3. Update application code to use:';
    RAISE NOTICE '   - session_uuid instead of session_id (cart, analytics_events)';
    RAISE NOTICE '   - merge_guest_cart_on_login() on user login';
    RAISE NOTICE '   - validate_user_cart() before checkout';
    RAISE NOTICE '';
    RAISE NOTICE '4. Set up scheduled cleanup job:';
    RAISE NOTICE '   - Run scheduled_cart_cleanup() daily';
    RAISE NOTICE '   - Run cleanup_expired_sessions() daily';
    RAISE NOTICE '';
    RAISE NOTICE '5. Check backup tables for duplicates:';
    RAISE NOTICE '   - users_duplicate_emails_backup';
    RAISE NOTICE '   - customers_duplicate_emails_backup';
    RAISE NOTICE '   - discount_codes_duplicates_backup';
    RAISE NOTICE '';
    RAISE NOTICE '6. Update TypeScript types:';
    RAISE NOTICE '   - Regenerate types from updated schema';
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
END $$;
