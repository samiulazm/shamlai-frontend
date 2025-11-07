// Main export file for InsForge integration
// Provides easy access to all services, types, and utilities

// Core client
export { insforgeClient, default } from './insforge';

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
  DISCOUNT_TYPES
} from './insforge';

// Utilities
export * as Validation from './utils/validation';
export * as SeedData from './utils/seed-data';

// React Hooks
export * from './hooks/useProducts';
export * from './hooks/useOrders';
export * from './hooks/useCart';
export * from './hooks/useShop';

// Helper functions
export {
  handleInsforgeError,
  uploadFile,
  getCurrentUser
} from './insforge';





