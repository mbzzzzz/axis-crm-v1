-- Add plan column to user preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS plan_key TEXT;

UPDATE user_preferences
SET plan_key = 'professional'
WHERE plan_key IS NULL;

ALTER TABLE user_preferences
ALTER COLUMN plan_key SET DEFAULT 'professional';

ALTER TABLE user_preferences
ALTER COLUMN plan_key SET NOT NULL;

-- Usage limits tracking table
CREATE TABLE IF NOT EXISTS usage_limits (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usage_limits_user_feature_period UNIQUE (user_id, feature, period_start)
);

CREATE INDEX IF NOT EXISTS usage_limits_user_feature_idx
  ON usage_limits (user_id, feature);


