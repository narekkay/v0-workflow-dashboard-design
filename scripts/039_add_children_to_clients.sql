-- Add children field to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN clients.children IS 'Array of children objects with first_name, last_name, and date_of_birth';
