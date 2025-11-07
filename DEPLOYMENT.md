# Deployment Guide 🚀

Complete guide for deploying Shamlai to various platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deployment Options](#deployment-options)
4. [Post-Deployment](#post-deployment)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18.x or higher
- npm 9.x or higher
- Access to your InsForge backend instance
- Domain name (for production)
- SSL certificate (for production)

## Environment Variables

Create a `.env.local` file (or configure in your deployment platform):

```bash
# Required
NEXT_PUBLIC_INSFORGE_URL=https://your-instance.insforge.app
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Shamlai

# Optional but recommended for production
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=your-fb-pixel-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# For payments (if enabled)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# For emails (if enabled)
SENDGRID_API_KEY=SG.xxxxx
```

## Deployment Options

### Option 1: Vercel (Recommended)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login

```bash
vercel login
```

#### Step 3: Deploy

```bash
# For preview deployment
vercel

# For production deployment
vercel --prod
```

#### Step 4: Configure Environment Variables

Go to your Vercel dashboard → Project Settings → Environment Variables and add all required variables.

#### Step 5: Configure Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown

### Option 2: Docker

#### Step 1: Build Docker Image

```bash
npm run docker:build
```

#### Step 2: Run with Docker Compose

```bash
# Start services
npm run docker:run

# View logs
docker-compose logs -f

# Stop services
npm run docker:stop
```

#### Step 3: Production Docker Deployment

```bash
# Build for production
docker build -t shamlai-frontend:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_INSFORGE_URL=https://your-instance.insforge.app \
  -e NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  --name shamlai-frontend \
  shamlai-frontend:latest
```

### Option 3: Netlify

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login

```bash
netlify login
```

#### Step 3: Initialize

```bash
netlify init
```

#### Step 4: Deploy

```bash
# For preview
netlify deploy

# For production
netlify deploy --prod
```

#### Build Settings

- Build command: `npm run build`
- Publish directory: `.next`

### Option 4: AWS (EC2 + Nginx)

#### Step 1: Prepare EC2 Instance

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

#### Step 2: Deploy Application

```bash
# Clone repository
git clone your-repo-url
cd shamlai-frontend

# Install dependencies
npm ci --production

# Build application
npm run build

# Start with PM2
pm2 start npm --name "shamlai" -- start
pm2 save
pm2 startup
```

#### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/shamlai`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/shamlai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 4: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 5: DigitalOcean App Platform

#### Step 1: Connect Repository

1. Go to DigitalOcean dashboard
2. Create New App → GitHub
3. Select your repository

#### Step 2: Configure Build

- Build Command: `npm run build`
- Run Command: `npm start`
- Environment: Node.js

#### Step 3: Add Environment Variables

Add all required environment variables in the App Settings.

#### Step 4: Deploy

Click "Deploy" and wait for deployment to complete.

### Option 6: Railway

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Login

```bash
railway login
```

#### Step 3: Initialize

```bash
railway init
```

#### Step 4: Add Variables

```bash
railway variables set NEXT_PUBLIC_INSFORGE_URL=https://your-instance.insforge.app
railway variables set NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### Step 5: Deploy

```bash
railway up
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check if site is accessible
curl -I https://yourdomain.com

# Check SSL certificate
openssl s_client -connect yourdomain.com:443
```

### 2. Configure DNS

Point your domain to your deployment:

```
A Record: @ → Your-Server-IP
CNAME: www → yourdomain.com
```

### 3. Set Up Monitoring

Configure monitoring services:

1. **Uptime Monitoring**: UptimeRobot, Pingdom
2. **Error Tracking**: Sentry
3. **Analytics**: Google Analytics, Vercel Analytics
4. **Performance**: Lighthouse CI, Web Vitals

### 4. Configure Backups

Set up automated backups for:

- Database (via InsForge)
- Static assets
- Environment variables

### 5. Set Up CI/CD

The repository includes GitHub Actions workflows that automatically:

- Run tests on pull requests
- Deploy to staging on `develop` branch
- Deploy to production on `main` branch

To enable:

1. Add secrets in GitHub repository settings
2. Configure deployment tokens
3. Push to trigger workflows

### 6. Performance Optimization

After deployment, optimize for:

```bash
# Analyze bundle size
npm run build

# Check Lighthouse score
npx lighthouse https://yourdomain.com

# Test Core Web Vitals
https://pagespeed.web.dev/
```

### 7. Security Hardening

- [ ] Enable HTTPS/SSL
- [ ] Configure security headers (already in next.config.mjs)
- [ ] Set up rate limiting with Redis
- [ ] Configure CORS policies
- [ ] Enable WAF (Web Application Firewall)
- [ ] Set up DDoS protection

### 8. CDN Configuration

For better performance, configure CDN:

#### Cloudflare (Recommended)

1. Add site to Cloudflare
2. Update DNS nameservers
3. Enable:
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - HTTP/3
   - Caching rules
4. Configure page rules for dynamic vs static content

### 9. Database Optimization

Ensure your InsForge instance is optimized:

- Connection pooling enabled
- Indexes on frequently queried fields
- Regular vacuum/analyze operations
- Backup schedule configured

### 10. Load Testing

Before going live, perform load testing:

```bash
# Using Apache Bench
ab -n 1000 -c 100 https://yourdomain.com/

# Using k6
k6 run load-test.js

# Using Artillery
artillery quick --count 10 -n 20 https://yourdomain.com/
```

## Rollback Procedure

If deployment fails:

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Docker

```bash
# Stop current container
docker stop shamlai-frontend

# Start previous version
docker start shamlai-frontend-previous
```

### PM2

```bash
# Revert to previous version
git reset --hard HEAD~1
npm ci
npm run build
pm2 restart shamlai
```

## Troubleshooting

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Runtime Errors

```bash
# Check logs
# Vercel
vercel logs

# Docker
docker logs shamlai-frontend

# PM2
pm2 logs shamlai
```

### Performance Issues

1. Enable production optimizations
2. Check bundle size
3. Optimize images
4. Enable caching
5. Use CDN

## Support

For deployment issues:

- Documentation: [README.md](README.md)
- Production Checklist: [PRODUCTION_READY.md](PRODUCTION_READY.md)
- Issues: Create a GitHub issue
- Email: support@yourdomain.com

---

**Last Updated:** November 2025

