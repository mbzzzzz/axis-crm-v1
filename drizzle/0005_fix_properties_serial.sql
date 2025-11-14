-- Fix properties table id column to be a proper SERIAL
-- This fixes the issue where Drizzle tries to insert 'default' for id

-- Step 1: Check if sequence exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE sequencename = 'properties_id_seq'
    ) THEN
        -- Create the sequence
        CREATE SEQUENCE properties_id_seq;
        
        -- Set the sequence to start from the max id + 1 (if table has data)
        PERFORM setval('properties_id_seq', COALESCE((SELECT MAX(id) FROM properties), 0) + 1, false);
        
        -- Make the sequence owned by the column
        ALTER SEQUENCE properties_id_seq OWNED BY properties.id;
        
        -- Set the default value
        ALTER TABLE properties ALTER COLUMN id SET DEFAULT nextval('properties_id_seq');
        
        RAISE NOTICE 'Created sequence properties_id_seq and set as default for properties.id';
    ELSE
        RAISE NOTICE 'Sequence properties_id_seq already exists';
    END IF;
END $$;

-- Step 2: Ensure id column is integer (should already be, but check)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'id'
        AND data_type != 'integer'
    ) THEN
        RAISE EXCEPTION 'id column is not integer type - manual intervention required';
    END IF;
END $$;

-- Step 3: Ensure user_id is TEXT (for Clerk user IDs)
-- WARNING: This is a data migration - backup your data first!
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'user_id'
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'user_id is integer - needs to be TEXT for Clerk. Manual migration required.';
        RAISE NOTICE 'Steps:';
        RAISE NOTICE '1. Backup your data';
        RAISE NOTICE '2. ALTER TABLE properties ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;';
    END IF;
END $$;

-- Step 4: Ensure timestamps are TIMESTAMP WITH TIME ZONE
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'created_at'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE 'created_at is text - needs to be TIMESTAMP WITH TIME ZONE. Manual migration required.';
    END IF;
END $$;

-- Step 5: Ensure amenities and images are JSONB
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'amenities'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE 'amenities is text - needs to be JSONB. Manual migration required.';
        RAISE NOTICE 'ALTER TABLE properties ALTER COLUMN amenities TYPE JSONB USING amenities::JSONB;';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'images'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE 'images is text - needs to be JSONB. Manual migration required.';
        RAISE NOTICE 'ALTER TABLE properties ALTER COLUMN images TYPE JSONB USING images::JSONB;';
    END IF;
END $$;

