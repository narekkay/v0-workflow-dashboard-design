-- Add additional income source fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS has_salaires BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_pensions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_bic_bnc BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_revenus_locatifs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_dividendes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_reductions_credits BOOLEAN DEFAULT false;

-- Comments
COMMENT ON COLUMN clients.has_salaires IS 'Client a des revenus salariés';
COMMENT ON COLUMN clients.has_pensions IS 'Client a des pensions/retraites';
COMMENT ON COLUMN clients.has_bic_bnc IS 'Client a des BIC/BNC/BA';
COMMENT ON COLUMN clients.has_revenus_locatifs IS 'Client a des revenus fonciers';
COMMENT ON COLUMN clients.has_dividendes IS 'Client a des dividendes/intérêts';
COMMENT ON COLUMN clients.has_reductions_credits IS 'Client a des réductions/crédits d impôt';
