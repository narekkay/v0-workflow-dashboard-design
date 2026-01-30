-- Add timestamp columns for onboarding status tracking
-- These columns track when each onboarding step was completed

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS convention_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS convention_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_form_pending_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_form_completed_at TIMESTAMPTZ;

-- Add index for querying by dates
CREATE INDEX IF NOT EXISTS idx_clients_convention_sent_at ON clients(convention_sent_at);
CREATE INDEX IF NOT EXISTS idx_clients_convention_signed_at ON clients(convention_signed_at);

-- Set timestamps for existing records that have the boolean flags set
UPDATE clients 
SET convention_sent_at = NOW() 
WHERE convention_sent = true AND convention_sent_at IS NULL;

UPDATE clients 
SET convention_signed_at = NOW() 
WHERE convention_signed = true AND convention_signed_at IS NULL;

UPDATE clients 
SET onboarding_form_pending_at = NOW() 
WHERE onboarding_form_pending = true AND onboarding_form_pending_at IS NULL;

UPDATE clients 
SET onboarding_form_completed_at = NOW() 
WHERE onboarding_form_completed = true AND onboarding_form_completed_at IS NULL;
