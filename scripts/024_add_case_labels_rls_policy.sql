-- Enable RLS on case_labels if not already enabled
ALTER TABLE case_labels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to case_labels" ON case_labels;

-- Create a policy to allow anyone to read case_labels
CREATE POLICY "Allow public read access to case_labels"
ON case_labels
FOR SELECT
TO public
USING (true);
