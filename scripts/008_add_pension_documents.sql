-- Add documents nécessaires for pension and retirement categories

DO $$
DECLARE
  pensions_retraites_id BIGINT;
  pensions_capital_75_id BIGINT;
  pensions_capital_per_id BIGINT;
  pensions_invalidite_id BIGINT;
  pensions_alimentaires_id BIGINT;
  pensions_non_residents_id BIGINT;
BEGIN
  -- Get sub_category IDs for pension categories
  SELECT id INTO pensions_retraites_id FROM categories_revenus_sub WHERE nom = 'Pensions/retraites imposables';
  SELECT id INTO pensions_capital_75_id FROM categories_revenus_sub WHERE nom = 'Pensions de retraite en capital taxables à 7,5%';
  SELECT id INTO pensions_capital_per_id FROM categories_revenus_sub WHERE nom = 'Pensions en capital des plans d''épargne retraite';
  SELECT id INTO pensions_invalidite_id FROM categories_revenus_sub WHERE nom = 'Pensions d''invalidité';
  SELECT id INTO pensions_alimentaires_id FROM categories_revenus_sub WHERE nom = 'Pensions alimentaires perçues';
  SELECT id INTO pensions_non_residents_id FROM categories_revenus_sub WHERE nom = 'Pensions perçues par les non-résidents et pensions de source étrangère avec crédit d''impôt égal à l''impôt français';

  -- Insert documents for pension categories
  INSERT INTO documents_necessaires (sub_category_id, description, shortname) VALUES
    (
      pensions_retraites_id,
      'Attestation fiscale annuelle de la caisse de retraite',
      'Attestation fiscale retraite'
    ),
    (
      pensions_capital_75_id,
      'Attestation ou relevé de la pension ou rente imposable',
      'Attestation pension/rente'
    ),
    (
      pensions_capital_per_id,
      'Attestations des organismes de retraite ou de PER précisant le montant de la sortie en capital imposable et la part correspondant aux versements déductibles',
      'Attestations PER'
    ),
    (
      pensions_invalidite_id,
      'Notifications ou attestations de la caisse d''assurance maladie ou de l''organisme payeur mentionnant le montant annuel des pensions d''invalidité',
      'Attestations invalidité'
    ),
    (
      pensions_alimentaires_id,
      'Jugement de divorce ou de séparation, convention homologuée, accord écrit fixant la pension, plus relevés bancaires ou attestations CAF prouvant les sommes effectivement perçues',
      'Jugement + relevés'
    ),
    (
      pensions_non_residents_id,
      'Attestation de la caisse étrangère ou de l''organisme payeur, justificatifs du montant brut, et le cas échéant formulaire 2047 pour les pensions de source étrangère',
      'Attestation étrangère + 2047'
    );
END $$;
