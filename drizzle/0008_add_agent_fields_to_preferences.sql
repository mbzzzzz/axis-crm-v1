-- Add agent name and organization fields to user_preferences table
-- This allows users to set default agent information that will be used in invoices

ALTER TABLE "user_preferences"
ADD COLUMN IF NOT EXISTS "agent_name" TEXT,
ADD COLUMN IF NOT EXISTS "agent_agency" TEXT;

