-- Add sub_bis_category_id column to support level 3 categories
ALTER TABLE documents_necessaires 
ADD COLUMN IF NOT EXISTS sub_bis_category_id BIGINT REFERENCES categories_revenus_sub_bis(id) ON DELETE CASCADE;

-- Make sub_category_id nullable since some documents will reference sub_bis instead
ALTER TABLE documents_necessaires 
ALTER COLUMN sub_category_id DROP NOT NULL;

-- Add constraint to ensure either sub_category_id or sub_bis_category_id is set, but not both
ALTER TABLE documents_necessaires
DROP CONSTRAINT IF EXISTS check_category_reference;

ALTER TABLE documents_necessaires
ADD CONSTRAINT check_category_reference CHECK (
  (sub_category_id IS NOT NULL AND sub_bis_category_id IS NULL) OR
  (sub_category_id IS NULL AND sub_bis_category_id IS NOT NULL)
);

-- Insert documents for "Charges déductibles" (level 2 - sub_category)
INSERT INTO documents_necessaires (sub_category_id, description, shortname)
SELECT sub_cat_id, description, shortname FROM (VALUES
  ((SELECT id FROM categories_revenus_sub WHERE nom = 'Pensions alimentaires versées à des enfants majeurs'), 
   'Jugement de divorce ou de séparation fixant la pension alimentaire, ou déclaration conjointe des parents, ou tout document justifiant du caractère nécessaire et du montant de l''aide apportée. Relevés bancaires ou attestations justifiant le versement effectif.', 
   'Jugement ou accord + justificatifs de paiement'),
  
  ((SELECT id FROM categories_revenus_sub WHERE nom = 'Autres pensions alimentaires versées (enfants mineurs, ascendants..)'), 
   'Mêmes justificatifs que pour les pensions versées aux enfants majeurs : jugement, convention ou accord fixant le montant, et relevés bancaires / attestations bancaires attestant des virements effectués au bénéficiaire.', 
   'Jugement/accord + preuves de versement'),
  
  ((SELECT id FROM categories_revenus_sub WHERE nom = 'Cotisations sur les nouveaux plans d''épargne retraire (PER) (déductibles du revenu global)'), 
   'Attestations de cotisations ou relevés fiscaux des organismes PER (assurance, banque) mentionnant les sommes versées et déductibles du revenu global.', 
   'Attestations PER'),
  
  ((SELECT id FROM categories_revenus_sub WHERE nom = 'Cotisations PERP, PREFON, COREM, CGOS'), 
   'Attestations fiscales fournies par les organismes PERP, PREFON, COREM ou CGOS indiquant les montants des cotisations versées pendant l''année.', 
   'Attestations PERP/PREFON'),
  
  ((SELECT id FROM categories_revenus_sub WHERE nom = 'Plafond de déduction'), 
   'Aucun justificatif spécifique : cette case concerne le calcul automatique du plafond. En revanche, conserver les bulletins de salaire ou l''avis d''imposition de l''année précédente pour vérifier le plafond disponible.', 
   'Calcul automatique')
) AS t(sub_cat_id, description, shortname)
WHERE sub_cat_id IS NOT NULL;
