# Database Fix Migrations

This directory contains SQL migration scripts to fix critical database issues identified in the database audit.

## Overview

**Total Migrations:** 5 (009-013)
**Estimated Total Time:** ~5-10 minutes
**Impact Level:** Medium (requires application code updates)

## Migration Files

| File | Purpose | Impact | Duration |
|------|---------|--------|----------|
| `009_create_sessions_table.sql` | Creates sessions table for cart and analytics tracking | Low | ~30s |
| `010_add_missing_foreign_keys.sql` | Adds missing FK constraints for data integrity | Medium | ~2-3 min |
| `011_add_unique_constraints.sql` | Adds UNIQUE constraints to prevent duplicates | Medium | ~1-2 min |
| `012_fix_cascade_delete_rules.sql` | Fixes CASCADE rules to preserve historical data | Low | ~30s |
| `013_cart_migration_functions.sql` | Creates cart management and migration functions | Low | ~30s |
| `RUN_ALL_FIXES.sql` | Master script that runs all migrations in order | - | ~5-10 min |

## Quick Start

### Option 1: Run All Migrations (Recommended)

```bash
# Connect to your database
psql -U your_username -d your_database

# Run the master migration script
\i scripts/migrations/RUN_ALL_FIXES.sql
```

### Option 2: Run Individual Migrations

```bash
# Run migrations in order
psql -U your_username -d your_database -f scripts/migrations/009_create_sessions_table.sql
psql -U your_username -d your_database -f scripts/migrations/010_add_missing_foreign_keys.sql
psql -U your_username -d your_database -f scripts/migrations/011_add_unique_constraints.sql
psql -U your_username -d your_database -f scripts/migrations/012_fix_cascade_delete_rules.sql
psql -U your_username -d your_database -f scripts/migrations/013_cart_migration_functions.sql
```

## Pre-Migration Checklist

- [ ] **Backup your database**
  ```bash
  pg_dump -U your_username -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Test on staging/development environment first**

- [ ] **Schedule during low-traffic period**

- [ ] **Notify team members about planned downtime (if any)**

- [ ] **Review each migration file to understand changes**

- [ ] **Check disk space** (for backup tables and indexes)

## What Each Migration Does

### 009: Create Sessions Table

**Purpose:** Add missing `sessions` table for proper session tracking

**Changes:**
- Creates `sessions` table with UUID primary key
- Adds indexes for performance
- Creates cleanup functions for expired sessions
- Creates trigger for automatic `last_activity` updates

**Why:** Currently, `cart` and `analytics_events` tables reference `session_id` as a string without a proper sessions table. This creates data integrity issues.

---

### 010: Add Missing Foreign Keys

**Purpose:** Add FK constraints that were missing in original schema

**Changes:**
- Migrates `cart.session_id` → `cart.session_uuid` (FK to sessions)
- Migrates `analytics_events.session_id` → `analytics_events.session_uuid`
- Migrates `discount_code_usage.session_id` → `discount_code_usage.session_uuid`
- Adds typed reference columns to `inventory_logs` (order_reference_id, product_reference_id, variant_reference_id)
- Adds typed reference columns to `hrm_activities` (leave_reference_id, attendance_reference_id, etc.)
- Migrates existing data to new typed columns

**Why:** Generic `reference_id` VARCHAR fields can point to non-existent records, causing data integrity issues.

**Note:** Old `session_id` VARCHAR columns are kept for backward compatibility. To fully migrate:
1. Update application code to use `session_uuid`
2. Drop old `session_id` columns after verification

---

### 011: Add UNIQUE Constraints

**Purpose:** Prevent duplicate data

**Changes:**
- Adds UNIQUE constraint to `users.email`
- Adds partial UNIQUE index to `customers(shop_id, email)` for active records
- Adds UNIQUE index to `shop_settings` per user
- Adds UNIQUE index to `discount_codes` per shop
- Adds UNIQUE index to product/variant SKUs per shop (if columns exist)
- Adds email format validation CHECK constraints
- Creates backup tables for any duplicates found

**Duplicate Handling:**
- **Users:** Keeps oldest account, backs up duplicates to `users_duplicate_emails_backup`
- **Customers:** Soft-deletes duplicates (sets `is_active = false`), backs up to `customers_duplicate_emails_backup`
- **Discount Codes:** Soft-deletes duplicates, backs up to `discount_codes_duplicates_backup`

**Why:** Without UNIQUE constraints, users can create multiple accounts with same email, customers can be duplicated, etc.

---

### 012: Fix CASCADE Delete Rules

**Purpose:** Change CASCADE to SET NULL where historical data should be preserved

**Changes:**
- `product_reviews.order_id`: CASCADE → SET NULL (preserve reviews when order deleted)
- `order_items.product_id`: → SET NULL (preserve order history when product deleted)
- `order_items.variant_id`: → SET NULL
- `orders.customer_id`: → SET NULL (handle guest orders and deleted customers)
- `inventory_logs` references: → SET NULL (preserve inventory history)
- `analytics_events` references: → SET NULL (preserve analytics data)
- `discount_code_usage` references: → SET NULL (preserve usage history)
- Creates `audit_cascade_rules()` function to review all FK delete rules

**Why:** Deleting a product/order/customer shouldn't cascade delete to historical records (reviews, analytics, logs).

**Verified CASCADE (kept as-is):**
- `payments → orders` (CASCADE correct - tied to order lifecycle)
- `product_images → products` (CASCADE correct)
- `addresses → customers` (CASCADE correct - tied to customer)

---

### 013: Cart Migration Functions

**Purpose:** Handle guest-to-user cart transitions and cart management

**Functions Created:**

1. **`merge_guest_cart_on_login(user_id, session_id, shop_id)`**
   - Merges guest cart into user cart when user logs in
   - Adds quantities for duplicate items
   - Deletes guest cart after merge
   - Returns summary: (items_merged, items_updated, items_added)

2. **`cleanup_abandoned_carts(days_old)`**
   - Removes guest carts not updated in X days (default 30)
   - Returns count of deleted items

3. **`cleanup_empty_carts()`**
   - Removes cart items with quantity <= 0
   - Returns count of deleted items

4. **`validate_cart_item_availability(cart_id)`**
   - Validates if a cart item is available and in stock
   - Returns availability status and message

5. **`validate_user_cart(user_id, session_id)`**
   - Validates all items in a user or guest cart
   - Returns detailed availability for each item

6. **`get_cart_summary(user_id, session_id, shop_id)`**
   - Returns cart summary: total items, quantity, subtotal, available/unavailable counts

7. **`scheduled_cart_cleanup()`**
   - Runs all cleanup functions (abandoned carts, empty carts, expired sessions)
   - Designed to be called by a daily cron job

**Why:** Currently no documented logic for merging guest carts when users log in. This causes lost cart items and poor user experience.

---

## Post-Migration Steps

### 1. Validate Migrations

```sql
-- Check all migrations ran successfully
SELECT * FROM migration_history ORDER BY executed_at DESC;

-- Audit CASCADE delete rules
SELECT * FROM audit_cascade_rules();

-- Check sessions table
SELECT COUNT(*) FROM sessions;

-- Check for backup tables (if duplicates were found)
SELECT COUNT(*) FROM users_duplicate_emails_backup;
SELECT COUNT(*) FROM customers_duplicate_emails_backup;
SELECT COUNT(*) FROM discount_codes_duplicates_backup;
```

### 2. Update Application Code

#### Update Cart Logic

```typescript
// On user login, merge guest cart
const result = await db.query(`
  SELECT * FROM merge_guest_cart_on_login($1, $2)
`, [userId, sessionId]);

console.log(`Merged ${result.items_merged} items`);
```

#### Update Session Handling

```typescript
// Use session_uuid instead of session_id
await db.query(`
  INSERT INTO cart (user_id, session_uuid, product_id, quantity, shop_id)
  VALUES ($1, $2, $3, $4, $5)
`, [userId, sessionUuid, productId, quantity, shopId]);
```

#### Validate Cart Before Checkout

```typescript
// Validate cart before checkout
const validation = await db.query(`
  SELECT * FROM validate_user_cart($1, NULL)
`, [userId]);

const unavailable = validation.rows.filter(item => !item.is_available);
if (unavailable.length > 0) {
  // Show error to user about unavailable items
}
```

### 3. Set Up Scheduled Jobs

Add to your cron jobs or task scheduler:

```bash
# Run daily at 2 AM
0 2 * * * psql -U your_username -d your_database -c "SELECT * FROM scheduled_cart_cleanup();"
```

Or in Node.js with node-cron:

```javascript
const cron = require('node-cron');

// Run cleanup daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const result = await db.query('SELECT * FROM scheduled_cart_cleanup()');
  console.log('Cleanup results:', result.rows[0]);
});
```

### 4. Update TypeScript Types

Regenerate your database types to reflect the new columns:

```bash
# If using Prisma
npx prisma db pull
npx prisma generate

# If using kysely-codegen
npx kysely-codegen

# If using pg-typegen
npm run generate:types
```

### 5. Review Duplicate Data

If migrations found duplicates, review the backup tables:

```sql
-- Review duplicate users
SELECT * FROM users_duplicate_emails_backup ORDER BY email, created_at;

-- Review duplicate customers
SELECT * FROM customers_duplicate_emails_backup ORDER BY shop_id, email, created_at;

-- Review duplicate discount codes
SELECT * FROM discount_codes_duplicates_backup ORDER BY shop_id, code, created_at;
```

Decide if you need to manually merge any data or notify affected users.

## Rollback Procedures

### Rollback Migration 013 (Cart Functions)

```sql
DROP FUNCTION IF EXISTS merge_guest_cart_on_login(UUID, VARCHAR, UUID);
DROP FUNCTION IF EXISTS cleanup_abandoned_carts(INTEGER);
DROP FUNCTION IF EXISTS cleanup_empty_carts();
DROP FUNCTION IF EXISTS validate_cart_item_availability(UUID);
DROP FUNCTION IF EXISTS validate_user_cart(UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_cart_summary(UUID, VARCHAR, UUID);
DROP FUNCTION IF EXISTS scheduled_cart_cleanup();
DROP FUNCTION IF EXISTS migrate_cart_sessions_to_sessions_table();
```

### Rollback Migration 012 (CASCADE Rules)

```sql
-- Revert product_reviews.order_id to CASCADE
ALTER TABLE product_reviews
DROP CONSTRAINT IF EXISTS product_reviews_order_id_fkey,
ADD CONSTRAINT product_reviews_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Revert other constraints similarly...
-- (Generate based on your original schema)
```

### Rollback Migration 011 (UNIQUE Constraints)

```sql
-- Remove UNIQUE constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_users_email;
DROP INDEX IF EXISTS unique_customer_email_per_shop;
DROP INDEX IF EXISTS unique_shop_settings_per_user;
DROP INDEX IF EXISTS unique_discount_code_per_shop;
DROP INDEX IF EXISTS unique_product_sku_per_shop;
DROP INDEX IF EXISTS unique_variant_sku_per_shop;

-- Remove CHECK constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_users_email_format;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS check_customers_email_format;

-- Restore duplicates from backup tables (if needed)
-- Manual process based on your business logic
```

### Rollback Migration 010 (Foreign Keys)

```sql
-- Remove new FK columns
ALTER TABLE cart DROP COLUMN IF EXISTS session_uuid;
ALTER TABLE analytics_events DROP COLUMN IF EXISTS session_uuid;
ALTER TABLE discount_code_usage DROP COLUMN IF EXISTS session_uuid;

ALTER TABLE inventory_logs DROP COLUMN IF EXISTS reference_type;
ALTER TABLE inventory_logs DROP COLUMN IF EXISTS order_reference_id;
ALTER TABLE inventory_logs DROP COLUMN IF EXISTS product_reference_id;
ALTER TABLE inventory_logs DROP COLUMN IF EXISTS variant_reference_id;

ALTER TABLE hrm_activities DROP COLUMN IF EXISTS reference_type;
ALTER TABLE hrm_activities DROP COLUMN IF EXISTS leave_reference_id;
ALTER TABLE hrm_activities DROP COLUMN IF EXISTS attendance_reference_id;
ALTER TABLE hrm_activities DROP COLUMN IF EXISTS task_reference_id;
ALTER TABLE hrm_activities DROP COLUMN IF EXISTS employee_reference_id;
```

### Rollback Migration 009 (Sessions Table)

```sql
DROP FUNCTION IF EXISTS cleanup_expired_sessions();
DROP FUNCTION IF EXISTS update_session_activity();
DROP TABLE IF EXISTS sessions CASCADE;
```

### Full Rollback (All Migrations)

```sql
-- WARNING: This will undo all fixes!
-- Only use if you need to completely revert

DROP TABLE IF EXISTS migration_history CASCADE;
-- Then run individual rollback procedures above in reverse order
```

## Troubleshooting

### Migration Fails on Duplicate Data

**Issue:** Migration 011 fails because it can't add UNIQUE constraint

**Solution:**
1. Migration automatically creates backup tables
2. Review duplicates in backup table
3. Manually resolve duplicates
4. Re-run migration

### Foreign Key Violation Errors

**Issue:** Migration 010 fails with FK violation

**Solution:**
1. Check which reference_id values don't match any records
2. Clean up orphaned data:
   ```sql
   DELETE FROM inventory_logs WHERE reference_id NOT IN (
     SELECT id::text FROM orders
     UNION
     SELECT id::text FROM products
   );
   ```
3. Re-run migration

### Session Migration Issues

**Issue:** Existing session_id values are too long or invalid

**Solution:**
1. Truncate or hash long session IDs:
   ```sql
   UPDATE cart SET session_id = MD5(session_id) WHERE LENGTH(session_id) > 255;
   ```
2. Re-run migration 009

## Testing Checklist

After running migrations, test these scenarios:

- [ ] User can log in with email (no duplicates)
- [ ] Guest cart merges correctly on login
- [ ] Cart validation works before checkout
- [ ] Products can be deleted without breaking orders
- [ ] Reviews are preserved when orders are deleted
- [ ] Analytics data is preserved when users are deleted
- [ ] Session cleanup runs without errors
- [ ] Foreign key constraints prevent invalid data
- [ ] UNIQUE constraints prevent duplicates

## Performance Impact

| Migration | Locks Tables | Estimated Downtime | Can Run Online? |
|-----------|--------------|-------------------|-----------------|
| 009 | No | None | Yes ✅ |
| 010 | Yes (brief) | <1 min | Partial ⚠️ |
| 011 | Yes (brief) | <2 min | Partial ⚠️ |
| 012 | Yes (brief) | <1 min | Partial ⚠️ |
| 013 | No | None | Yes ✅ |

**Recommendation:** Run migrations during low-traffic period to minimize impact.

## Support

If you encounter issues:

1. Check migration logs in `migration_history` table
2. Review PostgreSQL logs for errors
3. Restore from backup if needed
4. Contact database administrator

## Additional Resources

- [PostgreSQL Foreign Keys Documentation](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
- [PostgreSQL UNIQUE Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)
- [Database Audit Report](../../DATABASE_AUDIT_REPORT.md)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-21 | Initial migration suite (009-013) |
