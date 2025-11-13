/**
 * E2E Test: Complete Checkout Flow
 *
 * This test simulates a complete user journey through the checkout process:
 * 1. Browse products
 * 2. Add items to cart
 * 3. Proceed to checkout
 * 4. Complete payment
 * 5. Receive confirmation
 *
 * Note: This test requires Playwright or Cypress to be set up
 * Run with: npm run test:e2e
 */

import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should complete full checkout process', async ({ page }) => {
    // 1. Visit storefront
    await page.goto('/test-shop');
    await expect(page).toHaveTitle(/Test Shop/);

    // 2. Browse products
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();

    // 3. Add product to cart
    await page.locator('[data-testid="add-to-cart"]').first().click();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    // 4. Open cart
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();

    // 5. Proceed to checkout
    await page.locator('[data-testid="checkout-button"]').click();
    await expect(page).toHaveURL(/.*checkout/);

    // 6. Fill shipping information
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="phone"]', '+15551234567');
    await page.fill('[name="street"]', '123 Main St');
    await page.fill('[name="city"]', 'New York');
    await page.fill('[name="state"]', 'NY');
    await page.fill('[name="zip"]', '10001');

    // 7. Select shipping method
    await page.locator('[data-testid="shipping-method"]').first().click();

    // 8. Select payment method
    await page.locator('[data-testid="payment-cod"]').click();

    // 9. Place order
    await page.locator('[data-testid="place-order"]').click();

    // 10. Verify order confirmation
    await expect(page).toHaveURL(/.*order/);
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toContainText('ORD-');
  });

  test('should apply discount code', async ({ page }) => {
    // Add product to cart
    await page.goto('/test-shop');
    await page.locator('[data-testid="add-to-cart"]').first().click();
    await page.locator('[data-testid="cart-button"]').click();
    await page.locator('[data-testid="checkout-button"]').click();

    // Apply discount code
    await page.fill('[data-testid="discount-code"]', 'SAVE10');
    await page.locator('[data-testid="apply-discount"]').click();

    // Verify discount applied
    await expect(page.locator('[data-testid="discount-amount"]')).not.toHaveText('$0.00');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/checkout');

    // Try to submit without filling fields
    await page.locator('[data-testid="place-order"]').click();

    // Verify validation errors
    await expect(page.locator('[data-testid="error-firstName"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
  });

  test('should handle out of stock products', async ({ page }) => {
    await page.goto('/test-shop/product/out-of-stock');

    // Verify add to cart is disabled
    await expect(page.locator('[data-testid="add-to-cart"]')).toBeDisabled();
    await expect(page.locator('[data-testid="out-of-stock-message"]')).toBeVisible();
  });
});

test.describe('Customer Account', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/account');
  });

  test('should view order history', async ({ page }) => {
    await page.goto('/account/orders');

    // Verify orders are displayed
    await expect(page.locator('[data-testid="order-item"]').first()).toBeVisible();
  });

  test('should track order', async ({ page }) => {
    await page.goto('/account/orders');
    await page.locator('[data-testid="view-order"]').first().click();

    // Verify order details
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
  });

  test('should update profile', async ({ page }) => {
    await page.goto('/account/profile');

    // Update name
    await page.fill('[name="firstName"]', 'Jane');
    await page.fill('[name="lastName"]', 'Smith');
    await page.click('[data-testid="save-profile"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should manage addresses', async ({ page }) => {
    await page.goto('/account/addresses');

    // Add new address
    await page.click('[data-testid="add-address"]');
    await page.fill('[name="street"]', '456 Elm St');
    await page.fill('[name="city"]', 'Boston');
    await page.fill('[name="state"]', 'MA');
    await page.fill('[name="zip"]', '02101');
    await page.click('[data-testid="save-address"]');

    // Verify address added
    await expect(page.locator('[data-testid="address-item"]')).toContainText('456 Elm St');
  });
});
