-- Add documents for "Revenus fonciers" category
-- Revenus fonciers is category 6, with sub-categories starting at ID 32

INSERT INTO documents_necessaires (sub_category_id, description, shortname) VALUES
-- Micro-foncier (≤ 15 000 €) - ID 32
(32, 'Total des loyers encaissés : quittances, relevés bancaires, bail.', 'Quittances et loyers'),

-- dont recettes de source étrangère ouvrant droit à un crédit d'impôt égal à l'impôt français - ID 33
(33, 'Déclaration 2047 et justificatifs des loyers étrangers (baux, quittances, attestations de gestion) indiquant les recettes ouvrant droit au crédit d''impôt égal.', 'Déclaration 2047 + loyers étrangers'),

-- Résultat foncier (réel) — bénéfice - ID 34
(34, 'Déclaration 2044 + factures de travaux + appels de charges + intérêts d''emprunt + avis taxe foncière (hors TEOM).', 'Déclaration 2044 + justificatifs'),

-- dont revenus de source étrangère ouvrant droit à un crédit d'impôt égal à l'impôt français - ID 35
(35, 'Déclaration 2047, 2044 et justificatifs des revenus fonciers de source étrangère (baux, attestations) pour lesquels s''applique un crédit d''impôt égal.', 'Déclarations 2047/2044 étrangers'),

-- Déficit imputable sur les revenus fonciers - ID 36
(36, 'Déclaration 2044 (ou 2044-SPE) et annexes de calcul du déficit foncier, avec factures de travaux, intérêts d''emprunt, charges de copropriété.', 'Déclaration 2044 + déficit'),

-- Déficit imputable sur le revenu global - ID 37
(37, 'Déclaration 2044 montrant le déficit + justificatifs correspondants.', 'Déclaration 2044 déficit global'),

-- Déficits antérieurs non encore imputés - ID 38
(38, 'Déclarations 2044 des années antérieures faisant apparaître les déficits non encore imputés, plus l''avis d''impôt récapitulant les déficits reportables.', 'Déclarations 2044 antérieures');
