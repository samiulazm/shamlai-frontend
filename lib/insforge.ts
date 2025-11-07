import { createClient } from '@insforge/sdk';
import { logger } from './utils/logger';

// InsForge Backend Configuration
// During build time, use a placeholder URL; at runtime, check for the actual URL
const INSFORGE_URL =
  process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://3ftnzn2r.us-east.insforge.app';

// Validate environment variables at runtime (not during build)
// This check will run when the client is actually instantiated in the browser
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !process.env.NEXT_PUBLIC_INSFORGE_URL
) {
  console.warn(
    'Warning: NEXT_PUBLIC_INSFORGE_URL environment variable is not set. Using fallback URL.'
  );
}

// Create and export the InsForge client
export const insforgeClient = createClient({
  baseUrl: INSFORGE_URL,
});

// Export types for TypeScript usage
export type InsforgeClient = typeof insforgeClient;

// Helper function to handle errors consistently
export const handleInsforgeError = (error: any) => {
  logger.error('InsForge Error', error instanceof Error ? error : new Error(String(error)), {
    code: error?.code,
    details: error?.details,
  });
  return {
    message: error?.message || 'An unexpected error occurred',
    code: error?.code || 'UNKNOWN_ERROR',
    details: error?.details || null,
  };
};

// Helper function for file uploads with progress
export const uploadFile = async (
  bucket: string,
  fileName: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
) => {
  try {
    const { data, error } = await insforgeClient.storage.from(bucket).upload(fileName, file);

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

// Helper function to get current user with error handling
export const getCurrentUser = async () => {
  try {
    const { data, error } = await insforgeClient.auth.getCurrentUser();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

// Storage bucket names (constants for consistency)
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  CATEGORY_IMAGES: 'category-images',
  SHOP_ASSETS: 'shop-assets',
  BLOG_IMAGES: 'blog-images',
  REVIEW_IMAGES: 'review-images',
  CHATBOT_ATTACHMENTS: 'chatbot-attachments',
} as const;

// Order status constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Fulfillment status constants
export const FULFILLMENT_STATUS = {
  UNFULFILLED: 'unfulfilled',
  PARTIAL: 'partial',
  FULFILLED: 'fulfilled',
} as const;

// Discount type constants
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SHIPPING: 'free_shipping',
} as const;

export default insforgeClient;

// Export all services
export * as ProductService from './services/products';
export * as OrderService from './services/orders';
export * as CartService from './services/cart';
export * as MarketingService from './services/marketing';
export * as ShopService from './services/shop';

// Export all types
export * from './types/database';

// Export validation utilities
export * as Validation from './utils/validation';

// Export seed data utilities
export * as SeedData from './utils/seed-data';

// Export React hooks
export * from './hooks/useProducts';
export * from './hooks/useOrders';
export * from './hooks/useCart';
export * from './hooks/useShop';
