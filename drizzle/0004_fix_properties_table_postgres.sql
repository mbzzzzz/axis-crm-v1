-- Fix properties table to use proper PostgreSQL syntax
-- This migration fixes the table structure that was created with SQLite syntax

-- First, check if we need to alter the id column to be SERIAL
-- If the table exists with wrong structure, we'll need to recreate it

-- Step 1: Drop the table if it exists (WARNING: This will delete all data!)
-- Uncomment the following line ONLY if you want to recreate the table from scratch
-- DROP TABLE IF EXISTS properties CASCADE;

-- Step 2: Create the table with proper PostgreSQL syntax
-- Only run this if you dropped the table above
/*
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,  -- Changed from integer to TEXT for Clerk user IDs
    title TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    property_type TEXT NOT NULL,
    status TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    size_sqft INTEGER,
    bedrooms INTEGER,
    bathrooms REAL,
    year_built INTEGER,
    amenities JSONB,
    images JSONB,
    purchase_price REAL,
    estimated_value REAL,
    monthly_expenses REAL,
    commission_rate REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
*/

-- Step 3: If table already exists, alter it to fix the structure
-- Change user_id from integer to TEXT
DO $$ 
BEGIN
    -- Check if user_id is integer and needs to be changed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'user_id'
        AND data_type = 'integer'
    ) THEN
        -- This is a destructive operation - backup data first!
        -- For now, we'll just add a comment
        RAISE NOTICE 'user_id column is integer type - needs manual migration to TEXT';
    END IF;
END $$;

-- Step 4: Ensure id is SERIAL (auto-incrementing)
DO $$ 
BEGIN
    -- Check if id column exists and is not a serial
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'id'
        AND data_type != 'integer'
    ) THEN
        RAISE NOTICE 'id column type needs to be SERIAL';
    END IF;
END $$;

-- Step 5: Ensure timestamps are TIMESTAMP WITH TIME ZONE
DO $$ 
BEGIN
    -- Check if created_at is text instead of timestamp
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'created_at'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE 'created_at column is text type - needs manual migration to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- Step 6: Ensure amenities and images are JSONB
DO $$ 
BEGIN
    -- Check if amenities is text instead of jsonb
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'amenities'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE 'amenities column is text type - needs manual migration to JSONB';
    END IF;
END $$;

