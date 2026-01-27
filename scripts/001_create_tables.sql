-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tax_profiles table
CREATE TABLE IF NOT EXISTS tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  revenue_type TEXT NOT NULL,
  revenue_amount NUMERIC(12, 2),
  tax_year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tax_profiles
CREATE POLICY "Users can view tax profiles of their clients" ON tax_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = tax_profiles.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tax profiles for their clients" ON tax_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = tax_profiles.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tax profiles of their clients" ON tax_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = tax_profiles.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tax profiles of their clients" ON tax_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = tax_profiles.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can view documents of their clients" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert documents for their clients" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_tax_profiles_client_id ON tax_profiles(client_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
