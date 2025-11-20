# Production Demo Account Setup

## ✅ Status

The demo account **exists** on your backend (`http://119.40.88.49:7130`):
- ✅ User: `test@shamlai.com` 
- ✅ Password: `Test123456!`
- ✅ Shop Settings: Created (Shop ID: `18043010`)
- ✅ Login: Working

## 🔧 Issue

Your production site (`https://shamlai.co`) is showing "Demo Login Failed" because:

**The production environment is not configured with the correct backend URL.**

## 🚀 Solution

### Step 1: Set Environment Variable in Production

Make sure your production deployment has this environment variable set:

```bash
NEXT_PUBLIC_INSFORGE_URL=http://119.40.88.49:7130
```

### Step 2: Where to Set This

**If using Vercel:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add: `NEXT_PUBLIC_INSFORGE_URL` = `http://119.40.88.49:7130`
4. Redeploy your application

**If using other hosting:**
- Set the environment variable in your hosting platform's settings
- Restart/redeploy your application

### Step 3: Verify

After redeploying, visit `https://shamlai.co/demo` and it should:
1. ✅ Successfully log in with the demo account
2. ✅ Redirect to the demo shop storefront

## 📝 Additional Notes

- The demo account credentials are:
  - **Email:** `test@shamlai.com`
  - **Password:** `Test123456!`
  
- The account has shop settings configured with:
  - Shop ID: `18043010`
  - Shop Name: "Demo E-Commerce Store"
  - Subdomain: `demo-shop`

- If you need to recreate the account, run:
  ```bash
  NEXT_PUBLIC_INSFORGE_URL=http://119.40.88.49:7130 npx tsx scripts/create-test-user.ts
  ```

## 🔍 Troubleshooting

If the demo still doesn't work after setting the environment variable:

1. **Check browser console** for errors
2. **Verify the backend is accessible** from your production server
3. **Check CORS settings** on your InsForge backend
4. **Verify the environment variable** is actually set in production (check build logs)

## ✅ Quick Test

To test locally with the production backend:

```bash
NEXT_PUBLIC_INSFORGE_URL=http://119.40.88.49:7130 npm run dev
```

Then visit `http://localhost:3000/demo` - it should work!

