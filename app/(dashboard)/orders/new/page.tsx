'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient, OrderService } from '@/lib';
import { logger } from '@/lib/utils/logger';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  variant_id?: string;
  variant_name?: string;
  sku?: string;
  image_url?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string;
  image_url?: string;
}

export default function NewOrder() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  // Order items
  const [items, setItems] = useState<OrderItem[]>([
    { product_id: '', product_name: '', quantity: 1, price: 0 },
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) return;

      // Fetch shop_id for the current user
      const { data: shop, error: shopError } = await supabaseClient
        .from('shop_settings')
        .select('shop_id')
        .eq('user_id', user.id)
        .single();

      if (shopError || !shop) return;

      const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, price, sku, image_url')
        .eq('shop_id', shop.shop_id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      logger.error('Error fetching products', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: '', product_name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product is selected, auto-fill details
    if (field === 'product_id' && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].price = product.price;
        newItems[index].sku = product.sku;
        newItems[index].image_url = product.image_url;
      }
    }

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      return sum + itemTotal;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal;
  };

  const handleSubmit = async (status: 'pending' | 'processing') => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!customerFirstName || !customerEmail || !customerPhone) {
        setError('Please fill in customer name, email and phone');
        return;
      }

      if (items.some((item) => !item.product_id || item.quantity < 1)) {
        setError('Please select products and valid quantities');
        return;
      }

      // Get current user (shop owner)
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch shop_id for the current user
      const { data: shop, error: shopError } = await supabaseClient
        .from('shop_settings')
        .select('shop_id')
        .eq('user_id', user.id)
        .single();

      if (shopError || !shop) {
        setError('Shop not found');
        return;
      }

      // Get or create customer
      const customer = await OrderService.getOrCreateCustomer(
        shop.shop_id,
        customerEmail,
        customerFirstName,
        customerLastName,
        customerPhone,
        user.id
      );

      // Prepare order data
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      const orderData = {
        shop_id: shop.shop_id,
        customer_id: customer.id,
        status,
        payment_status: 'pending' as const,
        fulfillment_status: 'unfulfilled' as const,
        subtotal,
        discount_amount: 0,
        shipping_cost: 0,
        tax_amount: 0,
        total,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_first_name: customerFirstName,
        shipping_last_name: customerLastName,
        shipping_address1: shippingAddress || 'N/A',
        shipping_city: shippingCity || 'N/A',
        shipping_state: 'N/A',
        shipping_postal_code: shippingPostalCode || 'N/A',
        shipping_country: 'Bangladesh',
        billing_first_name: customerFirstName,
        billing_last_name: customerLastName,
        billing_address1: shippingAddress || 'N/A',
        billing_city: shippingCity || 'N/A',
        billing_state: 'N/A',
        billing_postal_code: shippingPostalCode || 'N/A',
        billing_country: 'Bangladesh',
        notes,
      };

      // Prepare order items
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        variant_name: item.variant_name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        discount_amount: 0,
        total: item.price * item.quantity,
        image_url: item.image_url,
      }));

      // Create order
      const order = await OrderService.createOrder(orderData, orderItems);

      // Success - redirect to orders page
      router.push('/orders');
    } catch (err: any) {
      logger.error('Error creating order', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Order</h1>
        <button onClick={() => router.back()} className="btn btn-outline">
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-pad grid gap-6">
          {/* Customer Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input
                  className="input"
                  placeholder="John"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  className="input"
                  placeholder="Doe"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  className="input"
                  type="email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input
                  className="input"
                  placeholder="+8801XXXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="grid gap-4">
              <div>
                <label className="label">Address</label>
                <input
                  className="input"
                  placeholder="Street address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input
                    className="input"
                    placeholder="Dhaka"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Postal Code</label>
                  <input
                    className="input"
                    placeholder="1000"
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Order Items</h2>
              <button onClick={addItem} className="btn btn-sm btn-outline">
                + Add Item
              </button>
            </div>
            <div className="grid gap-3">
              {items.map((item, index) => (
                <div key={index} className="grid md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="label text-sm">Product</label>
                    <select
                      className="input"
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                    >
                      <option value="">Select product...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ৳{product.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Quantity</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Price</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="label text-sm">Subtotal</label>
                      <div className="input bg-gray-50">
                        ৳{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="btn btn-sm btn-outline text-red-600 hover:bg-red-50 mt-6"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="online">Online Payment</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                className="input"
                placeholder="Order notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-brand-indigo">৳{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleSubmit('pending')}
              disabled={loading}
              className="btn btn-outline"
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSubmit('processing')}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
