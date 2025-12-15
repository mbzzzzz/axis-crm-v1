-- Add currency and signature columns to leases table
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

ALTER TABLE leases
ADD COLUMN IF NOT EXISTS owner_signature TEXT;

ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_signature TEXT;


