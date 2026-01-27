-- Add documents for "Rentes viagères à titre onéreux" category

-- Insert documents for the two sub-categories of "Rentes viagères à titre onéreux"
-- Sub-category IDs should be 15 and 16 based on insertion order in script 003

INSERT INTO documents_necessaires (sub_category_id, description, shortname, created_at) VALUES
-- Rentes perçues (en fonction de l'âge)
(15, 'Attestation employeur indiquant les heures supplémentaires au-delà du plafond.', 'Attestation employeur heures sup', NOW()),

-- Rentes perçues par les non-résidents et rentes de source étrangère avec crédit d'impôt égal à l'impôt françcais (en fonction de l'âge)
(16, 'IFU précisant le crédit d''impôt étranger.', 'IFU crédit impôt étranger', NOW());
