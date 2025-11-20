# Deployment Fix - API Routes 404 Error

## Problem

The API routes (`/api/auth/signin` and `/api/auth/signup`) are returning 404 on Heroku, even though they exist in the codebase.

## Root Cause

The files are committed to GitHub (`origin/master`) but **not deployed to Heroku yet**. Heroku needs to be updated with the latest code.

## Solution

Push the latest code to Heroku:

```bash
# Make sure you're on the latest commit
git status

# Push to Heroku (this will trigger a rebuild)
git push heroku master

# Or if you're on a different branch:
git push heroku master:master
```

## Verify Deployment

After pushing, check:

1. **Heroku Build Logs:**

   ```bash
   heroku logs --tail
   ```

   Look for the build completing successfully.

2. **Test the Routes:**
   - Try login again: `https://shamlai-app-76b7dcd26c8d.herokuapp.com/login`
   - Check browser DevTools → Network tab
   - The `/api/auth/signin` request should return 200 (not 404)

3. **Check Route Files:**
   The following files should be in the Heroku build:
   - `app/api/auth/signin/route.ts`
   - `app/api/auth/signup/route.ts`
   - `app/api/auth/profile/route.ts`

## Alternative: Manual Heroku Deploy

If `git push heroku` doesn't work, you can:

1. **Trigger a rebuild via Heroku Dashboard:**
   - Go to https://dashboard.heroku.com/apps/shamlai-app
   - Go to "Deploy" tab
   - Click "Deploy Branch" or "Manual Deploy"

2. **Or use Heroku CLI:**
   ```bash
   heroku restart
   ```

## Expected Result

After deployment:

- ✅ `/api/auth/signin` should return 200 (not 404)
- ✅ `/api/auth/signup` should return 200 (not 404)
- ✅ Login form should work
- ✅ Signup form should work

## Current Status

- ✅ Files exist in codebase
- ✅ Files are committed to git
- ✅ Files are pushed to GitHub
- ❌ Files are NOT deployed to Heroku yet ← **This is the issue**

## Next Steps

1. Run: `git push heroku master`
2. Wait for build to complete
3. Test login/signup
4. If still 404, check Heroku build logs for errors
