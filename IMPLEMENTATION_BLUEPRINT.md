# Implementation Blueprint: Bangladesh Market Features
**Project:** Shamlai E-Commerce Platform
**Date:** November 16, 2025
**Status:** Technical Specification & Implementation Plan

---

## Table of Contents
1. [P0 Features - Critical Priority](#p0-features)
2. [P1 Features - High Priority](#p1-features)
3. [P2 Features - Medium Priority](#p2-features)
4. [Technical Architecture](#technical-architecture)
5. [Database Schema Changes](#database-schema-changes)
6. [API Endpoints](#api-endpoints)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Plan](#deployment-plan)

---

## P0 Features - Critical Priority

### 1. Mobile Wallet Integration (bKash, Nagad, Rocket)

#### **Overview**
Integrate Bangladesh's top 3 mobile financial services (MFS) to enable digital payments, reducing dependency on COD and improving transaction security.

#### **Technical Approach**

**Payment Gateway Providers:**
- **SSLCOMMERZ** - Supports bKash, Nagad, Rocket, cards (Most popular in BD)
- **aamarpay** - Alternative with good MFS support
- **Portwallet** - Newer option with competitive rates

**Recommended:** Start with SSLCOMMERZ (market leader)

#### **Implementation Steps**

##### **Step 1: Database Schema**
```sql
-- Add to payment_methods table
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS provider_config JSONB;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Create mobile_wallet_transactions table
CREATE TABLE mobile_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id),
  wallet_type VARCHAR(20) CHECK (wallet_type IN ('bkash', 'nagad', 'rocket')),
  transaction_id VARCHAR(255) UNIQUE,
  gateway_transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BDT',
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  gateway_response JSONB,
  customer_phone VARCHAR(20),
  initiated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mobile_wallet_txn_order ON mobile_wallet_transactions(order_id);
CREATE INDEX idx_mobile_wallet_txn_status ON mobile_wallet_transactions(status);
CREATE INDEX idx_mobile_wallet_txn_gateway ON mobile_wallet_transactions(gateway_transaction_id);
```

##### **Step 2: Backend Service Layer**

**File:** `/lib/services/payment-gateway.service.ts`
```typescript
import crypto from 'crypto';

export interface PaymentGatewayConfig {
  storeId: string;
  storePassword: string;
  apiUrl: string;
  environment: 'sandbox' | 'production';
}

export interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'card';
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  gatewayUrl?: string;
  transactionId?: string;
  error?: string;
}

export class SSLCommerzService {
  private config: PaymentGatewayConfig;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
  }

  async initiatePayment(request: InitiatePaymentRequest): Promise<PaymentResponse> {
    try {
      const payload = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        total_amount: request.amount,
        currency: request.currency,
        tran_id: request.orderId,
        success_url: request.successUrl,
        fail_url: request.failUrl,
        cancel_url: request.cancelUrl,
        cus_name: request.customerName,
        cus_email: request.customerEmail,
        cus_phone: request.customerPhone,
        cus_add1: 'N/A',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        shipping_method: 'NO',
        product_name: `Order #${request.orderId}`,
        product_category: 'E-commerce',
        product_profile: 'general',
        // Mobile wallet specific
        ...(request.paymentMethod !== 'card' && {
          emi_option: 0,
          allowed_bin: this.getAllowedBins(request.paymentMethod)
        })
      };

      const response = await fetch(`${this.config.apiUrl}/gwprocess/v4/api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload as any)
      });

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        return {
          success: true,
          gatewayUrl: data.GatewayPageURL,
          transactionId: data.tran_id
        };
      }

      return {
        success: false,
        error: data.failedreason || 'Payment initiation failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validatePayment(transactionId: string): Promise<boolean> {
    try {
      const url = `${this.config.apiUrl}/validator/api/validationserverAPI.php`;
      const params = new URLSearchParams({
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        val_id: transactionId
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      return data.status === 'VALID' || data.status === 'VALIDATED';
    } catch {
      return false;
    }
  }

  async refundPayment(bankTransactionId: string, amount: number, reason: string): Promise<boolean> {
    try {
      const refundId = `REF-${Date.now()}`;
      const payload = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        bank_tran_id: bankTransactionId,
        refund_amount: amount,
        refund_remarks: reason,
        refe_id: refundId
      };

      const response = await fetch(`${this.config.apiUrl}/validator/api/merchantTransIDvalidationAPI.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload as any)
      });

      const data = await response.json();
      return data.status === 'success';
    } catch {
      return false;
    }
  }

  private getAllowedBins(method: string): string {
    const bins: Record<string, string> = {
      bkash: 'bkash',
      nagad: 'nagad',
      rocket: 'rocket'
    };
    return bins[method] || '';
  }
}

// Factory function
export function createPaymentGateway(shopId: string): SSLCommerzService {
  const config: PaymentGatewayConfig = {
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    apiUrl: process.env.SSLCOMMERZ_API_URL || 'https://sandbox.sslcommerz.com',
    environment: (process.env.SSLCOMMERZ_ENV as any) || 'sandbox'
  };
  return new SSLCommerzService(config);
}
```

##### **Step 3: API Endpoints**

**File:** `/app/api/payments/initiate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentGateway } from '@/lib/services/payment-gateway.service';
import { createClient } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentMethod } = await request.json();

    const insforge = createClient();

    // Get order details
    const { data: order } = await insforge
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Initiate payment
    const gateway = createPaymentGateway(order.shop_id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const result = await gateway.initiatePayment({
      orderId: order.id,
      amount: order.total_amount,
      currency: 'BDT',
      customerName: order.customers?.name || 'Guest',
      customerEmail: order.customers?.email || 'guest@example.com',
      customerPhone: order.customers?.phone || '',
      paymentMethod,
      successUrl: `${baseUrl}/api/payments/success`,
      failUrl: `${baseUrl}/api/payments/fail`,
      cancelUrl: `${baseUrl}/api/payments/cancel`
    });

    if (result.success) {
      // Store transaction record
      await insforge.from('mobile_wallet_transactions').insert({
        order_id: orderId,
        wallet_type: paymentMethod,
        transaction_id: result.transactionId,
        amount: order.total_amount,
        status: 'pending',
        customer_phone: order.customers?.phone
      });

      return NextResponse.json({
        success: true,
        gatewayUrl: result.gatewayUrl
      });
    }

    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**File:** `/app/api/payments/success/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge';
import { createPaymentGateway } from '@/lib/services/payment-gateway.service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tranId = formData.get('tran_id') as string;
    const valId = formData.get('val_id') as string;
    const bankTranId = formData.get('bank_tran_id') as string;

    const insforge = createClient();

    // Validate payment with gateway
    const gateway = createPaymentGateway('default');
    const isValid = await gateway.validatePayment(valId);

    if (!isValid) {
      return NextResponse.redirect(new URL('/payment/failed', request.url));
    }

    // Update transaction
    await insforge
      .from('mobile_wallet_transactions')
      .update({
        status: 'completed',
        gateway_transaction_id: bankTranId,
        gateway_response: Object.fromEntries(formData),
        completed_at: new Date().toISOString()
      })
      .eq('transaction_id', tranId);

    // Update order status
    const { data: transaction } = await insforge
      .from('mobile_wallet_transactions')
      .select('order_id')
      .eq('transaction_id', tranId)
      .single();

    if (transaction) {
      await insforge
        .from('orders')
        .update({ payment_status: 'paid', status: 'processing' })
        .eq('id', transaction.order_id);
    }

    return NextResponse.redirect(new URL('/payment/success', request.url));
  } catch (error) {
    console.error('Payment success handler error:', error);
    return NextResponse.redirect(new URL('/payment/failed', request.url));
  }
}
```

##### **Step 4: Frontend Components**

**File:** `/components/checkout/PaymentMethodSelector.tsx`
```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'card';
  logo?: string;
  description?: string;
}

interface Props {
  methods: PaymentMethod[];
  selectedMethod: string;
  onMethodChange: (methodId: string) => void;
}

export function PaymentMethodSelector({ methods, selectedMethod, onMethodChange }: Props) {
  const mobileWallets = methods.filter(m =>
    ['bkash', 'nagad', 'rocket'].includes(m.type)
  );
  const otherMethods = methods.filter(m =>
    !['bkash', 'nagad', 'rocket'].includes(m.type)
  );

  return (
    <div className="space-y-4">
      {mobileWallets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Mobile Wallets</h3>
          <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
            <div className="grid grid-cols-3 gap-3">
              {mobileWallets.map((method) => (
                <div key={method.id} className="relative">
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={method.id}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-500 cursor-pointer transition-all"
                  >
                    {method.logo && (
                      <div className="relative w-16 h-16 mb-2">
                        <Image
                          src={method.logo}
                          alt={method.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="text-sm font-medium">{method.name}</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {otherMethods.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Other Methods</h3>
          <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
            {otherMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-3">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{method.name}</span>
                    {method.logo && (
                      <Image
                        src={method.logo}
                        alt={method.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    )}
                  </div>
                  {method.description && (
                    <p className="text-sm text-gray-500">{method.description}</p>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
```

##### **Step 5: Environment Variables**

Add to `.env.local`:
```env
# SSLCOMMERZ Payment Gateway
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_API_URL=https://sandbox.sslcommerz.com
SSLCOMMERZ_ENV=sandbox
```

##### **Step 6: Seed Payment Methods**

**File:** `/lib/migrations/seed-mobile-wallets.ts`
```typescript
import { createClient } from '@/lib/insforge';

export async function seedMobileWalletMethods(shopId: string) {
  const insforge = createClient();

  const methods = [
    {
      shop_id: shopId,
      name: 'bKash',
      type: 'bkash',
      provider: 'sslcommerz',
      is_active: true,
      logo_url: '/payment-logos/bkash.png',
      description: 'Pay securely with bKash - Bangladesh\'s leading mobile wallet',
      instructions: 'You will be redirected to bKash payment page',
      provider_config: {
        enabled: true,
        fees: 1.8, // 1.8% transaction fee
        min_amount: 10,
        max_amount: 25000
      }
    },
    {
      shop_id: shopId,
      name: 'Nagad',
      type: 'nagad',
      provider: 'sslcommerz',
      is_active: true,
      logo_url: '/payment-logos/nagad.png',
      description: 'Fast and secure payment with Nagad',
      instructions: 'You will be redirected to Nagad payment page',
      provider_config: {
        enabled: true,
        fees: 1.5,
        min_amount: 10,
        max_amount: 25000
      }
    },
    {
      shop_id: shopId,
      name: 'Rocket',
      type: 'rocket',
      provider: 'sslcommerz',
      is_active: true,
      logo_url: '/payment-logos/rocket.png',
      description: 'Pay with Dutch-Bangla Bank Rocket',
      instructions: 'You will be redirected to Rocket payment page',
      provider_config: {
        enabled: true,
        fees: 1.8,
        min_amount: 10,
        max_amount: 25000
      }
    }
  ];

  await insforge.from('payment_methods').insert(methods);
}
```

---

### 2. Mobile UX Enhancement & Optimization

#### **Overview**
Optimize the platform for mobile-first experience to serve the 70%+ mobile shoppers effectively.

#### **Implementation Steps**

##### **Step 1: Performance Optimization**

**File:** `/next.config.js` - Update
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,

  // Optimize for mobile
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

module.exports = nextConfig;
```

##### **Step 2: Mobile-Optimized Components**

**File:** `/components/mobile/MobileBottomNav.tsx`
```typescript
'use client';

import { Home, Search, ShoppingCart, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart' },
    { href: '/account', icon: User, label: 'Account' },
    { href: '/menu', icon: Menu, label: 'Menu' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**File:** `/components/mobile/MobileProductCard.tsx`
```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating?: number;
  inStock: boolean;
}

export function MobileProductCard({ product }: { product: Product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image Container - Optimized for thumb reach */}
      <Link href={`/products/${product.id}`} className="block relative aspect-square">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          loading="lazy"
        />

        {/* Quick Actions - Thumb zone optimized */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm active:scale-95 transition-transform"
          aria-label="Add to wishlist"
        >
          <Heart
            className={cn(
              'h-4 w-4',
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            )}
          />
        </button>
      </Link>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ৳{product.price.toLocaleString('en-BD')}
          </span>

          {/* Large touch target for add to cart */}
          <Button
            size="sm"
            className="h-9 w-9 p-0"
            disabled={!product.inStock}
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        {!product.inStock && (
          <span className="text-xs text-red-600 font-medium">Out of Stock</span>
        )}
      </div>
    </div>
  );
}
```

**File:** `/components/mobile/MobileCheckout.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Wallet, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'address' | 'payment' | 'review';

export function MobileCheckout() {
  const [currentStep, setCurrentStep] = useState<Step>('address');

  const steps = [
    { id: 'address' as Step, label: 'Address', icon: MapPin },
    { id: 'payment' as Step, label: 'Payment', icon: Wallet },
    { id: 'review' as Step, label: 'Review', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized progress indicator */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      isActive && 'border-blue-600 bg-blue-50',
                      isCompleted && 'border-green-600 bg-green-50',
                      !isActive && !isCompleted && 'border-gray-300'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive && 'text-blue-600',
                        isCompleted && 'text-green-600',
                        !isActive && !isCompleted && 'text-gray-400'
                      )}
                    />
                  </div>
                  <span className="text-xs mt-1 font-medium">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 -mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content area with bottom padding for fixed checkout button */}
      <div className="pb-24">
        {/* Step content goes here */}
      </div>

      {/* Fixed bottom CTA - Thumb zone optimized */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={() => {
            // Handle checkout
          }}
        >
          Continue to Next Step
        </Button>
      </div>
    </div>
  );
}
```

##### **Step 3: Mobile-First CSS Utilities**

**File:** `/app/globals.css` - Add mobile utilities
```css
/* Mobile-first utilities */
@layer utilities {
  /* Thumb-zone safe areas (optimized for one-handed use) */
  .thumb-zone-safe {
    @apply pb-20 md:pb-4;
  }

  /* Large touch targets (minimum 44px as per mobile UX guidelines) */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }

  /* Mobile-optimized scrolling */
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
  }

  /* Prevent zoom on input focus (iOS Safari) */
  .no-zoom {
    font-size: 16px !important;
  }

  /* Mobile-friendly grid */
  .mobile-grid {
    @apply grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5;
  }
}

/* iOS Safari fixes */
@supports (-webkit-touch-callout: none) {
  .safe-area-bottom {
    padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
  }
}

/* Android Chrome fixes */
@media (hover: none) and (pointer: coarse) {
  /* Larger tap targets on touch devices */
  button, a {
    min-height: 44px;
  }
}
```

##### **Step 4: Mobile Performance Monitoring**

**File:** `/lib/analytics/mobile-performance.ts`
```typescript
export function trackMobilePerformance() {
  if (typeof window === 'undefined') return;

  // Track key mobile metrics
  if ('PerformanceObserver' in window) {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('FCP:', entry.startTime);
        // Send to analytics
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
      // Send to analytics
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      console.log('CLS:', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  // Track viewport size for mobile analytics
  const trackViewport = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    console.log('Viewport:', { width, height, isMobile });
  };

  trackViewport();
  window.addEventListener('resize', trackViewport);
}
```

---

## P1 Features - High Priority

### 3. Bengali Localization (i18n)

#### **Overview**
Implement full Bengali language support to reach the mass market and increase accessibility.

#### **Implementation Steps**

##### **Step 1: Install i18n Dependencies**

```bash
npm install next-intl
```

##### **Step 2: Project Structure**

```
/messages
  ├── en.json
  └── bn.json
/middleware.ts (update for locale detection)
```

##### **Step 3: Translation Files**

**File:** `/messages/en.json`
```json
{
  "common": {
    "home": "Home",
    "shop": "Shop",
    "cart": "Cart",
    "account": "Account",
    "search": "Search",
    "login": "Login",
    "logout": "Logout",
    "signup": "Sign Up"
  },
  "product": {
    "addToCart": "Add to Cart",
    "buyNow": "Buy Now",
    "outOfStock": "Out of Stock",
    "price": "Price",
    "description": "Description",
    "reviews": "Reviews"
  },
  "checkout": {
    "title": "Checkout",
    "shippingAddress": "Shipping Address",
    "paymentMethod": "Payment Method",
    "orderSummary": "Order Summary",
    "placeOrder": "Place Order",
    "total": "Total"
  },
  "payment": {
    "cashOnDelivery": "Cash on Delivery",
    "payWithBkash": "Pay with bKash",
    "payWithNagad": "Pay with Nagad",
    "payWithRocket": "Pay with Rocket"
  }
}
```

**File:** `/messages/bn.json`
```json
{
  "common": {
    "home": "হোম",
    "shop": "দোকান",
    "cart": "কার্ট",
    "account": "অ্যাকাউন্ট",
    "search": "খুঁজুন",
    "login": "লগইন",
    "logout": "লগআউট",
    "signup": "সাইন আপ"
  },
  "product": {
    "addToCart": "কার্টে যোগ করুন",
    "buyNow": "এখনই কিনুন",
    "outOfStock": "স্টক শেষ",
    "price": "দাম",
    "description": "বিবরণ",
    "reviews": "রিভিউ"
  },
  "checkout": {
    "title": "চেকআউট",
    "shippingAddress": "ডেলিভারি ঠিকানা",
    "paymentMethod": "পেমেন্ট পদ্ধতি",
    "orderSummary": "অর্ডার সারাংশ",
    "placeOrder": "অর্ডার করুন",
    "total": "মোট"
  },
  "payment": {
    "cashOnDelivery": "ক্যাশ অন ডেলিভারি",
    "payWithBkash": "বিকাশে পে করুন",
    "payWithNagad": "নগদে পে করুন",
    "payWithRocket": "রকেটে পে করুন"
  }
}
```

##### **Step 4: i18n Configuration**

**File:** `/i18n.ts`
```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'bn'] as const;
export const defaultLocale = 'en' as const;

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
```

##### **Step 5: Update Middleware**

**File:** `/middleware.ts` - Add locale detection
```typescript
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  // First handle i18n
  const response = intlMiddleware(request);

  // Then your existing subdomain logic
  // ... existing middleware code ...

  return response;
}
```

##### **Step 6: Usage in Components**

**File:** `/app/[locale]/layout.tsx`
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.Node;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
```

**Example Component Usage:**
```typescript
'use client';

import { useTranslations } from 'next-intl';

export function ProductCard() {
  const t = useTranslations('product');

  return (
    <button>{t('addToCart')}</button>
  );
}
```

##### **Step 7: Language Switcher**

**File:** `/components/LanguageSwitcher.tsx`
```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(path);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={locale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLocale('en')}
      >
        English
      </Button>
      <Button
        variant={locale === 'bn' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLocale('bn')}
      >
        বাংলা
      </Button>
    </div>
  );
}
```

---

## P2 Features - Medium Priority

### 4. SMS Notification System

#### **Overview**
Implement SMS notifications for order updates, delivery tracking, and promotional messages.

#### **Implementation Steps**

##### **Step 1: Database Schema**

```sql
CREATE TABLE sms_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shop_settings(id),
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('order_confirmation', 'order_status', 'delivery', 'promotional', 'otp')),
  status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  provider VARCHAR(50),
  provider_response JSONB,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sms_phone ON sms_notifications(phone);
CREATE INDEX idx_sms_status ON sms_notifications(status);
CREATE INDEX idx_sms_type ON sms_notifications(type);
```

##### **Step 2: SMS Service Integration**

**Recommended Providers for Bangladesh:**
- **SSLCOMMERZ SMS API**
- **Greenweb SMS**
- **Bulk SMS Bangladesh**

**File:** `/lib/services/sms.service.ts`
```typescript
interface SMSConfig {
  apiKey: string;
  senderId: string;
  apiUrl: string;
}

export interface SendSMSRequest {
  phone: string;
  message: string;
  type: 'order_confirmation' | 'order_status' | 'delivery' | 'promotional' | 'otp';
}

export class SMSService {
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
  }

  async sendSMS(request: SendSMSRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Format phone number for Bangladesh (add +880 if not present)
      const formattedPhone = this.formatBDPhone(request.phone);

      const payload = {
        api_token: this.config.apiKey,
        sid: this.config.senderId,
        sms: request.message,
        msisdn: formattedPhone,
        csms_id: `${Date.now()}`
      };

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'SUCCESS' || data.success) {
        return {
          success: true,
          messageId: data.message_id || data.csms_id
        };
      }

      return {
        success: false,
        error: data.message || 'SMS sending failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private formatBDPhone(phone: string): string {
    // Remove any spaces, dashes, or special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If starts with 0, replace with +880
    if (cleaned.startsWith('0')) {
      cleaned = '+880' + cleaned.substring(1);
    }

    // If doesn't start with +880, add it
    if (!cleaned.startsWith('+880')) {
      cleaned = '+880' + cleaned;
    }

    return cleaned;
  }

  // Template methods
  orderConfirmationSMS(orderNumber: string, total: number): string {
    return `আপনার অর্ডার #${orderNumber} নিশ্চিত হয়েছে। মোট: ৳${total}। ধন্যবাদ!`;
  }

  orderShippedSMS(orderNumber: string, trackingNumber: string): string {
    return `আপনার অর্ডার #${orderNumber} পাঠানো হয়েছে। ট্র্যাকিং: ${trackingNumber}`;
  }

  orderDeliveredSMS(orderNumber: string): string {
    return `আপনার অর্ডার #${orderNumber} ডেলিভার করা হয়েছে। আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!`;
  }

  otpSMS(otp: string): string {
    return `আপনার OTP কোড: ${otp}। এই কোডটি কারো সাথে শেয়ার করবেন না।`;
  }
}

export function createSMSService(): SMSService {
  const config: SMSConfig = {
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'Shamlai',
    apiUrl: process.env.SMS_API_URL || ''
  };
  return new SMSService(config);
}
```

##### **Step 3: API Endpoint**

**File:** `/app/api/sms/send/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSMSService } from '@/lib/services/sms.service';
import { createClient } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const { phone, message, type } = await request.json();

    const smsService = createSMSService();
    const result = await smsService.sendSMS({ phone, message, type });

    // Log to database
    const insforge = createClient();
    await insforge.from('sms_notifications').insert({
      phone,
      message,
      type,
      status: result.success ? 'sent' : 'failed',
      provider: 'greenweb',
      provider_response: result,
      sent_at: result.success ? new Date().toISOString() : null
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
```

##### **Step 4: Order Hooks - Auto SMS**

**File:** `/lib/hooks/order-sms-notifications.ts`
```typescript
import { createSMSService } from '@/lib/services/sms.service';
import { createClient } from '@/lib/insforge';

export async function sendOrderConfirmationSMS(orderId: string) {
  const insforge = createClient();
  const smsService = createSMSService();

  // Get order details
  const { data: order } = await insforge
    .from('orders')
    .select('*, customers(*)')
    .eq('id', orderId)
    .single();

  if (!order || !order.customers?.phone) return;

  const message = smsService.orderConfirmationSMS(
    order.order_number,
    order.total_amount
  );

  await smsService.sendSMS({
    phone: order.customers.phone,
    message,
    type: 'order_confirmation'
  });
}

export async function sendOrderStatusSMS(orderId: string, newStatus: string) {
  const insforge = createClient();
  const smsService = createSMSService();

  const { data: order } = await insforge
    .from('orders')
    .select('*, customers(*)')
    .eq('id', orderId)
    .single();

  if (!order || !order.customers?.phone) return;

  let message = '';
  if (newStatus === 'shipped') {
    message = smsService.orderShippedSMS(order.order_number, order.tracking_number || 'N/A');
  } else if (newStatus === 'delivered') {
    message = smsService.orderDeliveredSMS(order.order_number);
  }

  if (message) {
    await smsService.sendSMS({
      phone: order.customers.phone,
      message,
      type: 'order_status'
    });
  }
}
```

---

### 5. Social Commerce Integration

#### **Technical Approach**

**Phase 1: Facebook Shop Integration**
- Facebook Business SDK
- Product Catalog sync
- Facebook Pixel enhancement
- Messenger integration

**Phase 2: Instagram Shopping**
- Instagram Graph API
- Product tagging
- Shoppable posts

**Phase 3: Social Media Automation**
- Post scheduling
- Auto-posting new products
- Social proof widgets

#### **Database Schema**

```sql
CREATE TABLE social_media_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shop_settings(id),
  platform VARCHAR(20) CHECK (platform IN ('facebook', 'instagram', 'tiktok')),
  access_token TEXT,
  page_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shop_settings(id),
  connection_id UUID REFERENCES social_media_connections(id),
  product_id UUID REFERENCES products(id),
  platform VARCHAR(20),
  post_id VARCHAR(255),
  post_url TEXT,
  content TEXT,
  media_urls JSONB,
  status VARCHAR(20) CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_for TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 6. BNPL Integration

#### **Recommended BNPL Providers for Bangladesh**
- **iPay** - Leading BNPL in Bangladesh
- **Shohoj Pay Later**
- **Custom installment system**

#### **Database Schema**

```sql
CREATE TABLE bnpl_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  provider VARCHAR(50),
  total_amount DECIMAL(10, 2),
  down_payment DECIMAL(10, 2),
  installment_amount DECIMAL(10, 2),
  num_installments INT,
  installment_frequency VARCHAR(20) CHECK (installment_frequency IN ('weekly', 'biweekly', 'monthly')),
  status VARCHAR(20) CHECK (status IN ('pending', 'active', 'completed', 'defaulted')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bnpl_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bnpl_transaction_id UUID REFERENCES bnpl_transactions(id),
  installment_number INT,
  amount DECIMAL(10, 2),
  due_date DATE,
  paid_date DATE,
  status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Testing Strategy

### Unit Tests
- Payment gateway service tests
- SMS service tests
- i18n translation tests

### Integration Tests
- Mobile wallet payment flow
- Order creation with SMS notification
- Multi-language checkout flow

### E2E Tests (Playwright/Cypress)
- Complete mobile checkout journey
- Payment method selection
- SMS OTP verification

### Performance Tests
- Mobile page load time (<3s target)
- Lighthouse mobile score (>90 target)
- Core Web Vitals

---

## Deployment Plan

### Phase 1: Development & Testing (Week 1-2)
- Set up sandbox accounts (SSLCOMMERZ, SMS provider)
- Implement and test mobile wallet integration
- Mobile UX optimization
- Unit and integration tests

### Phase 2: Staging Deployment (Week 3)
- Deploy to staging environment
- End-to-end testing
- User acceptance testing (UAT)
- Performance testing

### Phase 3: Production Rollout (Week 4)
- Gradual rollout (10% → 50% → 100%)
- Monitor error rates and performance
- Collect user feedback
- Quick iteration based on feedback

### Phase 4: Post-Launch Optimization (Week 5-6)
- Analyze usage data
- Optimize conversion funnels
- A/B testing for mobile UX
- i18n content refinement

---

## Success Metrics

### P0 Features:
- **Mobile Wallet Adoption:** 25%+ of transactions within 3 months
- **Mobile Conversion Rate:** Increase by 30%
- **Page Load Time:** <3 seconds on 3G

### P1 Features:
- **Bengali Users:** 40%+ adoption within 6 months
- **Social Commerce:** 20% of traffic from social platforms

### P2 Features:
- **SMS Open Rate:** >90%
- **BNPL Adoption:** 15% of transactions
- **Average Order Value:** Increase by 25% with BNPL

---

## Risk Mitigation

### Technical Risks:
- **Payment Gateway Downtime:** Implement fallback to COD
- **SMS Delivery Failures:** Retry logic with exponential backoff
- **Translation Quality:** Professional Bengali translation review

### Business Risks:
- **Transaction Fees:** Monitor profitability, adjust pricing if needed
- **Fraud:** Implement fraud detection for mobile wallets
- **User Adoption:** Marketing campaigns to educate users

---

## Next Steps

1. ✅ Review and approve this blueprint
2. ✅ Set up vendor accounts (SSLCOMMERZ, SMS provider)
3. ✅ Create detailed sprint planning
4. ✅ Begin implementation in priority order
5. ✅ Weekly progress reviews and adjustments

---

**Document Status:** Ready for Implementation
**Last Updated:** November 16, 2025
**Next Review:** Upon completion of P0 features
