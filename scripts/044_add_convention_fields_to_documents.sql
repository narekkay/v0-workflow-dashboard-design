-- Add convention fields to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS convention_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS has_result_clause BOOLEAN DEFAULT FALSE;
