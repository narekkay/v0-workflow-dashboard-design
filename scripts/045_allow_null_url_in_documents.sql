-- Allow NULL url in documents table for text-based conventions
ALTER TABLE documents ALTER COLUMN url DROP NOT NULL;
