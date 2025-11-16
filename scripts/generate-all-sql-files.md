# Generate All SQL Files

This document lists all 54 tables that need SQL files generated.

## Status

✅ = SQL file created
⏳ = Pending

### Core Tables (✅ Complete)

- ✅ products
- ✅ orders
- ✅ categories
- ✅ customers
- ✅ users
- ✅ shop_settings
- ✅ cart
- ✅ cart_items
- ✅ product_variants
- ✅ product_images
- ✅ order_items
- ✅ discount_codes
- ✅ shipping_methods
- ✅ payment_methods

### Remaining Tables (⏳ Pending)

- ⏳ accounts
- ⏳ ad_campaign_products
- ⏳ ad_campaigns
- ⏳ addresses
- ⏳ analytics_events
- ⏳ blocked_ips
- ⏳ blocked_mobiles
- ⏳ blog_posts
- ⏳ chatbot_conversations
- ⏳ chatbot_messages
- ⏳ custom_domains
- ⏳ discount_code_categories
- ⏳ discount_code_products
- ⏳ discount_code_usage
- ⏳ email_subscribers
- ⏳ expenses
- ⏳ followups
- ⏳ hrm_activities
- ⏳ hrm_attendance
- ⏳ hrm_employees
- ⏳ hrm_leaves
- ⏳ income
- ⏳ inventory_logs
- ⏳ liabilities
- ⏳ menu_items
- ⏳ navigation_menus
- ⏳ notifications
- ⏳ order_status_history
- ⏳ pages
- ⏳ payments
- ⏳ product_reviews
- ⏳ review_images
- ⏳ task_configs
- ⏳ tasks
- ⏳ tax_rates
- ⏳ themes
- ⏳ wishlists
- ⏳ workflow_executions
- ⏳ workflow_templates
- ⏳ workflows

## Usage

To generate SQL files for remaining tables, use MCP tool:

```
mcp_insforge_get-table-schema with tableName: "table_name"
```

Then create SQL file at: `scripts/database-schemas/table_name.sql`
