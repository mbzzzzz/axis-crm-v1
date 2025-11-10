# Migration Guide: Better-Auth to Clerk + Supabase

This guide documents the migration from better-auth with Turso (SQLite) to Clerk authentication with Supabase (PostgreSQL).

## ✅ Completed Steps

### 1. Database Migration
- ✅ Created PostgreSQL schema in `src/db/schema-postgres.ts`
- ✅ Created all tables in Supabase:
  - `properties`
  - `invoices`
  - `tenants`
  - `maintenance_requests`
- ✅ Updated database connection in `src/db/index.ts` to use Supabase PostgreSQL
- ✅ Updated `drizzle.config.ts` to use PostgreSQL dialect

### 2. Authentication Migration
- ✅ Installed `@clerk/nextjs` package
- ✅ Updated `middleware.ts` to use `clerkMiddleware()`
- ✅ Wrapped app with `<ClerkProvider>` in `src/app/layout.tsx`
- ✅ Created new `src/lib/auth-client.ts` using Clerk hooks
- ✅ Updated `src/lib/auth.ts` to export Clerk's `auth` and `currentUser`

### 3. Component Updates
- ✅ Updated `src/app/(dashboard)/layout.tsx` to use Clerk's `SignOutButton`
- ✅ Updated `src/components/app-sidebar.tsx` to use Clerk's `SignOutButton`
- ✅ Replaced login page with Clerk's `<SignIn>` component
- ✅ Created register page with Clerk's `<SignUp>` component

### 4. API Routes Migration
- ✅ Updated `src/app/api/properties/route.ts` to use Clerk auth
- ✅ Updated `src/app/api/invoices/route.ts` to use Clerk auth
- ✅ Updated `src/app/api/tenants/route.ts` to use Clerk auth
- ✅ Updated `src/app/api/maintenance/route.ts` to use Clerk auth

## 🔧 Required Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY

# Supabase Database
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wgltfxvdbxvfypomirza.supabase.co:5432/postgres
SUPABASE_URL=https://wgltfxvdbxvfypomirza.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### Getting Your Keys

1. **Clerk Keys:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Create a new application or select existing one
   - Go to API Keys section
   - Copy `Publishable Key` and `Secret Key`

2. **Supabase Database URL:**
   - Go to your Supabase project settings
   - Navigate to Database settings
   - Find the connection string under "Connection string"
   - Replace `[YOUR-PASSWORD]` with your database password

3. **Supabase Anon Key:**
   - Already provided: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbHRmeHZkYnh2Znlwb21pcnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTI3MDIsImV4cCI6MjA3Njk4ODcwMn0.2Qu86mDEJTYUzqTfF_xQL0GCMO0ZjLiQr9CA_9Krhrg`

## 🚀 Next Steps

1. **Set up Clerk:**
   - Create a Clerk account at https://clerk.com
   - Create a new application
   - Configure authentication methods (email/password, social, etc.)
   - Copy your keys to `.env.local`

2. **Configure Clerk Routes:**
   - In Clerk Dashboard, go to Paths
   - Set Sign-in path: `/login`
   - Set Sign-up path: `/register`
   - Set After sign-in URL: `/dashboard`
   - Set After sign-up URL: `/dashboard`

3. **Test the Migration:**
   - Start the development server: `npm run dev`
   - Navigate to `/register` to create a new account
   - Navigate to `/login` to sign in
   - Verify that dashboard loads correctly
   - Test creating properties, invoices, tenants, and maintenance requests

## 📝 Important Notes

- **User IDs:** Clerk uses text-based user IDs (e.g., `user_2abc123`), which is compatible with our schema that uses `TEXT` for `user_id` fields
- **Session Management:** Clerk handles sessions automatically - no need for manual token management
- **Database:** All data is now stored in Supabase PostgreSQL instead of Turso SQLite
- **Auth Routes:** The old `/api/auth/[...all]` route is no longer needed - Clerk handles all auth endpoints

## 🔄 Breaking Changes

1. **Authentication Flow:**
   - Old: Custom email/password with better-auth
   - New: Clerk-managed authentication with customizable UI

2. **Session Management:**
   - Old: Manual bearer token management in localStorage
   - New: Automatic session management by Clerk

3. **User Object:**
   - Old: Custom user object from better-auth
   - New: Clerk user object with different structure

## 🐛 Troubleshooting

### "Unauthorized" errors in API routes
- Ensure Clerk middleware is properly configured
- Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set correctly
- Verify user is signed in by checking Clerk dashboard

### Database connection errors
- Verify `SUPABASE_DATABASE_URL` is correct
- Check that database password is properly URL-encoded
- Ensure Supabase project is active and healthy

### Login/Register pages not showing
- Check that Clerk components are properly imported
- Verify Clerk publishable key is set
- Check browser console for errors

