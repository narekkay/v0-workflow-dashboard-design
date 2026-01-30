"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Check, ChevronDown, FileText, Trash2, Upload, Clock, CheckCircle2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface FormData {
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  fiscalAddress: string
  maritalStatus: string
  livedAbroad: boolean
  abroadCountries: string[]
  spouseFirstName: string
  spouseLastName: string
  spouseBirthDate: string
  spouseBirthPlace: string
  children: Array<{ firstName: string; lastName: string; birthDate: string }>
  // Income sources
  hasSalaires: boolean
  hasPensions: boolean
  hasBicBnc: boolean
  hasRevenusLocatifs: boolean
  hasDividendes: boolean
  hasCrypto: boolean
  // Patrimony
  hasIfi: boolean
  hasLmnp: boolean
  hasSci: boolean
  hasForeignAccounts: boolean
  hasReductionsCredits: boolean
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
        className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
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

// Radio pill component for marital status
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

// Document status badge
function DocBadge({ status }: { status: "received" | "missing" | "optional" }) {
  const styles = {
    received: "bg-[#d1fae5] text-[#10b981]",
    missing: "bg-[#fef3c7] text-[#f59e0b]",
    optional: "bg-[#f3f4f6] text-[#6b7280]",
  }
  const labels = {
    received: "RECU",
    missing: "MANQUANT",
    optional: "OPTIONNEL",
  }
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
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
  
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    birthDate: "",
    birthPlace: "",
    fiscalAddress: "",
    maritalStatus: "single",
    livedAbroad: false,
    abroadCountries: [],
    spouseFirstName: "",
    spouseLastName: "",
    spouseBirthDate: "",
    spouseBirthPlace: "",
    children: [],
    hasSalaires: false,
    hasPensions: false,
    hasBicBnc: false,
    hasRevenusLocatifs: false,
    hasDividendes: false,
    hasCrypto: false,
    hasIfi: false,
    hasLmnp: false,
    hasSci: false,
    hasForeignAccounts: false,
    hasReductionsCredits: false,
  })

  const [childDialogOpen, setChildDialogOpen] = useState(false)
  const [newChild, setNewChild] = useState({ firstName: "", lastName: "", birthDate: "" })

  // Calculate progress
  const calculateProgress = useCallback(() => {
    const requiredFields = [
      formData.firstName,
      formData.lastName,
      formData.birthDate,
      formData.fiscalAddress,
    ]
    
    const optionalFields = [
      formData.birthPlace,
      formData.maritalStatus !== "single" ? formData.spouseFirstName : "skip",
      formData.maritalStatus !== "single" ? formData.spouseLastName : "skip",
    ].filter(f => f !== "skip")
    
    const filledRequired = requiredFields.filter(f => f && f.trim() !== "").length
    const filledOptional = optionalFields.filter(f => f && f.trim() !== "").length
    
    const totalRequired = requiredFields.length
    const totalOptional = optionalFields.length
    
    const requiredProgress = (filledRequired / totalRequired) * 70
    const optionalProgress = totalOptional > 0 ? (filledOptional / totalOptional) * 30 : 30
    
    return Math.round(requiredProgress + optionalProgress)
  }, [formData])

  useEffect(() => {
    setProgress(calculateProgress())
  }, [formData, calculateProgress])

  // Update client name in header
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
        setFormData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          birthDate: data.birth_date || "",
          birthPlace: data.birth_place || "",
          fiscalAddress: data.fiscal_address || data.address || "",
          maritalStatus: data.marital_status || "single",
          livedAbroad: data.lived_abroad || false,
          abroadCountries: data.abroad_countries || [],
          spouseFirstName: data.spouse_first_name || "",
          spouseLastName: data.spouse_last_name || "",
          spouseBirthDate: data.spouse_birth_date || "",
          spouseBirthPlace: data.spouse_birth_place || "",
          children: data.children || [],
          hasSalaires: data.has_salaires || false,
          hasPensions: data.has_pensions || false,
          hasBicBnc: data.has_bic_bnc || false,
          hasRevenusLocatifs: data.has_revenus_locatifs || false,
          hasDividendes: data.has_dividendes || false,
          hasCrypto: data.has_crypto || false,
          hasIfi: data.has_ifi || false,
          hasLmnp: data.has_lmnp || false,
          hasSci: data.has_sci || false,
          hasForeignAccounts: data.has_foreign_accounts || false,
          hasReductionsCredits: data.has_reductions_credits || false,
        })
        
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
          marital_status: formData.maritalStatus,
          lived_abroad: formData.livedAbroad,
          abroad_countries: formData.abroadCountries,
          spouse_first_name: formData.spouseFirstName,
          spouse_last_name: formData.spouseLastName,
          spouse_birth_date: formData.spouseBirthDate || null,
          spouse_birth_place: formData.spouseBirthPlace,
          children: formData.children,
          has_salaires: formData.hasSalaires,
          has_pensions: formData.hasPensions,
          has_bic_bnc: formData.hasBicBnc,
          has_revenus_locatifs: formData.hasRevenusLocatifs,
          has_dividendes: formData.hasDividendes,
          has_crypto: formData.hasCrypto,
          has_ifi: formData.hasIfi,
          has_lmnp: formData.hasLmnp,
          has_sci: formData.hasSci,
          has_foreign_accounts: formData.hasForeignAccounts,
          has_reductions_credits: formData.hasReductionsCredits,
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

  const addChild = () => {
    if (newChild.firstName && newChild.lastName) {
      setFormData(prev => ({
        ...prev,
        children: [...prev.children, { ...newChild }]
      }))
      setNewChild({ firstName: "", lastName: "", birthDate: "" })
      setChildDialogOpen(false)
    }
  }

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
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
      case "family":
        return formData.maritalStatus === "single" || !!(formData.spouseFirstName && formData.spouseLastName)
      case "income":
        return true
      case "patrimony":
        return true
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
        {/* Header */}
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

        {/* Success Content */}
        <div className="max-w-[720px] mx-auto px-8 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-[#10b981]" />
            </div>
            <h1 className="text-xl font-semibold text-[#111827] tracking-tight mb-3">
              Profil en cours de validation
            </h1>
            <p className="text-[15px] text-[#6b7280] mb-12">
              Votre dossier a bien ete soumis. Votre avocat va le verifier prochainement.
            </p>

            {/* Timeline */}
            <div className="max-w-md mx-auto text-left">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 bg-[#d1fae5] rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-[#10b981]" />
                </div>
                <div>
                  <p className="font-medium text-[15px] text-[#111827]">Formulaire soumis</p>
                  <p className="text-[13px] text-[#6b7280]">Vos informations ont ete envoyees</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 bg-[#fef3c7] rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="font-medium text-[15px] text-[#111827]">En attente de verification</p>
                  <p className="text-[13px] text-[#6b7280]">Votre avocat examine votre dossier</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#f3f4f6] rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#9ca3af]" />
                </div>
                <div>
                  <p className="font-medium text-[15px] text-[#9ca3af]">Declaration fiscale</p>
                  <p className="text-[13px] text-[#9ca3af]">Preparation de votre declaration</p>
                </div>
              </div>
            </div>
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
              {saveStatus === "saved" && "Enregistre"}
              {saveStatus === "saving" && "Enregistrement..."}
              {saveStatus === "error" && "Erreur"}
            </span>
          </div>
        </div>
      </header>

      {/* Privacy Notice */}
      <div className="max-w-[720px] mx-auto px-8 pt-6">
        <p className="text-center text-[13px] text-[#6b7280]">
          Vos informations sont traitees par votre cabinet dans le cadre de votre dossier fiscal.{" "}
          <a href="#" className="text-[#111827] underline underline-offset-2 hover:no-underline">Confidentialite</a>
          {" "}·{" "}
          <a href="#" className="text-[#111827] underline underline-offset-2 hover:no-underline">Mentions legales</a>
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
        {/* Section 1: Identity */}
        <AccordionSection
          id="identity"
          title="Identite & coordonnees"
          subtitle="Informations personnelles de base"
          isComplete={isSectionComplete("identity")}
          isOpen={openSection === "identity"}
          onToggle={() => setOpenSection(openSection === "identity" ? null : "identity")}
        >
          {/* Info Callout */}
          <div className="mb-6 pl-4 border-l-4 border-[#111827] bg-[#f9fafb] py-3 pr-4 rounded-r-lg">
            <p className="text-[13px] text-[#6b7280]">
              Ces informations sont obligatoires pour etablir votre declaration fiscale (2042).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[13px] font-medium text-[#6b7280]">
                Nom <span className="text-[#ef4444]">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Dupont"
                className="h-11 border-0 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-[#f3f4f6] focus:ring-2 focus:ring-[#111827] text-[15px] text-[#111827] placeholder:text-[#9ca3af] rounded-lg transition-colors duration-150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[13px] font-medium text-[#6b7280]">
                Prenom <span className="text-[#ef4444]">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Jean"
                className="h-11 border-0 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-[#f3f4f6] focus:ring-2 focus:ring-[#111827] text-[15px] text-[#111827] placeholder:text-[#9ca3af] rounded-lg transition-colors duration-150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-[13px] font-medium text-[#6b7280]">
                Date de naissance <span className="text-[#ef4444]">*</span>
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateField("birthDate", e.target.value)}
                className="h-11 border-0 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-[#f3f4f6] focus:ring-2 focus:ring-[#111827] text-[15px] text-[#111827] rounded-lg transition-colors duration-150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthPlace" className="text-[13px] font-medium text-[#6b7280]">
                Lieu de naissance
              </Label>
              <Input
                id="birthPlace"
                value={formData.birthPlace}
                onChange={(e) => updateField("birthPlace", e.target.value)}
                placeholder="Paris, France"
                className="h-11 border-0 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-[#f3f4f6] focus:ring-2 focus:ring-[#111827] text-[15px] text-[#111827] placeholder:text-[#9ca3af] rounded-lg transition-colors duration-150"
              />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="fiscalAddress" className="text-[13px] font-medium text-[#6b7280]">
              Adresse fiscale <span className="text-[#ef4444]">*</span>
            </Label>
            <Textarea
              id="fiscalAddress"
              value={formData.fiscalAddress}
              onChange={(e) => updateField("fiscalAddress", e.target.value)}
              placeholder="12 rue de la Paix, 75002 Paris"
              className="min-h-[80px] border-0 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-[#f3f4f6] focus:ring-2 focus:ring-[#111827] text-[15px] text-[#111827] placeholder:text-[#9ca3af] rounded-lg resize-y transition-colors duration-150"
            />
          </div>
        </AccordionSection>

        {/* Section 2: Family */}
        <AccordionSection
          id="family"
          title="Situation familiale"
          subtitle="Conjoint et enfants a charge"
          isComplete={isSectionComplete("family")}
          isOpen={openSection === "family"}
          onToggle={() => setOpenSection(openSection === "family" ? null : "family")}
        >
          <div className="space-y-6">
            {/* Marital Status */}
            <div className="space-y-3">
              <Label className="text-[13px] font-medium text-[#6b7280]">Situation matrimoniale</Label>
              <RadioPills
                options={[
                  { value: "single", label: "Celibataire" },
                  { value: "married", label: "Marie(e)" },
                  { value: "pacs", label: "Pacse(e)" },
                  { value: "divorced", label: "Divorce(e)" },
                  { value: "widowed", label: "Veuf/Veuve" },
                ]}
                value={formData.maritalStatus}
                onChange={(v) => updateField("maritalStatus", v)}
              />
            </div>

            {/* Spouse Info (conditional) */}
            {(formData.maritalStatus === "married" || formData.maritalStatus === "pacs") && (
              <div className="p-5 bg-[#f9fafb] rounded-xl space-y-4">
                <h4 className="font-medium text-[15px] text-[#111827]">Informations du conjoint</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-[#6b7280]">Prenom</Label>
                    <Input
                      value={formData.spouseFirstName}
                      onChange={(e) => updateField("spouseFirstName", e.target.value)}
                      className="h-11 border-0 bg-white hover:bg-[#f3f4f6] focus:bg-white focus:ring-2 focus:ring-[#111827] text-[15px] rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-[#6b7280]">Nom</Label>
                    <Input
                      value={formData.spouseLastName}
                      onChange={(e) => updateField("spouseLastName", e.target.value)}
                      className="h-11 border-0 bg-white hover:bg-[#f3f4f6] focus:bg-white focus:ring-2 focus:ring-[#111827] text-[15px] rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-[#6b7280]">Date de naissance</Label>
                    <Input
                      type="date"
                      value={formData.spouseBirthDate}
                      onChange={(e) => updateField("spouseBirthDate", e.target.value)}
                      className="h-11 border-0 bg-white hover:bg-[#f3f4f6] focus:bg-white focus:ring-2 focus:ring-[#111827] text-[15px] rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-[#6b7280]">Lieu de naissance</Label>
                    <Input
                      value={formData.spouseBirthPlace}
                      onChange={(e) => updateField("spouseBirthPlace", e.target.value)}
                      className="h-11 border-0 bg-white hover:bg-[#f3f4f6] focus:bg-white focus:ring-2 focus:ring-[#111827] text-[15px] rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Children */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium text-[#6b7280]">Enfants a charge</Label>
                <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 text-[13px] font-medium border-[#e5e7eb] hover:bg-[#f9fafb] hover:border-[#9ca3af] text-[#6b7280] hover:text-[#111827]"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-[#111827]">Ajouter un enfant</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[13px] font-medium text-[#6b7280]">Prenom</Label>
                          <Input
                            value={newChild.firstName}
                            onChange={(e) => setNewChild({ ...newChild, firstName: e.target.value })}
                            className="h-11 border-0 bg-[#f9fafb] focus:ring-2 focus:ring-[#111827] rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[13px] font-medium text-[#6b7280]">Nom</Label>
                          <Input
                            value={newChild.lastName}
                            onChange={(e) => setNewChild({ ...newChild, lastName: e.target.value })}
                            className="h-11 border-0 bg-[#f9fafb] focus:ring-2 focus:ring-[#111827] rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-[#6b7280]">Date de naissance</Label>
                        <Input
                          type="date"
                          value={newChild.birthDate}
                          onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                          className="h-11 border-0 bg-[#f9fafb] focus:ring-2 focus:ring-[#111827] rounded-lg"
                        />
                      </div>
                      <Button 
                        onClick={addChild} 
                        className="w-full h-11 bg-[#111827] hover:bg-[#1f2937] text-white font-medium rounded-lg transition-all duration-150 hover:-translate-y-px"
                      >
                        Ajouter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {formData.children.length > 0 && (
                <div className="space-y-2">
                  {formData.children.map((child, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-lg">
                      <div>
                        <p className="font-medium text-[15px] text-[#111827]">
                          {child.firstName} {child.lastName}
                        </p>
                        {child.birthDate && (
                          <p className="text-[13px] text-[#6b7280]">
                            Ne(e) le {new Date(child.birthDate).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(index)}
                        className="h-8 w-8 p-0 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#fee2e2]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lived Abroad */}
            <div className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl">
              <div>
                <p className="font-medium text-[15px] text-[#111827]">Avez-vous vecu a l'etranger ?</p>
                <p className="text-[13px] text-[#6b7280]">Durant l'annee fiscale concernee</p>
              </div>
              <ToggleGroup 
                value={formData.livedAbroad} 
                onChange={(v) => updateField("livedAbroad", v)} 
              />
            </div>
          </div>
        </AccordionSection>

        {/* Section 3: Income Sources */}
        <AccordionSection
          id="income"
          title="Panorama revenus & IFI"
          subtitle="Selectionnez vos sources de revenus"
          isComplete={isSectionComplete("income")}
          isOpen={openSection === "income"}
          onToggle={() => setOpenSection(openSection === "income" ? null : "income")}
        >
          <div className="space-y-3">
            {[
              { key: "hasSalaires" as const, label: "Salaires et traitements", desc: "Revenus d'activite salariee" },
              { key: "hasPensions" as const, label: "Pensions et retraites", desc: "Pensions de retraite, invalidite, alimentaires" },
              { key: "hasBicBnc" as const, label: "BIC / BNC / BA", desc: "Benefices industriels, commerciaux, non commerciaux, agricoles" },
              { key: "hasRevenusLocatifs" as const, label: "Revenus fonciers", desc: "Locations nues ou meublees" },
              { key: "hasDividendes" as const, label: "Dividendes et interets", desc: "Revenus de capitaux mobiliers" },
              { key: "hasCrypto" as const, label: "Plus-values crypto", desc: "Cessions de cryptomonnaies" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl hover:bg-[#f3f4f6] transition-colors duration-150">
                <div>
                  <p className="font-medium text-[15px] text-[#111827]">{item.label}</p>
                  <p className="text-[13px] text-[#6b7280]">{item.desc}</p>
                </div>
                <ToggleGroup 
                  value={formData[item.key]} 
                  onChange={(v) => updateField(item.key, v)} 
                />
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Section 4: Patrimony & Investments */}
        <AccordionSection
          id="patrimony"
          title="Charges / reductions / credits"
          subtitle="Situations particulieres et deductions"
          isComplete={isSectionComplete("patrimony")}
          isOpen={openSection === "patrimony"}
          onToggle={() => setOpenSection(openSection === "patrimony" ? null : "patrimony")}
        >
          <div className="space-y-3">
            {[
              { key: "hasIfi" as const, label: "IFI (Impot sur la Fortune Immobiliere)", desc: "Patrimoine immobilier > 1,3M€" },
              { key: "hasLmnp" as const, label: "LMNP", desc: "Location meublee non professionnelle" },
              { key: "hasSci" as const, label: "SCI", desc: "Societe civile immobiliere" },
              { key: "hasForeignAccounts" as const, label: "Comptes a l'etranger", desc: "Comptes bancaires hors France" },
              { key: "hasReductionsCredits" as const, label: "Reductions et credits d'impot", desc: "Dons, emploi a domicile, etc." },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl hover:bg-[#f3f4f6] transition-colors duration-150">
                <div>
                  <p className="font-medium text-[15px] text-[#111827]">{item.label}</p>
                  <p className="text-[13px] text-[#6b7280]">{item.desc}</p>
                </div>
                <ToggleGroup 
                  value={formData[item.key]} 
                  onChange={(v) => updateField(item.key, v)} 
                />
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Section 5: Documents */}
        <AccordionSection
          id="documents"
          title="Documents"
          subtitle="Pieces justificatives necessaires"
          isComplete={false}
          isOpen={openSection === "documents"}
          onToggle={() => setOpenSection(openSection === "documents" ? null : "documents")}
        >
          {/* Dropzone */}
          <div className="border-2 border-dashed border-[#e5e7eb] rounded-xl p-8 text-center hover:border-[#9ca3af] hover:bg-[#f9fafb] transition-all duration-150 cursor-pointer">
            <Upload className="h-8 w-8 text-[#9ca3af] mx-auto mb-3" />
            <p className="text-[15px] text-[#6b7280] mb-1">Deposez vos fichiers ici</p>
            <p className="text-[13px] text-[#9ca3af]">PDF, JPG, PNG (max 10 Mo)</p>
          </div>

          {/* Suggested Documents */}
          <div className="mt-6">
            <h4 className="font-medium text-[15px] text-[#111827] mb-3">Documents suggeres</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#9ca3af]" />
                  <span className="text-[15px] text-[#111827]">Piece d'identite</span>
                </div>
                <DocBadge status="missing" />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#9ca3af]" />
                  <span className="text-[15px] text-[#111827]">Avis d'imposition N-1</span>
                </div>
                <DocBadge status="missing" />
              </div>
              {formData.hasIfi && (
                <div className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#9ca3af]" />
                    <span className="text-[15px] text-[#111827]">Justificatifs patrimoine IFI</span>
                  </div>
                  <DocBadge status="missing" />
                </div>
              )}
              {formData.hasCrypto && (
                <div className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#9ca3af]" />
                    <span className="text-[15px] text-[#111827]">Releves crypto (Binance, etc.)</span>
                  </div>
                  <DocBadge status="missing" />
                </div>
              )}
              {formData.hasForeignAccounts && (
                <div className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#9ca3af]" />
                    <span className="text-[15px] text-[#111827]">Releves comptes etrangers</span>
                  </div>
                  <DocBadge status="missing" />
                </div>
              )}
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-white/90 border-t border-[#e5e7eb]">
        <div className="max-w-[720px] mx-auto px-8 py-4 flex items-center justify-between">
          <p className="text-[13px] text-[#9ca3af]">Sauvegarde automatique activee</p>
          <Button 
            onClick={handleSubmit}
            className="h-11 px-6 bg-[#111827] hover:bg-[#1f2937] text-white font-medium rounded-lg transition-all duration-150 hover:-translate-y-px"
          >
            Verifier & Soumettre
          </Button>
        </div>
      </div>
    </div>
  )
}
