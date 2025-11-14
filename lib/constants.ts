// Application-wide constants

// ============================================================================
// App Configuration
// ============================================================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Shamlai';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const APP_DESCRIPTION = 'Complete e-commerce solution for modern businesses';

// ============================================================================
// API Configuration
// ============================================================================

export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const PAGINATION_SIZES = [10, 20, 50, 100];

// ============================================================================
// File Upload
// ============================================================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGES_PER_PRODUCT = 10;
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// ============================================================================
// Validation
// ============================================================================

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_PRODUCT_NAME_LENGTH = 3;
export const MAX_PRODUCT_NAME_LENGTH = 500;
export const MIN_PRODUCT_PRICE = 0;
export const MAX_PRODUCT_PRICE = 999999.99;

// ============================================================================
// Currency & Locale
// ============================================================================

export const DEFAULT_CURRENCY = 'BDT';
export const DEFAULT_LOCALE = 'en-US';
export const SUPPORTED_CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'INR'];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
};

// ============================================================================
// Date & Time
// ============================================================================

export const DEFAULT_DATE_FORMAT = 'MMM dd, yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm:ss';
export const DEFAULT_DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';

// ============================================================================
// Order Status
// ============================================================================

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

// ============================================================================
// Payment Status
// ============================================================================

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

// ============================================================================
// Fulfillment Status
// ============================================================================

export const FULFILLMENT_STATUSES = {
  UNFULFILLED: 'unfulfilled',
  PARTIAL: 'partial',
  FULFILLED: 'fulfilled',
} as const;

export const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  unfulfilled: 'Unfulfilled',
  partial: 'Partially Fulfilled',
  fulfilled: 'Fulfilled',
};

// ============================================================================
// Discount Types
// ============================================================================

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SHIPPING: 'free_shipping',
} as const;

export const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: 'Percentage Off',
  fixed_amount: 'Fixed Amount Off',
  free_shipping: 'Free Shipping',
};

// ============================================================================
// User Roles
// ============================================================================

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  CUSTOMER: 'customer',
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURES = {
  CHATBOT: process.env.NEXT_PUBLIC_ENABLE_CHATBOT === 'true',
  REVIEWS: process.env.NEXT_PUBLIC_ENABLE_REVIEWS === 'true',
  WISHLISTS: process.env.NEXT_PUBLIC_ENABLE_WISHLISTS === 'true',
  GUEST_CHECKOUT: process.env.NEXT_PUBLIC_ENABLE_GUEST_CHECKOUT === 'true',
  PWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
} as const;

// ============================================================================
// Cart
// ============================================================================

export const CART_UPDATED_EVENT = 'cart:updated';
export const CART_SESSION_STORAGE_KEY = 'session_id';

// ============================================================================
// Rate Limiting
// ============================================================================

export const RATE_LIMITS = {
  API_DEFAULT: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  UPLOAD: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
};

// ============================================================================
// Cache TTL (Time To Live)
// ============================================================================

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
};

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created!',
  UPDATED: 'Successfully updated!',
  DELETED: 'Successfully deleted!',
  SAVED: 'Successfully saved!',
};

// ============================================================================
// Routes
// ============================================================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

// ============================================================================
// Social Media
// ============================================================================

export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/shamlai',
  INSTAGRAM: 'https://instagram.com/shamlai',
  TWITTER: 'https://twitter.com/shamlai',
  LINKEDIN: 'https://linkedin.com/company/shamlai',
};

// ============================================================================
// Contact Information
// ============================================================================

export const CONTACT = {
  EMAIL: 'support@shamlai.com',
  PHONE: '+880 1234-567890',
  ADDRESS: 'Dhaka, Bangladesh',
};

// ============================================================================
// SEO
// ============================================================================

export const SEO_DEFAULTS = {
  TITLE_TEMPLATE: '%s | Shamlai',
  DEFAULT_TITLE: 'Shamlai — Build Your Online Shop in 2 Clicks',
  DEFAULT_DESCRIPTION:
    'Complete e-commerce solution for modern businesses. Launch in minutes, not months.',
  DEFAULT_IMAGE: '/og-image.jpg',
  TWITTER_HANDLE: '@shamlai',
};

export default {
  APP_NAME,
  APP_URL,
  APP_DESCRIPTION,
  DEFAULT_CURRENCY,
  FEATURES,
  ROUTES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
