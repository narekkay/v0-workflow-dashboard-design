-- Add archived field to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Update existing clients to not be archived
UPDATE clients SET archived = FALSE WHERE archived IS NULL;
