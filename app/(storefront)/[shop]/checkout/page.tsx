'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { insforgeClient, CartService, OrderService } from "@/lib/insforge";
import { logger } from "@/lib/utils/logger";

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

export default function Checkout(){
  const router = useRouter();
  const params = useParams();
  const shopId = params.shop as string;
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(80);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!formData.firstName || !formData.email || !formData.phone || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setPlacingOrder(true);
      setError(null);

      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
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
      const orderItems = cartWithItems.items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product.name,
        variant_name: item.variant?.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: item.price,
        discount_amount: 0,
        total: item.price * item.quantity,
        image_url: undefined
      }));

      const total = subtotal + shipping;

      // Create order
      const order = await OrderService.createOrder({
        shop_id: shopId,
        customer_id: customer.id,
        status: 'pending',
        payment_status: formData.paymentMethod === 'cod' ? 'pending' : 'pending',
        fulfillment_status: 'unfulfilled',
        subtotal,
        discount_amount: 0,
        shipping_cost: shipping,
        tax_amount: 0,
        total,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_first_name: formData.firstName,
        shipping_last_name: formData.lastName,
        shipping_address1: formData.address,
        shipping_city: formData.city,
        shipping_state: '',
        shipping_postal_code: formData.postalCode,
        shipping_country: 'Bangladesh',
        billing_first_name: formData.firstName,
        billing_last_name: formData.lastName,
        billing_address1: formData.address,
        billing_city: formData.city,
        billing_state: '',
        billing_postal_code: formData.postalCode,
        billing_country: 'Bangladesh'
      }, orderItems);

      // Clear cart after successful order
      await CartService.clearCart(cart.id);

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  const total = subtotal + shipping;

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
                <label className="label">Full name *</label>
                <input 
                  className="input" 
                  placeholder="John Doe"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Last name</label>
                <input 
                  className="input" 
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
                  placeholder="+8801XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input 
                  className="input" 
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address *</label>
                <input 
                  className="input" 
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">City *</label>
                <input 
                  className="input" 
                  placeholder="Dhaka"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Postcode</label>
                <input 
                  className="input" 
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
      </div>
      
      <div className="card">
        <div className="card-pad">
          <div className="font-semibold mb-4">Order Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>৳{shipping.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={handlePlaceOrder}
            disabled={placingOrder || cartItems.length === 0}
            className="btn btn-primary mt-4 w-full"
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
