// Main export file for Supabase integration
// Provides easy access to all services, types, and utilities

// Core client
export { supabaseClient, default } from './supabase';

// Services
export * as ProductService from './services/products';
export * as OrderService from './services/orders';
export * as CartService from './services/cart';
export * as MarketingService from './services/marketing';
export * as ShopService from './services/shop';

// Types
export * from './types/database';

// Constants
export {
  STORAGE_BUCKETS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  FULFILLMENT_STATUS,
  DISCOUNT_TYPES,
} from './supabase';

// Utilities
export * as Validation from './utils/validation';
export * as SeedData from './utils/seed-data';
export * as AIHelpers from './utils/ai-helpers';

// React Hooks
export * from './hooks/useProducts';
export * from './hooks/useOrders';
export * from './hooks/useCart';
export * from './hooks/useShop';
export * from './hooks/useRealtime';

// Helper functions
export {
  handleSupabaseError,
  handleInsforgeError,
  uploadFile,
  uploadFileWithRetry,
  getCurrentUser,
  resetPasswordForEmail,
  updatePassword,
  updateUserProfile,
  verifyEmail,
  resendVerificationEmail,
  refreshSession,
  onAuthStateChange,
  invokeFunction,
  subscribeToTable,
  getPublicUrl,
  deleteFile,
  listFiles,
  downloadFile,
  moveFile,
  copyFile,
  fileExists,
  executeWithRetry,
  callRPC,
  executeBatch,
  upsert,
  bulkInsert,
  bulkUpdate,
} from './supabase';
