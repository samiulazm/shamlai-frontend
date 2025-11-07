# Demo Shop Setup Guide

## 🎯 Quick Start

Your demo shop is now ready! Follow these steps to get it fully working:

### 1. Create Test User Account

First, create the demo account:

```bash
npx tsx scripts/create-test-user.ts
```

This creates:
- **Email:** `test@shamlai.com`
- **Password:** `Test123456!`
- **Shop ID:** (your user's UUID)

### 2. Add Products to Your Shop

You have **three options** to add products:

#### Option A: Seed Sample Products (Recommended) ✅

Run the seed script to populate your shop with sample products:

```bash
npm run seed
```

This will create:
- 8 product categories
- 20 sample products with images
- Discount codes
- Shipping methods
- Payment methods

#### Option B: Add Products via Dashboard

1. Visit `http://localhost:3000/demo` to auto-login
2. You'll be redirected to your shop storefront
3. Click "📊 Dashboard" in the header
4. Go to **Products** → **Add Product**
5. Fill in product details and upload images

#### Option C: Add Products Programmatically

Use the product service to create products:

```typescript
import { ProductService } from '@/lib';

const newProduct = await ProductService.createProduct({
  shop_id: 'your-user-id',
  name: 'Wireless Headphones',
  slug: 'wireless-headphones',
  base_price: 79.99,
  short_description: 'Premium wireless headphones',
  description: 'High-quality sound with noise cancellation',
  stock_quantity: 50,
  is_active: true,
  category_id: 'category-id' // optional
});
```

### 3. View Your Demo Shop

Visit any of these URLs:

- **Demo (Auto-login):** `http://localhost:3000/demo`
- **Direct Shop:** `http://localhost:3000/[your-user-id]`
- **Dashboard:** `http://localhost:3000/dashboard`

## 🛍️ Demo Shop Features

Your storefront now includes:

- ✅ **Real product display** from database
- ✅ **Product images** with placeholder fallback
- ✅ **Shop settings** (name, description, currency)
- ✅ **Responsive grid layout** (2-4 columns)
- ✅ **Stock indicators** ("Only X left", "Out of stock")
- ✅ **Price display** with compare-at-price
- ✅ **Hover effects** and animations
- ✅ **Owner detection** (shows Dashboard button if you're logged in)
- ✅ **Empty state** with helpful message

## 📊 Shop Management

### As Shop Owner

When logged in as the shop owner, you'll see:

- **📊 Dashboard** button in shop header
- "You're viewing your shop as the owner" in footer
- Access to add/edit products
- Access to orders and settings

### As Visitor

Regular visitors see:
- Clean storefront without admin buttons
- Product browsing
- Add to cart (coming soon)
- Checkout flow (coming soon)

## 🎨 Customization

### Update Shop Info

Edit your shop name and description:

```typescript
import { ShopService } from '@/lib';

await ShopService.upsertShopSettings(shopId, {
  shop_name: 'My Awesome Shop',
  shop_description: 'The best products at great prices',
  currency: 'BDT', // or 'USD'
  shop_email: 'support@myshop.com'
});
```

### Add Product Images

When creating products, upload images:

```typescript
const imageFile = // File from input
await ProductService.createProduct(productData, [imageFile]);
```

## 🔍 Troubleshooting

### "No Products Yet" Message

If you see this message:
1. Run `npm run seed` to add sample products
2. OR manually add products via Dashboard
3. Make sure products have `is_active: true`

### Shop Not Loading

1. Check that the user exists: `npx tsx scripts/create-test-user.ts`
2. Verify database connection in console
3. Check shop_settings table has an entry for your user ID

### Images Not Showing

1. Make sure images are uploaded to `product-images` bucket
2. Check `image_url` field in products table
3. Verify InsForge storage is configured

## 📁 File Structure

```
app/
├── (auth)/
│   ├── demo/
│   │   └── page.tsx          # Auto-login demo route
│   ├── login/
│   │   └── page.tsx          # Manual login
│   └── signup/
│       └── page.tsx          # User registration
├── (storefront)/
│   └── [shop]/
│       ├── layout.tsx        # Shop header/footer
│       ├── page.tsx          # Product listing (UPDATED ✅)
│       ├── cart/
│       │   └── page.tsx      # Shopping cart
│       └── product/
│           └── [id]/
│               └── page.tsx  # Product details
└── (dashboard)/
    └── products/
        └── page.tsx          # Product management
```

## 🚀 Next Steps

1. ✅ **Add Products** - Run seed script or add manually
2. 🛒 **Test Shopping** - Browse products as a customer
3. 📊 **Manage Shop** - Use dashboard to update products
4. 🎨 **Customize** - Update shop name and description
5. 📸 **Add Images** - Upload product photos
6. 💰 **Configure Payments** - Set up payment methods
7. 🚚 **Setup Shipping** - Add shipping options

## 📞 Support

For issues or questions:
- Check console logs for errors
- Review InsForge documentation
- Check database tables in dashboard

Happy selling! 🎉

