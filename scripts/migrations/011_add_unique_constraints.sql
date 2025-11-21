-- Migration 011: Add Missing UNIQUE Constraints
-- Purpose: Add UNIQUE constraints to prevent duplicate data
-- Date: 2025-11-21

-- ===================================================================
-- SECTION 1: Add UNIQUE Constraint to users.email
-- ===================================================================

DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicate emails
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT email, COUNT(*) as cnt
        FROM users
        WHERE email IS NOT NULL
        GROUP BY email
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate email(s) in users table', duplicate_count;
        RAISE NOTICE 'Creating backup table with duplicates...';

        -- Create backup table with duplicates
        CREATE TABLE IF NOT EXISTS users_duplicate_emails_backup AS
        SELECT u.*
        FROM users u
        INNER JOIN (
            SELECT email
            FROM users
            WHERE email IS NOT NULL
            GROUP BY email
            HAVING COUNT(*) > 1
        ) dups ON u.email = dups.email
        ORDER BY u.email, u.created_at;

        RAISE NOTICE 'Duplicates backed up to users_duplicate_emails_backup';

        -- Keep only the oldest account for each duplicate email
        -- Delete newer duplicates
        DELETE FROM users
        WHERE id IN (
            SELECT u.id
            FROM users u
            INNER JOIN (
                SELECT email, MIN(created_at) as first_created
                FROM users
                WHERE email IS NOT NULL
                GROUP BY email
                HAVING COUNT(*) > 1
            ) keeper ON u.email = keeper.email
            WHERE u.created_at > keeper.first_created
        );

        RAISE NOTICE 'Removed duplicate email accounts, kept oldest for each email';
    ELSE
        RAISE NOTICE 'No duplicate emails found in users table';
    END IF;
END $$;

-- Now add the UNIQUE constraint
ALTER TABLE users ADD CONSTRAINT unique_users_email UNIQUE (email);

-- Add index for faster email lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON CONSTRAINT unique_users_email ON users IS 'Ensures each email can only be used once';

-- ===================================================================
-- SECTION 2: Add UNIQUE Constraint to customers (shop_id + email)
-- ===================================================================

DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicate customer emails per shop
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT shop_id, email, COUNT(*) as cnt
        FROM customers
        WHERE email IS NOT NULL AND is_active = true
        GROUP BY shop_id, email
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate customer email(s) per shop', duplicate_count;
        RAISE NOTICE 'Creating backup table with duplicates...';

        -- Create backup table with duplicates
        CREATE TABLE IF NOT EXISTS customers_duplicate_emails_backup AS
        SELECT c.*
        FROM customers c
        INNER JOIN (
            SELECT shop_id, email
            FROM customers
            WHERE email IS NOT NULL AND is_active = true
            GROUP BY shop_id, email
            HAVING COUNT(*) > 1
        ) dups ON c.shop_id = dups.shop_id AND c.email = dups.email
        WHERE c.is_active = true
        ORDER BY c.shop_id, c.email, c.created_at;

        RAISE NOTICE 'Duplicates backed up to customers_duplicate_emails_backup';

        -- Keep only the oldest customer for each shop+email combination
        -- Soft delete newer duplicates
        UPDATE customers
        SET is_active = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN (
            SELECT c.id
            FROM customers c
            INNER JOIN (
                SELECT shop_id, email, MIN(created_at) as first_created
                FROM customers
                WHERE email IS NOT NULL AND is_active = true
                GROUP BY shop_id, email
                HAVING COUNT(*) > 1
            ) keeper ON c.shop_id = keeper.shop_id AND c.email = keeper.email
            WHERE c.created_at > keeper.first_created
            AND c.is_active = true
        );

        RAISE NOTICE 'Soft-deleted duplicate customers, kept oldest for each shop+email';
    ELSE
        RAISE NOTICE 'No duplicate customer emails found per shop';
    END IF;
END $$;

-- Add partial UNIQUE index (only for active customers)
CREATE UNIQUE INDEX IF NOT EXISTS unique_customer_email_per_shop
ON customers(shop_id, email)
WHERE is_active = true AND email IS NOT NULL;

COMMENT ON INDEX unique_customer_email_per_shop IS 'Ensures each email is unique per shop for active customers';

-- ===================================================================
-- SECTION 3: Add Other Recommended UNIQUE Constraints
-- ===================================================================

-- Ensure shop settings are unique per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_shop_settings_per_user
ON shop_settings(user_id)
WHERE is_active = true;

COMMENT ON INDEX unique_shop_settings_per_user IS 'One shop settings per user (active only)';

-- Ensure discount codes are unique per shop
DO $$
BEGIN
    -- Check if the column and constraint make sense
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discount_codes' AND column_name = 'code') THEN
        -- Check for duplicates
        IF EXISTS (
            SELECT code, shop_id, COUNT(*)
            FROM discount_codes
            WHERE is_active = true
            GROUP BY code, shop_id
            HAVING COUNT(*) > 1
        ) THEN
            RAISE NOTICE 'Found duplicate discount codes per shop';

            -- Create backup
            CREATE TABLE IF NOT EXISTS discount_codes_duplicates_backup AS
            SELECT dc.*
            FROM discount_codes dc
            INNER JOIN (
                SELECT code, shop_id
                FROM discount_codes
                WHERE is_active = true
                GROUP BY code, shop_id
                HAVING COUNT(*) > 1
            ) dups ON dc.code = dups.code AND dc.shop_id = dups.shop_id
            WHERE dc.is_active = true;

            -- Soft delete duplicates, keep oldest
            UPDATE discount_codes
            SET is_active = false
            WHERE id IN (
                SELECT dc.id
                FROM discount_codes dc
                INNER JOIN (
                    SELECT code, shop_id, MIN(created_at) as first_created
                    FROM discount_codes
                    WHERE is_active = true
                    GROUP BY code, shop_id
                    HAVING COUNT(*) > 1
                ) keeper ON dc.code = keeper.code AND dc.shop_id = keeper.shop_id
                WHERE dc.created_at > keeper.first_created
                AND dc.is_active = true
            );
        END IF;

        -- Add unique constraint
        CREATE UNIQUE INDEX IF NOT EXISTS unique_discount_code_per_shop
        ON discount_codes(shop_id, code)
        WHERE is_active = true;

        COMMENT ON INDEX unique_discount_code_per_shop IS 'Discount codes must be unique per shop';
    END IF;
END $$;

-- Ensure product SKUs are unique per shop (if SKU column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS unique_product_sku_per_shop
        ON products(shop_id, sku)
        WHERE is_active = true AND sku IS NOT NULL AND sku != '';

        COMMENT ON INDEX unique_product_sku_per_shop IS 'Product SKUs must be unique per shop (when provided)';
        RAISE NOTICE 'Added unique constraint for product SKUs per shop';
    END IF;
END $$;

-- Ensure product variant SKUs are unique per shop (if SKU column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'sku') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS unique_variant_sku_per_shop
        ON product_variants(shop_id, sku)
        WHERE is_active = true AND sku IS NOT NULL AND sku != '';

        COMMENT ON INDEX unique_variant_sku_per_shop IS 'Variant SKUs must be unique per shop (when provided)';
        RAISE NOTICE 'Added unique constraint for variant SKUs per shop';
    END IF;
END $$;

-- ===================================================================
-- SECTION 4: Email Validation
-- ===================================================================

-- Add CHECK constraint to validate email format (basic validation)
DO $$
BEGIN
    -- Users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'users' AND constraint_name = 'check_users_email_format'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT check_users_email_format
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

        RAISE NOTICE 'Added email format validation to users table';
    END IF;

    -- Customers table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'customers' AND constraint_name = 'check_customers_email_format'
    ) THEN
        ALTER TABLE customers
        ADD CONSTRAINT check_customers_email_format
        CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

        RAISE NOTICE 'Added email format validation to customers table';
    END IF;
END $$;

-- ===================================================================
-- Migration Complete
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Migration 011 completed successfully!';
    RAISE NOTICE 'Added UNIQUE constraints for:';
    RAISE NOTICE '  - users.email';
    RAISE NOTICE '  - customers(shop_id, email) for active records';
    RAISE NOTICE '  - shop_settings per user';
    RAISE NOTICE '  - discount_codes per shop';
    RAISE NOTICE '  - product/variant SKUs per shop (if columns exist)';
    RAISE NOTICE 'Added email format validation';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Note: Check backup tables if duplicates were found:';
    RAISE NOTICE '  - users_duplicate_emails_backup';
    RAISE NOTICE '  - customers_duplicate_emails_backup';
    RAISE NOTICE '  - discount_codes_duplicates_backup';
    RAISE NOTICE '===========================================';
END $$;
