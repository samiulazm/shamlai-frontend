# Deployment Guide

**Current**: InsForge (Backend) + Heroku (Frontend)  
**Future**: VPS Deployment

---

## 🚀 Heroku Deployment (Current)

### Quick Deploy

```bash
# Option 1: Use deployment script
./deploy-to-heroku.sh

# Option 2: Manual deployment
heroku create your-app-name
git push heroku main
```

### Environment Variables

```bash
heroku config:set \
  NODE_ENV=production \
  NEXT_PUBLIC_APP_URL=https://your-app.herokuapp.com \
  NEXT_PUBLIC_INSFORGE_URL=https://your-insforge-backend.insforge.app \
  NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id \
  NEXT_PUBLIC_FB_PIXEL_ID=your-pixel-id \
  NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn \
  RESEND_API_KEY=your-resend-key \
  RESEND_FROM_EMAIL=noreply@yourdomain.com \
  TWILIO_ACCOUNT_SID=your-twilio-sid \
  TWILIO_AUTH_TOKEN=your-twilio-token \
  TWILIO_PHONE_NUMBER=your-twilio-number \
  PATHAO_CLIENT_ID=your-pathao-id \
  PATHAO_CLIENT_SECRET=your-pathao-secret \
  PATHAO_STORE_ID=your-pathao-store-id \
  REDX_API_KEY=your-redx-key
```

### Monitoring

```bash
heroku logs --tail    # View logs
heroku ps             # Check status
heroku restart        # Restart app
heroku open           # Open app
```

---

## 🖥️ VPS Deployment (Future)

### Prerequisites

- VPS with Ubuntu 20.04+ or Debian 11+
- Root/sudo access
- Domain name configured

### Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Application Setup

```bash
# Create app directory
sudo mkdir -p /var/www/shamlai-frontend
sudo chown $USER:$USER /var/www/shamlai-frontend

# Clone repository
cd /var/www/shamlai-frontend
git clone https://github.com/your-username/shamlai-frontend.git .

# Install dependencies
npm ci

# Build application
npm run build

# Create .env.production file
nano .env.production
```

### PM2 Configuration

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the command it outputs
```

### Nginx Configuration

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/shamlai-frontend

# Update domain name in config
sudo nano /etc/nginx/sites-available/shamlai-frontend

# Enable site
sudo ln -s /etc/nginx/sites-available/shamlai-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Setup

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Update Application

```bash
cd /var/www/shamlai-frontend
git pull
npm ci
npm run build
pm2 restart shamlai-frontend
```

---

## 🔧 Performance Optimizations

✅ **Already Configured**:

- Database indexes (19 indexes)
- Cache headers in next.config.mjs
- N+1 query fixes
- Parallel data fetching
- Compression enabled
- Nginx caching (VPS)

---

## 📊 Deployment Comparison

| Feature     | Heroku       | VPS            |
| ----------- | ------------ | -------------- |
| Setup Time  | 5 minutes    | 30-60 minutes  |
| Cost        | $7-25/month  | $5-20/month    |
| Scalability | Auto-scaling | Manual scaling |
| SSL         | Automatic    | Let's Encrypt  |
| Monitoring  | Built-in     | PM2 + Custom   |

---

**Last Updated**: January 2025
