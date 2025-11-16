'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { insforgeClient, CartService, OrderService } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import { getOrCreateCartSessionId, dispatchCartUpdatedEvent } from '@/lib/utils/cart';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    base_price: number;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
  };
}

export default function Checkout() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.shop as string;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [shippingMethods, setShippingMethods] = useState<
    Array<{ id: string; name: string; cost: number | string | null; description?: string }>
  >([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    paymentMethod: 'cod',
  });

  useEffect(() => {
    fetchCart();
    fetchShippingMethods();
  }, [shopId]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = typeof window !== 'undefined' ? getOrCreateCartSessionId() : null;
      if (!sessionId) {
        router.push(`/${shopId}/cart`);
        return;
      }

      const cart = await CartService.getOrCreateCart(undefined, sessionId);
      const cartWithItems = await CartService.getCartWithItems(cart.id);

      if (!cartWithItems.items || cartWithItems.items.length === 0) {
        router.push(`/${shopId}/cart`);
        return;
      }

      setCartItems(cartWithItems.items);
      setSubtotal(cartWithItems.subtotal || 0);
    } catch (err: any) {
      logger.error('Error fetching cart', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingMethods = async () => {
    try {
      const { data } = await insforgeClient.database
        .from('shipping_methods')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (data && data.length > 0) {
        setShippingMethods(data);
        setSelectedShippingMethod(data[0].id);
        setShipping(parseFloat(data[0].cost?.toString() || '0'));
      } else {
        setShipping(80);
      }
    } catch (err) {
      logger.error(
        'Error fetching shipping methods',
        err instanceof Error ? err : new Error(String(err))
      );
      setShipping(80);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingSelect = (methodId: string) => {
    setSelectedShippingMethod(methodId);
    const method = shippingMethods.find((method) => method.id === methodId);
    setShipping(method ? parseFloat(method.cost?.toString() || '0') : 0);
  };

  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) {
      setDiscountError('Please enter a discount code.');
      return;
    }

    try {
      setApplyingDiscount(true);
      setDiscountError(null);
      const code = discountCodeInput.trim().toUpperCase();

      const { data: discount } = await insforgeClient.database
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .single();

      if (!discount) {
        setDiscountError('Invalid discount code.');
        setDiscountAmount(0);
        setAppliedDiscountCode(null);
        return;
      }

      const now = new Date();
      const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
      const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

      if (
        (validFrom && now < validFrom) ||
        (validUntil && now > validUntil) ||
        (discount.usage_limit !== null && discount.usage_count >= discount.usage_limit) ||
        (discount.minimum_purchase && subtotal < parseFloat(discount.minimum_purchase.toString()))
      ) {
        setDiscountError('This code is not applicable right now.');
        setDiscountAmount(0);
        setAppliedDiscountCode(null);
        return;
      }

      let computedDiscount = 0;
      if (discount.discount_type === 'percentage') {
        computedDiscount = (subtotal * parseFloat(discount.discount_value.toString())) / 100;
        if (discount.maximum_discount) {
          computedDiscount = Math.min(
            computedDiscount,
            parseFloat(discount.maximum_discount.toString())
          );
        }
      } else if (discount.discount_type === 'fixed_amount') {
        computedDiscount = parseFloat(discount.discount_value.toString());
      } else if (discount.discount_type === 'free_shipping') {
        setShipping(0);
      }

      setDiscountAmount(Math.min(computedDiscount, subtotal));
      setAppliedDiscountCode(code);
    } catch (err) {
      logger.error('Error applying discount', err instanceof Error ? err : new Error(String(err)));
      setDiscountError('Failed to apply discount. Please try again.');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handlePlaceOrder = async () => {
    const requiredFields: Array<keyof typeof formData> = [
      'firstName',
      'email',
      'phone',
      'address',
      'city',
    ];
    const newErrors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    if (!selectedShippingMethod) {
      newErrors.shippingMethod = 'Please select a shipping method';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setError('Please fix the highlighted fields.');
      return;
    }

    setFormErrors({});
    setError(null);

    try {
      setPlacingOrder(true);
      setError(null);

      const sessionId = typeof window !== 'undefined' ? getOrCreateCartSessionId() : null;
      if (!sessionId) {
        throw new Error('Session expired. Please try again.');
      }

      const cart = await CartService.getOrCreateCart(undefined, sessionId);
      const cartWithItems = await CartService.getCartWithItems(cart.id);

      if (!cartWithItems.items || cartWithItems.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Verify shop exists (shopId is the user ID)
      const { data: shopSettings } = await insforgeClient.database
        .from('shop_settings')
        .select('shop_id')
        .eq('shop_id', shopId)
        .single();

      // Shop settings might not exist yet, but shopId is valid if it's a user ID
      // We'll proceed with the order creation

      // Get or create customer
      const customer = await OrderService.getOrCreateCustomer(
        shopId,
        formData.email,
        formData.firstName,
        formData.lastName,
        formData.phone,
        shopId
      );

      // Prepare order items from cart
      const orderItems = cartWithItems.items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product.name,
        variant_name: item.variant?.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: item.price,
        discount_amount: 0,
        total: item.price * item.quantity,
        image_url: undefined,
      }));

      const total = Math.max(0, subtotal - discountAmount) + shipping;

      // Create order
      const order = await OrderService.createOrder(
        {
          shop_id: shopId,
          customer_id: customer.id,
          status: 'pending',
          payment_status: formData.paymentMethod === 'cod' ? 'pending' : 'pending',
          fulfillment_status: 'unfulfilled',
          subtotal,
          discount_amount: discountAmount,
          shipping_cost: shipping,
          tax_amount: 0,
          total,
          customer_email: formData.email,
          customer_phone: formData.phone,
          shipping_first_name: formData.firstName,
          shipping_last_name: formData.lastName,
          shipping_address1: formData.address,
          shipping_city: formData.city,
          shipping_state: formData.state || '',
          shipping_postal_code: formData.postalCode,
          shipping_country: 'Bangladesh',
          billing_first_name: formData.firstName,
          billing_last_name: formData.lastName,
          billing_address1: formData.address,
          billing_city: formData.city,
          billing_state: formData.state || '',
          billing_postal_code: formData.postalCode,
          billing_country: 'Bangladesh',
        },
        orderItems
      );

      // Clear cart after successful order
      await CartService.clearCart(cart.id);
      dispatchCartUpdatedEvent({ action: 'checkout-complete' });

      // Redirect to order confirmation
      router.push(`/${shopId}/order/${order.id}`);
    } catch (err: any) {
      logger.error('Error placing order', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="container-responsive py-4 sm:py-6 md:py-10">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: 'var(--theme-primary)' }}
            ></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  const total = Math.max(0, subtotal - discountAmount) + shipping;
  const currencySymbol = '৳';

  return (
    <div className="container-responsive py-4 sm:py-6 md:py-10">
      {/* Mobile: Show progress indicator */}
      <div className="mb-4 md:hidden">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="font-medium text-gray-900">Checkout</span>
          <span>{cartItems.length} item(s)</span>
        </div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 w-2/3 transition-all duration-300"></div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 md:gap-6 lg:grid-cols-3">
        {/* Main form section - Mobile first, then 2 cols on desktop */}
        <div className="lg:col-span-2 grid gap-3 sm:gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Delivery Address Card */}
          <div className="card">
            <div className="p-4 sm:p-5 md:p-6 grid gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-semibold">Delivery Address</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Required</span>
              </div>
              {/* Mobile-first: Single column, then 2 columns on SM+ */}
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="label">First name *</label>
                  <input
                    className="input input-mobile"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                  {formErrors.firstName && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1" data-testid="error-firstName">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Last name</label>
                  <input
                    className="input input-mobile"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="label">Phone *</label>
                  <input
                    className="input input-mobile"
                    type="tel"
                    inputMode="tel"
                    name="phone"
                    placeholder="+8801XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    autoComplete="tel"
                  />
                  {formErrors.phone && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input
                    className="input input-mobile"
                    type="email"
                    inputMode="email"
                    name="email"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    autoComplete="email"
                  />
                  {formErrors.email && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1" data-testid="error-email">
                      {formErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Address *</label>
                <input
                  className="input input-mobile"
                  name="street"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  autoComplete="street-address"
                />
                {formErrors.address && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{formErrors.address}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="label">City *</label>
                  <input
                    className="input input-mobile"
                    name="city"
                    placeholder="Dhaka"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    autoComplete="address-level2"
                  />
                  {formErrors.city && <p className="text-xs sm:text-sm text-red-600 mt-1">{formErrors.city}</p>}
                </div>
                <div>
                  <label className="label">State</label>
                  <input
                    className="input input-mobile"
                    name="state"
                    placeholder="Division"
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    autoComplete="address-level1"
                  />
                </div>
                <div>
                  <label className="label">Postcode</label>
                  <input
                    className="input input-mobile"
                    type="text"
                    inputMode="numeric"
                    name="zip"
                    placeholder="1000"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="card">
            <div className="p-4 sm:p-5 md:p-6 grid gap-3 sm:gap-4">
              <div className="text-lg sm:text-xl font-semibold">Payment Method</div>
              <div className="grid gap-2.5 sm:gap-3">
                <label className="flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input
                    type="radio"
                    name="pay"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    data-testid="payment-cod"
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm sm:text-base">Cash on Delivery</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-0.5">Pay when you receive</div>
                  </div>
                  <span className="text-2xl">💵</span>
                </label>
                <label className="flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input
                    type="radio"
                    name="pay"
                    value="online"
                    checked={formData.paymentMethod === 'online'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm sm:text-base">Online Payment</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-0.5">Pay now (Test mode)</div>
                  </div>
                  <span className="text-2xl">💳</span>
                </label>
              </div>
            </div>
          </div>
          {/* Shipping Method Card */}
          <div className="card">
            <div className="p-4 sm:p-5 md:p-6 grid gap-3 sm:gap-4">
              <div className="text-lg sm:text-xl font-semibold">Shipping Method</div>
              <div className="grid gap-2.5 sm:gap-3">
                {shippingMethods.length === 0 ? (
                  <div className="p-3 sm:p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm sm:text-base">Standard Shipping</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">3-5 business days</p>
                      </div>
                      <p className="font-semibold text-sm sm:text-base">৳{shipping.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className="flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.id}
                        checked={selectedShippingMethod === method.id}
                        onChange={() => handleShippingSelect(method.id)}
                        data-testid="shipping-method"
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm sm:text-base">{method.name}</p>
                        {method.description && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{method.description}</p>
                        )}
                      </div>
                      <p className="font-semibold text-sm sm:text-base">
                        ৳{parseFloat(method.cost?.toString() || '0').toFixed(2)}
                      </p>
                    </label>
                  ))
                )}
                {formErrors.shippingMethod && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{formErrors.shippingMethod}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary - Sticky on desktop, regular on mobile */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="card">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="font-semibold text-lg sm:text-xl mb-3 sm:mb-4">Order Summary</div>

              {/* Cart items preview on mobile */}
              <div className="mb-3 pb-3 border-b lg:hidden">
                <div className="text-xs text-gray-500 mb-2">{cartItems.length} item(s) in cart</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1">{item.product.name}</span>
                      <span className="ml-2 text-gray-600">×{item.quantity}</span>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <div className="text-xs text-gray-500">+{cartItems.length - 3} more items</div>
                  )}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5 text-sm sm:text-base">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {shipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span className="font-medium text-green-600" data-testid="discount-amount">
                    -{currencySymbol}
                    {discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 sm:pt-3 mt-2 flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span style={{ color: 'var(--theme-primary)' }}>
                    {currencySymbol}
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-2.5">
                <label className="label text-xs sm:text-sm">Discount code</label>
                <div className="flex gap-2">
                  <input
                    className="input input-mobile flex-1 text-sm"
                    placeholder="SAVE10"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    data-testid="discount-code"
                  />
                  <button
                    type="button"
                    className="btn btn-outline text-xs sm:text-sm px-3 sm:px-4"
                    onClick={handleApplyDiscount}
                    disabled={applyingDiscount || !discountCodeInput.trim()}
                    data-testid="apply-discount"
                  >
                    {applyingDiscount ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {discountError && <p className="text-xs sm:text-sm text-red-600">{discountError}</p>}
                {appliedDiscountCode && !discountError && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-600">
                    <span>✓</span>
                    <span>Code {appliedDiscountCode} applied</span>
                  </div>
                )}
              </div>

              {/* Desktop: Show buttons normally */}
              <div className="hidden lg:block mt-5 space-y-2.5">
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || cartItems.length === 0}
                  className="btn btn-primary w-full text-sm sm:text-base font-semibold py-3 sm:py-3.5"
                  data-testid="place-order"
                >
                  {placingOrder ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Placing Order...
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
                <Link href={`/${shopId}/cart`} className="btn btn-outline w-full text-center text-sm">
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Sticky bottom bar with Place Order button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 safe-area-bottom">
        <div className="container-responsive py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500">Total Amount</div>
              <div className="font-bold text-lg" style={{ color: 'var(--theme-primary)' }}>
                {currencySymbol}{total.toFixed(2)}
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || cartItems.length === 0}
              className="btn btn-primary px-6 py-3 text-sm sm:text-base font-semibold min-w-[140px] shadow-lg"
              data-testid="place-order-mobile"
            >
              {placingOrder ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="hidden sm:inline">Placing...</span>
                </span>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
          <Link
            href={`/${shopId}/cart`}
            className="block text-center text-xs sm:text-sm text-gray-600 hover:text-gray-900 mt-2"
          >
            ← Back to Cart
          </Link>
        </div>
      </div>

      {/* Mobile: Add padding at bottom to prevent content being hidden by sticky bar */}
      <div className="lg:hidden h-32"></div>
    </div>
  );
}
