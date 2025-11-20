# Fix Database Password Authentication Error

## Error
```
password authentication failed for user "postgres"
```

## Cause
The `SUPABASE_DATABASE_URL` in your `.env.local` file has an incorrect password.

## Solution

### Step 1: Get Your Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mzmcibaxgelkndbvopwa)
2. Navigate to **Settings** → **Database**
3. Scroll to **Database password** section
4. You have two options:

   **Option A: Use existing password**
   - If you remember your password, use it
   - If you don't remember it, you'll need to reset it

   **Option B: Reset password**
   - Click **Reset database password**
   - Copy the new password (you won't see it again!)
   - Save it securely

### Step 2: Update `.env.local`

Open `.env.local` in your project root and update the connection string:

**Current (incorrect):**
```bash
SUPABASE_DATABASE_URL=postgresql://postgres.mzmcibaxgelkndbvopwa:WRONG_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Correct format:**
```bash
SUPABASE_DATABASE_URL=postgresql://postgres.mzmcibaxgelkndbvopwa:YOUR_ACTUAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Important:**
- Replace `YOUR_ACTUAL_PASSWORD` with the password from Step 1
- **No brackets** - just the password directly
- Make sure there are **no spaces** around the password
- The password may contain special characters - include them all

### Step 3: Get Connection String from Supabase (Easier Method)

Instead of manually constructing it:

1. In Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **Connection pooling** tab
4. Select **URI** format
5. Copy the connection string
6. It will look like:
   ```
   postgresql://postgres.mzmcibaxgelkndbvopwa:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual password
8. Paste into `.env.local` as `SUPABASE_DATABASE_URL`

### Step 4: Restart Dev Server

After updating `.env.local`:

1. **Stop the server** (Ctrl+C)
2. **Start it again**:
   ```bash
   npm run dev
   ```

### Step 5: Test Connection

Run the diagnostic script:
```bash
npx tsx scripts/check-database-connection.ts
```

This will verify:
- ✅ Connection string format is correct
- ✅ Password is correct
- ✅ Can connect to database
- ✅ Properties table exists

## Common Issues

### Password Contains Special Characters

If your password has special characters like `@`, `#`, `%`, etc., you may need to URL-encode them:

- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

Or use the connection string from Supabase dashboard which handles this automatically.

### Wrong Port

Make sure you're using:
- **Port 6543** for connection pooling (recommended)
- **Port 5432** for direct connection (not recommended for production)

### Wrong Host

For your project, the host should be:
- `aws-0-us-east-1.pooler.supabase.com` (connection pooling)
- `aws-0-us-east-1.pooler.supabase.com` (direct connection)

## Verification

After fixing, you should see:
- ✅ No more "password authentication failed" errors
- ✅ Property listing works
- ✅ Property creation works
- ✅ All API endpoints return proper responses (200/401, not 500)

## Security Note

- ⚠️ Never commit `.env.local` to git (already in `.gitignore`)
- ⚠️ Never share your database password
- ⚠️ Use different passwords for development and production

