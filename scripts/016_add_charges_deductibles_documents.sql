-- Add documents for Charges déductibles (category 7, sub_category_id 39-43)

INSERT INTO documents_necessaires (sub_category_id, description, shortname) VALUES
-- Pensions alimentaires versées à des enfants majeurs (ID 39)
(39, 'Jugement + justificatifs de paiement (virements, chèques…).', 'Jugement + justificatifs paiement'),

-- Autres pensions alimentaires versées (enfants mineurs, ascendants..) (ID 40)
(40, 'Jugement de divorce, convention, accord écrit, plus relevés bancaires prouvant le paiement effectif des pensions alimentaires versées (enfants, ascendants, etc.).', 'Jugement + relevés bancaires'),

-- Cotisations sur les nouveaux plans d'épargne retraire (PER) (déductibles du revenu global) (ID 41)
(41, 'Attestations annuelles des gestionnaires de PER et autres plans épargne retraite indiquant les versements volontaires déductibles du revenu global.', 'Attestations PER'),

-- Cotisations PERP, PREFON, COREM, CGOS (ID 42)
(42, 'Cotisations PERP, PREFON, COREM, CGOS.', 'Attestations cotisations'),

-- Plafond de déduction (ID 43)
(43, 'Avis d''impôt de l''année précédente ou consultation de l''espace en ligne indiquant le plafond de déduction retraite (PER/PERP/Madelin) pour le déclarant 1.', 'Avis d''impôt N-1');
