# Heroku Quick Start Guide

## 🚀 5-Minute Deployment

### Prerequisites
- Heroku account (free at [heroku.com](https://signup.heroku.com))
- Heroku CLI installed
- Git repository initialized

### Quick Deploy Commands

```bash
# 1. Login to Heroku
heroku login

# 2. Create app
heroku create your-app-name

# 3. Set required environment variables
heroku config:set \
  NODE_ENV=production \
  NEXT_PUBLIC_APP_URL=https://your-app-name.herokuapp.com \
  NEXT_PUBLIC_INSFORGE_URL=your-insforge-url \
  INSFORGE_SERVICE_ROLE_KEY=your-key \
  NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  NEXTAUTH_URL=https://your-app-name.herokuapp.com

# 4. Deploy
git push heroku main

# 5. Open your app
heroku open
```

## 🎯 Essential Commands

### Deployment
```bash
heroku create                  # Create new app
git push heroku main          # Deploy code
heroku restart                # Restart app
```

### Monitoring
```bash
heroku logs --tail            # Stream logs
heroku ps                     # Check dyno status
heroku apps:info              # App information
```

### Configuration
```bash
heroku config                 # List all config vars
heroku config:set KEY=value   # Set config var
heroku config:unset KEY       # Remove config var
```

### Scaling
```bash
heroku ps:scale web=1         # Scale web dynos
heroku dyno:type hobby        # Upgrade dyno type
```

### Database & Add-ons
```bash
heroku addons                 # List add-ons
heroku addons:create papertrail:choklad  # Add logging
heroku addons:create heroku-redis:mini   # Add Redis
```

### Troubleshooting
```bash
heroku logs --tail --num 500  # View recent logs
heroku run bash               # Open terminal
heroku restart                # Restart app
```

## 📋 Pre-Deployment Checklist

- [ ] Heroku CLI installed
- [ ] Logged into Heroku (`heroku login`)
- [ ] Git repository initialized
- [ ] Required files exist:
  - [ ] `Procfile`
  - [ ] `app.json`
  - [ ] `package.json` with build scripts
- [ ] Environment variables ready:
  - [ ] `NEXT_PUBLIC_INSFORGE_URL`
  - [ ] `INSFORGE_SERVICE_ROLE_KEY`
  - [ ] Other optional variables
- [ ] Code committed to Git

## 🎬 Automated Deploy Script

**Linux/Mac:**
```bash
chmod +x deploy-to-heroku.sh
./deploy-to-heroku.sh
```

**Windows (PowerShell):**
```powershell
.\deploy-to-heroku.ps1
```

## 🔑 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `https://yourapp.herokuapp.com` |
| `NEXT_PUBLIC_INSFORGE_URL` | Backend URL | `https://your.insforge.app` |
| `INSFORGE_SERVICE_ROLE_KEY` | Backend key | Your service key |
| `NEXTAUTH_SECRET` | Auth secret | Random 32-char string |
| `NEXTAUTH_URL` | Auth URL | Same as APP_URL |

## 💡 Tips

1. **Free Tier**: Start with free tier, upgrade as needed
2. **Auto-Sleep**: Free dynos sleep after 30 minutes of inactivity
3. **Always On**: Use Hobby dyno ($7/month) to prevent sleeping
4. **Logs**: Use Papertrail add-on for better log management
5. **SSL**: Automatic HTTPS on all Heroku apps
6. **Custom Domain**: Easy to add in dashboard or CLI

## 🆘 Common Issues & Solutions

**Problem**: Build fails
```bash
# Solution: Check build logs
heroku logs --tail --source app
```

**Problem**: App crashes on startup
```bash
# Solution: Check for missing environment variables
heroku config
heroku logs --tail
```

**Problem**: 503 Service Unavailable
```bash
# Solution: Check dyno status and restart
heroku ps
heroku restart
```

**Problem**: Changes not reflected
```bash
# Solution: Clear cache and redeploy
heroku repo:purge_cache
git commit --allow-empty -m "Rebuild"
git push heroku main
```

## 🔗 Useful Links

- [Heroku Dashboard](https://dashboard.heroku.com/)
- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Heroku Status](https://status.heroku.com/)
- [Full Documentation](./HEROKU_DEPLOYMENT.md)

## 📞 Need Help?

See [HEROKU_DEPLOYMENT.md](./HEROKU_DEPLOYMENT.md) for comprehensive guide.

---

**Deploy in 5 minutes! 🚀**

