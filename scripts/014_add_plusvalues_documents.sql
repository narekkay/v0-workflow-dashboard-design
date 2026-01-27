-- Add documents for "Plus-values mobilières" category
-- Category 5: Plus-values mobilières has 3 sub-categories (IDs 29-31)

INSERT INTO documents_necessaires (sub_category_id, description, shortname) VALUES
-- Gains nets de cession (ID 29)
(29, 'IFU + relevé d''opérations titres + justificatifs prix d''achat/vente.', 'IFU et relevé titres'),

-- Plus-value avant abattement (ID 30)
(30, 'Avis d''opéré et relevés de gains fournis par les intermédiaires financiers indiquant la plus-value brute réalisée avant application des abattements éventuels.', 'Avis d''opéré et relevé gains'),

-- Moins-values nettes (ID 31)
(31, 'Historique des moins-values + relevés du courtier.', 'Historique moins-values');
