-- Create client_revenues table to track selected revenue categories and subcategories for each client
CREATE TABLE IF NOT EXISTS client_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories_revenus(id) ON DELETE CASCADE,
  sub_category_ids INTEGER[] NOT NULL, -- Array of selected subcategory IDs
  document_ids INTEGER[] NOT NULL, -- Array of required document IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE client_revenues ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage revenues for their clients" ON client_revenues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_revenues.client_id 
      AND (clients.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Create index
CREATE INDEX idx_client_revenues_client_id ON client_revenues(client_id);
CREATE INDEX idx_client_revenues_category_id ON client_revenues(category_id);
