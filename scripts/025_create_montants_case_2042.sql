-- Create table to store amounts for each case code per client
CREATE TABLE IF NOT EXISTS montants_case_2042 (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  case_code TEXT NOT NULL,
  montant NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one entry per client per case code
  UNIQUE(client_id, case_code)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_montants_case_client ON montants_case_2042(client_id);
CREATE INDEX IF NOT EXISTS idx_montants_case_code ON montants_case_2042(case_code);

-- Enable RLS
ALTER TABLE montants_case_2042 ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to montants_case_2042"
ON montants_case_2042
FOR SELECT
TO public
USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access to montants_case_2042"
ON montants_case_2042
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update access to montants_case_2042"
ON montants_case_2042
FOR UPDATE
TO public
USING (true);
