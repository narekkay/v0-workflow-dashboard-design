-- Add onboarding form data fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS fiscal_address TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('single', 'married', 'pacs', 'divorced', 'widowed')),
ADD COLUMN IF NOT EXISTS lived_abroad BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS abroad_countries JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS spouse_first_name TEXT,
ADD COLUMN IF NOT EXISTS spouse_last_name TEXT,
ADD COLUMN IF NOT EXISTS spouse_birth_date DATE,
ADD COLUMN IF NOT EXISTS spouse_birth_place TEXT,
ADD COLUMN IF NOT EXISTS has_ifi BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_crypto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_lmnp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sci BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_foreign_accounts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_progress INTEGER DEFAULT 0;

-- Comments
COMMENT ON COLUMN clients.birth_date IS 'Date de naissance du client';
COMMENT ON COLUMN clients.birth_place IS 'Lieu de naissance du client';
COMMENT ON COLUMN clients.fiscal_address IS 'Adresse fiscale complète';
COMMENT ON COLUMN clients.marital_status IS 'Situation familiale';
COMMENT ON COLUMN clients.lived_abroad IS 'A vécu à l étranger';
COMMENT ON COLUMN clients.abroad_countries IS 'Liste des pays de résidence à l étranger';
COMMENT ON COLUMN clients.onboarding_data IS 'Données supplémentaires du formulaire d onboarding';
COMMENT ON COLUMN clients.onboarding_progress IS 'Pourcentage de progression du formulaire d onboarding';

-- Create RLS policy for public access to onboarding (unauthenticated)
-- This allows clients to fill the form via a unique link
CREATE POLICY "Allow public read for onboarding" ON clients
  FOR SELECT USING (true);

CREATE POLICY "Allow public update for onboarding" ON clients
  FOR UPDATE USING (true);
