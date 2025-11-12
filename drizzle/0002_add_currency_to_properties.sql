-- Add currency column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Update existing records to have USD as default currency
UPDATE properties SET currency = 'USD' WHERE currency IS NULL;

