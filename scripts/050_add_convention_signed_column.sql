-- Add convention_signed column to clients table
-- This tracks whether the client has signed their convention

ALTER TABLE clients 
ADD COLUMN convention_signed BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN clients.convention_signed IS 'Indicates if the client has signed their convention d''honoraires';

-- Set to true for existing clients who already have conventions
UPDATE clients 
SET convention_signed = true 
WHERE id IN (
  SELECT DISTINCT client_id 
  FROM documents 
  WHERE category = 'convention'
);
