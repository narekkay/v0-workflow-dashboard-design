"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Check, ChevronDown, FileText, Trash2, Upload, Clock, CheckCircle2, Plus, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface Child {
  firstName: string
  lastName: string
  birthDate: string
  residence: string // "principal" | "alternee" | "autre"
  handicap: boolean
}

interface ExSpouse {
  firstName: string
  lastName: string
  pensionVersee: string
  pensionRecue: string
}

interface FamilyEvent {
  type: string
  date: string
  description: string
}

interface Document {
  id: string
  name: string
  status: "received" | "missing" | "optional"
  category: string
}

interface ChargeItem {
  type: string
  amount: string
  description: string
}

interface FormData {
  // Section 1: Identité & coordonnées
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  fiscalAddress: string
  phone: string
  email: string
  
  // Section 2: Résidence fiscale & international
  fiscalResidence: string // "france" | "etranger" | "mixte"
  residenceCountry: string
  livedAbroad: boolean
  abroadCountries: string[]
  foreignIncome: boolean
  foreignIncomeCountries: string[]
  
  // Section 3: Situation familiale
  maritalStatus: string
  marriageDate: string
  pacsDate: string
  separationDate: string
  
  // Section 4: Relations du foyer (conjoint actuel)
  spouseFirstName: string
  spouseLastName: string
  spouseBirthDate: string
  spouseBirthPlace: string
  spouseNif: string
  jointDeclaration: boolean
  
  // Section 5: Enfants & personnes à charge
  children: Child[]
  dependents: Array<{ firstName: string; lastName: string; relationship: string; birthDate: string }>
  
  // Section 6: Pensions & obligations
  exSpouses: ExSpouse[]
  pensionAlimentaireVersee: boolean
  pensionAlimentaireRecue: boolean
  prestationCompensatoire: boolean
  
  // Section 7: Événements familiaux
  familyEvents: FamilyEvent[]
  hasMarriage: boolean
  hasDivorce: boolean
  hasBirth: boolean
  hasDeath: boolean
  
  // Section 8: Panorama Revenus & IFI
  hasSalaires: boolean
  hasPensions: boolean
  hasBicBnc: boolean
  hasRevenusLocatifs: boolean
  hasDividendes: boolean
  hasPlusValues: boolean
  hasCrypto: boolean
  hasRevenusEtrangers: boolean
  hasIfi: boolean
  ifiEstimation: string
  
  // Section 9: Charges / réductions / crédits
  charges: ChargeItem[]
  hasDonsOrganismes: boolean
  hasFraisGarde: boolean
  hasEmploiDomicile: boolean
  hasInvestissementLocatif: boolean
  hasFraisScolarite: boolean
  
  // Section 10: Documents
  documents: Document[]
  
  // Section 11: Relecture & soumission
  dataConfirmed: boolean
  termsAccepted: boolean
}

type SaveStatus = "saved" | "saving" | "error"

// Custom accordion section component
function AccordionSection({ 
  id, 
  title, 
  subtitle, 
  isComplete, 
  isOpen, 
  onToggle, 
  children 
}: { 
  id: string
  title: string
  subtitle: string
  isComplete: boolean
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb]">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#f9fafb] transition-colors duration-150 rounded-xl"
      >
        <div className="flex items-center gap-4">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-150 ${
            isComplete ? "bg-[#d1fae5]" : "bg-[#f3f4f6]"
          }`}>
            {isComplete ? (
              <Check className="h-3.5 w-3.5 text-[#10b981]" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
            )}
          </div>
          <div className="text-left">
            <p className="font-semibold text-[15px] text-[#111827] tracking-tight">{title}</p>
            <p className="text-[13px] text-[#6b7280] mt-0.5">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-[#9ca3af] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-6 pb-6 pl-16">
          {children}
        </div>
      </div>
    </div>
  )
}

// Toggle button component (Oui/Non)
function ToggleGroup({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex bg-[#f3f4f6] rounded-lg p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 ${
          value 
            ? "bg-white text-[#111827] shadow-sm" 
            : "text-[#6b7280] hover:text-[#111827]"
        }`}
      >
        Oui
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 ${
          !value 
            ? "bg-white text-[#111827] shadow-sm" 
            : "text-[#6b7280] hover:text-[#111827]"
        }`}
      >
        Non
      </button>
    </div>
  )
}

// Radio pill component
function RadioPills({ 
  options, 
  value, 
  onChange 
}: { 
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void 
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-[13px] font-medium rounded-full border transition-all duration-150 ${
            value === option.value
              ? "bg-[#111827] text-white border-[#111827]"
              : "bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#9ca3af] hover:text-[#111827]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Checkbox item for income/charges
function CheckboxItem({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void 
}) {
  return (
    <label className="flex items-start gap-3 p-4 rounded-lg border border-[#e5e7eb] hover:border-[#9ca3af] cursor-pointer transition-colors duration-150">
      <Checkbox 
        checked={checked} 
        onCheckedChange={onChange}
        className="mt-0.5"
      />
      <div>
        <p className="text-[14px] font-medium text-[#111827]">{label}</p>
        {description && <p className="text-[12px] text-[#6b7280] mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

// Document status badge
function DocBadge({ status }: { status: "received" | "missing" | "optional" }) {
  const styles = {
    received: "bg-[#d1fae5] text-[#10b981]",
    missing: "bg-[#fef3c7] text-[#f59e0b]",
    optional: "bg-[#f3f4f6] text-[#6b7280]",
  }
  const labels = {
    received: "REÇU",
    missing: "MANQUANT",
    optional: "OPTIONNEL",
  }
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

// Info callout
function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 pl-4 border-l-4 border-[#111827] bg-[#f9fafb] py-3 pr-4 rounded-r-lg">
      <p className="text-[13px] text-[#6b7280] leading-relaxed">{children}</p>
    </div>
  )
}

// Field label with required indicator
function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-[13px] font-medium text-[#374151] mb-1.5 block">
      {children}
      {required && <span className="text-[#ef4444] ml-0.5">*</span>}
    </Label>
  )
}

export default function ClientOnboardingPage() {
  const params = useParams()
  const clientId = params.uuid as string
  
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState("Nouveau Dossier")
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const [submitted, setSubmitted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [openSection, setOpenSection] = useState<string | null>("identity")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const [formData, setFormData] = useState<FormData>({
    // Section 1
    firstName: "",
    lastName: "",
    birthDate: "",
    birthPlace: "",
    fiscalAddress: "",
    phone: "",
    email: "",
    // Section 2
    fiscalResidence: "france",
    residenceCountry: "France",
    livedAbroad: false,
    abroadCountries: [],
    foreignIncome: false,
    foreignIncomeCountries: [],
    // Section 3
    maritalStatus: "celibataire",
    marriageDate: "",
    pacsDate: "",
    separationDate: "",
    // Section 4
    spouseFirstName: "",
    spouseLastName: "",
    spouseBirthDate: "",
    spouseBirthPlace: "",
    spouseNif: "",
    jointDeclaration: true,
    // Section 5
    children: [],
    dependents: [],
    // Section 6
    exSpouses: [],
    pensionAlimentaireVersee: false,
    pensionAlimentaireRecue: false,
    prestationCompensatoire: false,
    // Section 7
    familyEvents: [],
    hasMarriage: false,
    hasDivorce: false,
    hasBirth: false,
    hasDeath: false,
    // Section 8
    hasSalaires: false,
    hasPensions: false,
    hasBicBnc: false,
    hasRevenusLocatifs: false,
    hasDividendes: false,
    hasPlusValues: false,
    hasCrypto: false,
    hasRevenusEtrangers: false,
    hasIfi: false,
    ifiEstimation: "",
    // Section 9
    charges: [],
    hasDonsOrganismes: false,
    hasFraisGarde: false,
    hasEmploiDomicile: false,
    hasInvestissementLocatif: false,
    hasFraisScolarite: false,
    // Section 10
    documents: [],
    // Section 11
    dataConfirmed: false,
    termsAccepted: false,
  })

  // Calculate progress based on filled sections
  const calculateProgress = useCallback(() => {
    let completed = 0
    const total = 11
    
    // Section 1: Identity
    if (formData.firstName && formData.lastName && formData.birthDate && formData.fiscalAddress) completed++
    
    // Section 2: Residence
    if (formData.fiscalResidence) completed++
    
    // Section 3: Situation familiale
    if (formData.maritalStatus) completed++
    
    // Section 4: Relations du foyer
    const needsSpouse = ["marie", "pacse"].includes(formData.maritalStatus)
    if (!needsSpouse || (formData.spouseFirstName && formData.spouseLastName)) completed++
    
    // Section 5: Enfants
    completed++ // Always complete (can be empty)
    
    // Section 6: Pensions
    completed++ // Always complete
    
    // Section 7: Events
    completed++ // Always complete
    
    // Section 8: Revenus
    completed++ // Always complete (at least reviewed)
    
    // Section 9: Charges
    completed++ // Always complete
    
    // Section 10: Documents
    completed++ // Always complete
    
    // Section 11: Confirmation
    if (formData.dataConfirmed && formData.termsAccepted) completed++
    
    return Math.round((completed / total) * 100)
  }, [formData])

  useEffect(() => {
    setProgress(calculateProgress())
  }, [formData, calculateProgress])

  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      setClientName(`${formData.firstName} ${formData.lastName}`.trim())
    } else {
      setClientName("Nouveau Dossier")
    }
  }, [formData.firstName, formData.lastName])

  // Load client data
  useEffect(() => {
    async function loadClient() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .maybeSingle()

      if (error) {
        console.error("Error loading client:", error)
        setLoading(false)
        return
      }

      if (data) {
        setFormData(prev => ({
          ...prev,
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          birthDate: data.birth_date || "",
          birthPlace: data.birth_place || "",
          fiscalAddress: data.fiscal_address || data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          fiscalResidence: data.fiscal_residence || "france",
          residenceCountry: data.residence_country || "France",
          livedAbroad: data.lived_abroad || false,
          abroadCountries: data.abroad_countries || [],
          foreignIncome: data.foreign_income || false,
          foreignIncomeCountries: data.foreign_income_countries || [],
          maritalStatus: data.marital_status || "celibataire",
          marriageDate: data.marriage_date || "",
          pacsDate: data.pacs_date || "",
          separationDate: data.separation_date || "",
          spouseFirstName: data.spouse_first_name || "",
          spouseLastName: data.spouse_last_name || "",
          spouseBirthDate: data.spouse_birth_date || "",
          spouseBirthPlace: data.spouse_birth_place || "",
          spouseNif: data.spouse_nif || "",
          jointDeclaration: data.joint_declaration ?? true,
          children: data.children || [],
          dependents: data.dependents || [],
          exSpouses: data.ex_spouses || [],
          pensionAlimentaireVersee: data.pension_alimentaire_versee || false,
          pensionAlimentaireRecue: data.pension_alimentaire_recue || false,
          prestationCompensatoire: data.prestation_compensatoire || false,
          familyEvents: data.family_events || [],
          hasMarriage: data.has_marriage || false,
          hasDivorce: data.has_divorce || false,
          hasBirth: data.has_birth || false,
          hasDeath: data.has_death || false,
          hasSalaires: data.has_salaires || false,
          hasPensions: data.has_pensions || false,
          hasBicBnc: data.has_bic_bnc || false,
          hasRevenusLocatifs: data.has_revenus_locatifs || false,
          hasDividendes: data.has_dividendes || false,
          hasPlusValues: data.has_plus_values || false,
          hasCrypto: data.has_crypto || false,
          hasRevenusEtrangers: data.has_revenus_etrangers || false,
          hasIfi: data.has_ifi || false,
          ifiEstimation: data.ifi_estimation || "",
          charges: data.charges || [],
          hasDonsOrganismes: data.has_dons_organismes || false,
          hasFraisGarde: data.has_frais_garde || false,
          hasEmploiDomicile: data.has_emploi_domicile || false,
          hasInvestissementLocatif: data.has_investissement_locatif || false,
          hasFraisScolarite: data.has_frais_scolarite || false,
          documents: data.onboarding_documents || [],
          dataConfirmed: data.data_confirmed || false,
          termsAccepted: data.terms_accepted || false,
        }))
        
        if (data.onboarding_form_completed) {
          setSubmitted(true)
        }
      }
      setLoading(false)
    }

    loadClient()
  }, [clientId])

  // Autosave with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (loading || submitted) return
      
      setSaveStatus("saving")
      const supabase = createClient()
      
      const { error } = await supabase
        .from("clients")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formData.birthDate || null,
          birth_place: formData.birthPlace,
          fiscal_address: formData.fiscalAddress,
          address: formData.fiscalAddress,
          phone: formData.phone,
          email: formData.email,
          fiscal_residence: formData.fiscalResidence,
          residence_country: formData.residenceCountry,
          lived_abroad: formData.livedAbroad,
          abroad_countries: formData.abroadCountries,
          foreign_income: formData.foreignIncome,
          foreign_income_countries: formData.foreignIncomeCountries,
          marital_status: formData.maritalStatus,
          marriage_date: formData.marriageDate || null,
          pacs_date: formData.pacsDate || null,
          separation_date: formData.separationDate || null,
          spouse_first_name: formData.spouseFirstName,
          spouse_last_name: formData.spouseLastName,
          spouse_birth_date: formData.spouseBirthDate || null,
          spouse_birth_place: formData.spouseBirthPlace,
          spouse_nif: formData.spouseNif,
          joint_declaration: formData.jointDeclaration,
          children: formData.children,
          dependents: formData.dependents,
          ex_spouses: formData.exSpouses,
          pension_alimentaire_versee: formData.pensionAlimentaireVersee,
          pension_alimentaire_recue: formData.pensionAlimentaireRecue,
          prestation_compensatoire: formData.prestationCompensatoire,
          family_events: formData.familyEvents,
          has_marriage: formData.hasMarriage,
          has_divorce: formData.hasDivorce,
          has_birth: formData.hasBirth,
          has_death: formData.hasDeath,
          has_salaires: formData.hasSalaires,
          has_pensions: formData.hasPensions,
          has_bic_bnc: formData.hasBicBnc,
          has_revenus_locatifs: formData.hasRevenusLocatifs,
          has_dividendes: formData.hasDividendes,
          has_plus_values: formData.hasPlusValues,
          has_crypto: formData.hasCrypto,
          has_revenus_etrangers: formData.hasRevenusEtrangers,
          has_ifi: formData.hasIfi,
          ifi_estimation: formData.ifiEstimation,
          charges: formData.charges,
          has_dons_organismes: formData.hasDonsOrganismes,
          has_frais_garde: formData.hasFraisGarde,
          has_emploi_domicile: formData.hasEmploiDomicile,
          has_investissement_locatif: formData.hasInvestissementLocatif,
          has_frais_scolarite: formData.hasFraisScolarite,
          onboarding_documents: formData.documents,
          data_confirmed: formData.dataConfirmed,
          terms_accepted: formData.termsAccepted,
          onboarding_progress: progress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId)

      if (error) {
        console.error("Autosave error:", error)
        setSaveStatus("error")
      } else {
        setSaveStatus("saved")
      }
    }, 1500)

    return () => clearTimeout(timeoutId)
  }, [formData, clientId, loading, submitted, progress])

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Child management
  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { firstName: "", lastName: "", birthDate: "", residence: "principal", handicap: false }]
    }))
  }

  const updateChild = (index: number, field: keyof Child, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => i === index ? { ...child, [field]: value } : child)
    }))
  }

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }))
  }

  // Ex-spouse management
  const addExSpouse = () => {
    setFormData(prev => ({
      ...prev,
      exSpouses: [...prev.exSpouses, { firstName: "", lastName: "", pensionVersee: "", pensionRecue: "" }]
    }))
  }

  const updateExSpouse = (index: number, field: keyof ExSpouse, value: string) => {
    setFormData(prev => ({
      ...prev,
      exSpouses: prev.exSpouses.map((ex, i) => i === index ? { ...ex, [field]: value } : ex)
    }))
  }

  const removeExSpouse = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exSpouses: prev.exSpouses.filter((_, i) => i !== index)
    }))
  }

  // Validation
  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!formData.firstName) errors.push("Le prénom est requis")
    if (!formData.lastName) errors.push("Le nom est requis")
    if (!formData.birthDate) errors.push("La date de naissance est requise")
    if (!formData.fiscalAddress) errors.push("L'adresse fiscale est requise")
    
    if (["marie", "pacse"].includes(formData.maritalStatus)) {
      if (!formData.spouseFirstName) errors.push("Le prénom du conjoint est requis")
      if (!formData.spouseLastName) errors.push("Le nom du conjoint est requis")
    }
    
    if (!formData.dataConfirmed) errors.push("Vous devez confirmer l'exactitude des données")
    if (!formData.termsAccepted) errors.push("Vous devez accepter les conditions")
    
    return errors
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      setOpenSection("review")
      return
    }
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from("clients")
      .update({
        onboarding_form_completed: true,
        onboarding_form_completed_at: new Date().toISOString(),
        onboarding_progress: 100,
      })
      .eq("id", clientId)

    if (!error) {
      setSubmitted(true)
    }
  }

  const isSectionComplete = (section: string) => {
    switch (section) {
      case "identity":
        return !!(formData.firstName && formData.lastName && formData.birthDate && formData.fiscalAddress)
      case "residence":
        return !!formData.fiscalResidence
      case "family":
        return !!formData.maritalStatus
      case "spouse":
        const needsSpouse = ["marie", "pacse"].includes(formData.maritalStatus)
        return !needsSpouse || !!(formData.spouseFirstName && formData.spouseLastName)
      case "children":
        return true
      case "pensions":
        return true
      case "events":
        return true
      case "income":
        return true
      case "charges":
        return true
      case "documents":
        return true
      case "review":
        return formData.dataConfirmed && formData.termsAccepted
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#111827] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#6b7280] text-[15px]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-[#e5e7eb]">
          <div className="max-w-[720px] mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-[#111827] tracking-tight">Fiscalia</span>
              <div className="w-px h-5 bg-[#e5e7eb]" />
              <span className="text-[15px] text-[#6b7280]">{clientName}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d1fae5] text-[#10b981]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-[13px] font-medium">Soumis</span>
            </div>
          </div>
        </header>

        <div className="max-w-[720px] mx-auto px-8 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-[#10b981]" />
            </div>
            <h1 className="text-xl font-semibold text-[#111827] tracking-tight mb-3">
              Profil en cours de validation
            </h1>
            <p className="text-[15px] text-[#6b7280] mb-12">
              Votre dossier a bien été soumis. Votre avocat va le vérifier prochainement.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-[#e5e7eb]">
        <div className="max-w-[720px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-[#111827] tracking-tight">Fiscalia</span>
            <div className="w-px h-5 bg-[#e5e7eb]" />
            <span className="text-[15px] text-[#6b7280]">{clientName}</span>
          </div>
          <div 
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-150 ${
              saveStatus === "saved" ? "bg-[#d1fae5] text-[#10b981]" : 
              saveStatus === "saving" ? "bg-[#fef3c7] text-[#f59e0b]" : 
              "bg-[#fee2e2] text-[#ef4444]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === "saved" ? "bg-[#10b981]" : 
              saveStatus === "saving" ? "bg-[#f59e0b] animate-pulse" : 
              "bg-[#ef4444]"
            }`} />
            <span className="text-[13px] font-medium">
              {saveStatus === "saved" && "Enregistré"}
              {saveStatus === "saving" && "Enregistrement..."}
              {saveStatus === "error" && "Erreur"}
            </span>
          </div>
        </div>
      </header>

      {/* Privacy Notice */}
      <div className="max-w-[720px] mx-auto px-8 pt-6">
        <p className="text-center text-[13px] text-[#6b7280]">
          Vos informations sont traitées par votre cabinet dans le cadre de votre dossier fiscal.{" "}
          <a href="#" className="text-[#111827] underline underline-offset-2 hover:no-underline">Confidentialité</a>
          {" "}·{" "}
          <a href="#" className="text-[#111827] underline underline-offset-2 hover:no-underline">Mentions légales</a>
        </p>
      </div>

      {/* Progress Card */}
      <div className="max-w-[720px] mx-auto px-8 py-6">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-[#6b7280]">Progression</span>
            <span className="text-[13px] font-semibold text-[#111827]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#111827] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form Sections */}
      <div className="max-w-[720px] mx-auto px-8 pb-32 space-y-4">
        
        {/* Section 1: Identité & coordonnées */}
        <AccordionSection
          id="identity"
          title="Identité & coordonnées"
          subtitle="Informations personnelles de base"
          isComplete={isSectionComplete("identity")}
          isOpen={openSection === "identity"}
          onToggle={() => setOpenSection(openSection === "identity" ? null : "identity")}
        >
          <InfoCallout>
            Ces informations sont obligatoires pour établir votre déclaration fiscale (2042).
          </InfoCallout>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel required>Nom</FieldLabel>
              <Input
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Dupont"
                className="h-11 text-[14px]"
              />
            </div>
            <div>
              <FieldLabel required>Prénom</FieldLabel>
              <Input
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Jean"
                className="h-11 text-[14px]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel required>Date de naissance</FieldLabel>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateField("birthDate", e.target.value)}
                className="h-11 text-[14px]"
              />
            </div>
            <div>
              <FieldLabel>Lieu de naissance</FieldLabel>
              <Input
                value={formData.birthPlace}
                onChange={(e) => updateField("birthPlace", e.target.value)}
                placeholder="Paris, France"
                className="h-11 text-[14px]"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <FieldLabel required>Adresse fiscale</FieldLabel>
            <Textarea
              value={formData.fiscalAddress}
              onChange={(e) => updateField("fiscalAddress", e.target.value)}
              placeholder="123 rue de la République, 75001 Paris"
              className="text-[14px] min-h-[80px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Téléphone</FieldLabel>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="06 12 34 56 78"
                className="h-11 text-[14px]"
              />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="jean.dupont@email.com"
                className="h-11 text-[14px]"
              />
            </div>
          </div>
        </AccordionSection>

        {/* Section 2: Résidence fiscale & international */}
        <AccordionSection
          id="residence"
          title="Résidence fiscale & international"
          subtitle="Votre situation de résidence"
          isComplete={isSectionComplete("residence")}
          isOpen={openSection === "residence"}
          onToggle={() => setOpenSection(openSection === "residence" ? null : "residence")}
        >
          <InfoCallout>
            Indiquez votre résidence fiscale principale et vos liens avec l'étranger.
          </InfoCallout>
          
          <div className="mb-6">
            <FieldLabel required>Résidence fiscale principale</FieldLabel>
            <RadioPills
              options={[
                { value: "france", label: "France" },
                { value: "etranger", label: "Étranger" },
                { value: "mixte", label: "Mixte" },
              ]}
              value={formData.fiscalResidence}
              onChange={(v) => updateField("fiscalResidence", v)}
            />
          </div>
          
          {formData.fiscalResidence !== "france" && (
            <div className="mb-6">
              <FieldLabel>Pays de résidence principale</FieldLabel>
              <Input
                value={formData.residenceCountry}
                onChange={(e) => updateField("residenceCountry", e.target.value)}
                placeholder="Belgique, Suisse, etc."
                className="h-11 text-[14px]"
              />
            </div>
          )}
          
          <div className="mb-6">
            <FieldLabel>Avez-vous vécu à l'étranger en 2024 ?</FieldLabel>
            <div className="mt-2">
              <ToggleGroup value={formData.livedAbroad} onChange={(v) => updateField("livedAbroad", v)} />
            </div>
          </div>
          
          <div>
            <FieldLabel>Avez-vous perçu des revenus de source étrangère ?</FieldLabel>
            <div className="mt-2">
              <ToggleGroup value={formData.foreignIncome} onChange={(v) => updateField("foreignIncome", v)} />
            </div>
          </div>
        </AccordionSection>

        {/* Section 3: Situation familiale */}
        <AccordionSection
          id="family"
          title="Situation familiale"
          subtitle="Votre situation au 31 décembre"
          isComplete={isSectionComplete("family")}
          isOpen={openSection === "family"}
          onToggle={() => setOpenSection(openSection === "family" ? null : "family")}
        >
          <InfoCallout>
            Votre situation au 31 décembre 2024 détermine votre régime d'imposition.
          </InfoCallout>
          
          <div className="mb-6">
            <FieldLabel required>Situation matrimoniale</FieldLabel>
            <RadioPills
              options={[
                { value: "celibataire", label: "Célibataire" },
                { value: "marie", label: "Marié(e)" },
                { value: "pacse", label: "Pacsé(e)" },
                { value: "divorce", label: "Divorcé(e)" },
                { value: "veuf", label: "Veuf/Veuve" },
                { value: "separe", label: "Séparé(e)" },
              ]}
              value={formData.maritalStatus}
              onChange={(v) => updateField("maritalStatus", v)}
            />
          </div>
          
          {formData.maritalStatus === "marie" && (
            <div>
              <FieldLabel>Date de mariage</FieldLabel>
              <Input
                type="date"
                value={formData.marriageDate}
                onChange={(e) => updateField("marriageDate", e.target.value)}
                className="h-11 text-[14px] max-w-xs"
              />
            </div>
          )}
          
          {formData.maritalStatus === "pacse" && (
            <div>
              <FieldLabel>Date du PACS</FieldLabel>
              <Input
                type="date"
                value={formData.pacsDate}
                onChange={(e) => updateField("pacsDate", e.target.value)}
                className="h-11 text-[14px] max-w-xs"
              />
            </div>
          )}
          
          {["divorce", "separe"].includes(formData.maritalStatus) && (
            <div>
              <FieldLabel>Date de séparation/divorce</FieldLabel>
              <Input
                type="date"
                value={formData.separationDate}
                onChange={(e) => updateField("separationDate", e.target.value)}
                className="h-11 text-[14px] max-w-xs"
              />
            </div>
          )}
        </AccordionSection>

        {/* Section 4: Relations du foyer */}
        <AccordionSection
          id="spouse"
          title="Relations du foyer"
          subtitle="Conjoint actuel ou ex-conjoint"
          isComplete={isSectionComplete("spouse")}
          isOpen={openSection === "spouse"}
          onToggle={() => setOpenSection(openSection === "spouse" ? null : "spouse")}
        >
          {["marie", "pacse"].includes(formData.maritalStatus) ? (
            <>
              <InfoCallout>
                Les informations de votre conjoint sont nécessaires pour la déclaration commune.
              </InfoCallout>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <FieldLabel required>Nom du conjoint</FieldLabel>
                  <Input
                    value={formData.spouseLastName}
                    onChange={(e) => updateField("spouseLastName", e.target.value)}
                    className="h-11 text-[14px]"
                  />
                </div>
                <div>
                  <FieldLabel required>Prénom du conjoint</FieldLabel>
                  <Input
                    value={formData.spouseFirstName}
                    onChange={(e) => updateField("spouseFirstName", e.target.value)}
                    className="h-11 text-[14px]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <FieldLabel>Date de naissance</FieldLabel>
                  <Input
                    type="date"
                    value={formData.spouseBirthDate}
                    onChange={(e) => updateField("spouseBirthDate", e.target.value)}
                    className="h-11 text-[14px]"
                  />
                </div>
                <div>
                  <FieldLabel>Lieu de naissance</FieldLabel>
                  <Input
                    value={formData.spouseBirthPlace}
                    onChange={(e) => updateField("spouseBirthPlace", e.target.value)}
                    className="h-11 text-[14px]"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <FieldLabel>Numéro fiscal du conjoint</FieldLabel>
                <Input
                  value={formData.spouseNif}
                  onChange={(e) => updateField("spouseNif", e.target.value)}
                  placeholder="13 chiffres"
                  className="h-11 text-[14px] max-w-xs"
                />
              </div>
              
              <div>
                <FieldLabel>Déclaration commune ?</FieldLabel>
                <div className="mt-2">
                  <ToggleGroup value={formData.jointDeclaration} onChange={(v) => updateField("jointDeclaration", v)} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-[14px] text-[#6b7280]">
              Cette section ne s'applique pas à votre situation actuelle.
            </p>
          )}
        </AccordionSection>

        {/* Section 5: Enfants & personnes à charge */}
        <AccordionSection
          id="children"
          title="Enfants & personnes à charge"
          subtitle="Enfants et autres personnes rattachées"
          isComplete={isSectionComplete("children")}
          isOpen={openSection === "children"}
          onToggle={() => setOpenSection(openSection === "children" ? null : "children")}
        >
          <InfoCallout>
            Déclarez tous les enfants à charge et autres personnes rattachées à votre foyer fiscal.
          </InfoCallout>
          
          {formData.children.length > 0 && (
            <div className="space-y-3 mb-4">
              {formData.children.map((child, index) => (
                <div key={index} className="p-4 border border-[#e5e7eb] rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-medium text-[#111827]">Enfant {index + 1}</span>
                    <button
                      onClick={() => removeChild(index)}
                      className="text-[#ef4444] hover:text-[#dc2626] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      value={child.lastName}
                      onChange={(e) => updateChild(index, "lastName", e.target.value)}
                      placeholder="Nom"
                      className="h-10 text-[14px]"
                    />
                    <Input
                      value={child.firstName}
                      onChange={(e) => updateChild(index, "firstName", e.target.value)}
                      placeholder="Prénom"
                      className="h-10 text-[14px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      type="date"
                      value={child.birthDate}
                      onChange={(e) => updateChild(index, "birthDate", e.target.value)}
                      className="h-10 text-[14px]"
                    />
                    <select
                      value={child.residence}
                      onChange={(e) => updateChild(index, "residence", e.target.value)}
                      className="h-10 text-[14px] border border-[#e5e7eb] rounded-md px-3"
                    >
                      <option value="principal">Résidence principale</option>
                      <option value="alternee">Garde alternée</option>
                      <option value="autre">Autre parent</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={child.handicap}
                      onCheckedChange={(v) => updateChild(index, "handicap", !!v)}
                    />
                    <span className="text-[13px] text-[#6b7280]">Situation de handicap</span>
                  </label>
                </div>
              ))}
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={addChild}
            className="h-10 text-[13px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un enfant
          </Button>
        </AccordionSection>

        {/* Section 6: Pensions & obligations */}
        <AccordionSection
          id="pensions"
          title="Pensions & obligations"
          subtitle="Pensions versées ou reçues"
          isComplete={isSectionComplete("pensions")}
          isOpen={openSection === "pensions"}
          onToggle={() => setOpenSection(openSection === "pensions" ? null : "pensions")}
        >
          <InfoCallout>
            Indiquez les pensions alimentaires versées ou reçues dans le cadre d'un divorce ou séparation.
          </InfoCallout>
          
          <div className="space-y-4 mb-6">
            <div>
              <FieldLabel>Versez-vous une pension alimentaire ?</FieldLabel>
              <div className="mt-2">
                <ToggleGroup 
                  value={formData.pensionAlimentaireVersee} 
                  onChange={(v) => updateField("pensionAlimentaireVersee", v)} 
                />
              </div>
            </div>
            
            <div>
              <FieldLabel>Recevez-vous une pension alimentaire ?</FieldLabel>
              <div className="mt-2">
                <ToggleGroup 
                  value={formData.pensionAlimentaireRecue} 
                  onChange={(v) => updateField("pensionAlimentaireRecue", v)} 
                />
              </div>
            </div>
            
            <div>
              <FieldLabel>Prestation compensatoire ?</FieldLabel>
              <div className="mt-2">
                <ToggleGroup 
                  value={formData.prestationCompensatoire} 
                  onChange={(v) => updateField("prestationCompensatoire", v)} 
                />
              </div>
            </div>
          </div>
          
          {(formData.pensionAlimentaireVersee || formData.pensionAlimentaireRecue) && (
            <>
              <p className="text-[14px] font-medium text-[#111827] mb-3">Ex-conjoints concernés</p>
              
              {formData.exSpouses.map((ex, index) => (
                <div key={index} className="p-4 border border-[#e5e7eb] rounded-lg mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-medium text-[#111827]">Ex-conjoint {index + 1}</span>
                    <button onClick={() => removeExSpouse(index)} className="text-[#ef4444]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      value={ex.lastName}
                      onChange={(e) => updateExSpouse(index, "lastName", e.target.value)}
                      placeholder="Nom"
                      className="h-10 text-[14px]"
                    />
                    <Input
                      value={ex.firstName}
                      onChange={(e) => updateExSpouse(index, "firstName", e.target.value)}
                      placeholder="Prénom"
                      className="h-10 text-[14px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Pension versée (€/an)</FieldLabel>
                      <Input
                        type="number"
                        value={ex.pensionVersee}
                        onChange={(e) => updateExSpouse(index, "pensionVersee", e.target.value)}
                        className="h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <FieldLabel>Pension reçue (€/an)</FieldLabel>
                      <Input
                        type="number"
                        value={ex.pensionRecue}
                        onChange={(e) => updateExSpouse(index, "pensionRecue", e.target.value)}
                        className="h-10 text-[14px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addExSpouse} className="h-10 text-[13px]">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un ex-conjoint
              </Button>
            </>
          )}
        </AccordionSection>

        {/* Section 7: Événements familiaux */}
        <AccordionSection
          id="events"
          title="Événements familiaux"
          subtitle="Événements survenus dans l'année"
          isComplete={isSectionComplete("events")}
          isOpen={openSection === "events"}
          onToggle={() => setOpenSection(openSection === "events" ? null : "events")}
        >
          <InfoCallout>
            Signalez les événements importants survenus en 2024 qui peuvent affecter votre imposition.
          </InfoCallout>
          
          <div className="space-y-3">
            <CheckboxItem
              label="Mariage ou PACS en 2024"
              description="Union célébrée au cours de l'année"
              checked={formData.hasMarriage}
              onChange={(v) => updateField("hasMarriage", v)}
            />
            <CheckboxItem
              label="Divorce ou rupture de PACS en 2024"
              description="Séparation officielle au cours de l'année"
              checked={formData.hasDivorce}
              onChange={(v) => updateField("hasDivorce", v)}
            />
            <CheckboxItem
              label="Naissance ou adoption en 2024"
              description="Arrivée d'un enfant dans le foyer"
              checked={formData.hasBirth}
              onChange={(v) => updateField("hasBirth", v)}
            />
            <CheckboxItem
              label="Décès du conjoint en 2024"
              description="Perte du conjoint au cours de l'année"
              checked={formData.hasDeath}
              onChange={(v) => updateField("hasDeath", v)}
            />
          </div>
        </AccordionSection>

        {/* Section 8: Panorama Revenus & IFI */}
        <AccordionSection
          id="income"
          title="Panorama Revenus & IFI"
          subtitle="Types de revenus et patrimoine"
          isComplete={isSectionComplete("income")}
          isOpen={openSection === "income"}
          onToggle={() => setOpenSection(openSection === "income" ? null : "income")}
        >
          <InfoCallout>
            Cochez tous les types de revenus que vous avez perçus en 2024. Cette information permettra de préparer les annexes nécessaires.
          </InfoCallout>
          
          <p className="text-[14px] font-medium text-[#111827] mb-3">Revenus d'activité</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <CheckboxItem
              label="Salaires & traitements"
              description="Revenus d'activité salariée"
              checked={formData.hasSalaires}
              onChange={(v) => updateField("hasSalaires", v)}
            />
            <CheckboxItem
              label="Pensions & retraites"
              description="Pensions de retraite, invalidité"
              checked={formData.hasPensions}
              onChange={(v) => updateField("hasPensions", v)}
            />
            <CheckboxItem
              label="BIC / BNC / BA"
              description="Revenus professionnels non-salariés"
              checked={formData.hasBicBnc}
              onChange={(v) => updateField("hasBicBnc", v)}
            />
          </div>
          
          <p className="text-[14px] font-medium text-[#111827] mb-3">Revenus du patrimoine</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <CheckboxItem
              label="Revenus fonciers"
              description="Loyers perçus de biens immobiliers"
              checked={formData.hasRevenusLocatifs}
              onChange={(v) => updateField("hasRevenusLocatifs", v)}
            />
            <CheckboxItem
              label="Dividendes & intérêts"
              description="Revenus de placements financiers"
              checked={formData.hasDividendes}
              onChange={(v) => updateField("hasDividendes", v)}
            />
            <CheckboxItem
              label="Plus-values mobilières"
              description="Gains sur ventes de titres"
              checked={formData.hasPlusValues}
              onChange={(v) => updateField("hasPlusValues", v)}
            />
            <CheckboxItem
              label="Crypto-monnaies"
              description="Gains sur actifs numériques"
              checked={formData.hasCrypto}
              onChange={(v) => updateField("hasCrypto", v)}
            />
            <CheckboxItem
              label="Revenus étrangers"
              description="Revenus de source étrangère"
              checked={formData.hasRevenusEtrangers}
              onChange={(v) => updateField("hasRevenusEtrangers", v)}
            />
          </div>
          
          <p className="text-[14px] font-medium text-[#111827] mb-3">Impôt sur la Fortune Immobilière (IFI)</p>
          <div className="mb-4">
            <CheckboxItem
              label="Patrimoine immobilier > 1,3 M€"
              description="Soumis à l'IFI au 1er janvier 2024"
              checked={formData.hasIfi}
              onChange={(v) => updateField("hasIfi", v)}
            />
          </div>
          
          {formData.hasIfi && (
            <div>
              <FieldLabel>Estimation du patrimoine immobilier net</FieldLabel>
              <Input
                type="text"
                value={formData.ifiEstimation}
                onChange={(e) => updateField("ifiEstimation", e.target.value)}
                placeholder="Ex: 1 500 000 €"
                className="h-11 text-[14px] max-w-xs"
              />
            </div>
          )}
        </AccordionSection>

        {/* Section 9: Charges / réductions / crédits */}
        <AccordionSection
          id="charges"
          title="Charges / réductions / crédits"
          subtitle="Dépenses ouvrant droit à réduction"
          isComplete={isSectionComplete("charges")}
          isOpen={openSection === "charges"}
          onToggle={() => setOpenSection(openSection === "charges" ? null : "charges")}
        >
          <InfoCallout>
            Identifiez les dépenses qui peuvent réduire votre impôt. Les montants seront demandés ultérieurement.
          </InfoCallout>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CheckboxItem
              label="Dons aux organismes"
              description="Dons aux associations, fondations"
              checked={formData.hasDonsOrganismes}
              onChange={(v) => updateField("hasDonsOrganismes", v)}
            />
            <CheckboxItem
              label="Frais de garde d'enfants"
              description="Crèche, assistante maternelle"
              checked={formData.hasFraisGarde}
              onChange={(v) => updateField("hasFraisGarde", v)}
            />
            <CheckboxItem
              label="Emploi à domicile"
              description="Services à la personne"
              checked={formData.hasEmploiDomicile}
              onChange={(v) => updateField("hasEmploiDomicile", v)}
            />
            <CheckboxItem
              label="Investissement locatif"
              description="Pinel, Denormandie, etc."
              checked={formData.hasInvestissementLocatif}
              onChange={(v) => updateField("hasInvestissementLocatif", v)}
            />
            <CheckboxItem
              label="Frais de scolarité"
              description="Collège, lycée, études supérieures"
              checked={formData.hasFraisScolarite}
              onChange={(v) => updateField("hasFraisScolarite", v)}
            />
          </div>
        </AccordionSection>

        {/* Section 10: Documents */}
        <AccordionSection
          id="documents"
          title="Documents"
          subtitle="Justificatifs et pièces à fournir"
          isComplete={isSectionComplete("documents")}
          isOpen={openSection === "documents"}
          onToggle={() => setOpenSection(openSection === "documents" ? null : "documents")}
        >
          <InfoCallout>
            Les documents seront demandés par votre avocat une fois le formulaire soumis. Cette section est informative.
          </InfoCallout>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-[#e5e7eb] rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#6b7280]" />
                <div>
                  <p className="text-[14px] font-medium text-[#111827]">Avis d'imposition 2023</p>
                  <p className="text-[12px] text-[#6b7280]">Dernier avis reçu</p>
                </div>
              </div>
              <DocBadge status="missing" />
            </div>
            
            {formData.hasSalaires && (
              <div className="flex items-center justify-between p-4 border border-[#e5e7eb] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#6b7280]" />
                  <div>
                    <p className="text-[14px] font-medium text-[#111827]">Bulletins de salaire</p>
                    <p className="text-[12px] text-[#6b7280]">Décembre 2024 ou récapitulatif annuel</p>
                  </div>
                </div>
                <DocBadge status="missing" />
              </div>
            )}
            
            {formData.hasRevenusLocatifs && (
              <div className="flex items-center justify-between p-4 border border-[#e5e7eb] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#6b7280]" />
                  <div>
                    <p className="text-[14px] font-medium text-[#111827]">Relevés de loyers</p>
                    <p className="text-[12px] text-[#6b7280]">Récapitulatif annuel des loyers perçus</p>
                  </div>
                </div>
                <DocBadge status="missing" />
              </div>
            )}
            
            {formData.hasDividendes && (
              <div className="flex items-center justify-between p-4 border border-[#e5e7eb] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#6b7280]" />
                  <div>
                    <p className="text-[14px] font-medium text-[#111827]">IFU (Imprimé Fiscal Unique)</p>
                    <p className="text-[12px] text-[#6b7280]">De votre banque ou courtier</p>
                  </div>
                </div>
                <DocBadge status="missing" />
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Section 11: Relecture & soumission */}
        <AccordionSection
          id="review"
          title="Relecture & soumission"
          subtitle="Validation finale de votre dossier"
          isComplete={isSectionComplete("review")}
          isOpen={openSection === "review"}
          onToggle={() => setOpenSection(openSection === "review" ? null : "review")}
        >
          <InfoCallout>
            Veuillez relire attentivement vos informations avant de soumettre votre dossier.
          </InfoCallout>
          
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-[#fee2e2] border border-[#fecaca] rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-[#ef4444] mb-2">Veuillez corriger les erreurs suivantes :</p>
                  <ul className="list-disc list-inside text-[13px] text-[#ef4444] space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Summary */}
          <div className="mb-6 p-4 bg-[#f9fafb] rounded-lg">
            <p className="text-[14px] font-medium text-[#111827] mb-3">Récapitulatif</p>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Déclarant principal</span>
                <span className="text-[#111827] font-medium">{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Situation familiale</span>
                <span className="text-[#111827] font-medium capitalize">{formData.maritalStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Enfants à charge</span>
                <span className="text-[#111827] font-medium">{formData.children.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Types de revenus déclarés</span>
                <span className="text-[#111827] font-medium">
                  {[
                    formData.hasSalaires && "Salaires",
                    formData.hasPensions && "Pensions",
                    formData.hasBicBnc && "BIC/BNC",
                    formData.hasRevenusLocatifs && "Fonciers",
                    formData.hasDividendes && "Dividendes",
                  ].filter(Boolean).join(", ") || "Aucun"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={formData.dataConfirmed}
                onCheckedChange={(v) => updateField("dataConfirmed", !!v)}
                className="mt-0.5"
              />
              <span className="text-[14px] text-[#374151]">
                Je confirme que les informations fournies sont exactes et complètes.
              </span>
            </label>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={formData.termsAccepted}
                onCheckedChange={(v) => updateField("termsAccepted", !!v)}
                className="mt-0.5"
              />
              <span className="text-[14px] text-[#374151]">
                J'accepte que mes données soient traitées par mon avocat dans le cadre de ma déclaration fiscale.
              </span>
            </label>
          </div>
        </AccordionSection>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] py-4 px-8 z-40">
        <div className="max-w-[720px] mx-auto flex items-center justify-between">
          <p className="text-[13px] text-[#9ca3af]">Sauvegarde automatique activée</p>
          <Button 
            onClick={handleSubmit}
            className="h-11 px-6 text-[14px] font-medium"
            disabled={!formData.dataConfirmed || !formData.termsAccepted}
          >
            Vérifier & Soumettre
          </Button>
        </div>
      </div>
    </div>
  )
}
