-- Ajout du statut d'onboarding pour le suivi par l'avocat
-- Valeurs possibles: 'en_attente', 'soumis', 'en_revision', 'confirme'

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'en_attente';

-- Mettre à jour les clients qui ont déjà complété leur onboarding
UPDATE clients 
SET onboarding_status = 'soumis' 
WHERE onboarding_form_completed = true AND onboarding_status = 'en_attente';

-- Ajouter la date de confirmation par l'avocat
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS onboarding_confirme_le TIMESTAMPTZ;

-- Ajouter des notes de l'avocat sur l'onboarding
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS onboarding_notes_avocat TEXT;
