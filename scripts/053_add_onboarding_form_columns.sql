-- ============================================
-- COLONNES ONBOARDING POUR TABLE CLIENTS
-- Formulaire d'inscription client complet
-- ============================================

-- ============================================
-- 1. IDENTITÉ (certaines colonnes existent déjà)
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_naissance DATE;
COMMENT ON COLUMN clients.date_naissance IS 'Date de naissance du client';

-- ============================================
-- 2. RÉSIDENCE FISCALE
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS resident_fiscal_france BOOLEAN DEFAULT NULL;
COMMENT ON COLUMN clients.resident_fiscal_france IS 'Le client est-il résident fiscal français ?';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS vecu_etranger BOOLEAN DEFAULT NULL;
COMMENT ON COLUMN clients.vecu_etranger IS 'Le client a-t-il vécu à l''étranger cette année ?';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS pays_etranger TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.pays_etranger IS 'Pays où le client a résidé à l''étranger';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS jours_etranger INTEGER DEFAULT NULL;
COMMENT ON COLUMN clients.jours_etranger IS 'Nombre de jours passés à l''étranger';

-- ============================================
-- 3. SITUATION FAMILIALE
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS situation_familiale TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.situation_familiale IS 'Statut: single, married, pacs, cohabiting, divorced, separated, widowed';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS nom_conjoint TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.nom_conjoint IS 'Nom complet du conjoint actuel';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_matrimonial TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.regime_matrimonial IS 'Régime: community, separation, participation';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS declaration_commune BOOLEAN DEFAULT NULL;
COMMENT ON COLUMN clients.declaration_commune IS 'Déclaration fiscale commune avec le conjoint ?';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS nom_ex_conjoint TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.nom_ex_conjoint IS 'Nom de l''ex-conjoint (si divorcé/séparé)';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS pension_versee BOOLEAN DEFAULT NULL;
COMMENT ON COLUMN clients.pension_versee IS 'Verse une pension alimentaire à l''ex-conjoint ?';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_pension_versee NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.montant_pension_versee IS 'Montant annuel de la pension alimentaire versée';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS changement_situation_familiale BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.changement_situation_familiale IS 'Changement de situation familiale cette année ?';

-- ============================================
-- 4. ENFANTS À CHARGE (stockés en JSONB)
-- children existe déjà, on ajoute un format plus complet
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS enfants_onboarding JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN clients.enfants_onboarding IS 'Liste des enfants: [{id, nom, date_naissance, garde: principale|alternee}]';

-- ============================================
-- 5. REVENUS - SALAIRES
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_salaire BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_salaire IS 'Le client perçoit des salaires';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS frais_salaire TEXT DEFAULT 'standard';
COMMENT ON COLUMN clients.frais_salaire IS 'Type de déduction: standard (10%) ou real (frais réels)';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_frais_reels NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.montant_frais_reels IS 'Montant des frais réels si applicable';

-- ============================================
-- 6. REVENUS - PENSIONS
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_pension BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_pension IS 'Le client perçoit des pensions (retraite, invalidité)';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS nombre_pensions INTEGER DEFAULT NULL;
COMMENT ON COLUMN clients.nombre_pensions IS 'Nombre de pensions perçues';

-- ============================================
-- 7. REVENUS - CHÔMAGE
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_chomage BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_chomage IS 'Le client a perçu des allocations chômage';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_debut_chomage DATE DEFAULT NULL;
COMMENT ON COLUMN clients.date_debut_chomage IS 'Date de début des allocations chômage';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_fin_chomage DATE DEFAULT NULL;
COMMENT ON COLUMN clients.date_fin_chomage IS 'Date de fin des allocations chômage';

-- ============================================
-- 8. REVENUS - INDÉPENDANTS (BIC/BNC)
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_activite_independante BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_activite_independante IS 'Le client a une activité indépendante';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS type_activite_independante TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.type_activite_independante IS 'Type d''activité: BIC, BNC, profession libérale, etc.';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_independant TEXT DEFAULT 'micro';
COMMENT ON COLUMN clients.regime_independant IS 'Régime fiscal: micro ou real';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS charges_independant NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.charges_independant IS 'Montant des charges si régime réel';

-- ============================================
-- 9. REVENUS - FONCIER (IMMOBILIER LOCATIF NU)
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_revenus_fonciers BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_revenus_fonciers IS 'Le client perçoit des revenus fonciers';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS nombre_biens_fonciers INTEGER DEFAULT NULL;
COMMENT ON COLUMN clients.nombre_biens_fonciers IS 'Nombre de biens en location nue';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_foncier TEXT DEFAULT 'micro';
COMMENT ON COLUMN clients.regime_foncier IS 'Régime: micro-foncier ou real';

-- ============================================
-- 10. REVENUS - LMNP (MEUBLÉ NON PROFESSIONNEL)
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_lmnp BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_lmnp IS 'Le client a des revenus LMNP';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS nombre_biens_lmnp INTEGER DEFAULT NULL;
COMMENT ON COLUMN clients.nombre_biens_lmnp IS 'Nombre de biens en LMNP';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_lmnp TEXT DEFAULT 'micro';
COMMENT ON COLUMN clients.regime_lmnp IS 'Régime LMNP: micro-BIC ou real';

-- ============================================
-- 11. REVENUS - REVENUS ÉTRANGERS
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_revenus_etrangers BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_revenus_etrangers IS 'Le client perçoit des revenus de source étrangère';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS pays_revenus_etrangers TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.pays_revenus_etrangers IS 'Pays source des revenus étrangers';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_revenus_etrangers NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.montant_revenus_etrangers IS 'Montant brut des revenus étrangers';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS impot_paye_etranger BOOLEAN DEFAULT NULL;
COMMENT ON COLUMN clients.impot_paye_etranger IS 'Impôt déjà payé à l''étranger ?';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_impot_etranger NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.montant_impot_etranger IS 'Montant de l''impôt payé à l''étranger';

-- ============================================
-- 12. REVENUS - INTÉRÊTS
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_interets BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_interets IS 'Le client perçoit des intérêts (livrets, comptes)';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS interets_pfu BOOLEAN DEFAULT NULL;
COMMENT ON COLUMN clients.interets_pfu IS 'Option pour le PFU (prélèvement forfaitaire unique) ?';

-- ============================================
-- 13. REVENUS - DIVIDENDES
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_dividendes BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_dividendes IS 'Le client perçoit des dividendes';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS dividendes_pfu BOOLEAN DEFAULT NULL;
COMMENT ON COLUMN clients.dividendes_pfu IS 'Option pour le PFU sur dividendes ?';

-- ============================================
-- 14. REVENUS - CRYPTO-MONNAIES
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_crypto BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_crypto IS 'Le client a des plus-values crypto';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS nombre_transactions_crypto TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.nombre_transactions_crypto IS 'Volume approximatif de transactions';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS plateformes_crypto TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.plateformes_crypto IS 'Plateformes utilisées (Binance, Coinbase, etc.)';

-- ============================================
-- 15. CHARGES & DÉDUCTIONS - DONS
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_dons BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_dons IS 'Le client a fait des dons à des associations';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_dons NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.montant_dons IS 'Montant total des dons déductibles';

-- ============================================
-- 16. CHARGES & DÉDUCTIONS - GARDE D'ENFANTS
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_frais_garde BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_frais_garde IS 'Le client a des frais de garde d''enfants';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_frais_garde NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.montant_frais_garde IS 'Montant annuel des frais de garde';

-- ============================================
-- 17. CHARGES & DÉDUCTIONS - SERVICES À LA PERSONNE
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_services_personne BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_services_personne IS 'Le client emploie des services à la personne';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS type_services_personne TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.type_services_personne IS 'Type de service: ménage, jardinage, aide, etc.';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_services_personne NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.montant_services_personne IS 'Montant annuel des services à la personne';

-- ============================================
-- 18. CHARGES & DÉDUCTIONS - PENSION ALIMENTAIRE VERSÉE
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS a_deduction_pension BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.a_deduction_pension IS 'Le client verse une pension alimentaire déductible';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS beneficiaire_pension TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.beneficiaire_pension IS 'Nom du bénéficiaire de la pension';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_deduction_pension NUMERIC(12,2) DEFAULT NULL;
COMMENT ON COLUMN clients.montant_deduction_pension IS 'Montant annuel de la pension versée';

-- ============================================
-- 19. CONFIRMATIONS & STATUT
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_exactitude_confirmee BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.onboarding_exactitude_confirmee IS 'Client confirme l''exactitude des informations';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_traitement_accepte BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN clients.onboarding_traitement_accepte IS 'Client accepte le traitement des données';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_soumis_le TIMESTAMPTZ DEFAULT NULL;
COMMENT ON COLUMN clients.onboarding_soumis_le IS 'Date/heure de soumission du formulaire onboarding';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_reference TEXT DEFAULT NULL;
COMMENT ON COLUMN clients.onboarding_reference IS 'Numéro de référence du dossier onboarding';

-- ============================================
-- 20. TABLE FICHIERS ONBOARDING
-- ============================================
CREATE TABLE IF NOT EXISTS fichiers_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nom_fichier TEXT NOT NULL,
  taille_octets INTEGER NOT NULL,
  type_mime TEXT,
  url_stockage TEXT,
  categorie TEXT,
  statut TEXT DEFAULT 'uploaded',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE fichiers_onboarding IS 'Fichiers uploadés par le client lors de l''onboarding';
COMMENT ON COLUMN fichiers_onboarding.categorie IS 'Catégorie du document: identity, salary, pension, etc.';
COMMENT ON COLUMN fichiers_onboarding.statut IS 'Statut: uploaded, validated, rejected';

-- Enable RLS
ALTER TABLE fichiers_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Accès public pour les clients via leur UUID
CREATE POLICY "Clients can view their own onboarding files" ON fichiers_onboarding
  FOR SELECT USING (true);

CREATE POLICY "Clients can insert their own onboarding files" ON fichiers_onboarding
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Clients can delete their own onboarding files" ON fichiers_onboarding
  FOR DELETE USING (true);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_fichiers_onboarding_client_id ON fichiers_onboarding(client_id);
