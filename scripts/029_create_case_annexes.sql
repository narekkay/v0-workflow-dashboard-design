-- Create a table to associate case codes with tax form annexes
CREATE TABLE IF NOT EXISTS case_annexes (
  id SERIAL PRIMARY KEY,
  case_code TEXT NOT NULL UNIQUE,
  annexe_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE case_annexes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to case_annexes"
ON case_annexes
FOR SELECT
TO public
USING (true);

-- Insert the first entry: 3SG → 2042 C
INSERT INTO case_annexes (case_code, annexe_name)
VALUES ('3SG', '2042 C')
ON CONFLICT (case_code) DO NOTHING;
