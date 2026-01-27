-- Add last_requested_at column to track when documents were last requested
ALTER TABLE boite_envoi_files 
ADD COLUMN IF NOT EXISTS last_requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to set last_requested_at to created_at
UPDATE boite_envoi_files 
SET last_requested_at = created_at 
WHERE last_requested_at IS NULL;
