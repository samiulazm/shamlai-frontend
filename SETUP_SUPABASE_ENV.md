# Supabase Environment Setup

## ✅ Environment Variables Configured

Your Supabase credentials have been set up. The application is now configured to use:

```
NEXT_PUBLIC_SUPABASE_URL=https://bnkphlsfgzzaefxebbkk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 Next Steps

### 1. Create `.env.local` File

Copy the example file and fill in your credentials:

```bash
cp env.example.txt .env.local
```

Or manually create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bnkphlsfgzzaefxebbkk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua3BobHNmZ3p6YWVmeGViYmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjA1NTMsImV4cCI6MjA3OTIzNjU1M30.nMhDSFeuVTNhkICpjGDXFdqXoaN1weKINI-4b4Qg-Lc
```

### 2. Optional: Service Role Key

For server-side operations that bypass RLS, add:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ WARNING:** Never expose the service role key in client-side code!

### 3. Test the Application

Start the development server:

```bash
npm run dev
```

Then test:

- ✅ Login page: http://localhost:3000/login
- ✅ Signup page: http://localhost:3000/signup
- ✅ Dashboard: http://localhost:3000/dashboard (requires login)

## 🔍 Verification

Check that environment variables are loaded:

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_SUPABASE_URL

# Should output:
# https://bnkphlsfgzzaefxebbkk.supabase.co
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- See `MIGRATION_TO_SUPABASE_SSR.md` for detailed migration guide
