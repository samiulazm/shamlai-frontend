# Database Migrations Guide

This guide explains how to run database migrations to create missing tables for your Shamlai e-commerce platform.

## 📋 Overview

The migration system automatically creates missing database tables when the web app runs. Migrations are located in `scripts/migrations/` directory.

## 🗂️ Migration Files

All migration files are numbered sequentially:

1. **001_accounting_tables.sql** - Creates accounting tables (accounts, expenses, income, liabilities)
2. **002_task_management_tables.sql** - Creates task and follow-up tables
3. **003_hrm_tables.sql** - Creates HRM tables (employees, attendance, activities, leaves)
4. **004_automation_tables.sql** - Creates workflow automation tables
5. **005_security_tables.sql** - Creates security tables (blocked IPs, blocked mobiles)
6. **006_ad_campaigns_table.sql** - Creates ad campaigns table

## 🚀 Running Migrations

### Method 1: Automatic (Recommended)

Migrations run automatically when you access the dashboard:

1. Start your Next.js app: `npm run dev`
2. Navigate to `/dashboard`
3. Migrations will run automatically on first load
4. Check browser console for migration status

### Method 2: Manual via API

Call the migration API endpoint:

```bash
# Run all migrations
curl http://localhost:3000/api/migrations

# Or in browser
# GET http://localhost:3000/api/migrations
```

### Method 3: Using Insforge MCP Tools

If you have access to Insforge MCP tools:

1. Read each migration file from `scripts/migrations/`
2. Use `mcp_insforge_run-raw-sql` tool to execute each SQL file
3. Run migrations in order (001, 002, 003, etc.)

Example:

```typescript
// Execute migration 001
(await mcp_insforge_run) -
  raw -
  sql({
    query: readFileSync('scripts/migrations/001_accounting_tables.sql', 'utf-8'),
    apiKey: 'your-api-key',
  });
```

### Method 4: Manual SQL Execution

1. Open each `.sql` file in `scripts/migrations/`
2. Copy the SQL content
3. Execute in your Insforge database using any SQL client
4. Run migrations in sequential order

## 📊 Tables Created

### Accounting Module

- `accounts` - Financial accounts
- `expenses` - Business expenses
- `income` - Income tracking
- `liabilities` - Debt and payables

### Task Management

- `tasks` - General tasks
- `followups` - Customer/order follow-ups
- `task_configs` - Automated task configurations

### HRM Module

- `hrm_employees` - Employee master data
- `hrm_attendance` - Attendance tracking
- `hrm_activities` - Activity logs
- `hrm_leaves` - Leave management

### Automation

- `workflows` - Workflow definitions
- `workflow_templates` - Reusable templates
- `workflow_executions` - Execution logs

### Security

- `blocked_ips` - IP blocking
- `blocked_mobiles` - Mobile number blocking

### Marketing

- `ad_campaigns` - Ad campaign tracking
- `ad_campaign_products` - Campaign-product links

## ✅ Verification

After running migrations, verify tables were created:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'accounts', 'expenses', 'income', 'liabilities',
  'tasks', 'followups', 'task_configs',
  'hrm_employees', 'hrm_attendance', 'hrm_activities', 'hrm_leaves',
  'workflows', 'workflow_templates', 'workflow_executions',
  'blocked_ips', 'blocked_mobiles',
  'ad_campaigns', 'ad_campaign_products'
)
ORDER BY table_name;
```

## 🔄 Migration Status

The app tracks migration status using:

- Session storage (client-side) - prevents duplicate runs in same session
- API endpoint `/api/migrations` - returns migration status

## ⚠️ Important Notes

1. **Idempotent**: Migrations use `CREATE TABLE IF NOT EXISTS` - safe to run multiple times
2. **Order Matters**: Run migrations in sequential order (001, 002, 003...)
3. **No Data Loss**: Migrations only create tables, they don't modify existing data
4. **Error Handling**: If a table already exists, migration will skip it gracefully

## 🐛 Troubleshooting

### Migrations Not Running

1. Check browser console for errors
2. Verify API endpoint is accessible: `http://localhost:3000/api/migrations`
3. Check Insforge API key is configured
4. Verify migration files exist in `scripts/migrations/`

### Tables Already Exist

If tables already exist, migrations will skip them. This is expected behavior.

### Manual Execution Required

If automatic migrations fail:

1. Use Method 3 (MCP Tools) or Method 4 (Manual SQL)
2. Execute each migration file in order
3. Verify tables were created

## 📝 Adding New Migrations

To add new migrations:

1. Create new SQL file: `scripts/migrations/007_new_feature.sql`
2. Use `CREATE TABLE IF NOT EXISTS` for idempotency
3. Add indexes for performance
4. Add comments for documentation
5. Migration will run automatically on next app start

## 🔗 Related Files

- `scripts/migrations/` - Migration SQL files
- `app/api/migrations/route.ts` - Migration API endpoint
- `app/(dashboard)/layout.tsx` - Auto-migration trigger
- `lib/utils/migrations.ts` - Migration utilities

---

**Last Updated:** January 2025
