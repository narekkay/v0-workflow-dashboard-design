-- Add documents for "Capitaux mobiliers" subcategories
-- Category ID 4 has subcategories with IDs starting from 17

INSERT INTO documents_necessaires (sub_category_id, description, shortname) VALUES
-- Revenus des actions et parts (abattement de 40% si option barème) - ID 17
(17, 'IFU banque / courtier indiquant les dividendes.', 'IFU dividendes'),

-- Dividendes imposables des titres non cotés détenus dans le PEA ou le PEA-PME - ID 18
(18, 'Aucune pièce (choix fiscal PFU/barème).', 'Aucun justificatif'),

-- Intérêts et autre produits de placement à revenu fixe - ID 19
(19, 'IFU intérêts de comptes à terme ou placements.', 'IFU intérêts'),

-- Autres revenus distribués - ID 20
(20, 'IFU distributions exceptionnelles ou revenus réputés distribués.', 'IFU distributions'),

-- Intérets des prêts participatifs et des minibons - ID 21
(21, 'Imprimé fiscal unique (IFU) ou relevés fournis par les plateformes de financement participatif / l''émetteur des minibons indiquant les intérêts imposables.', 'IFU prêts participatifs'),

-- Intérets imposables des obligations remboursables en actions détenues dans le PEA-PME - ID 22
(22, 'IFU ou relevés de l''établissement financier gérant le PEA-PME, précisant les intérêts d''obligations remboursables en actions.', 'IFU PEA-PME'),

-- Produits des plans d'épargne retraire -sortie en capital - ID 23
(23, 'Relevés des organismes de PER / produits assimilés indiquant la part de capital imposable au titre de la sortie en capital.', 'Relevés PER capital'),

-- Frais et charges (déductibles si option barème) - ID 24
(24, 'Justificatifs des frais de garde de titres, commissions de gestion, d''abonnement ou de courtage se rapportant exclusivement aux revenus de capitaux mobiliers.', 'Justificatifs frais'),

-- Crédits d'impôt sur valeurs étrangères - ID 25
(25, 'Relevés détaillés des établissements teneurs de comptes indiquant, pays par pays, le montant des crédits d''impôt étrangers attachés aux dividendes ou intérêts.', 'Relevés crédits impôt'),

-- Prélèvement forfaitaire non libératoire déjà versé - ID 26
(26, 'IFU mentionnant le prélèvement forfaitaire non libératoire déjà prélevé, ainsi que les avis d''opérés des établissements payeurs le cas échéant.', 'IFU prélèvement'),

-- Autres revenus soumis à un prélèvement ou une retenue libératoire - ID 27
(27, 'IFU ou attestations des organismes payeurs indiquant la nature et le montant des revenus soumis à un prélèvement ou à une retenue libératoire définitive.', 'IFU retenue libératoire'),

-- Option barème (RCM) - ID 28
(28, 'Aucun justificatif spécifique : la case matérialise un choix d''imposition et IFU.', 'IFU option barème');
