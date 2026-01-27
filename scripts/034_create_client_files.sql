-- Create client_files table to track files sent to clients
CREATE TABLE IF NOT EXISTS client_files (
  id BIGSERIAL PRIMARY KEY,
  -- Changed client_id from BIGINT to UUID to match clients table
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read/write access
CREATE POLICY "Allow public access to client_files"
ON client_files
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_files_client_id ON client_files(client_id);
