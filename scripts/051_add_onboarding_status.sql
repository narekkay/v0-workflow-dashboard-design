-- Add onboarding status tracking columns to clients table

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS convention_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_form_pending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_form_completed BOOLEAN DEFAULT false;

-- Update existing clients with convention_signed=true to have convention_sent=true
UPDATE clients
SET convention_sent = true
WHERE convention_signed = true;

-- Comment on columns
COMMENT ON COLUMN clients.convention_sent IS 'Indicates if the convention has been sent to the client';
COMMENT ON COLUMN clients.convention_signed IS 'Indicates if the convention has been signed by the client';
COMMENT ON COLUMN clients.onboarding_form_pending IS 'Indicates if the onboarding form is waiting for client input';
COMMENT ON COLUMN clients.onboarding_form_completed IS 'Indicates if the onboarding form has been completed by the client';
