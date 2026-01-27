-- Create table to track document request history
CREATE TABLE IF NOT EXISTS sent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents_necessaires(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sent_history_client_document ON sent_history(client_id, document_id);
CREATE INDEX IF NOT EXISTS idx_sent_history_sent_at ON sent_history(sent_at DESC);

-- Enable RLS
ALTER TABLE sent_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Enable all access for sent_history" ON sent_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
