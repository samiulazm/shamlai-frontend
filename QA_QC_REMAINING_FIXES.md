# QA/QC - Remaining Logger Format Fixes

## Status: In Progress

### Files Needing Logger Format Updates:

1. **lib/services/marketing.ts** - 15 logger.error calls with colon format
2. **lib/services/shop.ts** - 20 logger.error calls with colon format  
3. **lib/services/cart.ts** - 9 logger.error calls (mostly fixed, verify)

### Pattern to Fix:

**Old Format:**
```typescript
logger.error('Error message:', error);
```

**New Format:**
```typescript
logger.error('Error message', error instanceof Error ? error : new Error(String(error)), {
  context: 'value',
});
```

### Console Statements in Application Code:

The following files have console.log/console.error that should be reviewed:
- `app/(dashboard)/dashboard/page.tsx` - console.error
- `app/(dashboard)/layout.tsx` - console.error  
- `app/(dashboard)/categories/page.tsx` - console.error
- `app/(dashboard)/orders/new/page.tsx` - console.error
- `app/(auth)/demo/page.tsx` - console.log/error (acceptable for demo)
- `app/(storefront)/[shop]/layout.tsx` - console.error
- `app/(auth)/login/page.tsx` - console.log/error
- `app/(dashboard)/products/[id]/page.tsx` - console.error
- `app/(dashboard)/products/new/page.tsx` - console.error
- `app/(dashboard)/theme/page.tsx` - console.error
- `app/(dashboard)/customers/page.tsx` - console.error
- `app/(auth)/signup/page.tsx` - console.log/error
- `app/(dashboard)/products/page.tsx` - console.error
- `app/(dashboard)/shop/page.tsx` - console.error
- `components/Topbar.tsx` - console.log/error

**Note:** Console statements in scripts (seed-data.ts, create-test-user.ts) and logger.ts itself are acceptable.

