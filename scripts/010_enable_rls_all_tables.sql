-- Clean up existing NULL user_ids before enabling RLS
-- Since auth is currently disabled, we'll use a placeholder UUID
DO $$
DECLARE
  placeholder_uuid UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Update NULL user_ids in clients table
  UPDATE clients SET user_id = placeholder_uuid WHERE user_id IS NULL;
  
  -- Update NULL user_ids in documents table (if any)
  UPDATE documents SET user_id = placeholder_uuid WHERE user_id IS NULL;
END $$;

-- Enable RLS on all existing tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_revenus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_revenus_sub ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_revenus_sub_bis ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_necessaires ENABLE ROW LEVEL SECURITY;

-- Make user_id columns NOT NULL for security
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;

-- Allow unrestricted access for now since auth is disabled
-- When auth is re-enabled, these policies should be replaced with proper auth.uid() checks

-- RLS Policies for clients (permissive for development)
CREATE POLICY "Allow all access to clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for tax_profiles (permissive for development)
CREATE POLICY "Allow all access to tax_profiles" ON tax_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for documents (permissive for development)
CREATE POLICY "Allow all access to documents" ON documents
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for reference tables (read-only for all)
CREATE POLICY "Allow read access to revenue categories" ON categories_revenus
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to revenue sub-categories" ON categories_revenus_sub
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to revenue sub-sub-categories" ON categories_revenus_sub_bis
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to required documents" ON documents_necessaires
  FOR SELECT USING (true);
