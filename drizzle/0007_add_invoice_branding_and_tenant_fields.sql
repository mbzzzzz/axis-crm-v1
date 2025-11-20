-- Add branding and additional fields to invoices table
-- This migration adds logo support and tenant integration fields

-- Add branding fields
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS logo_mode TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS logo_data_url TEXT,
ADD COLUMN IF NOT EXISTS logo_width INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'AXIS CRM',
ADD COLUMN IF NOT EXISTS company_tagline TEXT DEFAULT 'Real Estate Management';

-- Add additional invoice fields
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS agent_name TEXT,
ADD COLUMN IF NOT EXISTS agent_agency TEXT,
ADD COLUMN IF NOT EXISTS agent_email TEXT,
ADD COLUMN IF NOT EXISTS agent_phone TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS late_fee_policy TEXT;

-- Add tenant_id field for direct tenant association
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL;

-- Create index for tenant_id for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);

