-- Add comprehensive onboarding form fields to clients table

-- Residence & International fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_resident TEXT; -- 'yes', 'no', 'partial'
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lived_abroad BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS abroad_details TEXT;

-- Family status change
ALTER TABLE clients ADD COLUMN IF NOT EXISTS family_status_change BOOLEAN DEFAULT FALSE;

-- Ex-spouse information (JSONB array)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ex_spouses JSONB DEFAULT '[]'::jsonb;

-- Pensions & obligations
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_pension_obligations BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pensions JSONB DEFAULT '[]'::jsonb;

-- Family events
ALTER TABLE clients ADD COLUMN IF NOT EXISTS family_events JSONB DEFAULT '[]'::jsonb;

-- Income types (Panorama Revenus & IFI)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_salaries BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_pensions_income BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_unemployment BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_independent BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_foncier BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_lmnp BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_foreign_income BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_dividends BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_crypto BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_ifi BOOLEAN DEFAULT FALSE;

-- Charges / reductions / credits
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_donations BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_childcare BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_home_services BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_alimony_paid BOOLEAN DEFAULT FALSE;

-- Documents uploaded (JSONB array for tracking)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_documents JSONB DEFAULT '[]'::jsonb;

-- Confirmation flags
ALTER TABLE clients ADD COLUMN IF NOT EXISTS confirm_accuracy BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS confirm_processing BOOLEAN DEFAULT FALSE;

-- Onboarding submitted timestamp
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_submitted_at TIMESTAMPTZ;
