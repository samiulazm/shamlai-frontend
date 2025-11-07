import {
  isValidEmail,
  isValidUrl,
  generateSlug,
  isValidSlug,
  validateProduct,
  validatePassword,
} from '@/lib/utils/validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://invalid')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('generateSlug', () => {
    it('should generate valid slugs', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Product Name 123')).toBe('product-name-123');
      expect(generateSlug('Special!@#$%Characters')).toBe('specialcharacters');
    });

    it('should handle edge cases', () => {
      expect(generateSlug('  Trimmed  ')).toBe('trimmed');
      expect(generateSlug('Multiple---Dashes')).toBe('multiple-dashes');
      expect(generateSlug('CamelCase')).toBe('camelcase');
    });
  });

  describe('isValidSlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSlug('valid-slug')).toBe(true);
      expect(isValidSlug('slug-123')).toBe(true);
      expect(isValidSlug('a')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('Invalid Slug')).toBe(false);
      expect(isValidSlug('UPPERCASE')).toBe(false);
      expect(isValidSlug('slug_underscore')).toBe(false);
      expect(isValidSlug('slug--double')).toBe(false);
    });
  });

  describe('validateProduct', () => {
    it('should validate correct product data', () => {
      const validProduct = {
        name: 'Test Product',
        slug: 'test-product',
        base_price: 99.99,
        shop_id: 'shop-123',
        track_inventory: true,
        inventory_quantity: 10,
        allow_backorder: false,
        is_active: true,
        is_featured: false,
        has_variants: false,
      };

      const result = validateProduct(validProduct);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject product with missing name', () => {
      const invalidProduct = {
        slug: 'test-product',
        base_price: 99.99,
      };

      const result = validateProduct(invalidProduct as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    it('should reject product with negative price', () => {
      const invalidProduct = {
        name: 'Test Product',
        slug: 'test-product',
        base_price: -10,
      };

      const result = validateProduct(invalidProduct as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product price cannot be negative');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongP@ssw0rd123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require minimum length', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
  });
});

