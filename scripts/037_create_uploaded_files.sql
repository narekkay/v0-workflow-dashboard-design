-- Create uploaded_files table to track successfully uploaded files
CREATE TABLE IF NOT EXISTS uploaded_files (
  id BIGSERIAL PRIMARY KEY,
  file_request_id BIGINT NOT NULL REFERENCES file_requests(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to uploaded_files"
  ON uploaded_files FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to uploaded_files"
  ON uploaded_files FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_request_id ON uploaded_files(file_request_id);
