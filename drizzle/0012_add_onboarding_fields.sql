ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS organization_name TEXT,
  ADD COLUMN IF NOT EXISTS company_tagline TEXT,
  ADD COLUMN IF NOT EXISTS default_invoice_logo_mode TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS default_invoice_logo_data_url TEXT,
  ADD COLUMN IF NOT EXISTS default_invoice_logo_width INTEGER DEFAULT 40,
  ADD COLUMN IF NOT EXISTS heard_about TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

