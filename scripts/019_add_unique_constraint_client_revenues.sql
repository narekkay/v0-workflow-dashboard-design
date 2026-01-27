-- Remove duplicate entries before adding unique constraint
-- First, delete older duplicates keeping only the most recent entry for each client-category pair
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY client_id, category_id ORDER BY created_at DESC) as rn
  FROM client_revenues
)
DELETE FROM client_revenues 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint to ensure each client can only have one revenue type per category
ALTER TABLE client_revenues 
ADD CONSTRAINT unique_client_category UNIQUE (client_id, category_id);
