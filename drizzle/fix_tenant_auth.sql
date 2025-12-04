-- Fix Tenant Authentication: Check and Create Auth Record
-- IMPORTANT: Supabase Auth > Users is for AGENTS, not tenants!
-- Tenant portal uses the tenant_auth table in PostgreSQL

-- Step 1: Check if tenant exists in tenants table with this email
SELECT id, name, email, property_id, lease_status, user_id
FROM tenants 
WHERE LOWER(TRIM(email)) = 'neuraflow5@gmail.com';

-- Step 2: Check if tenant_auth record exists (for tenant portal login)
-- This is separate from Supabase Auth users!
SELECT id, tenant_id, email, is_active, created_at, last_login_at
FROM tenant_auth 
WHERE LOWER(TRIM(email)) = 'neuraflow5@gmail.com';

-- Step 3: Check tenant_auth record for tenant_id = 11 (from Step 1 result)
SELECT id, tenant_id, email, is_active, created_at, last_login_at
FROM tenant_auth 
WHERE tenant_id = 11;

-- Step 4: Check all tenant_auth records to see what emails exist
SELECT id, tenant_id, email, is_active, created_at 
FROM tenant_auth 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 5: Check all tenants to see the full list
SELECT id, name, email, property_id, lease_status
FROM tenants
ORDER BY created_at DESC
LIMIT 20;

