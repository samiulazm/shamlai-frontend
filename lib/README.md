# InsForge E-Commerce Integration Library

Complete backend integration for the Shamlai e-commerce platform using InsForge BaaS.

## 📁 Structure

```
lib/
├── insforge.ts                 # Core InsForge client configuration
├── index.ts                    # Main export file
├── types/
│   └── database.ts            # TypeScript types for all database tables
├── services/
│   ├── products.ts            # Product & category management
│   ├── orders.ts              # Order processing & fulfillment
│   ├── cart.ts                # Shopping cart operations
│   ├── marketing.ts           # Discounts, reviews, wishlists
│   └── shop.ts                # Shop settings & configuration
├── hooks/
│   ├── useProducts.ts         # React hooks for products
│   ├── useOrders.ts           # React hooks for orders
│   ├── useCart.ts             # React hooks for cart
│   └── useShop.ts             # React hooks for shop settings
└── utils/
    ├── validation.ts          # Data validation utilities
    └── seed-data.ts           # Database seeding utilities
```

## 🚀 Quick Start

### Basic Setup

```typescript
import { insforgeClient } from '@/lib/insforge';

// Client is already configured and ready to use!
```

### Using Services

```typescript
import { ProductService, OrderService, CartService } from '@/lib';

// Get products
const products = await ProductService.getProducts(shopId);

// Create an order
const order = await OrderService.createOrder(orderData, items);

// Add item to cart
await CartService.addToCart(cartId, productId, quantity);
```

### Using React Hooks

```typescript
'use client';

import { useProducts, useCart, useOrders } from '@/lib';

function ProductList() {
  const { products, loading, error } = useProducts(shopId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {products?.data.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Using Types

```typescript
import type { Product, Order, Customer } from '@/lib';

const product: Product = {
  id: 'uuid',
  shop_id: 'uuid',
  name: 'Product Name',
  // ... other fields
};
```

## 📦 Services

### ProductService

```typescript
// Get all products
const products = await ProductService.getProducts(shopId, filters);

// Get single product
const product = await ProductService.getProductById(productId);

// Create product
const newProduct = await ProductService.createProduct(productData, images);

// Update product
await ProductService.updateProduct(productId, updates);

// Delete product (soft delete)
await ProductService.deleteProduct(productId);

// Manage inventory
await ProductService.updateInventory(productId, quantityChange);

// Categories
const categories = await ProductService.getCategories();
```

### OrderService

```typescript
// Get orders
const orders = await OrderService.getOrders(shopId, filters);

// Get single order
const order = await OrderService.getOrderById(orderId);

// Create order
const newOrder = await OrderService.createOrder(orderData, items);

// Update order status
await OrderService.updateOrderStatus(orderId, 'shipped', 'Package sent');

// Cancel order
await OrderService.cancelOrder(orderId, 'Customer requested');

// Get statistics
const stats = await OrderService.getOrderStats(shopId);
```

### CartService

```typescript
// Get or create cart
const cart = await CartService.getOrCreateCart(userId, sessionId);

// Get cart with items
const cartData = await CartService.getCartWithItems(cartId);

// Add item
await CartService.addToCart(cartId, productId, quantity, variantId);

// Update quantity
await CartService.updateCartItemQuantity(itemId, newQuantity);

// Remove item
await CartService.removeFromCart(itemId);

// Clear cart
await CartService.clearCart(cartId);

// Validate cart
const validation = await CartService.validateCart(cartId);

// Calculate totals
const totals = await CartService.calculateCartTotals(cartId, shippingId, discountCode);
```

### MarketingService

```typescript
// Discount codes
const discounts = await MarketingService.getDiscountCodes(shopId);
await MarketingService.createDiscountCode(discountData);
const validation = await MarketingService.validateDiscountCode(shopId, code);

// Product reviews
const reviews = await MarketingService.getProductReviews(productId);
await MarketingService.createProductReview(reviewData, images);
await MarketingService.approveReview(reviewId);

// Wishlists
const wishlist = await MarketingService.getWishlist(customerId);
await MarketingService.addToWishlist(customerId, productId);

// Email marketing
await MarketingService.subscribeToNewsletter(shopId, email);
const subscribers = await MarketingService.getSubscribers(shopId);
```

### ShopService

```typescript
// Shop settings
const settings = await ShopService.getShopSettings(shopId);
await ShopService.upsertShopSettings(shopId, updates);

// Payment methods
const paymentMethods = await ShopService.getPaymentMethods(shopId);

// Shipping methods
const shippingMethods = await ShopService.getShippingMethods(shopId);

// Tax rates
const taxRates = await ShopService.getTaxRates(shopId);
const taxRate = await ShopService.calculateTax(shopId, country, state);

// Static pages
const pages = await ShopService.getPages(shopId);
const page = await ShopService.getPageBySlug(shopId, slug);
```

## 🪝 React Hooks

### useProducts

```typescript
const { products, loading, error } = useProducts(shopId, {
  page: 1,
  pageSize: 20,
  categoryId: 'category-uuid',
  search: 'search term'
});
```

### useProduct

```typescript
const { product, loading, error } = useProduct(productId);
```

### useCategories

```typescript
const { categories, loading, error } = useCategories();
```

### useOrders

```typescript
const { orders, loading, error } = useOrders(shopId, filters);
```

### useOrder

```typescript
const { order, loading, error } = useOrder(orderId);
```

### useOrderStats

```typescript
const { stats, loading, error } = useOrderStats(shopId, startDate, endDate);
```

### useCart

```typescript
const {
  cart,
  loading,
  error,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  validateCart,
  calculateTotals,
  refreshCart
} = useCart(userId, sessionId);

// Add item to cart
await addItem(productId, quantity, variantId);
```

### useShopSettings

```typescript
const { settings, loading, error, updateSettings } = useShopSettings(shopId);
```

## 🔧 Utilities

### Validation

```typescript
import { Validation } from '@/lib';

// Validate product
const result = Validation.validateProduct(productData);
if (!result.isValid) {
  console.error(result.errors);
}

// Validate email
const isValid = Validation.isValidEmail(email);

// Generate slug
const slug = Validation.generateSlug('Product Name'); // 'product-name'

// Validate image
const imageResult = Validation.validateImageFile(file, 5); // 5MB max
```

### Seed Data

```typescript
import { SeedData } from '@/lib';

// Seed all demo data
await SeedData.seedAllData(shopId);

// Seed specific data
const categories = await SeedData.seedCategories();
const products = await SeedData.seedProducts(shopId, categories);
await SeedData.seedDiscountCodes(shopId);

// Clear shop data
await SeedData.clearShopData(shopId);
```

## 🎯 Constants

```typescript
import { 
  STORAGE_BUCKETS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  FULFILLMENT_STATUS,
  DISCOUNT_TYPES
} from '@/lib';

// Storage buckets
STORAGE_BUCKETS.PRODUCT_IMAGES
STORAGE_BUCKETS.CATEGORY_IMAGES
STORAGE_BUCKETS.SHOP_ASSETS
STORAGE_BUCKETS.BLOG_IMAGES
STORAGE_BUCKETS.REVIEW_IMAGES
STORAGE_BUCKETS.CHATBOT_ATTACHMENTS

// Order status values
ORDER_STATUS.PENDING
ORDER_STATUS.PROCESSING
ORDER_STATUS.SHIPPED
ORDER_STATUS.DELIVERED
ORDER_STATUS.CANCELLED
ORDER_STATUS.REFUNDED
```

## 📝 TypeScript Types

All database types are fully typed! Auto-completion works out of the box.

```typescript
import type {
  // Products
  Product,
  ProductInsert,
  ProductUpdate,
  ProductVariant,
  Category,
  
  // Orders
  Order,
  OrderItem,
  Customer,
  Address,
  
  // Cart
  Cart,
  CartItem,
  
  // Marketing
  DiscountCode,
  ProductReview,
  Wishlist,
  
  // Shop
  ShopSettings,
  PaymentMethod,
  ShippingMethod,
  Theme,
  
  // Utility
  PaginatedResponse,
  QueryFilters,
  DatabaseResponse
} from '@/lib';
```

## 🎨 Example: Complete Product Flow

```typescript
'use client';

import { useState } from 'react';
import { useProducts, useProductMutations, Validation } from '@/lib';

function ProductManagement({ shopId }: { shopId: string }) {
  const { products, loading, error } = useProducts(shopId);
  const { createProduct, updateProduct, deleteProduct } = useProductMutations();
  
  const handleCreate = async (formData: FormData) => {
    const productData = {
      shop_id: shopId,
      name: formData.get('name') as string,
      slug: Validation.generateSlug(formData.get('name') as string),
      base_price: parseFloat(formData.get('price') as string),
      // ... other fields
    };
    
    // Validate
    const validation = Validation.validateProduct(productData);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    // Create
    const images = formData.getAll('images') as File[];
    await createProduct(productData, images);
  };
  
  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

## 🔐 Authentication

Authentication is handled automatically by the InsForge client:

```typescript
import { insforgeClient } from '@/lib';

// Sign in
const { data, error } = await insforgeClient.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get current user
const { data: userData } = await insforgeClient.auth.getCurrentUser();

// User data includes:
// - user: { id, email, role }
// - profile: { id, nickname, avatar_url, ... }
```

## 📊 Database Schema

See [DATABASE_SCHEMA.md](../../DATABASE_SCHEMA.md) for complete database documentation.

## 🚨 Error Handling

All services and hooks return errors in a consistent format:

```typescript
try {
  const product = await ProductService.getProductById(id);
} catch (error) {
  console.error('Error:', error.message);
}

// In hooks
const { data, loading, error } = useProducts(shopId);
if (error) {
  // Handle error
}
```

## 🧪 Testing with Seed Data

```typescript
// In a seed script or component
import { SeedData, insforgeClient } from '@/lib';

async function initializeStore() {
  // Get current user (shop owner)
  const { data } = await insforgeClient.auth.getCurrentUser();
  const shopId = data?.user?.id;
  
  if (shopId) {
    // Seed all demo data
    await SeedData.seedAllData(shopId);
    console.log('✅ Store initialized with demo data!');
  }
}
```

## 📚 Additional Resources

- [InsForge SDK Documentation](https://insforge.com/docs)
- [Database Schema](../../DATABASE_SCHEMA.md)
- [Setup Guide](../../SETUP_GUIDE.md)

## 🤝 Support

For issues or questions:
1. Check the type definitions (`lib/types/database.ts`)
2. Review service implementations (`lib/services/`)
3. Consult the InsForge documentation





