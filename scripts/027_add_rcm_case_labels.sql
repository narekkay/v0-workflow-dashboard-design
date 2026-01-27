-- Add case_labels associations for Revenus de Capitaux Mobiliers (RCM)
-- Links fiscal case codes (2DC, 2FU, 2TR, etc.) to subcategories of "Capitaux mobiliers"

INSERT INTO case_labels (case_code, sub_category_id)
VALUES
  ('2DC', 17), -- Revenus des actions et parts (abattement de 40% si option barème)
  ('2FU', 18), -- Dividendes imposables des titres non cotés détenus dans le PEA ou le PEA-PME
  ('2TR', 19), -- Intérêts et autre produits de placement à revenu fixe
  ('2TS', 20), -- Autres revenus distribués
  ('2TT', 21), -- Intérets des prêts participatifs et des minibons
  ('2TQ', 22), -- Intérets imposables des obligations remboursables en actions détenues dans le PEA-PME
  ('2TZ', 23), -- Produits des plans d'épargne retraire -sortie en capital
  ('2CA', 24), -- Frais et charges (déductibles si option barème)
  ('2AB', 25), -- Crédits d'impôt sur valeurs étrangères
  ('2CK', 26), -- Prélèvement forfaitaire non libératoire déjà versé
  ('2EE', 27), -- Autres revenus soumis à un prélèvement ou une retenue libératoire
  ('2OP', 28)  -- Option barème (RCM)
ON CONFLICT (case_code) DO NOTHING;
