-- Add case labels for Services à la personne (subcategory under Crédits / Réductions)
-- These case codes map to various home service activities eligible for tax credits

DO $$
DECLARE
  services_id BIGINT;
BEGIN
  -- Get the sub_category_id for "Services à la personne"
  SELECT id INTO services_id FROM categories_revenus_sub WHERE nom = 'Services à la personne' AND category_id = 9;

  -- Insert case labels for all Services à la personne activities
  INSERT INTO case_labels (case_code, sub_category_id) VALUES
    ('7DB', services_id),  -- Emploi à domicile (dépenses)
    ('BDA', services_id),  -- Garde d'enfants de moins de 3 ans et de moins de 18 ans handicapés à domicile
    ('BDB', services_id),  -- Accompagnement des enfants de moins de 3 ans et de moins de 18 ans handicapés
    ('BDC', services_id),  -- Assistance et aide aux personnes âgées ou handicapées
    ('BDD', services_id),  -- Conduite du véhicule personnel des personnes âgées, des personnes handicapées ou atteintes de pathologies chroniques
    ('BDE', services_id),  -- Accompagnement des personnes âgées, des personnes handicapées ou atteintes de pathologies chroniques
    ('BDF', services_id),  -- Entretien de la maison et travaux ménagers
    ('BDG', services_id),  -- Petits travaux de jardinage (plafond 5 000 € par an et par foyer)
    ('BDH', services_id),  -- Travaux de petit bricolage (plafond 500 € par an et par foyer)
    ('BDI', services_id),  -- Garde d'enfants de 3 ans et plus à domicile
    ('BDJ', services_id),  -- Accompagnement des enfants de 3 ans et plus
    ('BDK', services_id),  -- Soutien scolaire à domicile ou cours à domicile
    ('BDL', services_id),  -- Soins d'esthétique à domicile pour les personnes dépendantes
    ('BDM', services_id),  -- Préparation de repas à domicile
    ('BDN', services_id),  -- Livraison de repas à domicile
    ('BDO', services_id),  -- Collecte et livraison à domicile de linge repassé
    ('BDP', services_id),  -- Livraison de courses à domicile
    ('BDQ', services_id),  -- Assistance informatique et internet à domicile (plafond 3 000 € par an et par foyer)
    ('BDR', services_id),  -- Soins et promenades d'animaux de compagnie pour les personnes dépendantes
    ('BDS', services_id),  -- Maintenance, entretien et vigilance temporaires à domicile
    ('BDT', services_id),  -- Assistance administrative à domicile
    ('BDU', services_id),  -- Téléassistance et visio assistance
    ('BDV', services_id),  -- Interprète en langue des signes
    ('BDW', services_id),  -- Conduite du véhicule des personnes en cas d'invalidité temporaire
    ('BDX', services_id),  -- Accompagnement des personnes présentant une invalidité temporaire
    ('BDY', services_id),  -- Assistance aux personnes ayant besoin d'une aide temporaire à leur domicile
    ('BDZ', services_id),  -- Coordination et délivrance des services à la personne
    ('BEA', services_id),  -- Accueil familial
    ('7DR', services_id)   -- Aides perçues pour l'emploi à domicile (AP,PCH,CESU…)
  ON CONFLICT DO NOTHING;

END $$;
