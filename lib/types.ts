export interface Client {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
  custom_fields?: Array<{ name: string; value: string }>
  children?: Array<{ first_name: string; last_name: string; date_of_birth: string }>
  archived?: boolean
  is_complex?: boolean
  convention_signed?: boolean
  convention_sent?: boolean
  onboarding_form_pending?: boolean
  onboarding_form_completed?: boolean
  convention_sent_at?: string
  convention_signed_at?: string
  onboarding_form_pending_at?: string
  onboarding_form_completed_at?: string
  onboarding_status?: "en_attente" | "soumis" | "en_revision" | "confirme"
  onboarding_soumis_le?: string
  onboarding_confirme_le?: string
  onboarding_reference?: string
  onboarding_notes_avocat?: string
  // All onboarding form fields
  date_naissance?: string
  resident_fiscal_france?: boolean
  vecu_etranger?: boolean
  pays_etranger?: string
  jours_etranger?: number
  situation_familiale?: string
  nom_conjoint?: string
  prenom_conjoint?: string
  date_naissance_conjoint?: string
  numero_fiscal_conjoint?: string
  regime_matrimonial?: string
  declaration_commune?: boolean
  changement_situation_familiale?: boolean
  a_salaire?: boolean
  a_pension?: boolean
  a_activite_independante?: boolean
  a_revenus_fonciers?: boolean
  a_lmnp?: boolean
  a_crypto?: boolean
  a_revenus_etrangers?: boolean
  a_dons?: boolean
  montant_dons?: number
  a_frais_garde?: boolean
  a_services_personne?: boolean
  a_deduction_pension?: boolean
  onboarding_exactitude_confirmee?: boolean
  onboarding_traitement_accepte?: boolean
}

export interface TaxProfile {
  id: string
  client_id: string
  revenue_type: string
  revenue_amount?: number
  tax_year: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string
  user_id: string
  name: string
  type: string
  url: string
  size?: number
  uploaded_at: string
}
