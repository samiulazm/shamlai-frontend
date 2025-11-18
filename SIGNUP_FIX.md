# Signup Fix - Redis Integration Issue

## Problem

Signup was not working after implementing Redis database, showing error: "An unexpected error occurred during OAuth initialization"

## Root Causes

### 1. Missing Environment Configuration

- No `.env.local` file was present
- Missing `NEXT_PUBLIC_INSFORGE_URL` configuration
- Redis environment variables not configured

### 2. ioredis Client-Side Bundling Issue

- The `ioredis` package (server-only) was being included in client-side bundles
- This caused initialization errors when the signup page (client component) loaded
- Even though signup doesn't directly use Redis, service imports were pulling it in

## Solution Applied

### 1. Created `.env.local` file

Created a proper environment configuration with:

- InsForge URL configuration
- Redis variables commented out (not required for basic signup)
- Development-friendly defaults

### 2. Updated `next.config.mjs`

Added ioredis exclusion to webpack configuration:

```javascript
if (!isServer) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    // Exclude Redis from client bundles (server-only)
    ioredis: false,
  };

  // Prevent ioredis from being bundled
  config.externals = config.externals || [];
  config.externals.push({
    ioredis: 'ioredis',
  });
}
```

### 3. Existing Safeguards Already in Place

The codebase already had these safety measures:

- [lib/redis/client.ts:24-26](lib/redis/client.ts#L24-L26) - Throws error if Redis is used client-side
- [lib/redis/client.ts:76-78](lib/redis/client.ts#L76-L78) - Mock Redis client for development
- [lib/insforge.ts:30-37](lib/insforge.ts#L30-L37) - Fallback for missing service role key

## Testing

### Test the Fix

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/signup (or :3001 if 3000 is in use)

3. Try signing up with:
   - Email/password signup
   - OAuth signup (Google/GitHub)

4. Check browser console for errors

### What Should Work Now

- ✅ Signup page loads without errors
- ✅ Email/password signup works
- ✅ OAuth initialization works
- ✅ No Redis errors in browser console
- ✅ No ioredis module errors

## Configuration Options

### Option 1: Run without Redis (Current Setup)

The app will work fine without Redis configured. The Redis client falls back to a mock implementation in development.

### Option 2: Add Redis Later

When ready to add Redis for caching and performance:

1. Sign up for Upstash (https://upstash.com/) - free tier available
2. Add to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   ```
3. Restart the dev server

## Important Notes

- Redis is **optional** for signup functionality
- Redis is used for caching and rate limiting only
- The app gracefully handles missing Redis configuration
- All Redis imports use dynamic imports to prevent client-side bundling

## Related Files Changed

- [.env.local](.env.local) - Created (new file)
- [next.config.mjs](next.config.mjs#L158-L176) - Updated webpack config

## Related Commits

This fix addresses issues from:

- `39f5658` - Fix 500 error on signup by making INSFORGE_SERVICE_ROLE_KEY optional
- `ece9a51` - Fix Heroku build failure by preventing ioredis from client-side bundles
