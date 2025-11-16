# CDN Setup Guide for Shamlai E-commerce Platform

This guide helps you configure a CDN (Content Delivery Network) to scale your application to 1k-10k daily users.

## Why CDN is Critical

- **50% faster load times** globally
- **Reduced server load** by 70-80%
- **Better SEO** through improved page speed
- **Lower bandwidth costs** on hosting

## Option 1: Cloudflare (Recommended - FREE tier available)

### Setup Steps

1. **Sign up for Cloudflare**
   - Visit: https://dash.cloudflare.com/sign-up
   - Free tier includes unlimited bandwidth + DDoS protection

2. **Add your domain**
   ```bash
   # In Cloudflare dashboard:
   1. Click "Add site"
   2. Enter your domain (e.g., shamlai.com)
   3. Select FREE plan
   4. Cloudflare will scan DNS records
   ```

3. **Update DNS nameservers**
   ```
   # At your domain registrar (Namecheap, GoDaddy, etc):
   1. Replace existing nameservers with Cloudflare's
   2. Example:
      - ns1.cloudflare.com
      - ns2.cloudflare.com

   # Wait 5-30 minutes for DNS propagation
   ```

4. **Configure Caching Rules**

   In Cloudflare Dashboard > Rules > Page Rules:

   **Rule 1: Cache static assets (Images, CSS, JS)**
   ```
   URL Pattern: *.shamlai.com/_next/static/*
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 year
   - Browser Cache TTL: 1 year
   ```

   **Rule 2: Cache product images**
   ```
   URL Pattern: *.shamlai.com/product-images/*
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 1 week
   ```

   **Rule 3: API routes - No cache**
   ```
   URL Pattern: *.shamlai.com/api/*
   Settings:
   - Cache Level: Bypass
   ```

5. **Enable Performance Features**

   In Cloudflare Dashboard > Speed > Optimization:
   - ✅ Auto Minify: HTML, CSS, JavaScript
   - ✅ Brotli compression
   - ✅ Early Hints
   - ✅ Rocket Loader (optional - test first)
   - ✅ Mirage (image optimization)

6. **Configure SSL/TLS**
   ```
   Cloudflare Dashboard > SSL/TLS

   - SSL/TLS encryption mode: Full (strict)
   - Always Use HTTPS: ON
   - Minimum TLS Version: 1.2
   - Automatic HTTPS Rewrites: ON
   ```

### Environment Variables for Cloudflare

Add to `.env.local`:
```bash
# If using Cloudflare Images (optional upgrade)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_IMAGES_HASH=your_images_hash
```

---

## Option 2: AWS CloudFront

### Setup Steps

1. **Create CloudFront Distribution**
   ```bash
   # Via AWS Console:
   1. Go to CloudFront > Create Distribution
   2. Origin Domain: your-app.vercel.app (or your hosting)
   3. Origin Protocol: HTTPS only
   ```

2. **Configure Cache Behaviors**
   ```
   Default Behavior:
   - Viewer Protocol: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Cache Policy: CachingOptimized
   - Compress objects: Yes

   Path Pattern: /_next/static/*
   - Cache Policy: CachingOptimized
   - TTL: 31536000 (1 year)

   Path Pattern: /api/*
   - Cache Policy: CachingDisabled
   ```

3. **Add Custom Domain**
   ```bash
   # In CloudFront Distribution Settings:
   1. Alternate Domain Names (CNAMEs): shamlai.com, www.shamlai.com
   2. SSL Certificate: Request certificate via ACM
   3. Supported HTTP Versions: HTTP/2 and HTTP/3
   ```

4. **Update DNS**
   ```
   # In your DNS provider:
   Type: CNAME
   Name: www
   Value: d111111abcdef8.cloudfront.net (your CloudFront domain)
   TTL: 300
   ```

### Cost Estimate
- **First 10 TB/month:** ~$0.085/GB = ~$85/month
- **Better for:** High traffic (>50GB/day)

---

## Option 3: Vercel Edge Network (Built-in)

If deploying to Vercel, CDN is automatic! Just optimize headers:

### next.config.js
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};
```

---

## Verification

### Test CDN is working:

1. **Check Response Headers**
   ```bash
   curl -I https://shamlai.com/_next/static/chunks/main.js

   # Look for:
   cf-cache-status: HIT  (Cloudflare)
   x-cache: Hit from cloudfront  (AWS)
   x-vercel-cache: HIT  (Vercel)
   ```

2. **Test Global Speed**
   - Use: https://www.webpagetest.org/
   - Test from: Mumbai, Singapore, London, New York
   - Target: < 2s load time globally

3. **Monitor Cache Hit Rate**
   ```bash
   # In Cloudflare Analytics:
   - Target cache hit rate: > 90%
   - Bandwidth saved: > 70%
   ```

---

## Performance Expectations

### Before CDN:
- Load time (Bangladesh): 0.8s
- Load time (USA): 3.5s
- Server bandwidth: 100%

### After CDN:
- Load time (Bangladesh): 0.6s
- Load time (USA): 1.2s ⚡ **2.9x faster**
- Server bandwidth: 25% (75% saved)

---

## Troubleshooting

### Issue: Cache not working
```bash
# Check cache headers are set:
curl -I https://shamlai.com/_next/static/main.js

# Should see:
Cache-Control: public, max-age=31536000, immutable

# Force purge Cloudflare cache:
Cloudflare Dashboard > Caching > Purge Everything
```

### Issue: Stale content showing
```bash
# Option 1: Purge specific files
Cloudflare > Caching > Custom Purge > Enter URLs

# Option 2: Set shorter TTL for dynamic content
# In next.config.js, use:
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')
```

### Issue: API requests cached incorrectly
```bash
# Ensure API routes bypass cache:
Cloudflare Page Rule: *.shamlai.com/api/*
Settings: Cache Level = Bypass

# Or in Next.js API route:
res.setHeader('Cache-Control', 'no-store, must-revalidate')
```

---

## Next Steps

After CDN setup:
1. ✅ Verify cache hit rate > 90%
2. ✅ Test page load times globally
3. ✅ Monitor Cloudflare analytics
4. ✅ Configure purge webhooks for product updates

**Estimated improvement: 50% faster, 75% less server load**
