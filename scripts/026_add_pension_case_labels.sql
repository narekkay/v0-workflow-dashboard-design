-- Add case label associations for pension subcategories

-- Changed ON CONFLICT to use only case_code since the table has UNIQUE constraint on case_code only
INSERT INTO case_labels (case_code, sub_category_id)
VALUES
  ('1AS', 9),   -- Pensions/retraites imposables
  ('1AT', 10),  -- Pensions de retraite en capital taxables à 7,5%
  ('1AI', 11),  -- Pensions en capital des plans d'épargne retraite
  ('1AZ', 12),  -- Pensions d'invalidité
  ('1AO', 13),  -- Pensions alimentaires perçues
  ('1AL', 14)   -- Pensions perçues par les non-résidents et pensions de source étrangère
ON CONFLICT (case_code) DO NOTHING;
