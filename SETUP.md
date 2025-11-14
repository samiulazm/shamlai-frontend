# Shamlai E-commerce Platform - Setup Guide

Complete setup guide for the Shamlai SaaS SME e-commerce MVP.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Service Integrations](#service-integrations)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18.x, 20.x, or 22.x
- npm >= 9.0.0
- Git

## Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/shamlai-frontend.git
   cd shamlai-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Environment Configuration

### Required Services

#### 1. InsForge Backend (Required)

```env
NEXT_PUBLIC_INSFORGE_URL=https://your-project.insforge.app
```

- Sign up at [InsForge](https://insforge.com)
- Create a new project
- Copy your project URL

#### 2. Resend Email Service (Required for emails)

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Shamlai <noreply@yourdomain.com>
```

- Sign up at [Resend](https://resend.com)
- Create API key
- Verify your domain for production

#### 3. Twilio SMS Service (Required for SMS)

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

- Create account at [Twilio](https://twilio.com)
- Get credentials from Console
- Purchase a phone number

### Optional Services

#### Pathao Courier (Bangladesh delivery)

```env
PATHAO_API_URL=https://api-hermes.pathao.com/api/v1
PATHAO_CLIENT_ID=...
PATHAO_CLIENT_SECRET=...
PATHAO_STORE_ID=...
```

- Register as merchant at [Pathao](https://pathao.com)
- Request API access
- Create a store

#### RedX Courier (Bangladesh delivery)

```env
REDX_API_URL=https://openapi.redx.com.bd/v1.0.0-beta
REDX_API_KEY=...
```

- Register as merchant at [RedX](https://redx.com.bd)
- Request API access

## Service Integrations

### Database Setup (InsForge)

The database schema is automatically managed by InsForge. Key tables:

- `shop_settings` - Shop configuration
- `products` - Product catalog
- `orders` - Order management
- `customers` - Customer data
- `cart` - Shopping cart
- `payments` - Payment records
- 30+ more tables for complete functionality

### Payment Integration

Cash on Delivery is fully supported out of the box. If you want to record external payments (PayPal, bank transfer, etc.), update the payment method options in InsForge and mark orders as paid via the dashboard workflows. All automated payment processing hooks referencing third-party gateways have been removed for simplicity.

### Email Templates

Pre-built templates for:

- Order confirmation
- Shipment notification
- Welcome email
- Password reset

Customize in `lib/services/email.ts`

### SMS Notifications

Automatic SMS for:

- Order confirmation
- Shipment tracking
- Delivery confirmation
- Order status updates

Configure in `lib/services/sms.ts`

### Courier Integration

#### Creating a Shipment:

```typescript
import { createShipment } from '@/lib/services/courier';

const result = await createShipment('pathao', {
  orderNumber: 'ORD-123',
  customerName: 'John Doe',
  customerPhone: '+8801234567890',
  customerAddress: {
    street: '123 Main St',
    city: 'Dhaka',
    country: 'BD',
  },
  items: [{ name: 'Product', quantity: 1, price: 1000 }],
  totalAmount: 1000,
});
```

#### Tracking a Shipment:

```typescript
import { trackShipment } from '@/lib/services/courier';

const result = await trackShipment('pathao', 'TRACKING123');
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check

# Type checking
npm run type-check

# Testing
npm test
npm run test:ci
npm run test:coverage

# Database seeding
npm run seed
```

### Project Structure

```
/app
  /(auth)           - Authentication pages
  /(dashboard)      - Merchant dashboard
  /(marketing)      - Landing pages
  /(storefront)     - Customer storefront
  /api              - API endpoints
/components         - Reusable components
/lib
  /services         - Business logic
  /hooks            - React hooks
  /utils            - Utilities
  /context          - React context
  /types            - TypeScript types
/public             - Static assets
```

### Code Quality

Pre-commit hooks automatically run:

- ESLint
- Prettier
- Type checking

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:ci
```

### Coverage Report

```bash
npm run test:coverage
```

Target coverage: 70%+

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

4. **Set environment variables**
   - Go to Vercel Dashboard
   - Select your project
   - Settings > Environment Variables
   - Add all variables from `.env.example`

5. **Configure domains**
   - Settings > Domains
   - Add your custom domain

### Docker Deployment

1. **Build image**

   ```bash
   docker build -t shamlai-frontend .
   ```

2. **Run container**

   ```bash
   docker run -p 3000:3000 --env-file .env.local shamlai-frontend
   ```

3. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Environment-specific Configuration

#### Production Checklist:

- [ ] Set `NODE_ENV=production`
- [ ] Use production API keys (SMS, email, analytics, etc.)
- [ ] Configure production domain
- [ ] Set up SSL certificate
- [ ] Enable error tracking (Sentry)
- [ ] Configure analytics (Google Analytics)
- [ ] Set up CDN for static assets
- [ ] Enable rate limiting
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts

## Troubleshooting

### Common Issues

#### 1. **Build Errors**

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. **Environment Variables Not Loading**

- Ensure file is named `.env.local` (not `.env`)
- Restart development server after changes
- Variables starting with `NEXT_PUBLIC_` are exposed to browser

#### 3. **Database Connection Issues**

- Verify INSFORGE_URL is correct
- Check InsForge project status
- Ensure tables are created (run seed script)

#### 4. **Custom Payment Webhook Not Receiving Events**

- Verify your custom gateway is sending events to the correct URL
- Inspect server logs for incoming requests
- Re-deploy after changing any environment variables

#### 5. **Email/SMS Not Sending**

- Verify API keys are correct
- Check service quotas/limits
- Review logs for error messages
- Test with curl/Postman first

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
DEBUG=*
```

### Getting Help

- GitHub Issues: [Report bugs](https://github.com/your-org/shamlai-frontend/issues)
- Documentation: [Full docs](https://docs.shamlai.com)
- Community: [Discord](https://discord.gg/shamlai)

## Next Steps

1. **Complete Setup**
   - [ ] Configure all environment variables
   - [ ] Test authentication flow
   - [ ] Create test products
   - [ ] Place test orders
   - [ ] Verify email/SMS notifications

2. **Customize**
   - [ ] Update branding and colors
   - [ ] Customize email templates
   - [ ] Configure payment methods
   - [ ] Set up delivery zones

3. **Launch**
   - [ ] Deploy to production
   - [ ] Configure custom domain
   - [ ] Set up SSL
   - [ ] Test all workflows
   - [ ] Monitor errors and performance

## License

Proprietary - All rights reserved
