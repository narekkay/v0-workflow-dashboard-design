-- Remove redundant label column from case_labels
-- The label can be retrieved via JOIN with categories_revenus_sub

ALTER TABLE case_labels DROP COLUMN IF EXISTS label;
