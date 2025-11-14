-- Verify that the properties table is now correctly configured
-- Run this in Supabase SQL Editor to confirm the fix

-- 1. Check that the sequence exists and is configured
SELECT 
    sequence_name,
    last_value,
    is_called,
    start_value,
    increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
    AND sequence_name = 'properties_id_seq';

-- 2. Check that id column has the correct default
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'properties'
    AND column_name = 'id';

-- 3. Test insert (this should work now)
INSERT INTO properties (
    user_id, 
    title, 
    address, 
    city, 
    state, 
    zip_code, 
    property_type, 
    status, 
    price, 
    currency
) VALUES (
    'test_verification_user', 
    'Verification Test Property', 
    '123 Test St', 
    'Test City', 
    'Test State', 
    '12345', 
    'residential', 
    'available', 
    100000, 
    'USD'
) RETURNING id, title, created_at;

-- 4. Clean up test data
DELETE FROM properties WHERE user_id = 'test_verification_user';

