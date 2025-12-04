-- Add currency field to invoices table
-- This migration adds currency support to invoices, defaulting to USD
-- Currency is inherited from the property when invoice is created

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Update existing invoices to use USD as default if currency is null
UPDATE invoices SET currency = 'USD' WHERE currency IS NULL;

-- Create index for currency if needed for filtering
CREATE INDEX IF NOT EXISTS idx_invoices_currency ON invoices(currency);

