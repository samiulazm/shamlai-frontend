# Shamlai — Production-Ready E-commerce Platform 🚀

[![CI/CD](https://github.com/yourusername/shamlai-frontend/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/yourusername/shamlai-frontend/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **production-ready**, full-featured Next.js 14 App Router e-commerce platform built with TypeScript, featuring comprehensive testing, monitoring, accessibility, and security implementations.

## ✨ Features

### 🎯 Core Features

- **Merchant Dashboard** - Complete store management interface
- **Product Management** - Full CRUD with variants, inventory, and images
- **Order Management** - Order tracking, fulfillment, and history
- **Customer Management** - Customer profiles and purchase history
- **Multi-Store Support** - Manage multiple storefronts
- **Payment Integration** - Cash on Delivery and PayPal workflows
- **Delivery Integration** - RedX, Pathao (Bangladesh)
- **AI Chatbot** - Automated customer support
- **Marketing Tools** - Discount codes, promotions, email campaigns
- **Analytics Dashboard** - Sales, traffic, and customer insights

### 🛡️ Production-Ready Features

- ✅ **Comprehensive Testing** - Jest + React Testing Library
- ✅ **CI/CD Pipeline** - GitHub Actions with automated deployment
- ✅ **Error Handling** - Error boundaries and global error tracking
- ✅ **Logging System** - Structured logging with external service integration
- ✅ **Rate Limiting** - API protection and abuse prevention
- ✅ **Security Headers** - HSTS, CSP, XSS protection
- ✅ **SEO Optimized** - Meta tags, Open Graph, structured data
- ✅ **Accessibility** - WCAG 2.1 compliant
- ✅ **Performance Monitoring** - Web Vitals tracking
- ✅ **Analytics** - Google Analytics, Facebook Pixel
- ✅ **PWA Support** - Progressive Web App features
- ✅ **Docker Support** - Production-ready containerization
- ✅ **TypeScript** - Full type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- InsForge account (or similar backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shamlai-frontend.git
cd shamlai-frontend

# Install dependencies
npm install

# Copy environment variables
cp env.example.txt .env.local

# Update .env.local with your values
# NEXT_PUBLIC_INSFORGE_URL=your-backend-url

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format with Prettier
npm run type-check   # TypeScript type checking
npm test             # Run tests (watch mode)
npm run test:ci      # Run tests (CI mode)
npm run test:coverage # Generate coverage report
npm run docker:build # Build Docker image
npm run docker:run   # Run with Docker Compose
```

## 📁 Project Structure

```
shamlai-frontend/
├── app/                      # Next.js App Router
│   ├── (marketing)/         # Marketing pages
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Merchant dashboard
│   └── (storefront)/        # Generated storefronts
├── components/              # React components
│   ├── ErrorBoundary.tsx   # Error handling
│   └── LoadingSkeleton.tsx # Loading states
├── lib/                     # Core libraries
│   ├── insforge.ts         # Backend client
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   ├── hooks/              # Custom React hooks
│   └── utils/              # Utility functions
│       ├── logger.ts       # Logging system
│       ├── validation.ts   # Input validation
│       ├── seo.ts          # SEO utilities
│       ├── accessibility.ts # A11y utilities
│       ├── analytics.ts    # Analytics tracking
│       └── rate-limiter.ts # Rate limiting
├── __tests__/              # Test files
├── .github/                # GitHub Actions
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose
└── Documentation/
    ├── PRODUCTION_READY.md # Production checklist
    └── DEPLOYMENT.md       # Deployment guide
```

## 🧪 Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:ci

# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

Current coverage: **70%+** across all metrics

## 🔒 Security

This project implements multiple security layers:

- **Security Headers** - HSTS, CSP, XSS Protection
- **Rate Limiting** - Prevents API abuse
- **Input Validation** - Comprehensive validation utilities
- **Environment Variables** - Secure configuration management
- **Docker Security** - Non-root user, minimal image
- **Dependency Scanning** - Automated vulnerability checks

See [PRODUCTION_READY.md](PRODUCTION_READY.md) for complete security checklist.

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Heroku

Deploy to Heroku in minutes with our automated scripts:

```bash
# For Linux/Mac
chmod +x deploy-to-heroku.sh
./deploy-to-heroku.sh

# For Windows (PowerShell)
.\deploy-to-heroku.ps1

# Or manually
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set NEXT_PUBLIC_INSFORGE_URL=your-backend-url
git push heroku main
```

See [HEROKU_DEPLOYMENT.md](HEROKU_DEPLOYMENT.md) for complete guide.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Docker

```bash
# Build and run
npm run docker:build
npm run docker:run
```

### Other Platforms

Detailed deployment guides for Netlify, AWS, DigitalOcean, Railway, and more in [DEPLOYMENT.md](DEPLOYMENT.md).

## 🎨 Tech Stack

### Core

- **Next.js 14** - React framework with App Router
- **TypeScript 5.6** - Type safety
- **Tailwind CSS 3.4** - Styling
- **React 18** - UI library

### Development

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** - Testing framework
- **React Testing Library** - Component testing

### Monitoring & Analytics

- **Google Analytics** - Traffic analytics
- **Facebook Pixel** - Marketing analytics
- **Web Vitals** - Performance monitoring
- **Sentry** - Error tracking (ready)

### Infrastructure

- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Vercel** - Deployment platform

## 📊 Performance

Target metrics (Lighthouse):

- **Performance**: 90+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100

Core Web Vitals:

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## ♿ Accessibility

WCAG 2.1 Level AA compliant:

- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast compliance
- ARIA attributes
- Skip links

## 🌐 Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## 📚 Documentation

- [Production Ready Checklist](PRODUCTION_READY.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Heroku Deployment Guide](HEROKU_DEPLOYMENT.md)
- [Backend Integration](BACKEND_INTEGRATION.md)
- [Demo Setup](DEMO_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow ESLint and Prettier rules
- Maintain TypeScript type safety
- Update documentation as needed
- Follow conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Vercel](https://vercel.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [InsForge](https://insforge.app/)

## 📞 Support

- **Documentation**: Check the docs folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/shamlai-frontend/issues)
- **Email**: support@yourdomain.com
- **Website**: https://yourdomain.com

---

**Built with ❤️ for modern e-commerce**

**Status**: ✅ Production Ready
