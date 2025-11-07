# Test User Credentials

## Default Test Account

**Email:** `test@shamlai.com`  
**Password:** `Test123456!`

**User Type:** Shop Owner  
**Shop Name:** Test Shop

---

## How to Create the Test User

### Option 1: Run the Creation Script (Recommended)

```bash
cd shamlai-frontend
npx tsx scripts/create-test-user.ts
```

This will automatically:
- ✅ Create the test user account
- ✅ Set up user profile
- ✅ Create shop settings
- ✅ Display login credentials

### Option 2: Manual Creation via Frontend

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to signup page: `http://localhost:3000/signup`

3. Create account with:
   - Email: `test@shamlai.com`
   - Password: `Test123456!`

### Option 3: Create via Code

Add this to any page or component:

```typescript
import { insforgeClient } from '@/lib/insforge';

const createTestUser = async () => {
  const { data, error } = await insforgeClient.auth.signUp({
    email: 'test@shamlai.com',
    password: 'Test123456!'
  });

  if (error) {
    console.error('Signup failed:', error);
    return;
  }

  console.log('User created:', data.user);
};
```

---

## Additional Test Users

You can create more test users with different roles:

### Test Customer
- **Email:** `customer@shamlai.com`
- **Password:** `Customer123!`
- **Role:** Customer (no shop)

### Test Admin
- **Email:** `admin@shamlai.com`
- **Password:** `Admin123456!`
- **Role:** Shop Owner with admin privileges

---

## Login URL

**Development:** `http://localhost:3000/login`  
**Production:** Your deployed URL + `/login`

---

## OAuth Testing

InsForge has Google and GitHub OAuth enabled. You can also test login with:

- 🔵 **Google OAuth** - Click "Sign in with Google"
- 🐙 **GitHub OAuth** - Click "Sign in with GitHub"

---

## Quick Login Test

Use this code snippet to test login:

```typescript
import { insforgeClient } from '@/lib/insforge';

// Login
const { data, error } = await insforgeClient.auth.signInWithPassword({
  email: 'test@shamlai.com',
  password: 'Test123456!'
});

if (data) {
  console.log('Logged in:', data.user);
  
  // Get user profile
  const { data: userData } = await insforgeClient.auth.getCurrentUser();
  console.log('User data:', userData);
}
```

---

## Troubleshooting

### "User already exists" Error
This means the test user has already been created. Just use the credentials to login.

### "Invalid credentials" Error
Make sure you're using the exact credentials:
- Email: `test@shamlai.com`
- Password: `Test123456!`

### Can't login?
1. Check that your frontend is running (`npm run dev`)
2. Verify the InsForge URL in `.env.local`
3. Try creating the user again with the script

---

## Security Note

⚠️ **These are test credentials for development only!**

- Never use these in production
- Always create secure passwords for real users
- Delete test accounts before deploying to production

---

## What Gets Created

When you create a test user, the following is automatically set up:

1. **User Account** in `users` table
   - ID, email, role, encrypted password

2. **User Profile** 
   - Nickname: "Test User"
   - Bio: "Test account for development"

3. **Shop Settings** in `shop_settings` table
   - Shop name: "Test Shop"
   - Default currency: USD
   - All features enabled

---

## Next Steps After Creating User

1. **Login** with the credentials
2. **Add Products** to your test shop
3. **Test Cart** functionality
4. **Place Test Orders**
5. **Test Admin Features**

Enjoy testing! 🚀





