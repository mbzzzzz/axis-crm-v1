# Database Fix Instructions

## Problem
The properties table was created with SQLite syntax instead of PostgreSQL syntax, causing Drizzle to try inserting `id` with `default` instead of letting it auto-increment.

## Error
```
Failed query: insert into "properties" ("id", "user_id", ...) values (default, $1, $2, ...)
```

## Solution

### Step 1: Run the Migration
Execute the SQL migration in your Supabase SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mzmcibaxgelkndbvopwa)
2. Navigate to **SQL Editor**
3. Run the migration: `drizzle/0005_fix_properties_serial.sql`

This will:
- Create the `properties_id_seq` sequence if it doesn't exist
- Set the sequence as the default for the `id` column
- Ensure proper SERIAL behavior

### Step 2: Verify Table Structure
Run this query to check the table structure:

```sql
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'properties'
ORDER BY ordinal_position;
```

The `id` column should have:
- `data_type`: `integer`
- `column_default`: Should contain `nextval('properties_id_seq'::regclass)`

### Step 3: Check Sequence
Verify the sequence exists:

```sql
SELECT 
    sequence_name,
    last_value,
    is_called
FROM information_schema.sequences
WHERE sequence_schema = 'public'
    AND sequence_name = 'properties_id_seq';
```

### Step 4: Test Insert
Test that inserts work correctly:

```sql
INSERT INTO properties (
    user_id, title, address, city, state, zip_code, 
    property_type, status, price, currency
) VALUES (
    'test_user', 'Test Property', '123 Test St', 
    'Test City', 'Test State', '12345', 
    'residential', 'available', 100000, 'USD'
) RETURNING id;
```

If this works, the issue is fixed!

## Additional Fixes (If Needed)

### Fix user_id Type (If Still Integer)
If `user_id` is still `integer` instead of `TEXT`:

```sql
-- WARNING: Backup your data first!
ALTER TABLE properties ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
```

### Fix Timestamps (If Still Text)
If `created_at` or `updated_at` are `text` instead of `timestamp`:

```sql
-- WARNING: Backup your data first!
ALTER TABLE properties 
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
    USING created_at::TIMESTAMP WITH TIME ZONE;

ALTER TABLE properties 
    ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE 
    USING updated_at::TIMESTAMP WITH TIME ZONE;
```

### Fix JSONB Columns (If Still Text)
If `amenities` or `images` are `text` instead of `jsonb`:

```sql
-- WARNING: Backup your data first!
ALTER TABLE properties 
    ALTER COLUMN amenities TYPE JSONB 
    USING amenities::JSONB;

ALTER TABLE properties 
    ALTER COLUMN images TYPE JSONB 
    USING images::JSONB;
```

## Quick Fix Script
You can also use the diagnostic script:

```bash
npx tsx scripts/fix-properties-table.ts
```

This will show you exactly what needs to be fixed.

