# Supabase Setup Review & Fixes

## 🔍 Review Summary (via Composio MCP)

**Date:** 2025-11-12  
**Project ID:** `mzmcibaxgelkndbvopwa`  
**Project Name:** `axiscrmcloud`  
**Region:** `us-east-1`  
**Status:** `ACTIVE_HEALTHY`

### ✅ Health Status
All services are healthy:
- ✅ **Database (db):** ACTIVE_HEALTHY
- ✅ **Storage:** ACTIVE_HEALTHY  
- ✅ **Auth:** ACTIVE_HEALTHY (GoTrue v2.182.1)
- ✅ **REST API:** ACTIVE_HEALTHY
- ✅ **Read-only mode:** Disabled (writes allowed)

### ⚠️ Critical Issues Found

#### 1. **Database Tables Missing**
- **Status:** ❌ No tables found in `public` schema
- **Impact:** Application cannot function without database tables
- **Action Required:** Run database migrations

#### 2. **Storage Bucket Not Verified**
- **Status:** ⚠️ Cannot verify `property-images` bucket exists
- **Impact:** Image uploads will fail
- **Action Required:** Create storage bucket and verify

#### 3. **Environment Variable Naming Inconsistency**
- **Issue:** Documentation shows `SUPABASE_URL` but code uses `NEXT_PUBLIC_SUPABASE_URL`
- **Impact:** Potential configuration errors
- **Action Required:** Standardize environment variable names

## 🔧 Required Fixes

### Fix 1: Run Database Migrations

The database schema needs to be created. Run:

```bash
# Option 1: Using Drizzle Kit (Recommended)
npx drizzle-kit push

# Option 2: Manual SQL execution
# Execute the SQL from drizzle/0002_add_currency_to_properties.sql in Supabase SQL Editor
```

**Required Tables:**
1. `properties` - with `currency` column
2. `invoices`
3. `tenants`
4. `maintenance_requests`

### Fix 2: Create Storage Bucket

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mzmcibaxgelkndbvopwa)
2. Navigate to **Storage** → **Buckets**
3. Click **New bucket**
4. Configure:
   - **Name:** `property-images`
   - **Public:** ✅ Enabled
   - **File size limit:** 5 MB
   - **Allowed MIME types:** `image/jpeg, image/jpg, image/png, image/webp`

### Fix 3: Set Up Storage Policies

After creating the bucket, add RLS policies:

**INSERT Policy:**
```sql
(bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text)
```

**SELECT Policy (Public Read):**
```sql
bucket_id = 'property-images'::text
```

**DELETE Policy:**
```sql
(bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text) AND (storage.foldername(name))[1] = auth.uid()::text
```

### Fix 4: Environment Variables

Ensure `.env.local` has:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mzmcibaxgelkndbvopwa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bWNpYmF4Z2Vsa25kYnZvcHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NzA5NzgsImV4cCI6MjA3ODM0Njk3OH0.SGzRv5pcSP2kZFCgSwpLu75Y-JR9uz3r_lTy07iXU1g

# Database Connection (get password from Supabase Dashboard)
SUPABASE_DATABASE_URL=postgresql://postgres.mzmcibaxgelkndbvopwa:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Note:** The code uses `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`), which is correct for client-side access.

## 📋 Code Fixes Applied

### 1. Fixed Supabase Storage Client Initialization
- Changed from immediate initialization to lazy loading
- Prevents build-time errors when env vars are missing
- File: `src/lib/supabase-storage.ts`

### 2. Fixed Upload API Route
- Uses lazy client initialization
- File: `src/app/api/upload/route.ts`

### 3. Fixed Users API Route
- Removed non-existent `users` table import
- Returns 501 Not Implemented (users managed by Clerk)
- File: `src/app/api/users/route.ts`

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] Database tables exist (check Supabase Dashboard → Table Editor)
- [ ] Storage bucket `property-images` exists and is public
- [ ] Storage policies are configured
- [ ] Environment variables are set correctly
- [ ] Application can connect to database
- [ ] Image uploads work

## 🚀 Next Steps

1. **Run Migrations:**
   ```bash
   npx drizzle-kit push
   ```

2. **Create Storage Bucket:**
   - Follow Fix 2 above

3. **Set Up Storage Policies:**
   - Follow Fix 3 above

4. **Test Connection:**
   ```bash
   npm run dev
   ```
   - Try creating a property
   - Try uploading an image

5. **Verify in Supabase Dashboard:**
   - Check Table Editor for all 4 tables
   - Check Storage for `property-images` bucket
   - Check that policies are active

## 📊 Database Schema Reference

### Properties Table
- Includes `currency` field (default: 'USD')
- Stores images as JSONB array
- All fields properly typed for PostgreSQL

### Foreign Key Relationships
- `invoices.property_id` → `properties.id`
- `tenants.property_id` → `properties.id`
- `maintenance_requests.property_id` → `properties.id`

### Indexes
- User ID indexes for fast filtering
- Status indexes for quick queries
- Foreign key indexes for joins

## 🔒 Security Notes

- **RLS:** Currently disabled (acceptable with Clerk + application-level filtering)
- **Storage:** Uses RLS policies for file access control
- **Authentication:** Clerk handles user authentication
- **Data Isolation:** All queries filtered by `user_id` (Clerk user ID)

## 📝 Additional Notes

- Project is in `us-east-1` region
- Database version: PostgreSQL 17.6.1.038
- All services are healthy and operational
- Connection pooling available via port 6543

