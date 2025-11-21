# 🧪 Application Testing Checklist

## ✅ Pre-Testing Setup

- [x] Environment variables configured
- [x] Supabase credentials set in `.env.local`
- [x] TypeScript errors fixed
- [x] All `.database` references removed
- [x] SSR utilities created and configured

## 📋 Testing Checklist

### 1. Environment Setup ✅

- [x] Verify `.env.local` exists with Supabase credentials
- [ ] Start development server: `npm run dev`
- [ ] Check that application loads without errors

### 2. Authentication Testing

#### Login Flow

- [ ] Navigate to `/login`
- [ ] Test email/password login
- [ ] Verify redirect to dashboard after successful login
- [ ] Check that session is persisted in cookies

#### Signup Flow

- [ ] Navigate to `/signup`
- [ ] Create new account
- [ ] Verify shop creation via `/api/auth/complete-signup`
- [ ] Test auto-login after signup

#### Password Reset

- [ ] Navigate to `/reset-password`
- [ ] Request password reset email
- [ ] Verify email link works
- [ ] Test password update on `/update-password`

#### Session Management

- [ ] Verify session persists on page refresh
- [ ] Test session refresh in middleware
- [ ] Test logout functionality
- [ ] Verify redirect to login when session expires

### 3. Dashboard Testing

- [ ] Access `/dashboard` (requires login)
- [ ] Verify user data loads correctly
- [ ] Check shop settings display
- [ ] Test navigation between dashboard pages

### 4. Database Operations

#### Products

- [ ] View products list
- [ ] Create new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] Upload product images

#### Orders

- [ ] View orders list
- [ ] Create new order
- [ ] Update order status
- [ ] View order details

#### Customers

- [ ] View customers list
- [ ] View customer details
- [ ] Test customer filtering

### 5. API Routes Testing

Test all API endpoints:

- [ ] `POST /api/auth/signin` - Login
- [ ] `POST /api/auth/signup` - Signup
- [ ] `GET /api/auth/user` - Get current user
- [ ] `POST /api/auth/profile` - Update profile
- [ ] `GET /api/products` - List products
- [ ] `GET /api/cart` - Get cart
- [ ] `POST /api/cart` - Add to cart
- [ ] `GET /api/orders` - List orders

### 6. SSR Testing

- [ ] Test Server Components render correctly
- [ ] Verify cookies are handled properly
- [ ] Test middleware session refresh
- [ ] Check that Server Components have access to user data

### 7. Client Components Testing

- [ ] Test client-side authentication
- [ ] Verify real-time subscriptions work
- [ ] Test client-side database queries
- [ ] Check that client components update correctly

### 8. Error Handling

- [ ] Test invalid credentials
- [ ] Test network errors
- [ ] Test expired sessions
- [ ] Verify error messages display correctly

### 9. Performance Testing

- [ ] Check initial page load time
- [ ] Test API response times
- [ ] Verify caching works correctly
- [ ] Test database query performance

### 10. Security Testing

- [ ] Verify cookies are httpOnly and secure
- [ ] Test RLS policies (if enabled)
- [ ] Verify service role key is not exposed
- [ ] Test CSRF protection

## 🚀 Quick Test Commands

```bash
# Type check
npm run type-check

# Build application
npm run build

# Start development server
npm run dev

# Run tests (if available)
npm test
```

## 📝 Test Results

Document any issues found during testing:

### Issues Found:

- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

### Resolved:

- [ ] Issue resolved
- [ ] Issue resolved

## ✅ Testing Status

- [ ] All tests passed
- [ ] Ready for production
- [ ] Documentation updated
