/**
 * Enterprise-grade validation schemas using Zod
 * Similar to Shopify's validation patterns
 */

import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const idSchema = z.string().uuid('Invalid ID format');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const urlSchema = z.string().url('Invalid URL format');

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
  .min(1)
  .max(100);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  shopName: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().positive('Price must be positive'),
  compareAtPrice: z.coerce.number().positive().optional(),
  cost: z.coerce.number().nonnegative().optional(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  stockQuantity: z.coerce.number().int().nonnegative().default(0),
  trackInventory: z.boolean().default(true),
  weight: z.coerce.number().nonnegative().optional(),
  weightUnit: z.enum(['kg', 'g', 'lb', 'oz']).default('kg'),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'draft', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  taxable: z.boolean().default(true),
  shopId: z.string().uuid('Invalid shop ID'),
});

export const updateProductSchema = productSchema.partial().omit({ shopId: true });

export const productVariantSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().default(0),
  weight: z.coerce.number().nonnegative().optional(),
  options: z.record(z.string()).optional(), // e.g., { "color": "red", "size": "M" }
});

export const bulkProductUpdateSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    status: z.enum(['active', 'draft', 'archived']).optional(),
    featured: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const addressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(100).optional(),
  address1: z.string().min(1).max(255),
  address2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional(),
  country: z.string().length(2, 'Country must be 2-letter ISO code'),
  postalCode: z.string().min(1).max(20),
  phone: phoneSchema,
});

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().max(1000),
  price: z.coerce.number().positive().optional(), // Optional for cart, required for checkout
});

export const checkoutSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerEmail: emailSchema.optional(),
  items: z.array(orderItemSchema).min(1, 'Cart must have at least one item'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethodId: z.string().uuid(),
  paymentMethodId: z.string().uuid(),
  discountCode: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  notes: z.string().max(500).optional(),
  notifyCustomer: z.boolean().default(true),
});

export const fulfillOrderSchema = z.object({
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: urlSchema.optional(),
  courierName: z.string().max(100).optional(),
  shippedAt: z.coerce.date().optional(),
});

// ============================================================================
// CART SCHEMAS
// ============================================================================

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().max(1000),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.coerce.number().int().nonnegative().max(1000),
});

// ============================================================================
// DISCOUNT SCHEMAS
// ============================================================================

export const discountCodeSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.coerce.number().positive(),
  minPurchaseAmount: z.coerce.number().nonnegative().optional(),
  maxDiscountAmount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  usageLimitPerCustomer: z.coerce.number().int().positive().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  appliesToProducts: z.array(z.string().uuid()).optional(),
  appliesToCategories: z.array(z.string().uuid()).optional(),
  shopId: z.string().uuid(),
}).refine((data) => data.endsAt > data.startsAt, {
  message: 'End date must be after start date',
  path: ['endsAt'],
});

// ============================================================================
// SHOP SETTINGS SCHEMAS
// ============================================================================

export const shopSettingsSchema = z.object({
  shopName: z.string().min(2).max(100),
  subdomain: slugSchema.optional(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  description: z.string().max(1000).optional(),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('BDT'),
  timezone: z.string().default('Asia/Dhaka'),
  address: addressSchema.optional(),
  logo: urlSchema.optional(),
  favicon: urlSchema.optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// ============================================================================
// TAX SCHEMAS
// ============================================================================

export const taxRateSchema = z.object({
  name: z.string().min(1).max(100),
  rate: z.coerce.number().min(0).max(1), // 0 to 1 (0% to 100%)
  country: z.string().length(2),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  taxableCategories: z.array(z.string().uuid()).optional(),
  priority: z.coerce.number().int().nonnegative().default(0),
  isCompound: z.boolean().default(false), // For cascading taxes
  shopId: z.string().uuid(),
});

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

export const searchSchema = z.object({
  query: z.string().min(1).max(100).trim(),
  type: z.enum(['products', 'orders', 'customers', 'all']).default('all'),
  shopId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// ============================================================================
// CUSTOMER SCHEMAS
// ============================================================================

export const customerSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: phoneSchema.optional(),
  acceptsMarketing: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
  shopId: z.string().uuid(),
});

export const updateCustomerSchema = customerSchema.partial().omit({ shopId: true });

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

export const webhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.enum([
    'order.created',
    'order.updated',
    'order.cancelled',
    'product.created',
    'product.updated',
    'customer.created',
  ])).min(1),
  secret: z.string().min(16).max(100),
  isActive: z.boolean().default(true),
});

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const schemas = {
  // Auth
  signup: signupSchema,
  signin: signinSchema,
  resetPassword: resetPasswordSchema,
  updatePassword: updatePasswordSchema,

  // Products
  product: productSchema,
  updateProduct: updateProductSchema,
  productVariant: productVariantSchema,
  bulkProductUpdate: bulkProductUpdateSchema,

  // Orders
  checkout: checkoutSchema,
  updateOrderStatus: updateOrderStatusSchema,
  fulfillOrder: fulfillOrderSchema,

  // Cart
  addToCart: addToCartSchema,
  updateCartItem: updateCartItemSchema,

  // Discounts
  discountCode: discountCodeSchema,

  // Shop
  shopSettings: shopSettingsSchema,

  // Tax
  taxRate: taxRateSchema,

  // Search
  search: searchSchema,

  // Customer
  customer: customerSchema,
  updateCustomer: updateCustomerSchema,

  // Webhooks
  webhook: webhookSchema,

  // Common
  address: addressSchema,
  pagination: paginationSchema,
};

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type TaxRateInput = z.infer<typeof taxRateSchema>;
export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
