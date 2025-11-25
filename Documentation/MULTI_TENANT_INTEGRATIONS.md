# Multi-Tenant Integration Architecture Research
## Comprehensive Integration Guide for Shamlai SaaS Platform

**Version**: 1.0
**Last Updated**: 2025-11-25
**Purpose**: Research and implementation guide for integrating third-party services with multi-tenant schema

---

## Table of Contents

1. [Subscription & Billing Integration](#1-subscription--billing-integration)
2. [Payment Gateway Integration](#2-payment-gateway-integration)
3. [Email Service Integration](#3-email-service-integration)
4. [File Storage Integration](#4-file-storage-integration)
5. [Analytics Integration](#5-analytics-integration)
6. [Search Service Integration](#6-search-service-integration)
7. [Authentication Providers (SSO/SAML)](#7-authentication-providers-ssosaml)
8. [Webhook Management](#8-webhook-management)
9. [Background Job Processing](#9-background-job-processing)
10. [API Rate Limiting](#10-api-rate-limiting)
11. [Monitoring & Error Tracking](#11-monitoring--error-tracking)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Subscription & Billing Integration

### Overview

Manage tenant subscriptions, billing, and payment collection with automatic tier enforcement.

### Recommended Services

#### **Option 1: Stripe (Recommended)**

**Pros:**
- ✅ Built-in subscription management
- ✅ Automatic invoicing and receipts
- ✅ Webhook-based event handling
- ✅ Usage-based billing support
- ✅ Excellent documentation
- ✅ Test mode for development

**Cons:**
- ❌ 2.9% + $0.30 per transaction fee
- ❌ Complex setup for usage-based billing

**Multi-Tenant Strategy:**

```typescript
// Database Schema Enhancement
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

// Create subscription_events table for audit
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id),
  event_type VARCHAR(100) NOT NULL, -- subscription.created, payment.succeeded, etc.
  stripe_event_id VARCHAR(255) UNIQUE,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_tenant ON subscription_events(tenant_id, created_at DESC);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type, processed);
```

**Implementation:**

```typescript
// lib/services/billing.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function createSubscription(
  tenantId: string,
  email: string,
  priceId: string,
  tier: 'starter' | 'professional' | 'enterprise'
) {
  // Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      tenant_id: tenantId,
      tier
    }
  });

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    metadata: {
      tenant_id: tenantId,
      tier
    },
    trial_period_days: 14
  });

  // Update database
  await supabase
    .from('shop_settings')
    .update({
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      tenant_tier: tier,
      tenant_status: 'trialing',
      trial_ends_at: new Date(subscription.trial_end! * 1000).toISOString()
    })
    .eq('id', tenantId);

  return subscription;
}

export async function handleSubscriptionUpdate(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const tenantId = subscription.metadata.tenant_id;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await supabase
        .from('shop_settings')
        .update({
          tenant_status: subscription.status === 'active' ? 'active' : subscription.status,
          subscription_end_date: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null
        })
        .eq('id', tenantId);
      break;

    case 'customer.subscription.deleted':
      await supabase
        .from('shop_settings')
        .update({
          tenant_status: 'canceled',
          subscription_end_date: new Date().toISOString()
        })
        .eq('id', tenantId);
      break;

    case 'invoice.payment_failed':
      await supabase
        .from('shop_settings')
        .update({ tenant_status: 'past_due' })
        .eq('id', tenantId);
      break;
  }

  // Log event
  await supabase.from('subscription_events').insert({
    tenant_id: tenantId,
    event_type: event.type,
    stripe_event_id: event.id,
    data: event.data.object,
    processed: true
  });
}
```

**Webhook Handler:**

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleSubscriptionUpdate } from '@/lib/services/billing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    await handleSubscriptionUpdate(event);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}
```

**Subscription Enforcement Middleware:**

```typescript
// middleware/subscription.ts
export async function enforceSubscriptionLimits(
  tenantId: string,
  resource: 'products' | 'orders' | 'users'
) {
  const { data: tenant } = await supabase
    .from('shop_settings')
    .select('tenant_tier, tenant_status, max_products, max_orders_per_month')
    .eq('id', tenantId)
    .single();

  if (tenant.tenant_status !== 'active' && tenant.tenant_status !== 'trialing') {
    throw new Error('Subscription is not active');
  }

  // Check limits based on resource
  if (resource === 'products') {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', tenantId);

    if (count >= tenant.max_products) {
      throw new Error(`Product limit reached (${tenant.max_products})`);
    }
  }
}
```

#### **Option 2: Paddle**

**Pros:**
- ✅ Merchant of Record (handles tax/VAT)
- ✅ Simpler compliance
- ✅ Built-in fraud protection

**Cons:**
- ❌ Higher fees (5% + $0.50)
- ❌ Less flexible than Stripe

#### **Option 3: LemonSqueezy**

**Pros:**
- ✅ Merchant of Record
- ✅ No-code checkout
- ✅ Simple setup

**Cons:**
- ❌ 5% + $0.50 fees
- ❌ Less customization

**Recommendation:** Use **Stripe** for maximum flexibility and control.

---

## 2. Payment Gateway Integration

### Overview

Handle customer payments on storefronts with tenant-specific payment routing.

### Strategy: Stripe Connect

**Why Stripe Connect:**
- ✅ Each tenant gets their own Stripe account
- ✅ Direct deposits to tenant bank accounts
- ✅ Platform can take commission
- ✅ Tenant-specific payment methods

**Database Schema:**

```sql
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255);
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT false;
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 2.5;

CREATE TABLE tenant_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id),
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id VARCHAR(255),
  amount_total DECIMAL(10,2),
  amount_tenant DECIMAL(10,2),
  amount_platform_fee DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- pending, succeeded, failed, refunded
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_transactions_tenant ON tenant_transactions(tenant_id, created_at DESC);
CREATE INDEX idx_tenant_transactions_order ON tenant_transactions(order_id);
```

**Implementation:**

```typescript
// lib/services/payments.ts
export async function createTenantPayment(
  orderId: string,
  tenantId: string,
  amount: number,
  currency: string = 'USD'
) {
  // Get tenant's Stripe Connect account
  const { data: tenant } = await supabase
    .from('shop_settings')
    .select('stripe_connect_account_id, platform_fee_percentage')
    .eq('id', tenantId)
    .single();

  if (!tenant.stripe_connect_account_id) {
    throw new Error('Tenant has not connected their Stripe account');
  }

  // Calculate platform fee
  const platformFeeAmount = Math.round(amount * (tenant.platform_fee_percentage / 100));

  // Create payment intent with application fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    application_fee_amount: platformFeeAmount,
    transfer_data: {
      destination: tenant.stripe_connect_account_id
    },
    metadata: {
      tenant_id: tenantId,
      order_id: orderId
    }
  });

  // Record transaction
  await supabase.from('tenant_transactions').insert({
    tenant_id: tenantId,
    order_id: orderId,
    stripe_payment_intent_id: paymentIntent.id,
    amount_total: amount,
    amount_tenant: amount - (platformFeeAmount / 100),
    amount_platform_fee: platformFeeAmount / 100,
    currency,
    status: paymentIntent.status
  });

  return paymentIntent;
}

// Onboard tenant to Stripe Connect
export async function createConnectAccount(tenantId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    metadata: {
      tenant_id: tenantId
    }
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings/payments/refresh`,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings/payments/success`,
    type: 'account_onboarding'
  });

  await supabase
    .from('shop_settings')
    .update({ stripe_connect_account_id: account.id })
    .eq('id', tenantId);

  return accountLink.url;
}
```

---

## 3. Email Service Integration

### Overview

Send tenant-branded emails with proper isolation and tracking.

### Recommended Services

#### **Option 1: Resend (Recommended)**

**Pros:**
- ✅ Developer-friendly API
- ✅ React Email templates
- ✅ Domain verification per tenant
- ✅ Excellent deliverability

**Database Schema:**

```sql
CREATE TABLE tenant_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  reply_to_email VARCHAR(255),
  custom_domain VARCHAR(255),
  domain_verified BOOLEAN DEFAULT false,
  resend_api_key VARCHAR(255), -- Encrypted
  smtp_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id),
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  template VARCHAR(100),
  status VARCHAR(50), -- sent, delivered, bounced, complained
  provider_message_id VARCHAR(255),
  metadata JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id, sent_at DESC);
CREATE INDEX idx_email_logs_status ON email_logs(status);
```

**Implementation:**

```typescript
// lib/services/email.ts
import { Resend } from 'resend';

export async function sendTenantEmail(
  tenantId: string,
  to: string,
  subject: string,
  template: string,
  data: any
) {
  // Get tenant email settings
  const { data: settings } = await supabase
    .from('tenant_email_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  const resend = new Resend(settings?.resend_api_key || process.env.RESEND_API_KEY);

  const { data: result, error } = await resend.emails.send({
    from: settings?.from_email || 'noreply@shamlai.com',
    to,
    subject,
    react: await renderEmailTemplate(template, data)
  });

  // Log email
  await supabase.from('email_logs').insert({
    tenant_id: tenantId,
    to_email: to,
    subject,
    template,
    status: error ? 'failed' : 'sent',
    provider_message_id: result?.id,
    metadata: { data, error: error?.message }
  });

  return result;
}

// Email templates with tenant branding
async function renderEmailTemplate(template: string, data: any) {
  const { OrderConfirmationEmail } = await import('@/emails/order-confirmation');

  switch (template) {
    case 'order-confirmation':
      return OrderConfirmationEmail(data);
    case 'user-invitation':
      return UserInvitationEmail(data);
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}
```

#### **Option 2: SendGrid**

Good alternative with powerful marketing features.

#### **Option 3: Mailgun**

Best for transactional emails at scale.

**Recommendation:** Use **Resend** for developer experience and React Email templates.

---

## 4. File Storage Integration

### Overview

Store tenant files with proper isolation and access control.

### Strategy: AWS S3 with Tenant Prefixes

**Database Schema:**

```sql
CREATE TABLE tenant_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id),
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT, -- bytes
  s3_key VARCHAR(1000) NOT NULL,
  s3_bucket VARCHAR(255),
  upload_type VARCHAR(100), -- product_image, logo, document, etc.
  uploaded_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tenant_files_tenant ON tenant_files(tenant_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_files_type ON tenant_files(tenant_id, upload_type) WHERE deleted_at IS NULL;

-- Storage usage tracking
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;
```

**Implementation:**

```typescript
// lib/services/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function uploadTenantFile(
  tenantId: string,
  file: File,
  uploadType: string,
  userId: string
) {
  // Check storage limits
  await enforceStorageLimit(tenantId);

  // Generate tenant-scoped key
  const fileExtension = file.name.split('.').pop();
  const fileKey = `tenants/${tenantId}/${uploadType}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    Metadata: {
      tenant_id: tenantId,
      upload_type: uploadType,
      uploaded_by: userId
    }
  });

  await s3Client.send(command);

  // Record in database
  const { data: fileRecord } = await supabase
    .from('tenant_files')
    .insert({
      tenant_id: tenantId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      s3_key: fileKey,
      s3_bucket: process.env.AWS_S3_BUCKET,
      upload_type: uploadType,
      uploaded_by: userId
    })
    .select()
    .single();

  // Update storage usage
  await supabase.rpc('increment_storage_usage', {
    p_tenant_id: tenantId,
    p_bytes: file.size
  });

  return fileRecord;
}

export async function getTenantFileUrl(fileId: string, tenantId: string, expiresIn: number = 3600) {
  // Verify tenant owns file
  const { data: file } = await supabase
    .from('tenant_files')
    .select('*')
    .eq('id', fileId)
    .eq('tenant_id', tenantId)
    .single();

  if (!file) {
    throw new Error('File not found or access denied');
  }

  // Generate signed URL
  const command = new GetObjectCommand({
    Bucket: file.s3_bucket,
    Key: file.s3_key
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

async function enforceStorageLimit(tenantId: string) {
  const { data: tenant } = await supabase
    .from('shop_settings')
    .select('storage_limit_mb, storage_used_bytes')
    .eq('id', tenantId)
    .single();

  const limitBytes = tenant.storage_limit_mb * 1024 * 1024;
  if (tenant.storage_used_bytes >= limitBytes) {
    throw new Error(`Storage limit reached (${tenant.storage_limit_mb} MB)`);
  }
}
```

**Alternative: Cloudinary**

```typescript
// For image-heavy applications
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadToCloudinary(tenantId: string, file: File) {
  const result = await cloudinary.uploader.upload(file, {
    folder: `tenants/${tenantId}`,
    resource_type: 'auto',
    context: {
      tenant_id: tenantId
    }
  });

  return result.secure_url;
}
```

---

## 5. Analytics Integration

### Overview

Track tenant-specific analytics while maintaining data isolation.

### Recommended: PostHog (Self-hosted or Cloud)

**Pros:**
- ✅ Product analytics
- ✅ Feature flags
- ✅ Session replay
- ✅ Multi-tenant support
- ✅ Open source option

**Implementation:**

```typescript
// lib/services/analytics.ts
import { PostHog } from 'posthog-node';

const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
);

export async function trackTenantEvent(
  tenantId: string,
  userId: string,
  event: string,
  properties: any = {}
) {
  posthog.capture({
    distinctId: userId,
    event,
    properties: {
      ...properties,
      tenant_id: tenantId,
      $groups: { company: tenantId } // Group by tenant
    }
  });

  // Also log to database for custom reporting
  await supabase.from('analytics_events').insert({
    tenant_id: tenantId,
    user_id: userId,
    event_name: event,
    properties,
    created_at: new Date().toISOString()
  });
}

// Usage
await trackTenantEvent(
  tenantId,
  userId,
  'product_created',
  {
    product_id: product.id,
    product_name: product.name,
    price: product.price
  }
);
```

**Client-side:**

```tsx
// app/providers/analytics-provider.tsx
'use client';

import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import { useEffect } from 'react';

export function AnalyticsProvider({
  children,
  tenantId,
  userId
}: {
  children: React.ReactNode;
  tenantId: string;
  userId: string;
}) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST
    });

    // Identify user and group by tenant
    posthog.identify(userId);
    posthog.group('company', tenantId);
  }, [tenantId, userId]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

---

## 6. Search Service Integration

### Overview

Provide fast, tenant-scoped search across products, orders, customers.

### Recommended: Meilisearch

**Pros:**
- ✅ Fast typo-tolerant search
- ✅ Easy to self-host
- ✅ Multi-tenancy via tenant filters
- ✅ Excellent DX

**Database Schema:**

```sql
CREATE TABLE search_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id),
  resource_type VARCHAR(50) NOT NULL, -- product, order, customer
  resource_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- index, update, delete
  synced BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_sync_pending ON search_sync_queue(synced, created_at) WHERE synced = false;
```

**Implementation:**

```typescript
// lib/services/search.ts
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_MASTER_KEY!
});

export async function indexProduct(product: any, tenantId: string) {
  const index = client.index('products');

  await index.addDocuments([
    {
      id: product.id,
      tenant_id: tenantId, // Critical for filtering
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      category: product.category,
      status: product.status
    }
  ]);
}

export async function searchProducts(
  tenantId: string,
  query: string,
  filters?: any
) {
  const index = client.index('products');

  const results = await index.search(query, {
    filter: [
      `tenant_id = ${tenantId}`, // Always filter by tenant
      filters?.category && `category = ${filters.category}`,
      filters?.minPrice && `price >= ${filters.minPrice}`
    ].filter(Boolean)
  });

  return results.hits;
}

// Background sync job
export async function syncSearchIndex(tenantId: string) {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', tenantId)
    .eq('status', 'active');

  const index = client.index('products');
  await index.deleteDocuments({ filter: `tenant_id = ${tenantId}` });
  await index.addDocuments(
    products.map(p => ({ ...p, tenant_id: tenantId }))
  );
}
```

---

## 7. Authentication Providers (SSO/SAML)

### Overview

Enterprise tenants need SSO with their identity providers (Okta, Azure AD, Google Workspace).

### Strategy: WorkOS or Auth0

**Database Schema:**

```sql
CREATE TABLE tenant_sso_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- okta, azure_ad, google_workspace, onelogin
  is_enabled BOOLEAN DEFAULT false,

  -- SAML Configuration
  saml_entity_id VARCHAR(500),
  saml_sso_url VARCHAR(500),
  saml_certificate TEXT,

  -- OIDC Configuration
  oidc_client_id VARCHAR(255),
  oidc_client_secret VARCHAR(255), -- Encrypted
  oidc_issuer VARCHAR(500),

  -- Settings
  auto_provision_users BOOLEAN DEFAULT true,
  default_role VARCHAR(50) DEFAULT 'shop_staff',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);
```

**Implementation with WorkOS:**

```typescript
// lib/services/sso.ts
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export async function initiateSSOLogin(tenantId: string, email: string) {
  // Get tenant SSO config
  const { data: config } = await supabase
    .from('tenant_sso_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true)
    .single();

  if (!config) {
    throw new Error('SSO not configured for this tenant');
  }

  // Generate authorization URL
  const authorizationUrl = workos.sso.getAuthorizationURL({
    organization: tenantId,
    clientID: process.env.WORKOS_CLIENT_ID!,
    redirectURI: `${process.env.NEXT_PUBLIC_URL}/auth/sso/callback`,
    state: tenantId
  });

  return authorizationUrl;
}

export async function handleSSOCallback(code: string, tenantId: string) {
  // Exchange code for profile
  const profile = await workos.sso.getProfileAndToken({
    code,
    clientID: process.env.WORKOS_CLIENT_ID!
  });

  // Auto-provision or link user
  const { data: user } = await supabase.auth.admin.createUser({
    email: profile.email,
    email_confirm: true,
    user_metadata: {
      first_name: profile.firstName,
      last_name: profile.lastName,
      sso_provider: 'workos'
    }
  });

  // Add user to tenant with default role
  const { data: config } = await supabase
    .from('tenant_sso_config')
    .select('default_role, auto_provision_users')
    .eq('tenant_id', tenantId)
    .single();

  if (config.auto_provision_users) {
    await supabase.from('shop_users').insert({
      shop_id: tenantId,
      user_id: user.user.id,
      role: config.default_role,
      is_active: true,
      invitation_accepted: true,
      joined_at: new Date().toISOString()
    });
  }

  return user;
}
```

---

## 8. Webhook Management

### Overview

Allow tenants to configure webhooks for events (order created, payment received, etc.)

**Database Schema:**

```sql
CREATE TABLE tenant_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id) ON DELETE CASCADE,
  url VARCHAR(2000) NOT NULL,
  events TEXT[] NOT NULL, -- ['order.created', 'order.updated', 'payment.succeeded']
  is_active BOOLEAN DEFAULT true,
  secret VARCHAR(255), -- For signature verification

  -- Rate limiting
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,

  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES tenant_webhooks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES shop_settings(id),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,

  -- Delivery tracking
  status VARCHAR(50) NOT NULL, -- pending, success, failed, retrying
  http_status_code INTEGER,
  response_body TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status, next_retry_at) WHERE status = 'retrying';
```

**Implementation:**

```typescript
// lib/services/webhooks.ts
import crypto from 'crypto';

export async function triggerWebhooks(
  tenantId: string,
  eventType: string,
  payload: any
) {
  // Get active webhooks for this event
  const { data: webhooks } = await supabase
    .from('tenant_webhooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .contains('events', [eventType]);

  if (!webhooks || webhooks.length === 0) return;

  // Queue delivery for each webhook
  for (const webhook of webhooks) {
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      tenant_id: tenantId,
      event_type: eventType,
      payload,
      status: 'pending'
    });
  }

  // Process deliveries in background
  await processWebhookQueue();
}

async function processWebhookQueue() {
  // Get pending deliveries
  const { data: deliveries } = await supabase
    .from('webhook_deliveries')
    .select('*, webhook:tenant_webhooks(*)')
    .in('status', ['pending', 'retrying'])
    .lte('next_retry_at', new Date().toISOString())
    .limit(100);

  for (const delivery of deliveries) {
    await deliverWebhook(delivery);
  }
}

async function deliverWebhook(delivery: any) {
  const webhook = delivery.webhook;

  // Generate signature
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(JSON.stringify(delivery.payload))
    .digest('hex');

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shamlai-Signature': signature,
        'X-Shamlai-Event': delivery.event_type
      },
      body: JSON.stringify(delivery.payload)
    });

    const responseBody = await response.text();

    if (response.ok) {
      // Success
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'success',
          http_status_code: response.status,
          response_body: responseBody,
          delivered_at: new Date().toISOString()
        })
        .eq('id', delivery.id);
    } else {
      // Failed, schedule retry
      await scheduleRetry(delivery, response.status, responseBody);
    }
  } catch (error) {
    await scheduleRetry(delivery, 0, error.message);
  }
}

async function scheduleRetry(delivery: any, statusCode: number, errorMessage: string) {
  const retryCount = delivery.retry_count + 1;
  const maxRetries = delivery.webhook.max_retries;

  if (retryCount >= maxRetries) {
    // Max retries reached, mark as failed
    await supabase
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        http_status_code: statusCode,
        response_body: errorMessage,
        retry_count: retryCount
      })
      .eq('id', delivery.id);
  } else {
    // Schedule next retry with exponential backoff
    const delaySeconds = delivery.webhook.retry_delay_seconds * Math.pow(2, retryCount);
    const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

    await supabase
      .from('webhook_deliveries')
      .update({
        status: 'retrying',
        http_status_code: statusCode,
        response_body: errorMessage,
        retry_count: retryCount,
        next_retry_at: nextRetryAt.toISOString()
      })
      .eq('id', delivery.id);
  }
}

// Usage: Trigger on order creation
await triggerWebhooks(tenantId, 'order.created', {
  order_id: order.id,
  order_number: order.order_number,
  total: order.total,
  customer: order.customer
});
```

---

## 9. Background Job Processing

### Overview

Process tenant-scoped background jobs (email sending, report generation, data exports).

### Recommended: BullMQ with Redis

**Database Schema:**

```sql
CREATE TABLE tenant_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shop_settings(id),
  job_type VARCHAR(100) NOT NULL, -- export_orders, send_bulk_email, generate_report
  job_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  priority INTEGER DEFAULT 0,

  -- Job data
  input_data JSONB,
  result_data JSONB,
  error_message TEXT,

  -- Progress tracking
  progress_percent INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  total_count INTEGER,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_jobs_tenant ON tenant_jobs(tenant_id, status, created_at DESC);
CREATE INDEX idx_tenant_jobs_scheduled ON tenant_jobs(status, scheduled_for) WHERE status = 'pending';
```

**Implementation:**

```typescript
// lib/services/jobs.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Create tenant-scoped queue
const tenantJobsQueue = new Queue('tenant-jobs', { connection });

export async function queueTenantJob(
  tenantId: string,
  jobType: string,
  inputData: any,
  options?: {
    priority?: number;
    scheduledFor?: Date;
  }
) {
  // Record in database
  const { data: job } = await supabase
    .from('tenant_jobs')
    .insert({
      tenant_id: tenantId,
      job_type: jobType,
      input_data: inputData,
      priority: options?.priority || 0,
      scheduled_for: options?.scheduledFor?.toISOString()
    })
    .select()
    .single();

  // Add to queue
  await tenantJobsQueue.add(
    jobType,
    {
      job_id: job.id,
      tenant_id: tenantId,
      ...inputData
    },
    {
      priority: options?.priority,
      delay: options?.scheduledFor
        ? options.scheduledFor.getTime() - Date.now()
        : 0
    }
  );

  return job;
}

// Worker to process jobs
const worker = new Worker(
  'tenant-jobs',
  async (job) => {
    const { job_id, tenant_id } = job.data;

    // Update status to processing
    await supabase
      .from('tenant_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', job_id);

    try {
      // Process job based on type
      let result;
      switch (job.name) {
        case 'export_orders':
          result = await exportOrders(tenant_id, job.data);
          break;
        case 'send_bulk_email':
          result = await sendBulkEmail(tenant_id, job.data);
          break;
        case 'generate_report':
          result = await generateReport(tenant_id, job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }

      // Mark as completed
      await supabase
        .from('tenant_jobs')
        .update({
          status: 'completed',
          result_data: result,
          progress_percent: 100,
          completed_at: new Date().toISOString()
        })
        .eq('id', job_id);

      return result;
    } catch (error) {
      // Mark as failed
      await supabase
        .from('tenant_jobs')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', job_id);

      throw error;
    }
  },
  { connection }
);

// Job implementations
async function exportOrders(tenantId: string, data: any) {
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', tenantId)
    .gte('created_at', data.start_date)
    .lte('created_at', data.end_date);

  // Generate CSV
  const csv = generateCSV(orders);

  // Upload to S3
  const fileUrl = await uploadTenantFile(tenantId, csv, 'exports', 'system');

  return { file_url: fileUrl, count: orders.length };
}

async function sendBulkEmail(tenantId: string, data: any) {
  const { recipient_ids, template, template_data } = data;

  let sent = 0;
  for (const recipientId of recipient_ids) {
    await sendTenantEmail(tenantId, recipientId, template, template_data);
    sent++;

    // Update progress
    await supabase
      .from('tenant_jobs')
      .update({
        processed_count: sent,
        progress_percent: Math.round((sent / recipient_ids.length) * 100)
      })
      .eq('id', data.job_id);
  }

  return { sent_count: sent };
}
```

---

## 10. API Rate Limiting

### Overview

Implement tenant-specific rate limits based on subscription tier.

**Database Schema:**

```sql
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS api_rate_limit_per_minute INTEGER DEFAULT 60;
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS api_rate_limit_per_hour INTEGER DEFAULT 1000;

CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES shop_settings(id),
  endpoint VARCHAR(500),
  method VARCHAR(10),
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by date for performance
CREATE INDEX idx_api_logs_tenant_time ON api_request_logs(tenant_id, created_at DESC);
```

**Implementation:**

```typescript
// middleware/rate-limit.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function checkTenantRateLimit(
  tenantId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  // Get tenant rate limits
  const { data: tenant } = await supabase
    .from('shop_settings')
    .select('api_rate_limit_per_minute, api_rate_limit_per_hour, tenant_tier')
    .eq('id', tenantId)
    .single();

  // Check per-minute limit
  const minuteKey = `rate_limit:${tenantId}:${endpoint}:minute:${Math.floor(Date.now() / 60000)}`;
  const minuteCount = await redis.incr(minuteKey);
  await redis.expire(minuteKey, 60);

  if (minuteCount > tenant.api_rate_limit_per_minute) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Math.ceil(Date.now() / 60000) * 60000)
    };
  }

  // Check per-hour limit
  const hourKey = `rate_limit:${tenantId}:${endpoint}:hour:${Math.floor(Date.now() / 3600000)}`;
  const hourCount = await redis.incr(hourKey);
  await redis.expire(hourKey, 3600);

  if (hourCount > tenant.api_rate_limit_per_hour) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Math.ceil(Date.now() / 3600000) * 3600000)
    };
  }

  return {
    allowed: true,
    remaining: tenant.api_rate_limit_per_minute - minuteCount,
    resetAt: new Date(Math.ceil(Date.now() / 60000) * 60000)
  };
}

// Middleware
export async function rateLimitMiddleware(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');
  const endpoint = request.nextUrl.pathname;

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  const { allowed, remaining, resetAt } = await checkTenantRateLimit(tenantId, endpoint);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        reset_at: resetAt.toISOString()
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toISOString()
        }
      }
    );
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetAt.toISOString());

  return response;
}
```

---

## 11. Monitoring & Error Tracking

### Overview

Monitor tenant health and track errors per tenant.

### Recommended: Sentry

**Implementation:**

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Add tenant context to all errors
    if (event.user?.tenant_id) {
      event.tags = {
        ...event.tags,
        tenant_id: event.user.tenant_id
      };
    }
    return event;
  }
});

export function captureError(error: Error, tenantId?: string, context?: any) {
  Sentry.withScope((scope) => {
    if (tenantId) {
      scope.setTag('tenant_id', tenantId);
      scope.setContext('tenant', { id: tenantId });
    }
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
}
```

---

## 12. Implementation Roadmap

### Phase 1: Critical (Week 1-2)

1. ✅ **Subscription & Billing** (Stripe)
   - Create subscription plans
   - Implement webhook handler
   - Add subscription enforcement

2. ✅ **Payment Gateway** (Stripe Connect)
   - Set up Connect accounts
   - Implement payment flow
   - Add transaction logging

3. ✅ **Email Service** (Resend)
   - Configure domain
   - Create email templates
   - Set up logging

### Phase 2: Important (Week 3-4)

4. ✅ **File Storage** (AWS S3)
   - Set up bucket with tenant folders
   - Implement upload/download
   - Add storage limits

5. ✅ **Background Jobs** (BullMQ)
   - Set up Redis queue
   - Create workers
   - Add job monitoring

6. ✅ **Rate Limiting**
   - Implement Redis-based limits
   - Add middleware
   - Create monitoring dashboard

### Phase 3: Advanced (Week 5-6)

7. ✅ **Analytics** (PostHog)
   - Set up tenant grouping
   - Add event tracking
   - Create dashboards

8. ✅ **Search** (Meilisearch)
   - Set up indexes
   - Implement sync
   - Add search UI

9. ✅ **Webhooks**
   - Create webhook management
   - Implement delivery queue
   - Add retry logic

### Phase 4: Enterprise (Week 7-8)

10. ✅ **SSO/SAML** (WorkOS)
    - Configure providers
    - Add auto-provisioning
    - Test with enterprise customers

11. ✅ **Monitoring** (Sentry)
    - Set up error tracking
    - Add performance monitoring
    - Create alerts

---

## Summary

This comprehensive integration architecture provides:

✅ **Subscription Management** - Automated billing with Stripe
✅ **Multi-Tenant Payments** - Stripe Connect for tenant payouts
✅ **Email Service** - Branded emails with Resend
✅ **File Storage** - Isolated S3 storage per tenant
✅ **Analytics** - Tenant-scoped tracking with PostHog
✅ **Search** - Fast tenant-scoped search with Meilisearch
✅ **SSO** - Enterprise authentication with WorkOS
✅ **Webhooks** - Tenant-configurable webhooks with retry
✅ **Background Jobs** - Scalable job processing with BullMQ
✅ **Rate Limiting** - Tier-based API limits
✅ **Monitoring** - Error tracking with Sentry

All integrations maintain **tenant isolation** and follow **multi-tenant best practices**.

---

**Next Steps:**

1. Choose which integrations to implement first
2. Set up accounts with chosen services
3. Follow implementation guides for each service
4. Test thoroughly with multiple tenants
5. Monitor usage and adjust limits

Let me know which integration you'd like to implement first!
