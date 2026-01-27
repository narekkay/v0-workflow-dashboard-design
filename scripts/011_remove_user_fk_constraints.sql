-- Remove foreign key constraints on user_id since auth is disabled
-- This allows the app to work without actual user authentication

-- Only clients and documents have user_id, tax_profiles doesn't
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;

-- Set default user_id for existing NULL values
UPDATE clients SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE documents SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

-- Make user_id NOT NULL with a default value
ALTER TABLE clients ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE documents ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
