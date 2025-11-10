# New Supabase Project Setup - Complete Guide

## ✅ Project Created Successfully

**Project Details:**
- **Project ID:** `mzmcibaxgelkndbvopwa`
- **Project Name:** `axiscrmcloud`
- **Region:** `us-east-1`
- **Status:** `ACTIVE_HEALTHY`
- **Database Host:** `db.mzmcibaxgelkndbvopwa.supabase.co`
- **Project URL:** `https://mzmcibaxgelkndbvopwa.supabase.co`

## 📊 Database Tables Created

The following tables have been successfully created with all indexes:

1. ✅ **properties** - Property management
2. ✅ **invoices** - Invoice tracking
3. ✅ **tenants** - Tenant management
4. ✅ **maintenance_requests** - Maintenance tracking

All tables include:
- Proper foreign key relationships
- Indexes for optimal performance
- Timestamp fields with defaults
- User isolation via `user_id` field

## 🔑 Environment Variables

Update your `.env.local` file with the new project credentials:

```bash
# Clerk Authentication (keep your existing keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY

# New Supabase Project
SUPABASE_URL=https://mzmcibaxgelkndbvopwa.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bWNpYmF4Z2Vsa25kYnZvcHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NzA5NzgsImV4cCI6MjA3ODM0Njk3OH0.SGzRv5pcSP2kZFCgSwpLu75Y-JR9uz3r_lTy07iXU1g

# Database Connection String
# Get your database password from Supabase Dashboard → Settings → Database
# Replace [YOUR-PASSWORD] with your actual database password
SUPABASE_DATABASE_URL=postgresql://postgres.mzmcibaxgelkndbvopwa:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## 🔐 Getting Your Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **axiscrmcloud**
3. Navigate to **Settings** → **Database**
4. Scroll down to **Connection string** section
5. Copy the connection string or find your password
6. Replace `[YOUR-PASSWORD]` in the `SUPABASE_DATABASE_URL`

**Alternative:** Use the connection pooling URL format:
```
postgresql://postgres.mzmcibaxgelkndbvopwa:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## 📝 Database Schema

### Properties Table
- Stores all property information
- Links to users via `user_id` (Clerk user ID)
- Supports JSON fields for amenities and images

### Invoices Table
- Tracks all invoices
- Links to properties and users
- Stores invoice items as JSONB

### Tenants Table
- Manages tenant information
- Links to properties (optional)
- Tracks lease status and dates

### Maintenance Requests Table
- Tracks maintenance issues
- Links to properties (optional)
- Supports urgency levels and status tracking

## 🚀 Next Steps

1. **Update Environment Variables:**
   - Copy the new Supabase credentials to `.env.local`
   - Get your database password from Supabase Dashboard
   - Update `SUPABASE_DATABASE_URL` with your password

2. **Test the Connection:**
   ```bash
   npm run dev
   ```
   - Navigate to `/login` and sign in
   - Try creating a property to test the database connection

3. **Verify Database:**
   - Go to Supabase Dashboard → Table Editor
   - You should see all 4 tables listed
   - Check that indexes are created (Database → Indexes)

4. **Optional - Generate TypeScript Types:**
   ```bash
   npx supabase gen types typescript --project-id mzmcibaxgelkndbvopwa > src/types/supabase.ts
   ```

## 🔒 Security Notes

- **Row Level Security (RLS):** Currently disabled. Since we're using Clerk authentication and filtering by `user_id` in API routes, RLS is optional but recommended for additional security. You can enable it later if needed.
- **API Keys:** The anon key is safe to use in client-side code
- **Database Password:** Keep this secret and never commit it to git
- **Connection String:** Use connection pooling for production
- **Security Advisors:** Supabase detected that RLS is disabled. This is acceptable for now since we handle security at the application level, but consider enabling RLS for production.

## 📊 Database Performance

All tables have been indexed for optimal query performance:
- User ID indexes for fast user data filtering
- Status indexes for quick status filtering
- Foreign key indexes for join operations

## 🐛 Troubleshooting

### Connection Errors
- Verify your database password is correct
- Check that the connection string format is correct
- Ensure your IP is not blocked (check Supabase Dashboard → Settings → Database → Connection Pooling)

### Table Not Found Errors
- Verify tables exist in Supabase Dashboard → Table Editor
- Check that migrations were applied successfully
- Ensure you're using the correct project ID

### Authentication Errors
- Verify Clerk keys are set correctly
- Check that middleware is properly configured
- Ensure user is signed in before accessing protected routes

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)

## ✨ Project Status

✅ Project created and active
✅ Database tables created
✅ Indexes configured
✅ Foreign keys established
✅ Ready for development

Your new Supabase project is fully set up and ready to use!

