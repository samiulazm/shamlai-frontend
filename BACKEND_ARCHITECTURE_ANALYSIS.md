# Shamlai Frontend - Backend Architecture Analysis Report

**Date:** 2025-11-20  
**Project:** shamlai-frontend (Next.js E-commerce Platform)  
**Backend:** InsForge BaaS (Backend-as-a-Service)  
**Database:** PostgreSQL hosted on InsForge

---

## 1. CURRENT BACKEND/DATABASE STRUCTURE

### 1.1 Database Provider: InsForge (BaaS)
- **URL:** `http://119.40.88.49:7130`
- **Type:** Backend-as-a-Service with PostgreSQL database
- **No Prisma ORM** - Uses InsForge SDK directly for database access
- **Total Tables:** 41+ tables created (core + optional)
- **Storage Buckets:** 6 buckets for file uploads

### 1.2 API Route Structure
```
app/api/
├── auth/
│   ├── signin/route.ts          # Email/password login
│   ├── signup/route.ts          # User registration
│   ├── user/route.ts            # Get current authenticated user
│   └── profile/route.ts         # User profile management
├── products/
│   ├── route.ts                 # Product listing and creation
│   └── [id]/route.ts            # Product detail and updates
├── orders/
│   ├── route.ts                 # Order listing
│   └── [id]/route.ts            # Order detail and status updates
├── cart/route.ts                # Shopping cart operations
├── checkout/route.ts            # Checkout and order creation
├── search/route.ts              # Global search (products, orders, customers)
├── courier/
│   ├── shipment/route.ts        # Courier integration
│   └── track/route.ts           # Shipment tracking
├── migrations/
│   ├── route.ts                 # Migration status
│   └── run/route.ts             # Execute migrations
├── subdomain/check/route.ts     # Check subdomain availability
└── health/route.ts              # Health check endpoint
```

### 1.3 Core Database Models/Entities

**E-commerce Core (11 tables):**
- `users` - User accounts (managed by InsForge auth)
- `shop_settings` - Shop configuration
- `products` - Product catalog
- `product_variants` - Product variants
- `product_images` - Product images
- `categories` - Product categories
- `customers` - Customer records
- `orders` - Order management
- `order_items` - Order line items
- `cart` - Shopping carts
- `cart_items` - Cart items

**Order & Fulfillment (6 tables):**
- `order_status_history` - Order status changes
- `payments` - Payment records
- `delivery_methods` - Courier integration methods
- `addresses` - Customer addresses
- `payment_methods` - Payment options
- `shipping_methods` - Shipping options

**Marketing & Reviews (5 tables):**
- `discount_codes` - Discount codes
- `discount_code_products` - Products for discounts
- `discount_code_categories` - Categories for discounts
- `discount_code_usage` - Discount usage tracking
- `product_reviews` - Product reviews
- `review_images` - Review images
- `wishlists` - Product wishlists
- `email_subscribers` - Email subscribers

**Additional Features:**
- Accounting (accounts, expenses, income, liabilities)
- Task Management (tasks, followups, task_configs)
- HRM (employees, attendance, activities, leaves)
- Automation (workflows, workflow_templates, workflow_executions)
- Security (blocked_ips, blocked_mobiles)
- Ad Campaigns (ad_campaigns, ad_campaign_products)
- Content (blog_posts, pages, themes, navigation_menus)
- Analytics (analytics_events)
- Chatbot (chatbot_conversations, chatbot_messages)
- Notifications

### 1.4 Authentication Implementation

**Current Approach:**
```typescript
// middleware.ts - Checks for 'insforge_access_token' cookie
const authToken = request.cookies.get('insforge_access_token');

// Auth flow:
// 1. Client sends email/password to /api/auth/signin
// 2. API proxies to InsForge backend
// 3. Returns access token, sets cookie (7-day expiry)
// 4. Subsequent requests use token from cookie
```

**Token Storage & Retrieval:**
- Primary: `insforge_access_token` cookie
- Fallback: Authorization header with Bearer token
- Alternative: Query parameter `?token=...`

### 1.5 Data Access Pattern (Service Layer)

Location: `/home/user/shamlai-frontend/lib/services/`

**Key Services:**
```
- orders.ts          (Order CRUD, pagination, status tracking)
- products.ts        (Product listing, variants, caching)
- cart.ts            (Shopping cart operations)
- shop.ts            (Shop settings, subdomain management)
- marketing.ts       (Promotions, discounts)
- email.ts           (Email notifications)
- sms.ts             (SMS notifications)
- courier.ts         (Shipping integrations)
```

**Query Pattern:**
```typescript
const { data, error, count } = await insforgeClient.database
  .from('products')
  .select('*', { count: 'exact' })
  .eq('shop_id', shopId)
  .order('created_at', { ascending: false })
  .range(offset, offset + pageSize - 1);
```

### 1.6 Caching Strategy

**Redis Integration:**
- **Provider Options:** Upstash (serverless) or standard Redis
- **Client:** Supports both `@upstash/redis` and `ioredis`
- **Fallback:** Mock Redis for development (in-memory Map)

**Cache Keys:**
```typescript
PRODUCT: (id) => `cache:product:{id}`
PRODUCT_LIST: (shopId, page) => `cache:products:{shopId}:page:{page}`
SHOP: (id) => `cache:shop:{id}`
CART: (id) => `cache:cart:{id}`
ORDER: (id) => `cache:order:{id}`
```

**TTL Configuration:**
```typescript
PRODUCT: 5 minutes
PRODUCT_LIST: 3 minutes
SHOP: 1 hour
CART: 24 hours
ORDER: 30 minutes
```

---

## 2. MAJOR ISSUES & BUGS IDENTIFIED

### CRITICAL ISSUES

#### ❌ **Issue 1: Cookie Security Vulnerability** 
**File:** `/home/user/shamlai-frontend/app/api/auth/signin/route.ts` (line 52)
```typescript
response.cookies.set('insforge_access_token', data.accessToken, {
  httpOnly: false,  // ⚠️ SECURITY ISSUE: Allows JavaScript access
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
});
```
**Problem:** Setting `httpOnly: false` allows JavaScript to read the access token, making it vulnerable to XSS attacks. If an attacker injects malicious JS, they can steal the token.

**Impact:** High - Token theft via XSS
**Fix:** Set `httpOnly: true` - Only server-side code should read auth tokens

---

#### ❌ **Issue 2: No Input Validation for Database Queries**
**Files:** Multiple API routes
**Example:** `/home/user/shamlai-frontend/app/api/search/route.ts` (lines 40, 52, 65)
```typescript
// Using user input directly in ilike queries without validation
.or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
```
**Problem:** While ilike is not SQL injection vulnerable, lack of input sanitization could cause query errors on special characters

**Impact:** Medium - Potential DoS or unexpected behavior
**Fix:** Validate search query length and characters before using in query

---

#### ❌ **Issue 3: Hardcoded Tax Rate in Checkout**
**File:** `/home/user/shamlai-frontend/app/api/checkout/route.ts` (line 142)
```typescript
const taxRate = 0.1;  // Always 10% - hardcoded!
const taxAmount = (subtotal - discountAmount) * taxRate;
```
**Problem:** Tax calculation doesn't account for:
- Different regions/countries (US, EU, etc. have different tax laws)
- Different product types (some items might be tax-exempt)
- Customer location

**Impact:** High - Incorrect order totals, accounting issues, potential legal compliance problems
**Fix:** Implement dynamic tax calculation based on shipping address and product type

---

#### ❌ **Issue 4: Race Condition in Cart Operations**
**File:** `/home/user/shamlai-frontend/app/api/cart/route.ts` (lines 96-114)
```typescript
// Check-then-act pattern without locking
const { data: existingItem } = await insforgeClient.database
  .from('cart_items')
  .select('*')
  .eq('cart_id', cart.id)
  .eq('product_id', productId)
  .eq('variant_id', variantId || null)
  .single();

if (existingItem) {
  // Multiple concurrent requests could create duplicate items
  const newQuantity = existingItem.quantity + quantity;
  // ... update
}
```
**Problem:** Race condition between checking and updating. Two concurrent requests could both see the item doesn't exist and both create it.

**Impact:** Medium - Duplicate cart items in concurrent requests
**Fix:** Use database constraints or transactions, or use upsert operation

---

#### ❌ **Issue 5: Checkout Not Using Transactions**
**File:** `/home/user/shamlai-frontend/app/api/checkout/route.ts`
**Problem:** Checkout involves multiple steps:
1. Create order
2. Create order items
3. Update inventory
4. Create payment record
5. Send notifications

If any step fails after order creation, data becomes inconsistent (order exists but payment record doesn't, or inventory was deducted but order failed).

**Impact:** High - Data inconsistency, lost orders, inventory mismatches
**Fix:** Wrap checkout logic in a database transaction

---

#### ❌ **Issue 6: No Authentication on Public Endpoints**
**Files:** `/api/products/route.ts` (GET), `/api/cart/route.ts` (GET)
**Problem:** GET requests for products and cart don't require authentication
```typescript
export async function GET(request: NextRequest) {
  // No auth check! Anyone can list products and carts
```
While public product listing is OK, this creates confusion about which endpoints need auth.

**Impact:** Low-Medium - Inconsistent security posture
**Fix:** Document clearly which endpoints are public vs. protected

---

### HIGH-PRIORITY ISSUES

#### ⚠️ **Issue 7: Incomplete Migration System**
**File:** `/home/user/shamlai-frontend/app/api/migrations/run/route.ts` (line 42)
```typescript
// TODO: Execute SQL using MCP tool
// const result = await mcp_insforge_run-raw-sql({ query: sql, apiKey });

// Currently just returns success without executing!
return NextResponse.json({
  success: true,
  message: `Migration ${filename || 'unknown'} executed`,
});
```
**Problem:** The migration endpoint exists but doesn't actually execute migrations. It just returns success.

**Impact:** High - Database migrations can't be deployed
**Fix:** Implement actual SQL execution or use a proper migration tool

---

#### ⚠️ **Issue 8: No Authorization Check in Product List**
**File:** `/home/user/shamlai-frontend/app/api/products/route.ts` (line 8)
```typescript
export async function GET(request: NextRequest) {
  // No auth check for public listing
  const shopId = searchParams.get('shopId');
  if (!shopId) {
    return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
  }
  // Anyone can list any shop's products if they know the shop ID
}
```
**Problem:** Any user can access any shop's product list by guessing a shop ID

**Impact:** Medium - Information disclosure
**Fix:** Verify the requesting user owns the shop or implement proper access control

---

#### ⚠️ **Issue 9: No Rate Limiting on Auth Endpoints**
**Files:** `/api/auth/signin`, `/api/auth/signup`
**Problem:** No rate limiting - unlimited login/registration attempts allowed

**Impact:** Medium - Brute force attack vulnerability
**Fix:** Implement rate limiting (already exists in `/lib/middleware/rate-limit.ts` but not applied to auth routes)

---

#### ⚠️ **Issue 10: Inconsistent Error Handling**
**Multiple files**
```typescript
// Some routes log errors:
logger.error('Signin failed', error);

// Some return detailed errors:
{ error: error.message || 'An error occurred' }

// Some return generic errors:
{ error: 'Failed to get products' }

// Some include status codes, some don't
```
**Problem:** Inconsistent error handling makes debugging difficult and could leak information

**Impact:** Medium - Debugging difficulty, potential information disclosure
**Fix:** Implement standardized error response format across all endpoints

---

### MEDIUM-PRIORITY ISSUES

#### 🔶 **Issue 11: Multiple Redis Client Instantiation**
**File:** `/home/user/shamlai-frontend/lib/redis/client.ts`
**Problem:** Creates new client instance on each call if Redis isn't available

**Impact:** Low - Performance
**Fix:** Already partially addressed with singleton pattern

---

#### 🔶 **Issue 12: No Validation of Required Database Fields**
**File:** Multiple API routes
**Example:** `/api/products/route.ts` (POST, line 90)
```typescript
if (!name || !price) {
  return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
}
// But doesn't validate shop_id exists, category exists, etc.
```
**Problem:** Minimal validation - doesn't verify foreign key relationships

**Impact:** Medium - Database constraint violations
**Fix:** Implement comprehensive validation before insert/update

---

#### 🔶 **Issue 13: No Inventory Lock During Checkout**
**File:** `/home/user/shamlai-frontend/app/api/checkout/route.ts` (line 59)
```typescript
// Check stock
if (product.stock_quantity < item.quantity) {
  return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
}
// ... but by the time we create order, another request could have bought the item
```
**Problem:** Inventory check happens but no lock is held, so stock can be oversold

**Impact:** High - Inventory can go negative
**Fix:** Use row-level locking or atomic inventory deduction

---

#### 🔶 **Issue 14: Auth Token from Multiple Sources Without Clear Priority**
**File:** `/home/user/shamlai-frontend/app/api/auth/user/route.ts` (line 17-20)
```typescript
const accessToken =
  request.cookies.get('insforge_access_token')?.value ||
  request.headers.get('Authorization')?.replace('Bearer ', '') ||
  request.nextUrl.searchParams.get('token');
```
**Problem:** Unclear which source has priority if multiple are provided. Query param tokens are particularly dangerous.

**Impact:** Low-Medium - Security confusion, potential token leakage
**Fix:** Use only cookies (or header + cookie), remove query param option

---

#### 🔶 **Issue 15: SDK Methods Not Available Warnings**
**File:** `/home/user/shamlai-frontend/lib/insforge.ts` (many places)
```typescript
if (authClient.resetPasswordForEmail) {
  // ... try to use it
}
logger.warn('resetPasswordForEmail is not available in this SDK version');
```
**Problem:** Many SDK methods have fallback logic for "not available" - indicates SDK version compatibility issues

**Impact:** Medium - Unreliable functionality
**Fix:** Pin SDK version and test thoroughly

---

## 3. DATA MODELS & ENTITY RELATIONSHIPS

**Location:** `/home/user/shamlai-frontend/lib/types/database.ts`

### Core Relationships:

```
User (auth system)
  ├─→ ShopSettings
  │   ├─→ Products
  │   │   ├─→ ProductVariants
  │   │   ├─→ ProductImages
  │   │   └─→ Orders (indirectly)
  │   ├─→ Categories
  │   ├─→ Customers
  │   │   └─→ Orders
  │   ├─→ Orders
  │   │   └─→ OrderItems
  │   │       └─→ Products (reference)
  │   ├─→ DeliveryMethods
  │   ├─→ PaymentMethods
  │   ├─→ ShippingMethods
  │   ├─→ TaxRates
  │   └─→ Themes

Customer
  ├─→ Addresses (shipping, billing)
  ├─→ Orders
  │   ├─→ OrderItems
  │   ├─→ OrderStatusHistory
  │   ├─→ Payments
  │   └─→ OrderStatusHistory
  ├─→ Cart
  │   └─→ CartItems
  ├─→ ProductReviews
  └─→ Wishlists

DiscountCode
  ├─→ DiscountCodeProducts
  ├─→ DiscountCodeCategories
  └─→ DiscountCodeUsage
```

---

## 4. AUTHENTICATION & DATA MANAGEMENT CURRENT IMPLEMENTATION

### Authentication Flow:

```
1. User submits email/password to /api/auth/signin
   ↓
2. API proxies to InsForge auth endpoint
   ↓
3. InsForge returns access token + user data
   ↓
4. Access token stored in 'insforge_access_token' cookie (7 days)
   ↓
5. Middleware checks cookie on protected routes
   ↓
6. API routes use token to call InsForge database API
```

### Authorization:

**Current Pattern:**
```typescript
// Most protected endpoints do this:
const { data } = await insforgeClient.auth.getCurrentUser();
if (!data?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Then verify ownership
if (order.shop_id !== user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Issues:**
- No role-based access control (RBAC)
- No permission system
- Assumes user.id == shop_id (not scalable if one user has multiple shops)

### Data Consistency:

**Strong Points:**
- ✅ Database provides data consistency at database level
- ✅ Foreign keys enforce referential integrity
- ✅ Caching layer reduces database load

**Weak Points:**
- ❌ No transaction handling for multi-step operations
- ❌ No row-level locking for inventory
- ❌ No audit logging of data changes

---

## 5. FILE STRUCTURE SUMMARY

```
shamlai-frontend/
├── app/
│   ├── api/                      # All API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── products/             # Product management
│   │   ├── orders/               # Order management
│   │   ├── cart/                 # Shopping cart
│   │   ├── checkout/             # Checkout flow
│   │   ├── search/               # Global search
│   │   ├── courier/              # Shipping integration
│   │   ├── migrations/           # Database migrations
│   │   ├── subdomain/            # Shop subdomain routing
│   │   └── health/               # Health check
│   ├── (dashboard)/              # Admin pages
│   └── ...                        # Public pages
├── lib/
│   ├── insforge.ts               # InsForge client & helpers (943 lines)
│   ├── types/
│   │   └── database.ts           # All TypeScript types (680 lines)
│   ├── services/                 # Business logic layer
│   │   ├── orders.ts             # Order operations (368 lines)
│   │   ├── products.ts           # Product operations (428 lines)
│   │   ├── cart.ts               # Cart operations (314 lines)
│   │   ├── shop.ts               # Shop operations (392 lines)
│   │   ├── marketing.ts          # Marketing features (438 lines)
│   │   ├── email.ts              # Email service
│   │   ├── sms.ts                # SMS service
│   │   ├── courier.ts            # Shipping service
│   │   └── order-workflows.ts    # Complex order logic
│   ├── redis/                    # Redis caching
│   │   ├── client.ts             # Redis connection (187 lines)
│   │   ├── cache.ts              # Cache utilities
│   │   └── rate-limiter.ts       # Rate limiting
│   ├── utils/                    # Utilities
│   │   ├── logger.ts             # Logging
│   │   ├── validation.ts         # Data validation
│   │   └── ...
│   └── hooks/                    # React hooks for data fetching
├── middleware.ts                 # Next.js middleware (auth check)
├── package.json                  # Dependencies
└── ...
```

---

## 6. SUMMARY TABLE

| Aspect | Current Implementation | Issues |
|--------|------------------------|--------|
| **Database** | InsForge PostgreSQL | No Prisma ORM, direct SDK queries |
| **Authentication** | JWT token in cookie (7-day) | httpOnly: false vulnerability |
| **Authorization** | User.id == Shop.id | Not scalable, no RBAC |
| **Data Access** | Service layer + direct queries | Inconsistent patterns |
| **Caching** | Redis (Upstash + ioredis) | Optional, not required |
| **API Routes** | 17 endpoints | Inconsistent auth/validation |
| **Error Handling** | Try-catch with logging | Inconsistent error responses |
| **Transactions** | None | Multi-step operations unsafe |
| **Inventory** | Check-then-deduct | No locking, can oversell |
| **Tax Calculation** | Hardcoded 10% | No regional support |
| **Migrations** | Stub endpoint only | Not implemented |
| **Rate Limiting** | Exists but not applied | Auth endpoints vulnerable |

---

## 7. RECOMMENDED IMMEDIATE FIXES (Priority Order)

1. **Fix Cookie Security** - Set `httpOnly: true`
2. **Implement Checkout Transactions** - Prevent data inconsistency
3. **Add Inventory Locking** - Prevent overselling
4. **Implement Tax by Region** - Fix accounting issues
5. **Add Rate Limiting to Auth** - Prevent brute force
6. **Fix Migration Endpoint** - Make it actually work
7. **Standardize Error Handling** - Consistent responses
8. **Add Input Validation** - Prevent malformed data
9. **Implement RBAC** - Support multiple shops per user
10. **Add Audit Logging** - Track data changes

