-- Add spouse_children column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS spouse_children JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN clients.spouse_children IS 'Liste des enfants à charge du conjoint (prénom, nom, date de naissance)';
