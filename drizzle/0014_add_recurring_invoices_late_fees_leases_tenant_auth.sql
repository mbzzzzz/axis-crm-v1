-- Add late fee fields to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS late_fee_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS late_fee_applied_at TIMESTAMP;

-- Add late fee policy reference to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS late_fee_policy_id INTEGER;

-- Create tenant_auth table for tenant portal authentication
CREATE TABLE IF NOT EXISTS tenant_auth (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenant_auth_email_idx ON tenant_auth(email);
CREATE INDEX IF NOT EXISTS tenant_auth_tenant_id_idx ON tenant_auth(tenant_id);

-- Create recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  invoice_template JSONB NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_generated_at TIMESTAMP,
  next_generation_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recurring_invoices_user_id_idx ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS recurring_invoices_tenant_id_idx ON recurring_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS recurring_invoices_next_generation_date_idx ON recurring_invoices(next_generation_date);

-- Create late_fee_policies table
CREATE TABLE IF NOT EXISTS late_fee_policies (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flat', 'percentage')),
  grace_period_days INTEGER NOT NULL DEFAULT 0,
  amount REAL,
  percentage REAL,
  max_cap REAL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS late_fee_policies_user_id_idx ON late_fee_policies(user_id);
CREATE INDEX IF NOT EXISTS late_fee_policies_is_default_idx ON late_fee_policies(user_id, is_default);

-- Create leases table
CREATE TABLE IF NOT EXISTS leases (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE SET NULL,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  lease_type TEXT NOT NULL CHECK (lease_type IN ('residential', 'commercial')),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  monthly_rent REAL NOT NULL,
  deposit REAL,
  terms JSONB,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_signature', 'active', 'expired', 'renewed', 'terminated')),
  signed_by_tenant INTEGER NOT NULL DEFAULT 0,
  signed_by_owner INTEGER NOT NULL DEFAULT 0,
  signed_at TIMESTAMP,
  document_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leases_user_id_idx ON leases(user_id);
CREATE INDEX IF NOT EXISTS leases_tenant_id_idx ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS leases_property_id_idx ON leases(property_id);
CREATE INDEX IF NOT EXISTS leases_status_idx ON leases(status);
CREATE INDEX IF NOT EXISTS leases_end_date_idx ON leases(end_date);

