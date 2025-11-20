# Troubleshooting Guide - Login/Signup/Database Issues

## 🔴 "Failed to fetch" Error

This error indicates a **network connectivity issue** between your frontend and backend.

### Common Causes:

1. **CORS (Cross-Origin Resource Sharing) Issue**
   - Backend doesn't allow requests from your domain
   - Solution: Configure CORS on your InsForge backend to allow `https://shamlai.co`

2. **Backend Not Accessible**
   - Backend URL might be incorrect
   - Backend server might be down
   - Network firewall blocking the connection

3. **Missing Anon Key**
   - Client-side operations may require an anon key
   - Solution: Add `NEXT_PUBLIC_INSFORGE_ANON_KEY` to your environment variables

### Solutions:

#### 1. Add Anon Key to Environment Variables

**In Heroku:**

1. Go to Settings → Config Vars
2. Add: `NEXT_PUBLIC_INSFORGE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTMwMzh9.QGgkpv-M-1bkM9YULuwA1O6fLTljLnI1715xeVFnsuU`
3. Redeploy your app

**In Local Development:**
Add to `.env.local`:

```bash
NEXT_PUBLIC_INSFORGE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTMwMzh9.QGgkpv-M-1bkM9YULuwA1O6fLTljLnI1715xeVFnsuU
```

#### 2. Check Backend Accessibility

Test if the backend is reachable:

```bash
curl http://119.40.88.49:7130/health
```

Or use the test script:

```bash
npx tsx scripts/test-backend-connection.ts
```

#### 3. Verify Environment Variables

Make sure these are set in production:

- ✅ `NEXT_PUBLIC_INSFORGE_URL` = `http://119.40.88.49:7130`
- ✅ `NEXT_PUBLIC_INSFORGE_ANON_KEY` = (anon key from above)
- ✅ `INSFORGE_API_KEY` = (your API key)

#### 4. Check Browser Console

Open browser DevTools (F12) and check:

- **Console tab**: Look for specific error messages
- **Network tab**: Check if requests to `http://119.40.88.49:7130` are being made
- Look for CORS errors in red

#### 5. CORS Configuration

If you control the InsForge backend, ensure CORS is configured to allow:

- `https://shamlai.co`
- `https://www.shamlai.co`
- `http://localhost:3000` (for development)

## 🔍 Debugging Steps

1. **Test Backend Connection:**

   ```bash
   npx tsx scripts/test-backend-connection.ts
   ```

2. **Check Environment Variables:**
   - Verify they're set in Heroku
   - Restart/redeploy after adding new variables

3. **Check Browser Network Tab:**
   - Open DevTools → Network
   - Try to login
   - Look for failed requests to the backend
   - Check the error details

4. **Verify Backend is Running:**
   - Test with curl or Postman
   - Check backend logs

## ✅ Quick Fix Checklist

- [ ] `NEXT_PUBLIC_INSFORGE_URL` is set correctly
- [ ] `NEXT_PUBLIC_INSFORGE_ANON_KEY` is set (NEW - required)
- [ ] App has been restarted/redeployed after setting env vars
- [ ] Backend is accessible from your network
- [ ] CORS is configured on backend
- [ ] No firewall blocking the connection

## 📝 Current Configuration

**Backend URL:** `http://119.40.88.49:7130`  
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTMwMzh9.QGgkpv-M-1bkM9YULuwA1O6fLTljLnI1715xeVFnsuU`

Add the anon key to your Heroku config vars and redeploy!
