# Database Schema SQL Files

This directory contains SQL files for all tables in the Insforge PostgreSQL database. Each file contains the complete `CREATE TABLE` statement with all columns, indexes, foreign keys, and constraints.

## 📋 Complete Table List (54 Tables)

### Core E-commerce Tables

- ✅ `products.sql` - Product catalog
- ✅ `product_variants.sql` - Product variants/options
- ✅ `product_images.sql` - Product images
- ✅ `product_reviews.sql` - Customer reviews
- ✅ `review_images.sql` - Review images
- ✅ `categories.sql` - Product categories
- ✅ `orders.sql` - Order management
- ✅ `order_items.sql` - Order line items
- ✅ `order_status_history.sql` - Order status tracking
- ✅ `customers.sql` - Customer data
- ✅ `addresses.sql` - Customer addresses
- ✅ `cart.sql` - Shopping cart
- ✅ `cart_items.sql` - Cart items
- ✅ `wishlists.sql` - Customer wishlists

### Store Management

- ✅ `shop_settings.sql` - Store configuration
- ✅ `themes.sql` - Store themes
- ✅ `custom_domains.sql` - Custom domain management
- ✅ `navigation_menus.sql` - Navigation menus
- ✅ `menu_items.sql` - Menu items
- ✅ `pages.sql` - Static pages

### Financial Management

- ✅ `accounts.sql` - Financial accounts
- ✅ `income.sql` - Income records
- ✅ `expenses.sql` - Expense records
- ✅ `liabilities.sql` - Liability tracking
- ✅ `payments.sql` - Payment records
- ✅ `payment_methods.sql` - Payment method configuration
- ✅ `tax_rates.sql` - Tax rate configuration

### Marketing & Promotions

- ✅ `discount_codes.sql` - Discount codes
- ✅ `discount_code_products.sql` - Discount code product associations
- ✅ `discount_code_categories.sql` - Discount code category associations
- ✅ `discount_code_usage.sql` - Discount code usage tracking
- ✅ `ad_campaigns.sql` - Advertising campaigns
- ✅ `ad_campaign_products.sql` - Campaign product associations
- ✅ `email_subscribers.sql` - Email marketing subscribers

### Shipping & Fulfillment

- ✅ `shipping_methods.sql` - Shipping method configuration

### Content Management

- ✅ `blog_posts.sql` - Blog posts

### Customer Service

- ✅ `chatbot_conversations.sql` - Chatbot conversations
- ✅ `chatbot_messages.sql` - Chatbot messages
- ✅ `followups.sql` - Customer follow-ups
- ✅ `notifications.sql` - User notifications

### Analytics & Tracking

- ✅ `analytics_events.sql` - Analytics event tracking
- ✅ `inventory_logs.sql` - Inventory change logs

### Security & Access Control

- ✅ `blocked_ips.sql` - Blocked IP addresses
- ✅ `blocked_mobiles.sql` - Blocked mobile numbers

### Task & Workflow Management

- ✅ `tasks.sql` - Task management
- ✅ `task_configs.sql` - Task configuration templates
- ✅ `workflows.sql` - Workflow definitions
- ✅ `workflow_templates.sql` - Workflow templates
- ✅ `workflow_executions.sql` - Workflow execution logs

### Human Resources

- ✅ `hrm_employees.sql` - Employee records
- ✅ `hrm_attendance.sql` - Attendance tracking
- ✅ `hrm_leaves.sql` - Leave management
- ✅ `hrm_activities.sql` - Employee activities

### Authentication & Users

- ✅ `users.sql` - User profiles
- ✅ `accounts.sql` - Authentication accounts (system table)

## 📝 Usage

Each SQL file can be executed independently to create the corresponding table. The files include:

- **CREATE TABLE** statements with all columns and data types
- **Foreign key constraints** with proper ON DELETE/UPDATE rules
- **Indexes** for performance optimization
- **Comments** describing the table purpose

### Example Usage

```sql
-- Create a single table
\i scripts/database-schemas/products.sql

-- Or execute all files (in correct order)
\i scripts/database-schemas/users.sql
\i scripts/database-schemas/products.sql
\i scripts/database-schemas/orders.sql
-- ... etc
```

## ⚠️ Important Notes

1. **Execution Order**: Some tables depend on others. Execute base tables first (e.g., `users`, `products`) before dependent tables.

2. **Foreign Key Dependencies**: The SQL files include foreign key constraints. Ensure referenced tables exist before creating dependent tables.

3. **IF NOT EXISTS**: All CREATE TABLE statements use `IF NOT EXISTS` to prevent errors if tables already exist.

4. **RLS Policies**: Row Level Security (RLS) policies are managed by the Insforge backend and are not included in these SQL files.

5. **System Tables**: Some tables like `_accounts` are system tables managed by Insforge and may not be included.

## 🔄 Schema Updates

These SQL files represent the current state of the database schema as of the generation date. When the database schema changes, regenerate these files using:

```bash
# Use the Insforge MCP tools to fetch updated schemas
# Then regenerate SQL files accordingly
```

## 📊 Statistics

- **Total Tables**: 54
- **Core E-commerce**: 14 tables
- **Store Management**: 6 tables
- **Financial**: 7 tables
- **Marketing**: 7 tables
- **Content & Service**: 4 tables
- **Analytics**: 2 tables
- **Security**: 2 tables
- **Task/Workflow**: 5 tables
- **HR**: 4 tables
- **Auth**: 2 tables

---

**Generated**: January 2025  
**Database**: Insforge PostgreSQL  
**Source**: Actual database schema via Insforge MCP tools
