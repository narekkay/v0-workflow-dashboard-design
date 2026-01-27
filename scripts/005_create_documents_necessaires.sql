-- Create documents_necessaires table to associate required documents with sub-categories

CREATE TABLE IF NOT EXISTS documents_necessaires (
  id BIGSERIAL PRIMARY KEY,
  sub_category_id BIGINT NOT NULL REFERENCES categories_revenus_sub(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert required documents for each sub-category
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

  -- Salaires nets imposables
  INSERT INTO documents_necessaires (sub_category_id, description) VALUES
    (salaires_nets_id, 'Bulletins de salaire'),
    (salaires_nets_id, 'Attestation employeur'),
    (salaires_nets_id, 'Récapitulatif annuel net imposable');

  -- Salaires (cases alternatives)
  INSERT INTO documents_necessaires (sub_category_id, description) VALUES
    (salaires_cases_id, 'Bulletins de salaire rectificatifs ou spécifiques fournis par l''employeur');

  -- Heures sup / RTT exonérées
  INSERT INTO documents_necessaires (sub_category_id, description) VALUES
    (heures_sup_id, 'Attestation employeur détaillant les heures supplémentaires exonérées');

  -- Revenus des associés et gérants (art.62 CGI)
  INSERT INTO documents_necessaires (sub_category_id, description) VALUES
    (associes_gerants_id, 'Relevés de rémunération du gérant ou de l''associé (compte 644)'),
    (associes_gerants_id, 'Liasse fiscale de la société (2031/2035)'),
    (associes_gerants_id, 'PV d''assemblée fixant la rémunération (le cas échéant)');

  -- Autres revenus imposables (chômage, préretraite)
  INSERT INTO documents_necessaires (sub_category_id, description) VALUES
    (autres_revenus_id, 'Attestations Pôle emploi / employeur'),
    (autres_revenus_id, 'Relevés d''indemnisation (chômage, préretraite)'),
    (autres_revenus_id, 'Relevés bancaires en cas de versement direct');

  -- Salaires de source étrangère
  INSERT INTO documents_necessaires (sub_category_id, description) VALUES
    (salaires_etranger_id, 'Bulletins étrangers'),
    (salaires_etranger_id, 'Formulaire 2047 rempli');

  -- Frais réels (déduction)
  INSERT INTO documents_necessaires (sub_category_id, description) VALUES
    (frais_reels_id, 'Dossier complet frais réels : justificatifs kilométriques, tickets carburant, factures repas, frais de double résidence');

  -- Pensions de source étrangère
  INSERT INTO documents_necessaires (sub_category_id, description) VALUES
    (pensions_etranger_id, 'Attestation pension étrangère'),
    (pensions_etranger_id, 'Formulaire 2047');
END $$;
