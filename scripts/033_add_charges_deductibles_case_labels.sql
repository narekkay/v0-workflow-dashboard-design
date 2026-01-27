-- Add case_labels for deductible charges (Charges déductibles)

INSERT INTO case_labels (case_code, sub_category_id)
VALUES
  -- Pensions alimentaires versées à des enfants majeurs
  ('6EL', 39),
  ('6EM', 39),
  
  -- Autres pensions alimentaires versées (enfants mineurs, ascendants..)
  ('6GU', 40),
  
  -- Cotisations sur les nouveaux plans d'épargne retraire (PER)
  ('6NS', 41),
  
  -- Cotisations PERP, PREFON, COREM, CGOS
  ('6RS', 42),
  
  -- Plafond de déduction
  ('6PS', 43)
ON CONFLICT (case_code) DO NOTHING;
