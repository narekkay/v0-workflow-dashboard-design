-- Add missing subcategories for "Crédits / Réductions"
-- These are specific categories for children in alternating residence

DO $$
DECLARE
  credits_category_id BIGINT;
BEGIN
  -- Get the ID of "Crédits / Réductions" category
  SELECT id INTO credits_category_id FROM categories_revenus WHERE nom = 'Crédits / Réductions';

  -- Insert the new sub-categories if they don't already exist
  INSERT INTO categories_revenus_sub (nom, category_id)
  SELECT nom, credits_category_id FROM (VALUES
    ('Scolarité (résidence alternée)'),
    ('Garde d''enfants (résidence alternée)')
  ) AS t(nom)
  WHERE NOT EXISTS (
    SELECT 1 FROM categories_revenus_sub 
    WHERE categories_revenus_sub.nom = t.nom 
    AND categories_revenus_sub.category_id = credits_category_id
  );

  RAISE NOTICE 'New subcategories added to "Crédits / Réductions"';
END $$;
