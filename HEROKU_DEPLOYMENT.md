# Heroku Deployment Guide

This guide will help you deploy the Shamlai Frontend to Heroku.

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://signup.heroku.com/)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure Git is installed and your project is in a Git repository

## Quick Deployment

### Method 1: Using Heroku CLI (Recommended)

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   # Or let Heroku generate a name:
   heroku create
   ```

3. **Set environment variables**
   ```bash
   # Required variables
   heroku config:set NODE_ENV=production
   heroku config:set NEXT_PUBLIC_APP_URL=https://your-app-name.herokuapp.com
   heroku config:set NEXT_PUBLIC_APP_NAME=Shamlai
   heroku config:set NEXT_PUBLIC_INSFORGE_URL=your-insforge-url
   heroku config:set INSFORGE_SERVICE_ROLE_KEY=your-service-role-key
   heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)
   heroku config:set NEXTAUTH_URL=https://your-app-name.herokuapp.com
   heroku config:set NEXT_TELEMETRY_DISABLED=1
   ```

   **Optional but recommended:**
   ```bash
   # Payment integrations
   heroku config:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
   heroku config:set STRIPE_SECRET_KEY=your-stripe-secret
   
   # Analytics
   heroku config:set NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id
   
   # Email service
   heroku config:set SENDGRID_API_KEY=your-sendgrid-key
   heroku config:set SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Deploy to Heroku**
   ```bash
   git push heroku main
   # If your branch is named 'master':
   # git push heroku master
   ```

5. **Open your app**
   ```bash
   heroku open
   ```

### Method 2: Using Heroku Dashboard

1. Go to [dashboard.heroku.com](https://dashboard.heroku.com/)
2. Click "New" → "Create new app"
3. Enter app name and region
4. Go to "Deploy" tab
5. Connect your GitHub repository (or use Heroku Git)
6. Enable automatic deploys (optional)
7. Go to "Settings" tab → "Config Vars" and add all required environment variables
8. Click "Deploy Branch" in the Deploy tab

### Method 3: Deploy Button (One-Click Deploy)

Click the button below to deploy directly to Heroku:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Environment Variables Setup

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `NEXT_PUBLIC_APP_URL` | Your Heroku app URL | `https://your-app.herokuapp.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Shamlai` |
| `NEXT_PUBLIC_INSFORGE_URL` | InsForge backend URL | `https://your-instance.insforge.app` |
| `INSFORGE_SERVICE_ROLE_KEY` | InsForge service key | Your service role key |
| `NEXTAUTH_SECRET` | NextAuth secret | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL for auth | Same as `NEXT_PUBLIC_APP_URL` |

### Optional Variables

Refer to `env.example.txt` for all available environment variables including:
- Payment gateway integration (Stripe, PayPal)
- Delivery services (RedX, Pathao)
- Email services (SendGrid, Resend)
- Analytics (Google Analytics, Facebook Pixel)
- AI/Chatbot features
- And more...

## Post-Deployment Setup

### 1. Verify Deployment
```bash
heroku logs --tail
```

### 2. Check App Status
```bash
heroku ps
```

### 3. Run Database Migrations (if applicable)
```bash
# If you need to seed the database
heroku run npm run seed
```

### 4. Custom Domain (Optional)
```bash
heroku domains:add www.yourdomain.com
```

Then update your DNS records with the provided DNS target.

## Scaling Your App

### Upgrade Dyno Type
```bash
# Upgrade to hobby dyno ($7/month)
heroku dyno:type hobby

# Upgrade to standard dyno
heroku dyno:type standard-1x
```

### Scale Dynos
```bash
# Scale to 2 web dynos
heroku ps:scale web=2
```

## Monitoring & Maintenance

### View Logs
```bash
# Tail logs
heroku logs --tail

# View last 500 lines
heroku logs -n 500

# Filter logs
heroku logs --source app --tail
```

### Restart App
```bash
heroku restart
```

### Run Commands
```bash
heroku run bash
heroku run npm run seed
```

### Add-ons (Optional)

**Papertrail** (Log management):
```bash
heroku addons:create papertrail:choklad
```

**Heroku Redis** (Caching/Rate limiting):
```bash
heroku addons:create heroku-redis:mini
```

**New Relic** (Performance monitoring):
```bash
heroku addons:create newrelic:wayne
```

## Troubleshooting

### Build Failures

1. **Check build logs**:
   ```bash
   heroku logs --tail
   ```

2. **Verify Node version**:
   - Check `engines` in `package.json`
   - Heroku uses Node 18+ by default

3. **Clear build cache**:
   ```bash
   heroku repo:purge_cache -a your-app-name
   git commit --allow-empty -m "Purge cache"
   git push heroku main
   ```

### Application Errors

1. **Check error logs**:
   ```bash
   heroku logs --tail
   ```

2. **Verify environment variables**:
   ```bash
   heroku config
   ```

3. **Test locally with production build**:
   ```bash
   npm run build
   npm start
   ```

### Common Issues

**Issue**: Application not starting
- **Solution**: Verify `Procfile` exists and contains `web: npm run start`

**Issue**: Environment variables not working
- **Solution**: Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access

**Issue**: Build timeout
- **Solution**: Upgrade to a higher dyno tier or optimize build process

## Performance Optimization

### Enable Compression
Already configured in Next.js by default.

### CDN Setup
Consider using a CDN for static assets:
- CloudFlare
- AWS CloudFront
- Fastly

### Database Connection Pooling
If using a database, configure connection pooling to handle multiple requests efficiently.

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] `NEXTAUTH_SECRET` is a strong random value
- [ ] API keys are not exposed in client-side code
- [ ] HTTPS is enabled (automatic on Heroku)
- [ ] CORS settings are configured properly
- [ ] Rate limiting is enabled
- [ ] Error messages don't expose sensitive information

## Continuous Deployment

### GitHub Integration

1. Connect GitHub repo in Heroku dashboard
2. Enable automatic deploys from main branch
3. Enable "Wait for CI to pass" (if using CI/CD)

### GitHub Actions (Alternative)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: akhileshns/heroku-deploy@v3.12.14
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

## Cost Estimation

| Tier | Price | Features |
|------|-------|----------|
| Free | $0/month | 550-1000 dyno hours/month |
| Hobby | $7/month | Always-on, custom domains |
| Standard-1X | $25/month | More RAM, horizontal scaling |
| Standard-2X | $50/month | 2X RAM, better performance |

## Support & Resources

- **Heroku Dev Center**: https://devcenter.heroku.com/
- **Heroku Status**: https://status.heroku.com/
- **Next.js on Heroku**: https://devcenter.heroku.com/articles/deploying-nextjs-with-heroku
- **Heroku Support**: https://help.heroku.com/

## Next Steps

1. Set up a custom domain
2. Configure SSL certificate (automatic with custom domains)
3. Set up monitoring and alerts
4. Configure automated backups
5. Set up staging environment
6. Implement CI/CD pipeline

---

**Need Help?** Check the [Heroku documentation](https://devcenter.heroku.com/) or contact support.

