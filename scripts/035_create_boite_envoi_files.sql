-- Create boite_envoi_files table to store files in the outbox
CREATE TABLE IF NOT EXISTS boite_envoi_files (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  document_id BIGINT REFERENCES documents_necessaires(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE boite_envoi_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read boite_envoi_files" ON boite_envoi_files;
DROP POLICY IF EXISTS "Allow authenticated users to insert boite_envoi_files" ON boite_envoi_files;
DROP POLICY IF EXISTS "Allow authenticated users to update boite_envoi_files" ON boite_envoi_files;
DROP POLICY IF EXISTS "Allow authenticated users to delete boite_envoi_files" ON boite_envoi_files;

-- Create policy to allow all users to read all files
CREATE POLICY "Allow all users to read boite_envoi_files"
  ON boite_envoi_files
  FOR SELECT
  USING (true);

-- Create policy to allow all users to insert files
CREATE POLICY "Allow all users to insert boite_envoi_files"
  ON boite_envoi_files
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow all users to update files
CREATE POLICY "Allow all users to update boite_envoi_files"
  ON boite_envoi_files
  FOR UPDATE
  USING (true);

-- Create policy to allow all users to delete files
CREATE POLICY "Allow all users to delete boite_envoi_files"
  ON boite_envoi_files
  FOR DELETE
  USING (true);
