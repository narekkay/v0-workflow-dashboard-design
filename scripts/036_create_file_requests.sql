-- Create file_requests table to track upload requests
CREATE TABLE IF NOT EXISTS file_requests (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  sub_category_id BIGINT REFERENCES categories_revenus_sub(id),
  upload_link TEXT NOT NULL,
  blob_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE file_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to file_requests" ON file_requests;
DROP POLICY IF EXISTS "Allow public insert access to file_requests" ON file_requests;
DROP POLICY IF EXISTS "Allow public update access to file_requests" ON file_requests;

-- Create policies for public access
CREATE POLICY "Allow public read access to file_requests"
  ON file_requests FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to file_requests"
  ON file_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to file_requests"
  ON file_requests FOR UPDATE
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_file_requests_client_id ON file_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_file_requests_status ON file_requests(status);

-- Additional updates can be added here if necessary
