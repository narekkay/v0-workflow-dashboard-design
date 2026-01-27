-- Create revenue categories tables with hierarchical structure

-- Main categories (level 1)
CREATE TABLE IF NOT EXISTS categories_revenus (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub categories (level 2)
CREATE TABLE IF NOT EXISTS categories_revenus_sub (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories_revenus(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub-sub categories (level 3)
CREATE TABLE IF NOT EXISTS categories_revenus_sub_bis (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  sub_category_id BIGINT NOT NULL REFERENCES categories_revenus_sub(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert main categories
INSERT INTO categories_revenus (nom) VALUES
('Traitements & salaires'),
('Pensions & rentes'),
('Rentes viagères à titre onéreux'),
('Capitaux mobiliers'),
('Plus-values mobilières'),
('Revenus fonciers'),
('Charges déductibles'),
('Réductions/crédits d''impôt - Dons'),
('Crédits / Réductions'),
('Prélèvement à la source');

-- Insert sub-categories for "Traitements & salaires"
INSERT INTO categories_revenus_sub (nom, category_id) 
SELECT nom, 1 FROM (VALUES
  ('Salaires nets imposables'),
  ('Salaires (cases alternatives)'),
  ('Heures sup / RTT exonérées'),
  ('Revenus des associés et gérants (art.62 CGI)'),
  ('Autres revenus imposables (chômage, préretraite)'),
  ('Salaires de source étrangère'),
  ('Frais réels (déduction)'),
  ('Pensions de source étrangère')
) AS t(nom);

-- Insert sub-categories for "Pensions & rentes"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 2 FROM (VALUES
  ('Pensions/retraites imposables'),
  ('Pensions de retraite en capital taxables à 7,5%'),
  ('Pensions en capital des plans d''épargne retraite'),
  ('Pensions d''invalidité'),
  ('Pensions alimentaires perçues'),
  ('Pensions perçues par les non-résidents et pensions de source étrangère avec crédit d''impôt égal à l''impôt français')
) AS t(nom);

-- Insert sub-categories for "Rentes viagères à titre onéreux"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 3 FROM (VALUES
  ('Rentes perçues (en fonction de l''âge)'),
  ('Rentes perçues par les non-résidents et rentes de source étrangère avec crédit d''impôt égal à l''impôt françcais (en fonction de l''âge)')
) AS t(nom);

-- Insert sub-categories for "Capitaux mobiliers"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 4 FROM (VALUES
  ('Revenus des actions et parts (abattement de 40% si option barème)'),
  ('Dividendes imposables des titres non cotés détenus dans le PEA ou le PEA-PME'),
  ('Intérêts et autre produits de placement à revenu fixe'),
  ('Autres revenus distribués'),
  ('Intérets des prêts participatifs et des minibons'),
  ('Intérets imposables des obligations remboursables en actions détenues dans le PEA-PME'),
  ('Produits des plans d''épargne retraire -sortie en capital'),
  ('Frais et charges (déductibles si option barème)'),
  ('Crédits d''impôt sur valeurs étrangères'),
  ('Prélèvement forfaitaire non libératoire déjà versé'),
  ('Autres revenus soumis à un prélèvement ou une retenue libératoire'),
  ('Option barème (RCM)')
) AS t(nom);

-- Insert sub-categories for "Plus-values mobilières"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 5 FROM (VALUES
  ('Gains nets de cession'),
  ('Plus-value avant abattement'),
  ('Moins-values nettes')
) AS t(nom);

-- Insert sub-categories for "Revenus fonciers"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 6 FROM (VALUES
  ('Micro-foncier (≤ 15 000 €)'),
  ('dont recettes de source étrangère ouvrant droit à un crédit d''impôt égal à l''impôt français'),
  ('Résultat foncier (réel) — bénéfice'),
  ('dont revenus de source étrangère ouvrant droit à un crédit d''impôt égal à l''impôt français'),
  ('Déficit imputable sur les revenus fonciers'),
  ('Déficit imputable sur le revenu global'),
  ('Déficits antérieurs non encore imputés')
) AS t(nom);

-- Insert sub-categories for "Charges déductibles"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 7 FROM (VALUES
  ('Pensions alimentaires versées à des enfants majeurs'),
  ('Autres pensions alimentaires versées (enfants mineurs, ascendants..)'),
  ('Cotisations sur les nouveaux plans d''épargne retraire (PER) (déductibles du revenu global)'),
  ('Cotisations PERP, PREFON, COREM, CGOS'),
  ('Plafond de déduction')
) AS t(nom);

-- Insert sub-categories for "Réductions/crédits d'impôt - Dons"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 8 FROM (VALUES
  ('Dons versés à des organismes d''aide aux personnes en difficulté (maximum 1000 euros)'),
  ('Dons versés pour la sauvegarde du patrimoine religieux (maximum 1000 euros)'),
  ('Dons versés à d''autres organismes d''intérêt général, aux associations d''utilité publique, aux candidats aux éléctions')
) AS t(nom);

-- Insert sub-categories for "Crédits / Réductions"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 9 FROM (VALUES
  ('Services à la personne'),
  ('Cotisations syndicales'),
  ('Scolarité'),
  ('Garde d''enfants')
) AS t(nom);

-- Insert sub-categories for "Prélèvement à la source"
INSERT INTO categories_revenus_sub (nom, category_id)
SELECT nom, 10 FROM (VALUES
  ('Revenus de source étrangère ouvrant droit à un crédit d''impôt égal à l''impôt français')
) AS t(nom);

-- Get the sub_category_id for "Services à la personne" to insert level 3
DO $$
DECLARE
  services_id BIGINT;
  cotisations_id BIGINT;
  scolarite_id BIGINT;
  garde_id BIGINT;
BEGIN
  SELECT id INTO services_id FROM categories_revenus_sub WHERE nom = 'Services à la personne';
  SELECT id INTO cotisations_id FROM categories_revenus_sub WHERE nom = 'Cotisations syndicales';
  SELECT id INTO scolarite_id FROM categories_revenus_sub WHERE nom = 'Scolarité';
  SELECT id INTO garde_id FROM categories_revenus_sub WHERE nom = 'Garde d''enfants';

  -- Insert sub-sub-categories for "Services à la personne"
  INSERT INTO categories_revenus_sub_bis (nom, sub_category_id) VALUES
    ('Emploi à domicile (dépenses)', services_id),
    ('Garde d''enfants de moins de 3 ans et de moins de 18 ans handicapés à domicile', services_id),
    ('Accompagnement des enfants de moins de 3 ans et de moins de 18 ans handicapés *', services_id),
    ('Assistance et aide aux personnes âgées ou handicapées', services_id),
    ('Conduite du véhicule personnel des personnes âgées, des personnes handicapées ou atteintes de pathologies chroniques *', services_id),
    ('Accompagnement des personnes âgées, des personnes handicapées ou atteintes de pathologies chroniques *', services_id),
    ('Entretien de la maison et travaux ménagers', services_id),
    ('Petits travaux de jardinage (plafond 5 000 € par an et par foyer)', services_id),
    ('Travaux de petit bricolage (plafond 500 € par an et par foyer)', services_id),
    ('Garde d''enfants de 3 ans et plus à domicile', services_id),
    ('Accompagnement des enfants de 3 ans et plus *', services_id),
    ('Soutien scolaire à domicile ou cours à domicile', services_id),
    ('Soins d''esthétique à domicile pour les personnes dépendantes', services_id),
    ('Préparation de repas à domicile', services_id),
    ('Livraison de repas à domicile *', services_id),
    ('Collecte et livraison à domicile de linge repassé *', services_id),
    ('Livraison de courses à domicile *', services_id),
    ('Assistance informatique et internet à domicile (plafond 3 000 € par an et par foyer)', services_id),
    ('Soins et promenades d''animaux de compagnie pour les personnes dépendantes', services_id),
    ('Maintenance, entretien et vigilance temporaires à domicile', services_id),
    ('Assistance administrative à domicile', services_id),
    ('Téléassistance et visio assistance', services_id),
    ('Interprète en langue des signes', services_id),
    ('Conduite du véhicule des personnes en cas d''invalidité temporaire *', services_id),
    ('Accompagnement des personnes présentant une invalidité temporaire *', services_id),
    ('Assistance aux personnes ayant besoin d''une aide temporaire à leur domicile', services_id),
    ('Coordination et délivrance des services à la personne', services_id),
    ('Accueil familial', services_id),
    ('Aides perçues pour l''emploi à domicile (AP,PCH,CESU…)', services_id);

  -- Insert sub-sub-categories for "Cotisations syndicales"
  INSERT INTO categories_revenus_sub_bis (nom, sub_category_id) VALUES
    ('Cotisations syndicales des salariés et pensionnés (déclarant 1)', cotisations_id);

  -- Insert sub-sub-categories for "Scolarité"
  INSERT INTO categories_revenus_sub_bis (nom, sub_category_id) VALUES
    ('Frais de scolarité — Collège', scolarite_id),
    ('Frais de scolarité — Lycée', scolarite_id),
    ('Frais de scolarité — Enseignement supérieur', scolarite_id),
    ('Enfants en résidence alternée — Collège', scolarite_id),
    ('Enfants en résidence alternée — Lycée', scolarite_id),
    ('Enfants en résidence alternée — Enseignement supérieur', scolarite_id);

  -- Insert sub-sub-categories for "Garde d'enfants"
  INSERT INTO categories_revenus_sub_bis (nom, sub_category_id) VALUES
    ('Garde hors domicile < 6 ans (enfant 1)', garde_id),
    ('Garde hors domicile < 6 ans (enfant 2)', garde_id),
    ('Garde hors domicile < 6 ans (enfant 3+)', garde_id),
    ('Garde hors domicile < 6 ans (résidence alternée, 1er enfant)', garde_id),
    ('Garde hors domicile < 6 ans (résidence alternée, 2e enfant)', garde_id),
    ('Garde hors domicile < 6 ans (résidence alternée, 3e enfant et suivants)', garde_id);
END $$;
