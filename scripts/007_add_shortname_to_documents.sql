-- Add shortname column to documents_necessaires and populate with concise names

ALTER TABLE documents_necessaires ADD COLUMN IF NOT EXISTS shortname TEXT;

-- Update shortnames with concise versions
DO $$
DECLARE
  salaires_nets_id BIGINT;
  salaires_cases_id BIGINT;
  heures_sup_id BIGINT;
  associes_gerants_id BIGINT;
  autres_revenus_id BIGINT;
  salaires_etranger_id BIGINT;
  frais_reels_id BIGINT;
  pensions_etranger_id BIGINT;
BEGIN
  -- Get sub_category IDs
  SELECT id INTO salaires_nets_id FROM categories_revenus_sub WHERE nom = 'Salaires nets imposables';
  SELECT id INTO salaires_cases_id FROM categories_revenus_sub WHERE nom = 'Salaires (cases alternatives)';
  SELECT id INTO heures_sup_id FROM categories_revenus_sub WHERE nom = 'Heures sup / RTT exonérées';
  SELECT id INTO associes_gerants_id FROM categories_revenus_sub WHERE nom = 'Revenus des associés et gérants (art.62 CGI)';
  SELECT id INTO autres_revenus_id FROM categories_revenus_sub WHERE nom = 'Autres revenus imposables (chômage, préretraite)';
  SELECT id INTO salaires_etranger_id FROM categories_revenus_sub WHERE nom = 'Salaires de source étrangère';
  SELECT id INTO frais_reels_id FROM categories_revenus_sub WHERE nom = 'Frais réels (déduction)';
  SELECT id INTO pensions_etranger_id FROM categories_revenus_sub WHERE nom = 'Pensions de source étrangère';

  -- Update shortnames
  UPDATE documents_necessaires SET shortname = 'Bulletins de salaire' WHERE sub_category_id = salaires_nets_id;
  UPDATE documents_necessaires SET shortname = 'Bulletins rectificatifs' WHERE sub_category_id = salaires_cases_id;
  UPDATE documents_necessaires SET shortname = 'Attestation heures sup' WHERE sub_category_id = heures_sup_id;
  UPDATE documents_necessaires SET shortname = 'Relevés gérant + liasse' WHERE sub_category_id = associes_gerants_id;
  UPDATE documents_necessaires SET shortname = 'Attestations Pôle emploi' WHERE sub_category_id = autres_revenus_id;
  UPDATE documents_necessaires SET shortname = 'Bulletins étrangers' WHERE sub_category_id = salaires_etranger_id;
  UPDATE documents_necessaires SET shortname = 'Justificatifs frais' WHERE sub_category_id = frais_reels_id;
  UPDATE documents_necessaires SET shortname = 'Attestation pension' WHERE sub_category_id = pensions_etranger_id;
END $$;
