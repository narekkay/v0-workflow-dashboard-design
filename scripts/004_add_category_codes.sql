-- Add code column to categories_revenus and update with proper codes
ALTER TABLE categories_revenus ADD COLUMN IF NOT EXISTS code TEXT;

-- Update existing categories with their codes
UPDATE categories_revenus SET code = '2042' WHERE nom = 'Traitements & salaires';
UPDATE categories_revenus SET code = '2042' WHERE nom = 'Pensions & rentes';
UPDATE categories_revenus SET code = '2042' WHERE nom = 'Rentes viagères à titre onéreux';
UPDATE categories_revenus SET code = '2042 C' WHERE nom = 'Capitaux mobiliers';
UPDATE categories_revenus SET code = '2042 C' WHERE nom = 'Plus-values mobilières';
UPDATE categories_revenus SET code = '2044' WHERE nom = 'Revenus fonciers';
UPDATE categories_revenus SET code = '2042' WHERE nom = 'Charges déductibles';
UPDATE categories_revenus SET code = '2042 RICI' WHERE nom = 'Réductions/crédits d''impôt - Dons';
UPDATE categories_revenus SET code = '2042 RICI' WHERE nom = 'Crédits / Réductions';
UPDATE categories_revenus SET code = '2042' WHERE nom = 'Prélèvement à la source';
