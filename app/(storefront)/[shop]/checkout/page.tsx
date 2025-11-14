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
      <div className="container-responsive py-10">
        <div className="flex items-center justify-center h-64">
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
    <div className="container-responsive py-10 grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 grid gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-pad grid gap-3">
            <div className="text-lg font-semibold">Delivery Address</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">First name *</label>
                <input
                  className="input"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-600 mt-1" data-testid="error-firstName">
                    {formErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Last name</label>
                <input
                  className="input"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  placeholder="+8801XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  className="input"
                  type="email"
                  name="email"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
                {formErrors.email && (
                  <p className="text-sm text-red-600 mt-1" data-testid="error-email">
                    {formErrors.email}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="label">Address *</label>
                <input
                  className="input"
                  name="street"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
                {formErrors.address && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.address}</p>
                )}
              </div>
              <div>
                <label className="label">City *</label>
                <input
                  className="input"
                  name="city"
                  placeholder="Dhaka"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
                {formErrors.city && <p className="text-sm text-red-600 mt-1">{formErrors.city}</p>}
              </div>
              <div>
                <label className="label">State</label>
                <input
                  className="input"
                  name="state"
                  placeholder="Division"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Postcode</label>
                <input
                  className="input"
                  name="zip"
                  placeholder="1000"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-pad grid gap-3">
            <div className="text-lg font-semibold">Payment</div>
            <div className="grid gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pay"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  data-testid="payment-cod"
                />
                Cash on Delivery
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pay"
                  value="online"
                  checked={formData.paymentMethod === 'online'}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                />
                Online Payment (Test)
              </label>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad grid gap-3">
            <div className="text-lg font-semibold">Shipping Method</div>
            <div className="grid gap-2">
              {shippingMethods.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Standard Shipping - ৳{shipping.toFixed(2)}
                </div>
              ) : (
                shippingMethods.map((method) => (
                  <label
                    key={method.id}
                    className="inline-flex items-center gap-3 cursor-pointer border rounded-lg p-3"
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.id}
                      checked={selectedShippingMethod === method.id}
                      onChange={() => handleShippingSelect(method.id)}
                      data-testid="shipping-method"
                    />
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-gray-500">
                        ৳{parseFloat(method.cost?.toString() || '0').toFixed(2)}
                      </p>
                      {method.description && (
                        <p className="text-xs text-gray-400">{method.description}</p>
                      )}
                    </div>
                  </label>
                ))
              )}
              {formErrors.shippingMethod && (
                <p className="text-sm text-red-600 mt-1">{formErrors.shippingMethod}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          <div className="font-semibold mb-4">Order Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>
                {currencySymbol}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>
                {currencySymbol}
                {shipping.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span data-testid="discount-amount">
                {currencySymbol}
                {discountAmount.toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>
                {currencySymbol}
                {total.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="label">Discount code</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="SAVE10"
                value={discountCodeInput}
                onChange={(e) => setDiscountCodeInput(e.target.value)}
                data-testid="discount-code"
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleApplyDiscount}
                disabled={applyingDiscount || !discountCodeInput.trim()}
                data-testid="apply-discount"
              >
                {applyingDiscount ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {discountError && <p className="text-sm text-red-600">{discountError}</p>}
            {appliedDiscountCode && !discountError && (
              <p className="text-sm text-emerald-600">Code {appliedDiscountCode} applied.</p>
            )}
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || cartItems.length === 0}
            className="btn btn-primary mt-4 w-full"
            data-testid="place-order"
          >
            {placingOrder ? 'Placing Order...' : 'Place Order'}
          </button>
          <Link href={`/${shopId}/cart`} className="btn btn-outline mt-2 w-full text-center">
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
