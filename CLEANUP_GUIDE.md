# 🧹 Cleanup Guide - Remove Old Insforge Files

## Files to Remove (Optional)

After verifying the application works correctly with Supabase, you can optionally remove the old Insforge files:

### 1. Old Insforge Directory

The `lib/insforge/` directory contains legacy files that are no longer needed:

```bash
# Remove the entire directory
rm -rf lib/insforge
```

**Files in this directory:**

- `lib/insforge/client-manager.ts`
- `lib/insforge/index.ts`
- `lib/insforge/migration-runner.ts`
- `lib/insforge/query-optimizer.ts`
- `lib/insforge/realtime-manager.ts`
- `lib/insforge/rpc-functions.ts`
- `lib/insforge/storage-helper.ts`

### 2. Old Insforge Client File

The `lib/insforge.ts` file is kept for backwards compatibility. You can remove it if:

- ✅ All code has been migrated to use `lib/supabase.ts`
- ✅ Application is tested and working
- ✅ No references remain

```bash
# Remove the old file
rm lib/insforge.ts
```

### 3. Update Imports

After removing files, check for any remaining imports:

```bash
# Search for any remaining imports
grep -r "from.*insforge" app/ lib/
```

## ⚠️ Before Removing

1. ✅ **Test thoroughly** - Make sure everything works
2. ✅ **Check for references** - Search for any `insforge` imports
3. ✅ **Backup** - Create a backup before removing files
4. ✅ **Commit changes** - Save your work before cleanup

## 📝 Recommended Approach

1. **Keep files temporarily** - Leave them during initial testing
2. **Remove after verification** - Delete after confirming everything works
3. **Update documentation** - Remove references in README files

## ✅ Cleanup Checklist

- [ ] Application tested and working
- [ ] No `insforge` imports found in active code
- [ ] Backup created
- [ ] Changes committed
- [ ] Remove `lib/insforge/` directory
- [ ] Remove `lib/insforge.ts` (optional)
- [ ] Update documentation

## 🔍 Verification

After cleanup, verify:

```bash
# Should return no results
grep -r "from.*@/lib/insforge" app/ lib/
grep -r "from.*insforge" app/ lib/
```

## 📚 Files to Keep

**DO NOT remove:**

- `lib/supabase.ts` - Main Supabase client
- `utils/supabase/*` - SSR utilities
- Service files - All updated to use Supabase
