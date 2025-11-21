/**
 * Centralized error messages
 */

export const ERROR_MESSAGES = {
  // Auth errors
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Your session has expired. Please sign in again',
    TOKEN_INVALID: 'Invalid authentication token',
    UNAUTHORIZED: 'You must be signed in to access this resource',
    FORBIDDEN: 'You do not have permission to access this resource',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
    WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  },

  // Product errors
  PRODUCT: {
    NOT_FOUND: 'Product not found',
    INVALID_PRICE: 'Product price must be greater than 0',
    INVALID_STOCK: 'Stock quantity cannot be negative',
    DUPLICATE_SKU: 'A product with this SKU already exists',
    INSUFFICIENT_STOCK: 'Insufficient stock available',
  },

  // Order errors
  ORDER: {
    NOT_FOUND: 'Order not found',
    EMPTY_CART: 'Cannot checkout with an empty cart',
    INVALID_STATUS_TRANSITION: 'Cannot change order status to the requested state',
    ALREADY_PAID: 'This order has already been paid',
    CANNOT_CANCEL: 'This order cannot be cancelled',
  },

  // Cart errors
  CART: {
    NOT_FOUND: 'Shopping cart not found',
    ITEM_NOT_FOUND: 'Item not found in cart',
    INVALID_QUANTITY: 'Quantity must be between 1 and 1000',
  },

  // Discount errors
  DISCOUNT: {
    NOT_FOUND: 'Discount code not found',
    EXPIRED: 'This discount code has expired',
    NOT_STARTED: 'This discount code is not yet active',
    USAGE_LIMIT_REACHED: 'This discount code has reached its usage limit',
    MIN_PURCHASE_NOT_MET: 'Minimum purchase amount not met for this discount',
    NOT_APPLICABLE: 'This discount code does not apply to items in your cart',
  },

  // Shop errors
  SHOP: {
    NOT_FOUND: 'Shop not found',
    SUBDOMAIN_TAKEN: 'This subdomain is already taken',
    INVALID_SUBDOMAIN: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
  },

  // Customer errors
  CUSTOMER: {
    NOT_FOUND: 'Customer not found',
    DUPLICATE_EMAIL: 'A customer with this email already exists',
  },

  // System errors
  SYSTEM: {
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again later',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
    INVALID_REQUEST: 'Invalid request data',
    DATABASE_ERROR: 'Database operation failed',
  },

  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Invalid email address',
    INVALID_PHONE: 'Invalid phone number',
    INVALID_URL: 'Invalid URL format',
    INVALID_UUID: 'Invalid ID format',
    STRING_TOO_LONG: 'Value exceeds maximum length',
    STRING_TOO_SHORT: 'Value is below minimum length',
    NUMBER_TOO_LARGE: 'Value exceeds maximum',
    NUMBER_TOO_SMALL: 'Value is below minimum',
  },
} as const;
