# Shamlai Application Enhancement Action Plan

## Based on Ecomdrive BD Portal Feature Analysis

**Project:** Shamlai Frontend Enhancement  
**Reference:** ECOMDRIVE_FEATURE_REPORT.md  
**Date:** November 8, 2025  
**Status:** Planning Phase

---

## 📋 EXECUTIVE SUMMARY

This action plan outlines the step-by-step implementation of Ecomdrive features into the Shamlai e-commerce platform. The plan is organized into phases, prioritizing high-impact features first, followed by advanced capabilities.

**Current Shamlai State:**

- ✅ Basic dashboard with simple stats
- ✅ Product management (CRUD)
- ✅ Order management (basic)
- ✅ Customer management
- ✅ Basic integrations (Delivery, Payments)
- ✅ Simple reports

**Target State (Ecomdrive-inspired):**

- 🎯 Advanced dashboard with real-time analytics
- 🎯 Comprehensive order management (11 status types)
- 🎯 Multi-channel order processing
- 🎯 Advanced inventory management
- 🎯 Task & Follow-up system
- 🎯 HRM module
- 🎯 Workflow automation
- 🎯 Advanced reporting
- 🎯 SMS integration
- 🎯 Courier rating system

---

## 🎯 IMPLEMENTATION PHASES

### **PHASE 1: Foundation & Core Enhancements** (Weeks 1-2)

**Priority: CRITICAL**  
**Estimated Time: 2 weeks**

---

## PHASE 1.1: Enhanced Dashboard Module

### Step 1.1.1: Upgrade Dashboard Overview Cards

**File:** `app/(dashboard)/dashboard/page.tsx`

**Current State:**

- Basic 4 cards (Today's Orders, Total Revenue, Total Orders, Pending Orders)
- Simple weekly chart
- Top products list

**Target State:**

- Add percentage change indicators (↑↓ arrows)
- Add Profit card (separate from revenue)
- Add Pending Web Orders count
- Add date picker for custom date ranges
- Add comparison period (Today vs Yesterday)

**Implementation Steps:**

1. **Update Dashboard Stats Interface**

   ```typescript
   // Add to dashboard/page.tsx
   interface DashboardStats {
     todayOrders: number;
     todayOrdersChange: number; // % change
     totalRevenue: number;
     revenueChange: number; // % change
     profit: number; // NEW
     profitChange: number; // NEW
     totalOrders: number;
     pendingOrders: number;
     pendingWebOrders: number; // NEW
   }
   ```

2. **Add Profit Calculation**
   - Fetch product cost prices
   - Calculate: Profit = Revenue - Cost
   - Store in database or calculate on-the-fly

3. **Add Percentage Change Logic**

   ```typescript
   // Calculate % change vs previous period
   const calculateChange = (current: number, previous: number) => {
     if (previous === 0) return current > 0 ? 100 : 0;
     return ((current - previous) / previous) * 100;
   };
   ```

4. **Add Date Range Picker Component**
   - Install date picker library (react-datepicker or similar)
   - Add date range selector to dashboard
   - Update queries to filter by date range

5. **Update UI Components**
   - Add up/down arrow indicators
   - Color code positive/negative changes
   - Add loading states

**Files to Create/Modify:**

- `app/(dashboard)/dashboard/page.tsx` - Main dashboard component
- `components/dashboard/StatCard.tsx` - Reusable stat card component
- `components/dashboard/DateRangePicker.tsx` - Date picker component
- `lib/services/dashboard.ts` - Dashboard data service

**Dependencies:**

- `react-datepicker` or `@radix-ui/react-calendar`
- Update database schema if needed for profit tracking

---

### Step 1.1.2: Add Web Order Report Widget

**File:** `app/(dashboard)/dashboard/page.tsx`

**Features to Add:**

- Order status breakdown (Processing, Complete, Cancel, Incomplete)
- Time-based filters (Today, Yesterday, 30D)
- Visual order distribution chart
- Status count badges

**Implementation Steps:**

1. **Create Web Order Report Component**

   ```typescript
   // components/dashboard/WebOrderReport.tsx
   interface WebOrderReportProps {
     dateRange: 'today' | 'yesterday' | '30d';
   }
   ```

2. **Add Order Status Aggregation**
   - Query orders grouped by status
   - Count orders per status
   - Calculate percentages

3. **Add Time Filter Tabs**
   - Today, Yesterday, 30D buttons
   - Update data on filter change

4. **Add Visual Chart**
   - Use recharts (already installed)
   - Pie chart or bar chart for status distribution

**Files to Create:**

- `components/dashboard/WebOrderReport.tsx`
- `lib/services/webOrders.ts` - Web order queries

---

### Step 1.1.3: Add Orders by Source Widget

**File:** `app/(dashboard)/dashboard/page.tsx`

**Features:**

- Multi-channel order tracking
- Source attribution analytics
- Chart visualization

**Implementation Steps:**

1. **Add Order Source Field**
   - Update Order type to include `source` field
   - Values: 'web', 'facebook', 'manual', 'phone', etc.

2. **Create Orders by Source Component**
   - Group orders by source
   - Display counts and percentages
   - Visual chart

**Files to Create:**

- `components/dashboard/OrdersBySource.tsx`
- Update `lib/types/database.ts` - Add source field

---

### Step 1.1.4: Add Order Counts Chart (30-day trend)

**File:** `app/(dashboard)/dashboard/page.tsx`

**Features:**

- 30-day trend visualization
- Created vs Sent to Courier comparison
- Interactive date range selection

**Implementation Steps:**

1. **Create Order Counts Component**

   ```typescript
   // components/dashboard/OrderCountsChart.tsx
   interface OrderCountsData {
     date: string;
     created: number;
     sentToCourier: number;
   }
   ```

2. **Add Courier Status Tracking**
   - Add `sent_to_courier_at` timestamp to orders
   - Track when orders are sent to courier

3. **Generate 30-day Data**
   - Query orders for last 30 days
   - Group by date
   - Count created vs sent

4. **Add Comparison Chart**
   - Dual-line chart (Created vs Sent)
   - Interactive tooltips

**Files to Create:**

- `components/dashboard/OrderCountsChart.tsx`
- Update database schema - Add `sent_to_courier_at` field

---

### Step 1.1.5: Add Hourly Web Orders Chart

**File:** `app/(dashboard)/dashboard/page.tsx`

**Features:**

- Hour-by-hour order analysis
- Today vs Yesterday comparison
- Line chart visualization

**Implementation Steps:**

1. **Create Hourly Orders Component**

   ```typescript
   // components/dashboard/HourlyOrdersChart.tsx
   interface HourlyData {
     hour: string; // "12 AM", "1 AM", etc.
     today: number;
     yesterday: number;
   }
   ```

2. **Query Hourly Data**
   - Group orders by hour (0-23)
   - Separate today vs yesterday
   - Format hours as "12 AM", "1 AM", etc.

3. **Add Comparison View**
   - Dual-line chart
   - Color-coded lines (today vs yesterday)

**Files to Create:**

- `components/dashboard/HourlyOrdersChart.tsx`

---

### Step 1.1.6: Enhance Top Sales Products Widget

**File:** `app/(dashboard)/dashboard/page.tsx`

**Current:** Simple product list  
**Target:** Sales volume ranking with filters

**Implementation Steps:**

1. **Add Sales Volume Calculation**
   - Count orders per product
   - Calculate total quantity sold
   - Calculate revenue per product

2. **Add Time Filters**
   - Today, Yesterday, 30D tabs
   - Update product ranking

3. **Add Product Images**
   - Display product thumbnails
   - Link to product detail page

**Files to Modify:**

- `app/(dashboard)/dashboard/page.tsx`
- `lib/services/products.ts` - Add sales analytics

---

## PHASE 1.2: Advanced Order Management

### Step 1.2.1: Expand Order Status Types

**File:** `app/(dashboard)/orders/page.tsx`  
**Current:** 6 statuses (pending, processing, shipped, delivered, cancelled, refunded)  
**Target:** 11 statuses (matching Ecomdrive)

**New Statuses to Add:**

- `rts` - Ready to Ship
- `pending_return` - Pending Return
- `returned` - Returned
- `partial` - Partial Delivery
- `pending_cancel` - Pending Cancel
- `preorder` - Preorder
- `lost` - Lost

**Implementation Steps:**

1. **Update Type Definitions**

   ```typescript
   // lib/types/database.ts
   export type OrderStatus =
     | 'pending'
     | 'rts' // NEW
     | 'processing'
     | 'shipped'
     | 'delivered'
     | 'pending_return' // NEW
     | 'returned' // NEW
     | 'partial' // NEW
     | 'cancelled'
     | 'pending_cancel' // NEW
     | 'preorder' // NEW
     | 'lost' // NEW
     | 'refunded';
   ```

2. **Update Database Schema**
   - Add new status values to enum
   - Update RLS policies if needed

3. **Update Order List UI**
   - Add status tabs for all 11 statuses
   - Add status badges with colors
   - Add status count badges

4. **Update Status Change Logic**
   - Add status transition rules
   - Validate status changes
   - Add status change history

**Files to Modify:**

- `lib/types/database.ts`
- `app/(dashboard)/orders/page.tsx`
- `lib/services/orders.ts`
- `components/orders/OrderStatusBadge.tsx` (new)

---

### Step 1.2.2: Add Delivery Method Filtering

**File:** `app/(dashboard)/orders/page.tsx`

**Features:**

- Filter orders by delivery method
- Delivery method tabs (Pathao, Steadfast, etc.)
- Count badges per method

**Implementation Steps:**

1. **Add Delivery Method Field**
   - Update Order type
   - Add delivery_method field

2. **Create Delivery Method Tabs**
   - Fetch unique delivery methods
   - Create tab component
   - Filter orders by selected method

3. **Add Delivery Method Management**
   - Create delivery methods page
   - CRUD operations for methods

**Files to Create/Modify:**

- `app/(dashboard)/orders/page.tsx`
- `components/orders/DeliveryMethodTabs.tsx` (new)
- `app/(dashboard)/delivery-methods/page.tsx` (new)
- `lib/services/deliveryMethods.ts` (new)

---

### Step 1.2.3: Enhance Order Table Columns

**File:** `app/(dashboard)/orders/page.tsx`

**Current Columns:**

- Order ID, Date, Customer, Status, Payment, Total, Actions

**New Columns to Add:**

- Created Date/Time (sortable)
- Invoice Number (with quick actions)
- Customer Details (Name, Phone, Courier Rating %, Address)
- Notes column
- Product Images
- Product Codes
- Quantity
- Order Status & Payment Status (separate)
- Custom Tags
- Print Options
- Upload Shipping Note
- Actions Menu (expanded)

**Implementation Steps:**

1. **Add Courier Rating System**

   ```typescript
   // Calculate courier success rate per customer/area
   interface CourierRating {
     customerId: string;
     deliveryMethod: string;
     successRate: number; // 0-100%
   }
   ```

2. **Add Product Images Column**
   - Fetch product images for order items
   - Display thumbnails
   - Link to product page

3. **Add Tags System**
   - Create tags table
   - Add tag management UI
   - Display tags in order table

4. **Add Notes Column**
   - Display order notes
   - Add note editing capability

5. **Add Print Options**
   - Invoice print button
   - Sticker print button
   - Bulk print

6. **Add Shipping Note Upload**
   - File upload component
   - Store shipping notes
   - Display uploaded status

**Files to Create:**

- `components/orders/OrderTable.tsx` (enhanced)
- `components/orders/CourierRating.tsx` (new)
- `components/orders/OrderTags.tsx` (new)
- `components/orders/PrintButtons.tsx` (new)
- `components/orders/ShippingNoteUpload.tsx` (new)
- `lib/services/tags.ts` (new)
- `lib/services/courierRatings.ts` (new)

---

### Step 1.2.4: Add Advanced Filtering & Search

**File:** `app/(dashboard)/orders/page.tsx`

**Features:**

- Advanced filter panel
- Multi-criteria filtering
- Search by invoice, customer, phone, product
- Sort by multiple columns
- Bulk selection and actions

**Implementation Steps:**

1. **Create Advanced Filter Component**

   ```typescript
   // components/orders/OrderFilters.tsx
   interface OrderFilters {
     status?: OrderStatus[];
     deliveryMethod?: string[];
     dateRange?: { start: Date; end: Date };
     customer?: string;
     minAmount?: number;
     maxAmount?: number;
     tags?: string[];
   }
   ```

2. **Add Search Functionality**
   - Search by invoice number
   - Search by customer name/phone
   - Search by product name/code
   - Real-time search

3. **Add Sort Options**
   - Sort by date, amount, status
   - Multi-column sorting
   - Sort direction toggle

4. **Add Bulk Actions**
   - Select multiple orders
   - Bulk status update
   - Bulk print
   - Bulk export

**Files to Create:**

- `components/orders/OrderFilters.tsx` (new)
- `components/orders/OrderSearch.tsx` (new)
- `components/orders/BulkActions.tsx` (new)

---

### Step 1.2.5: Add Super Edit Feature

**File:** `app/(dashboard)/orders/super-edit/page.tsx` (new)

**Features:**

- Bulk order editing
- Mass status updates
- Batch operations

**Implementation Steps:**

1. **Create Super Edit Page**
   - Order selection interface
   - Bulk edit form
   - Preview changes
   - Apply changes

2. **Add Bulk Update API**
   - Update multiple orders
   - Validate changes
   - Log bulk operations

**Files to Create:**

- `app/(dashboard)/orders/super-edit/page.tsx`
- `lib/services/bulkOrders.ts` (new)

---

### Step 1.2.6: Add Preorder Management

**File:** `app/(dashboard)/orders/preorders/page.tsx` (new)

**Features:**

- Separate preorder list
- Preorder tracking
- Customer communication

**Implementation Steps:**

1. **Create Preorder Page**
   - Filter orders with preorder status
   - Preorder-specific actions
   - Expected delivery date tracking

**Files to Create:**

- `app/(dashboard)/orders/preorders/page.tsx`

---

### Step 1.2.7: Add Scan to Update Feature

**File:** `app/(dashboard)/orders/scan/page.tsx` (new)

**Features:**

- Barcode/QR scanning
- Quick status updates
- Mobile-friendly interface

**Implementation Steps:**

1. **Add Barcode Scanner**
   - Install barcode scanner library
   - Camera access for mobile
   - Scan order barcode/QR

2. **Create Scan Page**
   - Scanner interface
   - Quick update form
   - Status change buttons

**Files to Create:**

- `app/(dashboard)/orders/scan/page.tsx`
- `components/orders/BarcodeScanner.tsx` (new)

**Dependencies:**

- `html5-qrcode` or `react-qr-reader`

---

## PHASE 1.3: Web Orders Module

### Step 1.3.1: Create Web Order List Page

**File:** `app/(dashboard)/web-orders/page.tsx` (new)

**Features:**

- List pending web orders
- Approval workflow
- Convert to approved orders
- Real-time synchronization

**Implementation Steps:**

1. **Create Web Orders Page**
   - Fetch pending web orders
   - Display order details
   - Approve/reject actions

2. **Add WooCommerce Integration**
   - API connection setup
   - Order sync logic
   - Product sync

**Files to Create:**

- `app/(dashboard)/web-orders/page.tsx`
- `app/(dashboard)/web-orders/[id]/page.tsx` (detail)
- `lib/services/woocommerce.ts` (new)

---

### Step 1.3.2: Add WooCommerce Integration Settings

**File:** `app/(dashboard)/integrations/woocommerce/page.tsx` (new)

**Features:**

- Connect WooCommerce stores
- API key management
- Sync settings
- Field mapping

**Implementation Steps:**

1. **Create Integration Page**
   - WooCommerce API form
   - Connection test
   - Sync configuration

**Files to Create:**

- `app/(dashboard)/integrations/woocommerce/page.tsx`
- `lib/services/woocommerce.ts` (enhance)

---

### Step 1.3.3: Add IP & Mobile Block Feature

**File:** `app/(dashboard)/security/block-list/page.tsx` (new)

**Features:**

- Block fraudulent customers
- IP address blacklist
- Phone number blacklist

**Implementation Steps:**

1. **Create Block List Page**
   - IP address management
   - Phone number management
   - Block/unblock actions

2. **Add Block Check Logic**
   - Check on order creation
   - Prevent blocked customers

**Files to Create:**

- `app/(dashboard)/security/block-list/page.tsx`
- `lib/services/security.ts` (new)

---

## PHASE 1.4: Enhanced Inventory Management

### Step 1.4.1: Add Stock Adjustment Features

**File:** `app/(dashboard)/inventory/adjustments/page.tsx` (new)

**Features:**

- Increase stock (purchases)
- Decrease stock (damage, returns)
- Stock transfer between locations
- Adjustment history

**Implementation Steps:**

1. **Create Stock Adjustment Pages**
   - New increase stock page
   - New decrease stock page
   - Adjustment list page
   - Transfer stock page

2. **Add Adjustment Service**
   - Create adjustment records
   - Update inventory
   - Track reasons

**Files to Create:**

- `app/(dashboard)/inventory/adjustments/increase/page.tsx`
- `app/(dashboard)/inventory/adjustments/decrease/page.tsx`
- `app/(dashboard)/inventory/adjustments/list/page.tsx`
- `app/(dashboard)/inventory/transfer/page.tsx`
- `lib/services/inventory.ts` (enhance)

---

### Step 1.4.2: Enhance Product List with Quick Actions

**File:** `app/(dashboard)/products/page.tsx`

**Features:**

- Quick stock increase/decrease buttons
- Stock quantity display with actions
- Real-time stock updates

**Implementation Steps:**

1. **Add Quick Actions to Product Table**
   - Increase/decrease buttons per row
   - Modal for quantity input
   - Instant update

**Files to Modify:**

- `app/(dashboard)/products/page.tsx`
- `components/products/QuickStockAdjust.tsx` (new)

---

## PHASE 2: Advanced Features (Weeks 3-4)

**Priority: HIGH**  
**Estimated Time: 2 weeks**

---

## PHASE 2.1: Task & Follow-up System

### Step 2.1.1: Create Follow-up Module

**Files:** Multiple new files

**Features:**

- Schedule follow-ups for orders
- Customizable reminders
- Automatic assignment
- Tracking and completion

**Implementation Steps:**

1. **Create Database Schema**

   ```sql
   CREATE TABLE followups (
     id UUID PRIMARY KEY,
     order_id UUID REFERENCES orders(id),
     assigned_to UUID REFERENCES users(id),
     scheduled_at TIMESTAMP,
     completed_at TIMESTAMP,
     status VARCHAR,
     notes TEXT,
     created_at TIMESTAMP
   );
   ```

2. **Create Follow-up Pages**
   - My Follow-ups page
   - Follow-up Dashboard
   - Assign Follow-ups page
   - Follow-up Reports

3. **Add Follow-up Service**
   - Create follow-ups
   - Schedule reminders
   - Mark as complete

**Files to Create:**

- `app/(dashboard)/followups/page.tsx`
- `app/(dashboard)/followups/dashboard/page.tsx`
- `app/(dashboard)/followups/assign/page.tsx`
- `app/(dashboard)/followups/reports/page.tsx`
- `lib/services/followups.ts` (new)

---

### Step 2.1.2: Create Task Management System

**Files:** Multiple new files

**Features:**

- Create and assign tasks
- Priority levels
- Due dates
- Status tracking

**Implementation Steps:**

1. **Create Task Pages**
   - New Task page
   - Task List page
   - Task detail page

2. **Add Task Service**
   - CRUD operations
   - Assignment logic
   - Status updates

**Files to Create:**

- `app/(dashboard)/tasks/new/page.tsx`
- `app/(dashboard)/tasks/page.tsx`
- `app/(dashboard)/tasks/[id]/page.tsx`
- `lib/services/tasks.ts` (new)

---

### Step 2.1.3: Add Auto Task Configuration

**File:** `app/(dashboard)/tasks/auto-config/page.tsx` (new)

**Features:**

- Automated task creation rules
- Trigger-based tasks
- Workflow integration

**Implementation Steps:**

1. **Create Auto Config Page**
   - Rule builder
   - Trigger configuration
   - Action setup

**Files to Create:**

- `app/(dashboard)/tasks/auto-config/page.tsx`
- `lib/services/autoTasks.ts` (new)

---

## PHASE 2.2: HRM Module

### Step 2.2.1: Create HRM Dashboard

**File:** `app/(dashboard)/hrm/dashboard/page.tsx` (new)

**Features:**

- Live employee tracking
- GPS location monitoring
- Activity logging

**Implementation Steps:**

1. **Create HRM Pages**
   - Live Dashboard
   - Activities page
   - Attendance Report

2. **Add Employee Tracking**
   - Location tracking (requires mobile app or browser geolocation)
   - Activity logging
   - Time tracking

**Files to Create:**

- `app/(dashboard)/hrm/dashboard/page.tsx`
- `app/(dashboard)/hrm/activities/page.tsx`
- `app/(dashboard)/hrm/attendance/page.tsx`
- `lib/services/hrm.ts` (new)

**Note:** Full GPS tracking requires mobile app or browser permissions

---

## PHASE 2.3: Automation Module

### Step 2.3.1: Create Workflow Builder

**File:** `app/(dashboard)/automation/workflows/page.tsx` (new)

**Features:**

- Visual workflow designer
- Drag-and-drop interface
- Trigger configuration
- Action setup

**Implementation Steps:**

1. **Install Workflow Library**
   - Consider `react-flow` or `react-diagrams`
   - Or build custom drag-and-drop

2. **Create Workflow Pages**
   - Workflows list
   - Workflow builder
   - Templates page

3. **Add Workflow Engine**
   - Trigger system
   - Action execution
   - Conditional logic

**Files to Create:**

- `app/(dashboard)/automation/workflows/page.tsx`
- `app/(dashboard)/automation/workflows/builder/page.tsx`
- `app/(dashboard)/automation/templates/page.tsx`
- `lib/services/workflows.ts` (new)

**Dependencies:**

- `react-flow` or similar workflow library

---

## PHASE 2.4: Advanced Reporting

### Step 2.4.1: Enhance Reports Module

**File:** `app/(dashboard)/reports/page.tsx`

**Features:**

- Profit & Sales Report
- Employee Report
- Order Report (enhanced)
- Product Report
- Web Order Report
- Meta Ads Report

**Implementation Steps:**

1. **Create Report Pages**
   - Profit & Sales page
   - Employee Report page
   - Enhanced Order Report
   - Product Report
   - Web Order Report

2. **Add Report Components**
   - Charts and visualizations
   - Export functionality
   - Date range filters

**Files to Create/Modify:**

- `app/(dashboard)/reports/profit-sales/page.tsx`
- `app/(dashboard)/reports/employee/page.tsx`
- `app/(dashboard)/reports/orders/page.tsx` (enhance)
- `app/(dashboard)/reports/products/page.tsx`
- `app/(dashboard)/reports/web-orders/page.tsx`
- `components/reports/ReportCharts.tsx` (new)

---

## PHASE 2.5: SMS Integration

### Step 2.5.1: Add SMS Module

**Files:** Multiple new files

**Features:**

- Send SMS manually
- Auto-send messages
- SMS log
- Template management

**Implementation Steps:**

1. **Integrate SMS Service**
   - Choose SMS provider (Twilio, MessageBird, etc.)
   - Add API integration

2. **Create SMS Pages**
   - Send SMS page
   - Auto Send configuration
   - SMS Log page

**Files to Create:**

- `app/(dashboard)/sms/send/page.tsx`
- `app/(dashboard)/sms/auto-send/page.tsx`
- `app/(dashboard)/sms/log/page.tsx`
- `lib/services/sms.ts` (new)

**Dependencies:**

- SMS API service (Twilio, MessageBird, etc.)

---

## PHASE 3: UI/UX Enhancements (Week 5)

**Priority: MEDIUM**  
**Estimated Time: 1 week**

---

## PHASE 3.1: Navigation & Sidebar Updates

### Step 3.1.1: Update Sidebar Navigation

**File:** `components/Sidebar.tsx`

**Changes:**

- Add new menu items matching Ecomdrive structure
- Add expandable sub-menus
- Add icons for all items
- Add active state indicators

**New Menu Structure:**

```
Dashboard
Search
Approved Orders
  ├── New Order
  ├── Order List
  ├── All List
  ├── Super Edit
  ├── Preorder List
  └── Scan To Update
Web Orders
  ├── Web Order List
  ├── Sync Products
  ├── WooCommerce Integration
  └── IP & Mobile Block
Inventory
  ├── Add New Product
  ├── Product List
  ├── Categories & Brands
  ├── Stock Adjustments
  └── Transfer Stock
Meta Ads
  ├── Meta Ads Report
  └── Campaign Products
Accounting
  ├── Accounts
  ├── Expenses
  ├── Income
  └── Liabilities
Task & Follow-up
  ├── My Follow-ups
  ├── Follow-up Dashboard
  ├── Assign Follow-ups
  ├── New Task
  └── Task List
HRM
  ├── Live Dashboard
  ├── Activities
  └── Attendance Report
Automation
  ├── Workflows
  ├── Create Workflow
  └── Templates
Delivery Methods
  ├── Delivery Method List
  └── Add Delivery Method
Settings
Reports
Customer
SMS
```

**Implementation Steps:**

1. **Update Sidebar Component**
   - Add nested menu structure
   - Add expand/collapse functionality
   - Update icons

**Files to Modify:**

- `components/Sidebar.tsx`
- `components/SidebarMenuItem.tsx` (new)

---

### Step 3.1.2: Add Top Navigation Bar

**File:** `components/Topbar.tsx` (enhance)

**Features:**

- Quick action buttons (Search, New Order, Web Orders, Order List, Send Message)
- Notification center
- Theme toggle
- User menu

**Implementation Steps:**

1. **Enhance Topbar Component**
   - Add quick action buttons
   - Add notification bell with badge
   - Add theme toggle
   - Add user dropdown menu

**Files to Modify:**

- `components/Topbar.tsx`

---

## PHASE 3.2: Courier Rating System

### Step 3.2.1: Implement Courier Rating

**Files:** Multiple files

**Features:**

- Calculate delivery success rate per customer/area/courier
- Display rating percentage
- Data-driven courier selection

**Implementation Steps:**

1. **Create Courier Rating Service**

   ```typescript
   // lib/services/courierRatings.ts
   interface CourierRating {
     customerId: string;
     deliveryMethod: string;
     area: string;
     successRate: number; // 0-100%
     totalDeliveries: number;
     successfulDeliveries: number;
   }
   ```

2. **Calculate Ratings**
   - Track delivery outcomes
   - Calculate success rates
   - Store in database

3. **Display Ratings**
   - Show in order list
   - Show in customer details
   - Use for courier selection

**Files to Create:**

- `lib/services/courierRatings.ts`
- `components/orders/CourierRatingBadge.tsx`

---

## PHASE 4: Database Schema Updates

**Priority: CRITICAL**  
**Estimated Time: Ongoing (parallel with development)**

---

### Step 4.1: Update Orders Table

```sql
-- Add new columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sent_to_courier_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_rating DECIMAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'rts';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_return';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'partial';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_cancel';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preorder';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'lost';
```

---

### Step 4.2: Create New Tables

```sql
-- Followups table
CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  assigned_to UUID REFERENCES users(id),
  scheduled_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  priority VARCHAR DEFAULT 'medium',
  due_date TIMESTAMP,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  color VARCHAR,
  shop_id UUID REFERENCES shops(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order tags junction table
CREATE TABLE IF NOT EXISTS order_tags (
  order_id UUID REFERENCES orders(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (order_id, tag_id)
);

-- Courier ratings table
CREATE TABLE IF NOT EXISTS courier_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  delivery_method VARCHAR NOT NULL,
  area VARCHAR,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stock adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  type VARCHAR NOT NULL, -- 'increase' or 'decrease'
  reason VARCHAR,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  trigger_type VARCHAR NOT NULL,
  trigger_config JSONB,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  shop_id UUID REFERENCES shops(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Block list table
CREATE TABLE IF NOT EXISTS block_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  type VARCHAR NOT NULL, -- 'ip' or 'phone'
  value VARCHAR NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## PHASE 5: Testing & Quality Assurance

**Priority: CRITICAL**  
**Estimated Time: Ongoing**

---

### Step 5.1: Unit Tests

- Test all new services
- Test utility functions
- Test components

### Step 5.2: Integration Tests

- Test API endpoints
- Test database operations
- Test workflow automation

### Step 5.3: E2E Tests

- Test critical user flows
- Test order management
- Test inventory operations

---

## 📊 IMPLEMENTATION TIMELINE

### Week 1-2: Phase 1 (Foundation)

- ✅ Enhanced Dashboard
- ✅ Advanced Order Management
- ✅ Web Orders Module
- ✅ Enhanced Inventory

### Week 3-4: Phase 2 (Advanced Features)

- ✅ Task & Follow-up System
- ✅ HRM Module
- ✅ Automation Module
- ✅ Advanced Reporting
- ✅ SMS Integration

### Week 5: Phase 3 (UI/UX)

- ✅ Navigation Updates
- ✅ Courier Rating System
- ✅ UI Polish

### Ongoing: Phase 4 & 5

- ✅ Database Updates
- ✅ Testing

---

## 🎯 PRIORITY MATRIX

### 🔴 CRITICAL (Must Have)

1. Enhanced Dashboard with analytics
2. Advanced Order Management (11 statuses)
3. Delivery Method Filtering
4. Stock Adjustments
5. Database Schema Updates

### 🟡 HIGH (Should Have)

1. Task & Follow-up System
2. Web Orders Module
3. Advanced Reporting
4. Courier Rating System
5. SMS Integration

### 🟢 MEDIUM (Nice to Have)

1. HRM Module
2. Workflow Automation
3. Super Edit Feature
4. Scan to Update

---

## 📝 NOTES & CONSIDERATIONS

1. **Database Migrations**
   - Create migration scripts for all schema changes
   - Test migrations on staging first
   - Backup before production migrations

2. **Performance**
   - Optimize queries for large datasets
   - Add pagination everywhere
   - Cache frequently accessed data

3. **Security**
   - Validate all inputs
   - Implement proper authorization
   - Audit sensitive operations

4. **Mobile Responsiveness**
   - Ensure all new pages are mobile-friendly
   - Test on various screen sizes
   - Optimize for touch interactions

5. **Accessibility**
   - Maintain WCAG compliance
   - Add proper ARIA labels
   - Keyboard navigation support

---

## 🚀 GETTING STARTED

1. **Review this plan** with the team
2. **Set up development environment**
3. **Create feature branches** for each phase
4. **Start with Phase 1.1** (Enhanced Dashboard)
5. **Test incrementally** as you build
6. **Deploy to staging** after each phase
7. **Gather feedback** and iterate

---

**Last Updated:** November 8, 2025  
**Next Review:** After Phase 1 completion
