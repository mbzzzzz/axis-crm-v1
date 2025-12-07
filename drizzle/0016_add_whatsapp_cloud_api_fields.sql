-- Add WhatsApp Cloud API fields to user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_connected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number TEXT;

CREATE INDEX IF NOT EXISTS idx_user_preferences_whatsapp ON user_preferences(whatsapp_phone_number_id) WHERE whatsapp_phone_number_id IS NOT NULL;

