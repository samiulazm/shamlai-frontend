-- ============================================================================
-- SHOP SETTINGS UPDATE MIGRATION
-- Migration: 007_update_shop_settings
-- Description: Updates shop_settings table to use numeric shop IDs and adds shop_username
-- ============================================================================

-- Step 1: Drop existing foreign key constraint
ALTER TABLE shop_settings
  DROP CONSTRAINT IF EXISTS shop_settings_shop_id_fkey;

-- Step 2: Add user_id column (will hold the current shop_id value which is the user's UUID)
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 3: Copy current shop_id to user_id for existing records
UPDATE shop_settings
  SET user_id = shop_id::uuid
  WHERE user_id IS NULL;

-- Step 4: Make user_id NOT NULL after populating it
ALTER TABLE shop_settings
  ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Add shop_username column
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS shop_username VARCHAR(50);

-- Step 6: Populate shop_username with subdomain values for existing records
UPDATE shop_settings
  SET shop_username = subdomain
  WHERE shop_username IS NULL;

-- Step 7: Make shop_username NOT NULL and UNIQUE
ALTER TABLE shop_settings
  ALTER COLUMN shop_username SET NOT NULL;

-- Step 8: Add unique constraint on shop_username if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shop_settings_shop_username_key'
  ) THEN
    ALTER TABLE shop_settings
      ADD CONSTRAINT shop_settings_shop_username_key UNIQUE (shop_username);
  END IF;
END $$;

-- Step 9: Make subdomain NOT NULL if it isn't already
ALTER TABLE shop_settings
  ALTER COLUMN subdomain SET NOT NULL;

-- Step 10: Create a temporary column for new numeric shop IDs
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS shop_id_new VARCHAR(10);

-- Step 11: Generate unique random 8-10 digit shop IDs for existing records
-- This uses a function to ensure uniqueness
DO $$
DECLARE
  shop_record RECORD;
  new_shop_id VARCHAR(10);
  is_unique BOOLEAN;
  attempt_count INTEGER;
BEGIN
  FOR shop_record IN SELECT id FROM shop_settings WHERE shop_id_new IS NULL
  LOOP
    attempt_count := 0;
    is_unique := FALSE;

    WHILE NOT is_unique AND attempt_count < 100 LOOP
      -- Generate random 8-10 digit number
      DECLARE
        target_length INTEGER;
      BEGIN
        target_length := FLOOR(RANDOM() * 3)::INTEGER + 8;
        new_shop_id := LPAD(
          FLOOR(RANDOM() * (POWER(10, target_length) - POWER(10, target_length - 1)) + POWER(10, target_length - 1))::BIGINT::TEXT,
          8,
          '0'
        );
      END;

      -- Check if this ID is already used
      SELECT NOT EXISTS (
        SELECT 1 FROM shop_settings WHERE shop_id_new = new_shop_id
      ) INTO is_unique;

      attempt_count := attempt_count + 1;
    END LOOP;

    -- Update the record with the new shop ID, or raise an error if not unique
    IF is_unique THEN
      UPDATE shop_settings
        SET shop_id_new = new_shop_id
        WHERE id = shop_record.id;
    ELSE
      RAISE EXCEPTION 'Failed to generate unique shop ID for record % after 100 attempts', shop_record.id;
    END IF;
END $$;

-- Step 12: Drop the old shop_id column
ALTER TABLE shop_settings
  DROP COLUMN IF EXISTS shop_id;

-- Step 13: Rename shop_id_new to shop_id
ALTER TABLE shop_settings
  RENAME COLUMN shop_id_new TO shop_id;

-- Step 14: Make shop_id NOT NULL
ALTER TABLE shop_settings
  ALTER COLUMN shop_id SET NOT NULL;

-- Step 15: Add unique constraint on shop_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shop_settings_shop_id_key'
  ) THEN
    ALTER TABLE shop_settings
      ADD CONSTRAINT shop_settings_shop_id_key UNIQUE (shop_id);
  END IF;
END $$;

-- Step 16: Add foreign key constraint from user_id to users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shop_settings_user_id_fkey'
  ) THEN
    ALTER TABLE shop_settings
      ADD CONSTRAINT shop_settings_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 17: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_settings_user_id ON shop_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON shop_settings(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_username ON shop_settings(shop_username);

-- Verification query (commented out - uncomment to verify)
-- SELECT id, user_id, shop_id, shop_name, shop_username, subdomain FROM shop_settings LIMIT 10;
