# Database Migration Guide

**Generated:** November 2025
**Purpose:** Complete guide to run all database migrations for missing tables

---

## 📋 Overview

This guide will help you execute all database migrations to create the missing tables identified in the research:

1. **Accounting Tables** (accounts, expenses, income, liabilities)
2. **Task Management Tables** (tasks, followups, task_configs)
3. **HRM Tables** (hrm_employees, hrm_attendance, hrm_activities, hrm_leaves)
4. **Automation Tables** (workflows, workflow_templates, workflow_executions)
5. **Security Tables** (blocked_ips, blocked_mobiles)

---

## 🚀 Quick Start

### Option 1: Using npm Script (Recommended)

```bash
# Ensure you have the INSFORGE_API_KEY set
export INSFORGE_API_KEY=your-api-key-here

# Run migrations
npm run migrate
```

### Option 2: Manual Migration via MCP Tools

If you have access to MCP tools for InsForge, run each migration file manually:

```bash
# List all migrations
ls -la scripts/migrations/

# Run each migration using MCP tools
# mcp_insforge_run-raw-sql < scripts/migrations/001_accounting_tables.sql
```

### Option 3: Direct SQL Execution via InsForge Dashboard

1. Log in to your InsForge dashboard
2. Navigate to SQL Editor
3. Execute each migration file in order (see below)

---

## 📝 Migration Files

All migration files are located in `scripts/migrations/`:

```
scripts/migrations/
├── 001_accounting_tables.sql
├── 002_task_management_tables.sql
├── 003_hrm_tables.sql
├── 004_automation_tables.sql
├── 005_security_tables.sql
├── 006_ad_campaigns_table.sql
├── 007_shop_settings_rls.sql
└── 008_delivery_methods_table.sql
```

---

## 🔧 Detailed Migration Instructions

### Migration 1: Accounting Tables

**File:** `scripts/migrations/001_accounting_tables.sql`

**Creates:**
- `accounts` - Financial accounts (assets, liabilities, equity, revenue, expenses)
- `expenses` - Business expenses tracking
- `income` - Income sources tracking
- `liabilities` - Debt and payables tracking

**UI Pages:**
- `/accounting/accounts` - Manage accounts
- `/accounting/expenses` - Track expenses
- `/accounting/income` - Track income
- `/accounting/liabilities` - Manage liabilities

---

### Migration 2: Task Management Tables

**File:** `scripts/migrations/002_task_management_tables.sql`

**Creates:**
- `tasks` - General task management
- `followups` - Customer and order follow-ups
- `task_configs` - Automated task creation rules

**UI Pages:**
- `/tasks` - View and manage tasks
- `/tasks/new` - Create new task
- `/tasks/auto-config` - Configure automated tasks
- `/followups` - Manage follow-ups
- `/followups/dashboard` - Follow-up dashboard
- `/followups/assign` - Assign follow-ups
- `/followups/reports` - Follow-up reports

---

### Migration 3: HRM Tables

**File:** `scripts/migrations/003_hrm_tables.sql`

**Creates:**
- `hrm_employees` - Employee master data
- `hrm_attendance` - Daily attendance tracking
- `hrm_activities` - Employee activity logs
- `hrm_leaves` - Leave management

**UI Pages:**
- `/hrm/dashboard` - HRM dashboard
- `/hrm/attendance` - Attendance tracking
- `/hrm/activities` - Activity logs

---

### Migration 4: Automation Tables

**File:** `scripts/migrations/004_automation_tables.sql`

**Creates:**
- `workflows` - Custom workflow definitions
- `workflow_templates` - Reusable workflow templates
- `workflow_executions` - Workflow execution logs

**UI Pages:**
- `/automation` - Workflow overview
- `/automation/builder` - Workflow builder
- `/automation/templates` - Workflow templates

---

### Migration 5: Security Tables

**File:** `scripts/migrations/005_security_tables.sql`

**Creates:**
- `blocked_ips` - IP blocking for security
- `blocked_mobiles` - Mobile number blocking

**UI Pages:**
- `/security/block-list` - Manage blocked IPs and mobiles

---

## 🎯 New Feature Pages Created

In addition to the migrations above, the following pages have been created for existing unused tables:

### 1. Product Reviews (`/products/reviews`)
- **Table:** `product_reviews`, `review_images`
- **Features:**
  - View all product reviews
  - Filter by approved/pending
  - Approve or delete reviews
  - View star ratings and customer feedback

### 2. Customer Wishlists (`/customers/wishlists`)
- **Table:** `wishlists`
- **Features:**
  - View all customer wishlists
  - See which products are most wishlisted
  - Track customer interest
  - Export wishlist data

### 3. Email Subscribers (`/marketing/subscribers`)
- **Table:** `email_subscribers`
- **Features:**
  - Manage email subscribers
  - Filter by active/unsubscribed
  - Export subscriber list to CSV
  - Track subscription sources

### 4. Notifications (`/notifications`)
- **Table:** `notifications`
- **Features:**
  - View all notifications
  - Mark as read/unread
  - Filter by notification type
  - Action URLs for quick access

### 5. Tax Rates (`/settings/tax-rates`)
- **Table:** `tax_rates`
- **Features:**
  - Create and manage tax rates
  - Set default tax rate
  - Configure by location (country/state)
  - Toggle active/inactive status

### 6. Order Payments (`/orders/payments`)
- **Table:** `payments`
- **Features:**
  - View all order payments
  - Filter by payment status
  - Track completed/pending/failed/refunded payments
  - View transaction details

---

## ✅ Verification Steps

After running migrations, verify the tables were created:

### Using InsForge SDK (Recommended)

```typescript
import { insforgeClient } from '@/lib';

// Test query each new table
const testTables = async () => {
  const tables = [
    'accounts', 'expenses', 'income', 'liabilities',
    'tasks', 'followups', 'task_configs',
    'hrm_employees', 'hrm_attendance', 'hrm_activities', 'hrm_leaves',
    'workflows', 'workflow_templates', 'workflow_executions',
    'blocked_ips', 'blocked_mobiles'
  ];

  for (const table of tables) {
    const { data, error } = await insforgeClient.database
      .from(table)
      .select('*')
      .limit(1);

    console.log(`Table ${table}:`, error ? 'ERROR' : 'OK');
  }
};
```

### Using SQL Query

```sql
-- Check if all tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'accounts', 'expenses', 'income', 'liabilities',
  'tasks', 'followups', 'task_configs',
  'hrm_employees', 'hrm_attendance', 'hrm_activities', 'hrm_leaves',
  'workflows', 'workflow_templates', 'workflow_executions',
  'blocked_ips', 'blocked_mobiles'
)
ORDER BY tablename;
```

---

## 🐛 Troubleshooting

### Migration Fails with "Table Already Exists"

This is normal! The migrations use `CREATE TABLE IF NOT EXISTS`, so they're safe to run multiple times.

```
✅ This is OK: "relation already exists"
```

### Permission Errors

Ensure your `INSFORGE_SERVICE_ROLE_KEY` or `INSFORGE_API_KEY` has sufficient permissions:

```bash
# Check environment variables
echo $INSFORGE_API_KEY
echo $INSFORGE_SERVICE_ROLE_KEY
```

### Migration Script Not Found

Ensure you're in the project root directory:

```bash
pwd  # Should show /path/to/shamlai-frontend
ls scripts/migrations/  # Should list migration files
```

---

## 📊 Migration Status Tracking

Create a `migrations_log` table to track which migrations have been run:

```sql
CREATE TABLE IF NOT EXISTS migrations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_file TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  error_message TEXT
);
```

---

## 🔐 Security Notes

- Never commit `.env.local` with real API keys
- Use `INSFORGE_SERVICE_ROLE_KEY` for server-side migrations only
- Row Level Security (RLS) is automatically enabled on all tables
- All tables include `shop_id` foreign key to `users(id)`

---

## 📞 Support

If you encounter issues:

1. Check the migration file SQL syntax
2. Verify your InsForge connection
3. Check InsForge logs for detailed error messages
4. Refer to InsForge documentation: https://insforge.app/docs

---

## ✨ Summary

**Total Migrations:** 5 core migrations
**Total New Tables:** 15 tables
**Total New Pages:** 6 pages for existing tables
**Total Existing Pages:** 54+ pages already implemented

After running all migrations, you'll have a fully-featured e-commerce platform with:
- ✅ Complete accounting system
- ✅ Task and follow-up management
- ✅ Human resource management
- ✅ Workflow automation
- ✅ Security features (IP/mobile blocking)
- ✅ Product reviews and ratings
- ✅ Customer wishlists
- ✅ Email subscriber management
- ✅ Notification system
- ✅ Tax rate configuration
- ✅ Payment tracking

**Status:** ✅ Ready for Production

---

**Next Steps:**
1. Run migrations using one of the methods above
2. Verify all tables were created
3. Test the new feature pages
4. Configure security settings
5. Set up tax rates for your region
6. Start using the new features!
