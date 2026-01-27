-- Create a junction table to link clients with their selected revenue subcategories
CREATE TABLE IF NOT EXISTS fk_clients_revenus_sous_categories (
  id SERIAL PRIMARY KEY,
  client_id UUID NOT NULL,
  category_id INTEGER NOT NULL,
  sub_category_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories_revenus(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_category FOREIGN KEY (sub_category_id) REFERENCES categories_revenus_sub(id) ON DELETE CASCADE,
  
  -- Ensure unique combinations
  CONSTRAINT unique_client_category_subcategory UNIQUE (client_id, category_id, sub_category_id)
);

-- Add index for faster queries
CREATE INDEX idx_fk_clients_revenus_client ON fk_clients_revenus_sous_categories(client_id);
CREATE INDEX idx_fk_clients_revenus_category ON fk_clients_revenus_sous_categories(category_id);

-- Enable RLS
ALTER TABLE fk_clients_revenus_sous_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (permissive for now)
CREATE POLICY "Allow all operations" ON fk_clients_revenus_sous_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);
