# Backend Integration Guide

This document provides a comprehensive guide to the InsForge backend integration for the Shamlai e-commerce platform.

## 🎯 Overview

The platform uses InsForge as a Backend-as-a-Service (BaaS) solution, providing:

- **Database**: PostgreSQL with 36 tables for complete e-commerce functionality
- **Authentication**: Email/password and OAuth (Google, GitHub)
- **Storage**: 6 buckets for images and files
- **AI Integration**: OpenAI GPT-4 and Google Gemini models

## 📁 Project Structure

```
lib/
├── insforge.ts           # Core client & constants
├── index.ts              # Main export file
├── README.md             # Detailed API documentation
├── types/
│   └── database.ts       # All TypeScript types
├── services/
│   ├── products.ts       # Product management (428 lines)
│   ├── orders.ts         # Order processing (368 lines)
│   ├── cart.ts           # Shopping cart (314 lines)
│   ├── marketing.ts      # Marketing features (438 lines)
│   └── shop.ts           # Shop settings (392 lines)
├── hooks/
│   ├── useProducts.ts    # Product React hooks
│   ├── useOrders.ts      # Order React hooks
│   ├── useCart.ts        # Cart React hooks
│   └── useShop.ts        # Shop React hooks
└── utils/
    ├── validation.ts     # Data validation (386 lines)
    └── seed-data.ts      # Database seeding (370 lines)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd shamlai-frontend
npm install
```

### 2. Configure Environment

The InsForge URL is already configured in `lib/insforge.ts`:

```typescript
const INSFORGE_URL = 'https://3ftnzn2r.us-east.insforge.app';
```

### 3. Seed the Database

Populate your database with sample data:

```bash
npm run seed

# Or clear existing data first:
npm run seed -- --clear
```

### 4. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` and log in with test credentials.

## 💡 Usage Examples

### Basic Product Management

```typescript
import { ProductService } from '@/lib';

// Get all products
const products = await ProductService.getProducts(shopId, {
  page: 1,
  pageSize: 20,
  categoryId: 'category-id',
  isActive: true
});

// Get single product with images and variants
const product = await ProductService.getProductById(productId);

// Create product with images
const newProduct = await ProductService.createProduct(
  {
    shop_id: shopId,
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    base_price: 79.99,
    // ... other fields
  },
  [imageFile1, imageFile2] // File objects
);
```

### Using React Hooks

```typescript
'use client';

import { useProducts, useCart } from '@/lib';

export default function ProductsPage({ shopId }: { shopId: string }) {
  const { products, loading, error } = useProducts(shopId, {
    page: 1,
    pageSize: 20
  });

  const { cart, addItem } = useCart(userId);

  const handleAddToCart = async (productId: string) => {
    await addItem(productId, 1);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products?.data.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.base_price}</p>
          <button onClick={() => handleAddToCart(product.id)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Complete Checkout Flow

```typescript
import { CartService, OrderService, getCurrentUser } from '@/lib';

async function checkout(cartId: string, shippingInfo: any, paymentInfo: any) {
  // 1. Get cart with items
  const cart = await CartService.getCartWithItems(cartId);

  // 2. Validate cart
  const validation = await CartService.validateCart(cartId);
  if (!validation.isValid) {
    throw new Error('Cart validation failed: ' + validation.issues.join(', '));
  }

  // 3. Calculate totals
  const totals = await CartService.calculateCartTotals(
    cartId,
    shippingInfo.methodId,
    paymentInfo.discountCode
  );

  // 4. Get or create customer
  const { data: userData } = await getCurrentUser();
  const customer = await OrderService.getOrCreateCustomer(
    cart.shop_id,
    shippingInfo.email,
    shippingInfo.firstName,
    shippingInfo.lastName,
    shippingInfo.phone,
    userData?.user?.id
  );

  // 5. Create order
  const orderData = {
    shop_id: cart.shop_id,
    customer_id: customer.id,
    status: 'pending',
    payment_status: 'pending',
    fulfillment_status: 'unfulfilled',
    subtotal: totals.subtotal,
    discount_amount: totals.discountAmount,
    shipping_cost: totals.shippingCost,
    tax_amount: totals.taxAmount,
    total: totals.total,
    customer_email: shippingInfo.email,
    // ... shipping and billing addresses
  };

  const orderItems = cart.items.map(item => ({
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product.name,
    sku: item.product.sku,
    quantity: item.quantity,
    price: item.price,
    discount_amount: 0,
    total: item.price * item.quantity,
    image_url: item.product.image_url
  }));

  const order = await OrderService.createOrder(orderData, orderItems);

  // 6. Clear cart
  await CartService.clearCart(cartId);

  return order;
}
```

### Data Validation

```typescript
import { Validation } from '@/lib';

// Validate product data
const productData = {
  name: 'Test Product',
  slug: 'test-product',
  base_price: 29.99,
  // ...
};

const validation = Validation.validateProduct(productData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  // Handle errors...
}

// Generate URL-friendly slugs
const slug = Validation.generateSlug('Product Name!'); // 'product-name'

// Validate images
const imageValidation = Validation.validateImageFile(file, 5); // 5MB max
if (!imageValidation.isValid) {
  alert(imageValidation.error);
}
```

## 📊 Database Schema

### Core Tables

1. **Products** (29 tables)
   - `categories`, `products`, `product_images`, `product_variants`, `inventory_logs`

2. **Orders** (5 tables)
   - `orders`, `order_items`, `order_status_history`, `customers`, `addresses`

3. **Cart** (2 tables)
   - `cart`, `cart_items`

4. **Marketing** (9 tables)
   - `discount_codes`, `product_reviews`, `wishlists`, `email_subscribers`

5. **Shop Config** (7 tables)
   - `shop_settings`, `payment_methods`, `shipping_methods`, `tax_rates`, `themes`, `pages`

### Storage Buckets

- `product-images` - Product photos (public)
- `category-images` - Category images (public)
- `shop-assets` - Logos, banners (public)
- `blog-images` - Blog images (public)
- `review-images` - Customer review photos (public)
- `chatbot-attachments` - Chat files (private)

See [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) for complete details.

## 🔐 Authentication

### Email/Password Authentication

```typescript
import { insforgeClient } from '@/lib';

// Sign up
const { data, error } = await insforgeClient.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!'
});

// Sign in
const { data, error } = await insforgeClient.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'SecurePassword123!'
});

// Get current user
const { data } = await insforgeClient.auth.getCurrentUser();
// Returns: { user: {...}, profile: {...} }

// Sign out
await insforgeClient.auth.signOut();
```

### OAuth Authentication

```typescript
// Google OAuth
const { data, error } = await insforgeClient.auth.signInWithOAuth({
  provider: 'google',
  redirectTo: window.location.origin + '/dashboard',
  skipBrowserRedirect: true
});

if (data?.url) {
  window.location.href = data.url;
}

// After redirect, user is automatically authenticated
// Just call getCurrentUser() to get their info
```

## 🎨 React Component Examples

### Product List Component

```typescript
'use client';

import { useProducts, useCategories } from '@/lib';
import type { Product } from '@/lib';

export default function ProductList({ shopId }: { shopId: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string>();
  
  const { categories } = useCategories();
  const { products, loading, error } = useProducts(shopId, {
    categoryId: selectedCategory,
    page: 1,
    pageSize: 20
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />
      
      <div className="grid grid-cols-4 gap-4">
        {products?.data.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Pagination
        current={products?.page || 1}
        total={products?.total || 0}
        pageSize={products?.pageSize || 20}
      />
    </div>
  );
}
```

### Shopping Cart Component

```typescript
'use client';

import { useCart } from '@/lib';

export default function ShoppingCart({ userId }: { userId: string }) {
  const {
    cart,
    loading,
    updateQuantity,
    removeItem,
    clearCart
  } = useCart(userId);

  if (loading) return <div>Loading cart...</div>;

  return (
    <div>
      <h2>Shopping Cart ({cart?.itemCount || 0} items)</h2>
      
      {cart?.items.map(item => (
        <div key={item.id}>
          <img src={item.product.image_url} alt={item.product.name} />
          <h3>{item.product.name}</h3>
          <p>${item.price}</p>
          
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
          />
          
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}

      <div>
        <p>Subtotal: ${cart?.subtotal.toFixed(2)}</p>
        <button onClick={clearCart}>Clear Cart</button>
        <button>Proceed to Checkout</button>
      </div>
    </div>
  );
}
```

## 🧪 Testing with Seed Data

The seed data utility creates:

- **8 Categories**: Electronics, Clothing, Home & Garden, etc.
- **20 Products**: Variety of products across categories
- **Product Variants**: Sizes, colors, and combinations
- **3 Discount Codes**: WELCOME10, SAVE20, FREESHIP
- **3 Shipping Methods**: Standard, Express, Overnight
- **3 Payment Methods**: Credit Card, PayPal, Cash on Delivery
- **Shop Settings**: Complete store configuration

Run the seed script:

```bash
# Seed data
npm run seed

# Clear and re-seed
npm run seed -- --clear
```

## 🛠️ Advanced Features

### Inventory Management

```typescript
import { ProductService } from '@/lib';

// Update inventory (automatic when orders are placed)
await ProductService.updateInventory(
  productId,
  -5, // Decrease by 5
  variantId,
  'Order #12345',
  'sale',
  orderId,
  userId
);

// Get inventory logs
const logs = await ProductService.getInventoryLogs(productId);
```

### Discount Code Validation

```typescript
import { MarketingService } from '@/lib';

const validation = await MarketingService.validateDiscountCode(
  shopId,
  'WELCOME10',
  customerId,
  subtotal
);

if (validation.isValid) {
  // Apply discount
  const discount = validation.discount;
  const discountAmount = calculateDiscount(subtotal, discount);
}
```

### Order Management

```typescript
import { OrderService } from '@/lib';

// Update order status
await OrderService.updateOrderStatus(
  orderId,
  'shipped',
  'Package has been shipped with tracking #123456',
  true // Notify customer
);

// Cancel order (restores inventory)
await OrderService.cancelOrder(
  orderId,
  'Customer requested cancellation'
);

// Get order statistics
const stats = await OrderService.getOrderStats(shopId, startDate, endDate);
// Returns: { totalOrders, totalRevenue, averageOrderValue, ordersByStatus }
```

## 📈 Performance Tips

1. **Use Pagination**: Always paginate large datasets
   ```typescript
   const products = await ProductService.getProducts(shopId, {
     page: 1,
     pageSize: 20
   });
   ```

2. **Cache Results**: Use React Query or SWR for caching
   ```typescript
   import useSWR from 'swr';
   
   const { data, error } = useSWR(
     ['products', shopId],
     () => ProductService.getProducts(shopId)
   );
   ```

3. **Optimize Images**: Use proper image sizes and formats

4. **Batch Operations**: Use Promise.all for parallel operations
   ```typescript
   const [products, categories, orders] = await Promise.all([
     ProductService.getProducts(shopId),
     ProductService.getCategories(),
     OrderService.getOrders(shopId)
   ]);
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure you're logged in before making API calls
   - Check that the auth token is stored correctly

2. **Type Errors**
   - Make sure you're importing types from `@/lib`
   - Use TypeScript strict mode for better type safety

3. **Database Errors**
   - Check foreign key constraints
   - Ensure required fields are provided

4. **Storage Upload Failures**
   - Verify file size limits (5MB default)
   - Check file type validation

## 📚 Additional Resources

- [InsForge SDK Documentation](https://insforge.com/docs)
- [API Reference](./lib/README.md)
- [Database Schema](../DATABASE_SCHEMA.md)
- [Type Definitions](./lib/types/database.ts)

## 🤝 Contributing

When adding new features:

1. Add types to `lib/types/database.ts`
2. Create service functions in appropriate service file
3. Add React hooks if needed
4. Update validation utilities
5. Add examples to documentation

## 📝 License

This integration is part of the Shamlai e-commerce platform.





