// Validation utilities for data integrity
import type {
  Product,
  ProductVariant,
  Order,
  Customer,
  DiscountCode,
  ShopSettings
} from '../types/database';

// ============================================================================
// String Validators
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate URL-friendly slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/--+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Validate phone number (basic international format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// ============================================================================
// Product Validators
// ============================================================================

export interface ProductValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate product data
 */
export function validateProduct(product: Partial<Product>): ProductValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required');
  }

  if (product.name && product.name.length > 500) {
    errors.push('Product name must be 500 characters or less');
  }

  if (!product.slug || product.slug.trim().length === 0) {
    errors.push('Product slug is required');
  }

  if (product.slug && !isValidSlug(product.slug)) {
    errors.push('Product slug must contain only lowercase letters, numbers, and hyphens');
  }

  // Price validation
  if (product.base_price !== undefined) {
    if (product.base_price < 0) {
      errors.push('Product price cannot be negative');
    }
    if (product.base_price > 999999.99) {
      errors.push('Product price is too high');
    }
  }

  if (product.compare_at_price !== undefined && product.compare_at_price < 0) {
    errors.push('Compare at price cannot be negative');
  }

  if (product.cost_per_item !== undefined && product.cost_per_item < 0) {
    errors.push('Cost per item cannot be negative');
  }

  // Inventory validation
  if (product.inventory_quantity !== undefined && product.inventory_quantity < 0) {
    errors.push('Inventory quantity cannot be negative');
  }

  // Weight validation
  if (product.weight !== undefined && product.weight < 0) {
    errors.push('Weight cannot be negative');
  }

  // SKU and Barcode
  if (product.sku && product.sku.length > 100) {
    errors.push('SKU must be 100 characters or less');
  }

  if (product.barcode && product.barcode.length > 100) {
    errors.push('Barcode must be 100 characters or less');
  }

  // Meta fields
  if (product.meta_title && product.meta_title.length > 255) {
    errors.push('Meta title must be 255 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate product variant data
 */
export function validateProductVariant(variant: Partial<ProductVariant>): ProductValidationResult {
  const errors: string[] = [];

  if (!variant.name || variant.name.trim().length === 0) {
    errors.push('Variant name is required');
  }

  if (variant.price !== undefined && variant.price < 0) {
    errors.push('Variant price cannot be negative');
  }

  if (variant.inventory_quantity !== undefined && variant.inventory_quantity < 0) {
    errors.push('Inventory quantity cannot be negative');
  }

  if (variant.weight !== undefined && variant.weight < 0) {
    errors.push('Weight cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Order Validators
// ============================================================================

/**
 * Validate order data
 */
export function validateOrder(order: Partial<Order>): ProductValidationResult {
  const errors: string[] = [];

  // Email validation
  if (!order.customer_email) {
    errors.push('Customer email is required');
  } else if (!isValidEmail(order.customer_email)) {
    errors.push('Invalid customer email format');
  }

  // Amounts validation
  if (order.subtotal !== undefined && order.subtotal < 0) {
    errors.push('Subtotal cannot be negative');
  }

  if (order.discount_amount !== undefined && order.discount_amount < 0) {
    errors.push('Discount amount cannot be negative');
  }

  if (order.shipping_cost !== undefined && order.shipping_cost < 0) {
    errors.push('Shipping cost cannot be negative');
  }

  if (order.tax_amount !== undefined && order.tax_amount < 0) {
    errors.push('Tax amount cannot be negative');
  }

  if (order.total !== undefined && order.total < 0) {
    errors.push('Order total cannot be negative');
  }

  // Address validation
  if (!order.shipping_first_name || order.shipping_first_name.trim().length === 0) {
    errors.push('Shipping first name is required');
  }

  if (!order.shipping_last_name || order.shipping_last_name.trim().length === 0) {
    errors.push('Shipping last name is required');
  }

  if (!order.shipping_address1 || order.shipping_address1.trim().length === 0) {
    errors.push('Shipping address is required');
  }

  if (!order.shipping_city || order.shipping_city.trim().length === 0) {
    errors.push('Shipping city is required');
  }

  if (!order.shipping_state || order.shipping_state.trim().length === 0) {
    errors.push('Shipping state is required');
  }

  if (!order.shipping_postal_code || order.shipping_postal_code.trim().length === 0) {
    errors.push('Shipping postal code is required');
  }

  if (!order.shipping_country || order.shipping_country.trim().length === 0) {
    errors.push('Shipping country is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Customer Validators
// ============================================================================

/**
 * Validate customer data
 */
export function validateCustomer(customer: Partial<Customer>): ProductValidationResult {
  const errors: string[] = [];

  if (!customer.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(customer.email)) {
    errors.push('Invalid email format');
  }

  if (!customer.first_name || customer.first_name.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!customer.last_name || customer.last_name.trim().length === 0) {
    errors.push('Last name is required');
  }

  if (customer.phone && !isValidPhone(customer.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Discount Code Validators
// ============================================================================

/**
 * Validate discount code data
 */
export function validateDiscountCode(discount: Partial<DiscountCode>): ProductValidationResult {
  const errors: string[] = [];

  if (!discount.code || discount.code.trim().length === 0) {
    errors.push('Discount code is required');
  }

  if (discount.code && discount.code.length > 100) {
    errors.push('Discount code must be 100 characters or less');
  }

  if (discount.discount_value !== undefined && discount.discount_value <= 0) {
    errors.push('Discount value must be greater than 0');
  }

  if (discount.discount_type === 'percentage' && discount.discount_value && discount.discount_value > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }

  if (discount.minimum_purchase !== undefined && discount.minimum_purchase < 0) {
    errors.push('Minimum purchase cannot be negative');
  }

  if (discount.maximum_discount !== undefined && discount.maximum_discount < 0) {
    errors.push('Maximum discount cannot be negative');
  }

  if (discount.usage_limit !== undefined && discount.usage_limit < 1) {
    errors.push('Usage limit must be at least 1');
  }

  if (discount.usage_limit_per_customer !== undefined && discount.usage_limit_per_customer < 1) {
    errors.push('Usage limit per customer must be at least 1');
  }

  // Date validation
  if (discount.starts_at && discount.expires_at) {
    const startDate = new Date(discount.starts_at);
    const endDate = new Date(discount.expires_at);
    if (endDate <= startDate) {
      errors.push('Expiration date must be after start date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Shop Settings Validators
// ============================================================================

/**
 * Validate shop settings
 */
export function validateShopSettings(settings: Partial<ShopSettings>): ProductValidationResult {
  const errors: string[] = [];

  if (!settings.shop_name || settings.shop_name.trim().length === 0) {
    errors.push('Shop name is required');
  }

  if (settings.shop_name && settings.shop_name.length > 255) {
    errors.push('Shop name must be 255 characters or less');
  }

  if (!settings.shop_email) {
    errors.push('Shop email is required');
  } else if (!isValidEmail(settings.shop_email)) {
    errors.push('Invalid shop email format');
  }

  if (settings.shop_phone && !isValidPhone(settings.shop_phone)) {
    errors.push('Invalid shop phone format');
  }

  if (settings.logo_url && !isValidUrl(settings.logo_url)) {
    errors.push('Invalid logo URL');
  }

  if (settings.facebook_url && !isValidUrl(settings.facebook_url)) {
    errors.push('Invalid Facebook URL');
  }

  if (settings.instagram_url && !isValidUrl(settings.instagram_url)) {
    errors.push('Invalid Instagram URL');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// File Validators
// ============================================================================

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }

  return { isValid: true };
}

/**
 * Validate multiple images
 */
export function validateImageFiles(
  files: File[],
  maxFiles: number = 10,
  maxSizeMB: number = 5
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} images allowed`);
  }

  files.forEach((file, index) => {
    const result = validateImageFile(file, maxSizeMB);
    if (!result.isValid) {
      errors.push(`Image ${index + 1}: ${result.error}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Password Validators
// ============================================================================

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Determine strength
  const criteriaCount = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
    password.length >= 12
  ].filter(Boolean).length;

  if (criteriaCount >= 5) {
    strength = 'strong';
  } else if (criteriaCount >= 3) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors
  };
}





