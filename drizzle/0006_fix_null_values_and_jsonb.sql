-- Fix null values and JSONB fields in properties table
-- This migration fixes:
-- 1. Empty description strings to be null
-- 2. String representations of JSONB arrays to proper JSONB

-- Step 1: Fix empty description strings to null
UPDATE properties
SET description = NULL
WHERE description = '';

-- Step 2: Fix amenities if stored as string instead of JSONB
-- Check if amenities is stored as text string '[]' and convert to proper JSONB
UPDATE properties
SET amenities = '[]'::jsonb
WHERE amenities::text = '"[]"' OR amenities::text = '[]';

-- Step 3: Fix images if stored as string instead of JSONB
-- Check if images is stored as text string '[]' and convert to proper JSONB
UPDATE properties
SET images = '[]'::jsonb
WHERE images::text = '"[]"' OR images::text = '[]';

-- Step 4: Verify the fixes
-- Run this query to check results:
-- SELECT id, description, amenities, images FROM properties;

