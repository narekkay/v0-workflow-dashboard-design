"use server"

import { createClient } from "@/lib/supabase/server"

interface Child {
  id: string
  name: string
  birthDate: string
  custody: "principale" | "alternee"
}

interface OnboardingFormData {
  // Identité
  firstName: string
  lastName: string
  birthDate: string
  address: string
  
  // Résidence fiscale
  taxResident: boolean | null
  livedAbroad: boolean | null
  abroadCountry: string
  abroadDays: string
  
  // Situation familiale
  familyStatus: string
  spouseName: string
  matrimonialRegime: string
  jointDeclaration: boolean | null
  exSpouseName: string
  alimonyPaid: boolean | null
  alimonyAmount: string
  children: Child[]
  familyChange: boolean
  
  // Revenus
  salary: boolean
  salaryExpenses: "standard" | "real"
  salaryExpensesAmount: string
  pension: boolean
  pensionCount: string
  unemployment: boolean
  unemploymentStart: string
  unemploymentEnd: string
  independent: boolean
  independentType: string
  independentRegime: "real" | "micro"
  independentCharges: string
  foncier: boolean
  foncierCount: string
  foncierRegime: "micro" | "real"
  lmnp: boolean
  lmnpCount: string
  lmnpRegime: "micro" | "real"
  foreign: boolean
  foreignCountry: string
  foreignAmount: string
  foreignTaxPaid: boolean | null
  foreignTaxAmount: string
  interest: boolean
  interestPfu: boolean | null
  dividends: boolean
  dividendsPfu: boolean | null
  crypto: boolean
  cryptoTransactions: string
  cryptoPlatforms: string
  
  // Charges & Déductions
  donations: boolean
  donationsAmount: string
  childcare: boolean
  childcareAmount: string
  homeServices: boolean
  homeServicesType: string
  homeServicesAmount: string
  alimonyDeduction: boolean
  alimonyBeneficiary: string
  alimonyDeductionAmount: string
  
  // Confirmations
  accuracy: boolean
  processing: boolean
}

interface FileData {
  id: string
  name: string
  size: number
  base64: string
  type: string
}

// Étape 1: Sauvegarder les informations d'identité
export async function saveIdentity(clientId: string, data: OnboardingFormData) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("clients")
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      date_naissance: data.birthDate || null,
      address: data.address,
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur sauvegarde identité: ${error.message}`)
  return { success: true }
}

// Étape 2: Sauvegarder la résidence fiscale
export async function saveResidenceFiscale(clientId: string, data: OnboardingFormData) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("clients")
    .update({
      resident_fiscal_france: data.taxResident,
      vecu_etranger: data.livedAbroad,
      pays_etranger: data.abroadCountry || null,
      jours_etranger: data.abroadDays ? parseInt(data.abroadDays) : null,
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur sauvegarde résidence fiscale: ${error.message}`)
  return { success: true }
}

// Étape 3: Sauvegarder la situation familiale
export async function saveSituationFamiliale(clientId: string, data: OnboardingFormData) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("clients")
    .update({
      situation_familiale: data.familyStatus || null,
      nom_conjoint: data.spouseName || null,
      regime_matrimonial: data.matrimonialRegime || null,
      declaration_commune: data.jointDeclaration,
      nom_ex_conjoint: data.exSpouseName || null,
      pension_versee: data.alimonyPaid,
      montant_pension_versee: data.alimonyAmount ? parseFloat(data.alimonyAmount) : null,
      changement_situation_familiale: data.familyChange,
      enfants_onboarding: data.children.length > 0 ? JSON.stringify(data.children) : "[]",
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur sauvegarde situation familiale: ${error.message}`)
  return { success: true }
}

// Étape 4: Sauvegarder les revenus
export async function saveRevenus(clientId: string, data: OnboardingFormData) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("clients")
    .update({
      // Salaires
      a_salaire: data.salary,
      frais_salaire: data.salaryExpenses,
      montant_frais_reels: data.salaryExpensesAmount ? parseFloat(data.salaryExpensesAmount) : null,
      
      // Pensions
      a_pension: data.pension,
      nombre_pensions: data.pensionCount ? parseInt(data.pensionCount) : null,
      
      // Chômage
      a_chomage: data.unemployment,
      date_debut_chomage: data.unemploymentStart || null,
      date_fin_chomage: data.unemploymentEnd || null,
      
      // Activité indépendante
      a_activite_independante: data.independent,
      type_activite_independante: data.independentType || null,
      regime_independant: data.independentRegime,
      charges_independant: data.independentCharges ? parseFloat(data.independentCharges) : null,
      
      // Revenus fonciers
      a_revenus_fonciers: data.foncier,
      nombre_biens_fonciers: data.foncierCount ? parseInt(data.foncierCount) : null,
      regime_foncier: data.foncierRegime,
      
      // LMNP
      a_lmnp: data.lmnp,
      nombre_biens_lmnp: data.lmnpCount ? parseInt(data.lmnpCount) : null,
      regime_lmnp: data.lmnpRegime,
      
      // Revenus étrangers
      a_revenus_etrangers: data.foreign,
      pays_revenus_etrangers: data.foreignCountry || null,
      montant_revenus_etrangers: data.foreignAmount ? parseFloat(data.foreignAmount) : null,
      impot_paye_etranger: data.foreignTaxPaid,
      montant_impot_etranger: data.foreignTaxAmount ? parseFloat(data.foreignTaxAmount) : null,
      
      // Intérêts
      a_interets: data.interest,
      interets_pfu: data.interestPfu,
      
      // Dividendes
      a_dividendes: data.dividends,
      dividendes_pfu: data.dividendsPfu,
      
      // Crypto
      a_crypto: data.crypto,
      nombre_transactions_crypto: data.cryptoTransactions || null,
      plateformes_crypto: data.cryptoPlatforms || null,
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur sauvegarde revenus: ${error.message}`)
  return { success: true }
}

// Étape 5: Sauvegarder les charges et déductions
export async function saveChargesDeductions(clientId: string, data: OnboardingFormData) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("clients")
    .update({
      // Dons
      a_dons: data.donations,
      montant_dons: data.donationsAmount ? parseFloat(data.donationsAmount) : null,
      
      // Garde enfants
      a_frais_garde: data.childcare,
      montant_frais_garde: data.childcareAmount ? parseFloat(data.childcareAmount) : null,
      
      // Services à la personne
      a_services_personne: data.homeServices,
      type_services_personne: data.homeServicesType || null,
      montant_services_personne: data.homeServicesAmount ? parseFloat(data.homeServicesAmount) : null,
      
      // Pension alimentaire déductible
      a_deduction_pension: data.alimonyDeduction,
      beneficiaire_pension: data.alimonyBeneficiary || null,
      montant_deduction_pension: data.alimonyDeductionAmount ? parseFloat(data.alimonyDeductionAmount) : null,
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur sauvegarde charges: ${error.message}`)
  return { success: true }
}

// Étape 6: Sauvegarder les fichiers
export async function saveFiles(clientId: string, files: FileData[]) {
  if (files.length === 0) return { success: true, count: 0 }
  
  const supabase = await createClient()
  
  // Supprimer les anciens fichiers du client
  await supabase
    .from("fichiers_onboarding")
    .delete()
    .eq("client_id", clientId)
  
  // Insérer les nouveaux fichiers
  const filesToInsert = files.map(f => ({
    client_id: clientId,
    nom_fichier: f.name,
    taille_octets: f.size,
    type_mime: f.type,
    url_stockage: f.base64, // Pour le moment on stocke en base64, idéalement on utiliserait Blob storage
    statut: "uploaded"
  }))
  
  const { error } = await supabase
    .from("fichiers_onboarding")
    .insert(filesToInsert)
  
  if (error) throw new Error(`Erreur sauvegarde fichiers: ${error.message}`)
  return { success: true, count: files.length }
}

// Étape 7: Finaliser la soumission
export async function finalizeSubmission(clientId: string, data: OnboardingFormData) {
  const supabase = await createClient()
  
  const referenceNumber = `FIS-2024-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  
  const { error } = await supabase
    .from("clients")
    .update({
      onboarding_exactitude_confirmee: data.accuracy,
      onboarding_traitement_accepte: data.processing,
      onboarding_soumis_le: new Date().toISOString(),
      onboarding_reference: referenceNumber,
      onboarding_form_completed: true,
      onboarding_status: "soumis",
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur finalisation: ${error.message}`)
  
  // Nettoyer le localStorage côté client sera fait après le retour
  return { success: true, referenceNumber }
}

// Action pour l'avocat: Confirmer l'onboarding
export async function confirmOnboarding(clientId: string, notes?: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("clients")
    .update({
      onboarding_status: "confirme",
      onboarding_confirme_le: new Date().toISOString(),
      onboarding_notes_avocat: notes || null,
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur confirmation: ${error.message}`)
  return { success: true }
}

// Action pour l'avocat: Mettre en révision
export async function requestRevision(clientId: string, notes: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("clients")
    .update({
      onboarding_status: "en_revision",
      onboarding_notes_avocat: notes,
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur demande révision: ${error.message}`)
  return { success: true }
}

// Action pour récupérer les données onboarding d'un client
export async function getOnboardingData(clientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single()
  
  if (error) throw new Error(`Erreur récupération données: ${error.message}`)
  return data
}

// Action pour mettre à jour les notes de l'avocat
export async function updateOnboardingNotes(clientId: string, notes: string | null) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("clients")
    .update({
      onboarding_notes_avocat: notes,
    })
    .eq("id", clientId)
  
  if (error) throw new Error(`Erreur mise à jour notes: ${error.message}`)
  return { success: true }
}
