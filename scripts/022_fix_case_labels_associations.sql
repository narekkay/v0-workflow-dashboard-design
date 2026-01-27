-- Fix case_labels associations to match actual subcategory names
DELETE FROM case_labels;

-- Removed label column since it was dropped in script 021
-- Re-insert with correct associations based on actual subcategory names
INSERT INTO case_labels (case_code, sub_category_id)
SELECT case_code, sub_category_id FROM (
  -- Corrected associations to match exact subcategory names from categories_revenus_sub
  SELECT '1AJ' as case_code, id as sub_category_id
  FROM categories_revenus_sub WHERE nom = 'Salaires nets imposables' AND category_id = 1
  UNION ALL
  SELECT '1AA', id
  FROM categories_revenus_sub WHERE nom = 'Salaires (cases alternatives)' AND category_id = 1
  UNION ALL
  SELECT '1GH', id
  FROM categories_revenus_sub WHERE nom = 'Heures sup / RTT exonérées' AND category_id = 1
  UNION ALL
  SELECT '1GB', id
  FROM categories_revenus_sub WHERE nom = 'Revenus des associés et gérants (art.62 CGI)' AND category_id = 1
  UNION ALL
  SELECT '1AP', id
  FROM categories_revenus_sub WHERE nom = 'Autres revenus imposables (chômage, préretraite)' AND category_id = 1
  UNION ALL
  SELECT '1AF', id
  FROM categories_revenus_sub WHERE nom = 'Salaires de source étrangère' AND category_id = 1
  UNION ALL
  SELECT '1AK', id
  FROM categories_revenus_sub WHERE nom = 'Frais réels (déduction)' AND category_id = 1
  UNION ALL
  SELECT '1AL', id
  FROM categories_revenus_sub WHERE nom = 'Pensions de source étrangère' AND category_id = 1
) AS t
WHERE t.sub_category_id IS NOT NULL;
