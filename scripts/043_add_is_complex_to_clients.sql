-- Add is_complex column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_complex BOOLEAN DEFAULT FALSE;
