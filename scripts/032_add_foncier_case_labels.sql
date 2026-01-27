-- Add case_labels for Revenus fonciers (Rental Property Income)
-- Associates fiscal case codes (4BE, 4BK, 4BA, 4BL, 4BB, 4BC, 4BD) to revenue subcategories

INSERT INTO case_labels (case_code, sub_category_id)
VALUES
  ('4BE', 32),  -- Micro-foncier (≤ 15 000 €)
  ('4BK', 33),  -- dont recettes de source étrangère ouvrant droit à un crédit d'impôt égal à l'impôt français
  ('4BA', 34),  -- Résultat foncier (réel) — bénéfice
  ('4BL', 35),  -- dont revenus de source étrangère ouvrant droit à un crédit d'impôt égal à l'impôt français
  ('4BB', 36),  -- Déficit imputable sur les revenus fonciers
  ('4BC', 37),  -- Déficit imputable sur le revenu global
  ('4BD', 38)   -- Déficits antérieurs non encore imputés
ON CONFLICT (case_code) DO NOTHING;
