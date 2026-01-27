-- Create case_labels table to map fiscal case codes to subcategories
CREATE TABLE IF NOT EXISTS case_labels (
  id BIGSERIAL PRIMARY KEY,
  case_code TEXT NOT NULL UNIQUE,
  sub_category_id BIGINT NOT NULL REFERENCES categories_revenus_sub(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert case labels for "Traitements & salaires" subcategories
INSERT INTO case_labels (case_code, sub_category_id, label)
SELECT case_code, sub_category_id, label FROM (
  SELECT '1AJ' as case_code, id as sub_category_id, 'Salaires nets imposables' as label 
  FROM categories_revenus_sub WHERE nom = 'Salaires nets imposables'
  UNION ALL
  SELECT '1AA', id, 'Salaires (cases alternatives)' 
  FROM categories_revenus_sub WHERE nom = 'Salaires (cases alternatives)'
  UNION ALL
  SELECT '1GH', id, 'Heures sup / RTT exonérées' 
  FROM categories_revenus_sub WHERE nom = 'Heures sup / RTT exonérées'
  UNION ALL
  SELECT '1GB', id, 'Revenus des associés et gérants (art.62 CGI)' 
  FROM categories_revenus_sub WHERE nom = 'Revenus des associés et gérants (art.62 CGI)'
  UNION ALL
  SELECT '1AP', id, 'Autres revenus imposables (chômage, préretraite)' 
  FROM categories_revenus_sub WHERE nom = 'Autres revenus imposables (chômage, préretraite)'
  UNION ALL
  SELECT '1AF', id, 'Salaires de source étrangère' 
  FROM categories_revenus_sub WHERE nom = 'Salaires de source étrangère'
  UNION ALL
  SELECT '1AK', id, 'Frais réels (déduction)' 
  FROM categories_revenus_sub WHERE nom = 'Frais réels (déduction)'
  UNION ALL
  SELECT '1AL', id, 'Pensions de source étrangère' 
  FROM categories_revenus_sub WHERE nom = 'Pensions de source étrangère'
) AS t;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_case_labels_sub_category ON case_labels(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_case_labels_case_code ON case_labels(case_code);
