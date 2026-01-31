"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { 
  ChevronDown, 
  Check, 
  Upload, 
  FileText, 
  X, 
  Trash2, 
  Plus,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"

// Types
interface FormData {
  identity: {
    lastName: string
    firstName: string
    birthDate: string
    birthPlace: string
    address: string
  }
  residence: {
    taxResident: string
    livedAbroad: string
    abroadCountry: string
  }
  family: {
    status: string
    hasChange: string
  }
  children: {
    hasChildren: string
    list: Child[]
  }
  pensions: {
    hasPension: string
    list: Pension[]
  }
  events: Event[]
  spouse: Spouse | null
  exSpouse: Spouse | null
  income: Record<string, boolean>
  deductions: Record<string, boolean>
  documents: UploadedFile[]
  confirmAccuracy: boolean
  confirmProcessing: boolean
}

interface Child {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  attachment: string
  isShared: boolean
}

interface Pension {
  id: string
  type: string
  beneficiary: string
  amount: string
}

interface Event {
  id: string
  type: string
  date: string
  details: string
}

interface Spouse {
  firstName: string
  lastName: string
  birthDate: string
  cohabiting: boolean
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
}

// Income toggles configuration
const incomeToggles = [
  { id: "salaires", label: "Salaires et traitements" },
  { id: "bnc", label: "BNC (professions libérales)" },
  { id: "bic", label: "BIC (activité commerciale)" },
  { id: "ba", label: "BA (activité agricole)" },
  { id: "foncier", label: "Revenus fonciers" },
  { id: "lmnp", label: "LMNP / LMP" },
  { id: "rcm", label: "Revenus de capitaux mobiliers" },
  { id: "plusvalues", label: "Plus-values mobilières" },
  { id: "crypto", label: "Crypto-actifs" },
  { id: "retraite", label: "Pensions de retraite" },
  { id: "ifi", label: "Assujetti à l'IFI" },
  { id: "etranger", label: "Revenus de source étrangère" },
]

// Deduction toggles configuration
const deductionToggles = [
  { id: "emploi_domicile", label: "Emploi à domicile" },
  { id: "garde_enfants", label: "Garde d'enfants" },
  { id: "dons", label: "Dons aux œuvres" },
  { id: "pinel", label: "Investissement Pinel" },
  { id: "per", label: "Épargne retraite (PER)" },
  { id: "deficit_foncier", label: "Déficit foncier" },
  { id: "csg", label: "CSG déductible" },
  { id: "pension_alimentaire", label: "Pension alimentaire versée" },
]

// Suggested documents based on form selections
const getSuggestedDocuments = (formData: FormData) => {
  const docs: { name: string; category: string }[] = [
    { name: "Pièce d'identité", category: "identity" },
    { name: "Avis d'imposition N-1", category: "identity" },
  ]

  if (formData.income.salaires) {
    docs.push({ name: "Bulletins de salaire", category: "income" })
    docs.push({ name: "Attestation employeur", category: "income" })
  }
  if (formData.income.bnc || formData.income.bic) {
    docs.push({ name: "Liasse fiscale 2035 ou 2031", category: "income" })
  }
  if (formData.income.foncier || formData.income.lmnp) {
    docs.push({ name: "Relevés de loyers perçus", category: "income" })
    docs.push({ name: "Charges déductibles", category: "income" })
  }
  if (formData.income.rcm) {
    docs.push({ name: "IFU (relevé bancaire)", category: "income" })
  }
  if (formData.income.plusvalues || formData.income.crypto) {
    docs.push({ name: "Relevés de cessions", category: "income" })
  }
  if (formData.income.ifi) {
    docs.push({ name: "Justificatifs patrimoine IFI", category: "income" })
  }
  if (formData.income.etranger) {
    docs.push({ name: "Justificatifs revenus étrangers", category: "income" })
  }
  if (formData.deductions.emploi_domicile) {
    docs.push({ name: "Attestation URSSAF / CESU", category: "deduction" })
  }
  if (formData.deductions.dons) {
    docs.push({ name: "Reçus fiscaux dons", category: "deduction" })
  }
  if (formData.deductions.per) {
    docs.push({ name: "Relevé versements PER", category: "deduction" })
  }

  return docs
}

// Accordion sections configuration
const sections = [
  { id: "identity", title: "Identité & coordonnées", subtitle: "Informations personnelles de base" },
  { id: "residence", title: "Résidence fiscale & international", subtitle: "Votre situation de résidence" },
  { id: "family", title: "Situation familiale", subtitle: "Votre situation au 31 décembre" },
  { id: "relations", title: "Relations du foyer", subtitle: "Conjoint actuel ou ex-conjoint" },
  { id: "children", title: "Enfants & personnes à charge", subtitle: "Enfants et autres personnes rattachées" },
  { id: "pensions", title: "Pensions & obligations", subtitle: "Pensions versées ou reçues" },
  { id: "events", title: "Événements familiaux", subtitle: "Événements survenus dans l'année" },
  { id: "income", title: "Panorama Revenus & IFI", subtitle: "Types de revenus et patrimoine" },
  { id: "deductions", title: "Charges / réductions / crédits", subtitle: "Dépenses ouvrant droit à réduction" },
  { id: "documents", title: "Documents", subtitle: "Justificatifs et pièces à fournir" },
  { id: "review", title: "Relecture & soumission", subtitle: "Validation finale de votre dossier" },
]

export default function OnboardingPage() {
  const params = useParams()
  const clientId = params.uuid as string

  const [clientName, setClientName] = useState("Nouveau Dossier")
  const [openSections, setOpenSections] = useState<string[]>(["identity"])
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved")
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Modal states
  const [childModalOpen, setChildModalOpen] = useState(false)
  const [pensionModalOpen, setPensionModalOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [spouseModalOpen, setSpouseModalOpen] = useState(false)
  const [exSpouseModalOpen, setExSpouseModalOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    identity: { lastName: "", firstName: "", birthDate: "", birthPlace: "", address: "" },
    residence: { taxResident: "", livedAbroad: "", abroadCountry: "" },
    family: { status: "", hasChange: "" },
    children: { hasChildren: "", list: [] },
    pensions: { hasPension: "", list: [] },
    events: [],
    spouse: null,
    exSpouse: null,
    income: {},
    deductions: {},
    documents: [],
    confirmAccuracy: false,
    confirmProcessing: false,
  })

  // Temporary modal form states
  const [tempChild, setTempChild] = useState<Partial<Child>>({})
  const [tempPension, setTempPension] = useState<Partial<Pension>>({})
  const [tempEvent, setTempEvent] = useState<Partial<Event>>({})
  const [tempSpouse, setTempSpouse] = useState<Partial<Spouse>>({})

  // Update client name in header
  useEffect(() => {
    const { firstName, lastName } = formData.identity
    if (firstName || lastName) {
      setClientName(`${firstName} ${lastName}`.trim() || "Nouveau Dossier")
    } else {
      setClientName("Nouveau Dossier")
    }
  }, [formData.identity.firstName, formData.identity.lastName])

  // Autosave simulation
  const triggerAutosave = useCallback(() => {
    setSaveStatus("saving")
    setTimeout(() => setSaveStatus("saved"), 1500)
  }, [])

  // Calculate progress
  const calculateProgress = () => {
    let filled = 0
    let total = 0

    // Identity fields
    const identityFields = ["lastName", "firstName", "birthDate", "address"]
    identityFields.forEach(field => {
      total++
      if (formData.identity[field as keyof typeof formData.identity]) filled++
    })

    // Residence
    total += 2
    if (formData.residence.taxResident) filled++
    if (formData.residence.livedAbroad) filled++

    // Family
    total++
    if (formData.family.status) filled++

    // Children
    total++
    if (formData.children.hasChildren) filled++

    // Pensions
    total++
    if (formData.pensions.hasPension) filled++

    // Confirmations
    total += 2
    if (formData.confirmAccuracy) filled++
    if (formData.confirmProcessing) filled++

    return Math.round((filled / total) * 100)
  }

  // Section status
  const getSectionStatus = (sectionId: string): "complete" | "incomplete" | "neutral" => {
    switch (sectionId) {
      case "identity":
        const { lastName, firstName, birthDate, address } = formData.identity
        if (lastName && firstName && birthDate && address) return "complete"
        if (lastName || firstName || birthDate || address) return "incomplete"
        return "neutral"
      case "residence":
        if (formData.residence.taxResident && formData.residence.livedAbroad) return "complete"
        if (formData.residence.taxResident || formData.residence.livedAbroad) return "incomplete"
        return "neutral"
      case "family":
        if (formData.family.status) return "complete"
        return "neutral"
      case "relations":
        const needsSpouse = ["married", "pacs"].includes(formData.family.status)
        if (needsSpouse && formData.spouse) return "complete"
        if (!needsSpouse) return "complete"
        return "neutral"
      case "children":
        if (formData.children.hasChildren === "no") return "complete"
        if (formData.children.hasChildren === "yes" && formData.children.list.length > 0) return "complete"
        if (formData.children.hasChildren) return "incomplete"
        return "neutral"
      case "pensions":
        if (formData.pensions.hasPension === "no") return "complete"
        if (formData.pensions.hasPension === "yes" && formData.pensions.list.length > 0) return "complete"
        if (formData.pensions.hasPension) return "incomplete"
        return "neutral"
      case "events":
        return formData.events.length > 0 ? "complete" : "neutral"
      case "income":
        return Object.values(formData.income).some(v => v) ? "complete" : "neutral"
      case "deductions":
        return Object.values(formData.deductions).some(v => v) ? "complete" : "neutral"
      case "documents":
        return formData.documents.length > 0 ? "complete" : "neutral"
      case "review":
        if (formData.confirmAccuracy && formData.confirmProcessing) return "complete"
        return "neutral"
      default:
        return "neutral"
    }
  }

  // Toggle section
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  // Update form field
  const updateField = (section: keyof FormData, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === "object" && !Array.isArray(prev[section])
        ? { ...(prev[section] as object), [field]: value }
        : value
    }))
    triggerAutosave()
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type
    }))

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...newFiles]
    }))
    triggerAutosave()
  }

  // Delete uploaded file
  const deleteFile = (id: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== id)
    }))
    triggerAutosave()
  }

  // Save child
  const saveChild = () => {
    if (!tempChild.firstName || !tempChild.lastName) return
    const newChild: Child = {
      id: crypto.randomUUID(),
      firstName: tempChild.firstName,
      lastName: tempChild.lastName,
      birthDate: tempChild.birthDate || "",
      attachment: tempChild.attachment || "exclusive",
      isShared: tempChild.isShared || false
    }
    setFormData(prev => ({
      ...prev,
      children: { ...prev.children, list: [...prev.children.list, newChild] }
    }))
    setTempChild({})
    setChildModalOpen(false)
    triggerAutosave()
  }

  // Delete child
  const deleteChild = (id: string) => {
    setFormData(prev => ({
      ...prev,
      children: { ...prev.children, list: prev.children.list.filter(c => c.id !== id) }
    }))
    triggerAutosave()
  }

  // Save pension
  const savePension = () => {
    if (!tempPension.type || !tempPension.amount) return
    const newPension: Pension = {
      id: crypto.randomUUID(),
      type: tempPension.type,
      beneficiary: tempPension.beneficiary || "",
      amount: tempPension.amount
    }
    setFormData(prev => ({
      ...prev,
      pensions: { ...prev.pensions, list: [...prev.pensions.list, newPension] }
    }))
    setTempPension({})
    setPensionModalOpen(false)
    triggerAutosave()
  }

  // Delete pension
  const deletePension = (id: string) => {
    setFormData(prev => ({
      ...prev,
      pensions: { ...prev.pensions, list: prev.pensions.list.filter(p => p.id !== id) }
    }))
    triggerAutosave()
  }

  // Save event
  const saveEvent = () => {
    if (!tempEvent.type || !tempEvent.date) return
    const newEvent: Event = {
      id: crypto.randomUUID(),
      type: tempEvent.type,
      date: tempEvent.date,
      details: tempEvent.details || ""
    }
    setFormData(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }))
    setTempEvent({})
    setEventModalOpen(false)
    triggerAutosave()
  }

  // Delete event
  const deleteEvent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== id)
    }))
    triggerAutosave()
  }

  // Save spouse
  const saveSpouse = (isEx: boolean = false) => {
    if (!tempSpouse.firstName || !tempSpouse.lastName) return
    const spouse: Spouse = {
      firstName: tempSpouse.firstName,
      lastName: tempSpouse.lastName,
      birthDate: tempSpouse.birthDate || "",
      cohabiting: tempSpouse.cohabiting ?? true
    }
    setFormData(prev => ({
      ...prev,
      [isEx ? "exSpouse" : "spouse"]: spouse
    }))
    setTempSpouse({})
    if (isEx) setExSpouseModalOpen(false)
    else setSpouseModalOpen(false)
    triggerAutosave()
  }

  // Submit form
  const handleSubmit = async () => {
    setIsSubmitted(true)
    // TODO: Save to database
  }

  const progress = calculateProgress()
  const suggestedDocs = getSuggestedDocuments(formData)
  const canSubmit = formData.confirmAccuracy && formData.confirmProcessing && progress > 50

  // Submitted state screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-[900px] mx-auto flex items-center justify-between h-[72px] px-8">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold text-gray-900 tracking-tight">Fiscalia</span>
              <div className="h-8 border-l border-gray-200" />
              <span className="text-lg font-semibold text-gray-900">{clientName}</span>
            </div>
          </div>
        </header>

        {/* Success State */}
        <main className="max-w-[720px] mx-auto px-8 py-20 text-center">
          <div className="mb-6">
            <Clock className="w-16 h-16 mx-auto text-gray-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Profil en cours de validation</h1>
          <p className="text-gray-500 mb-8">
            Votre dossier a été soumis avec succès. Il est maintenant en cours d'examen par votre avocat.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
            <Check className="w-4 h-4" />
            <span>Dossier soumis</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[900px] mx-auto flex items-center justify-between h-[72px] px-8">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-gray-900 tracking-tight">Fiscalia</span>
            <div className="h-8 border-l border-gray-200" />
            <span className="text-lg font-semibold text-gray-900">{clientName}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            saveStatus === "saving" 
              ? "bg-amber-50 text-amber-600" 
              : "bg-emerald-50 text-emerald-600"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === "saving" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
            }`} />
            <span>{saveStatus === "saving" ? "Enregistrement..." : "Enregistré"}</span>
          </div>
        </div>
      </header>

      {/* Trust Banner */}
      <div className="bg-gray-50 border-b border-gray-100 py-3 px-8">
        <p className="max-w-[720px] mx-auto text-center text-[13px] text-gray-500">
          Vos informations sont traitées par votre cabinet dans le cadre de votre dossier fiscal.{" "}
          <a href="#" className="text-gray-900 font-medium hover:opacity-70">Confidentialité</a> · <a href="#" className="text-gray-900 font-medium hover:opacity-70">Mentions légales</a>
        </p>
      </div>

      {/* Main */}
      <main className="max-w-[720px] mx-auto px-8 py-8 pb-36">
        {/* Progress */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-gray-500">Progression</span>
            <span className="text-[13px] font-semibold text-gray-900">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-gray-200" />
        </div>

        {/* Accordion */}
        <div className="flex flex-col">
          {sections.map(section => (
            <div key={section.id} className="border-b border-gray-100 first:border-t">
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between py-5 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    getSectionStatus(section.id) === "complete" 
                      ? "bg-emerald-50 text-emerald-600" 
                      : getSectionStatus(section.id) === "incomplete"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {getSectionStatus(section.id) === "complete" ? <Check className="w-3.5 h-3.5" /> : "•"}
                  </div>
                  <div>
                    <div className="text-[15px] font-medium text-gray-900">{section.title}</div>
                    <div className="text-[13px] text-gray-400 mt-0.5">{section.subtitle}</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                  openSections.includes(section.id) ? "rotate-180" : ""
                }`} />
              </button>

              {/* Accordion Content */}
              {openSections.includes(section.id) && (
                <div className="pb-8 pl-10">
                  {/* Identity Section */}
                  {section.id === "identity" && (
                    <div className="space-y-6">
                      <p className="text-[13px] text-gray-500 p-4 bg-gray-50 rounded-lg border-l-2 border-gray-900">
                        Ces informations sont obligatoires pour établir votre déclaration fiscale (2042).
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[13px] font-medium text-gray-900">
                            Nom<span className="text-red-500 ml-0.5">*</span>
                          </Label>
                          <Input
                            value={formData.identity.lastName}
                            onChange={e => updateField("identity", "lastName", e.target.value)}
                            placeholder="Dupont"
                            className="bg-gray-50 border-0 focus:bg-gray-100 focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[13px] font-medium text-gray-900">
                            Prénom<span className="text-red-500 ml-0.5">*</span>
                          </Label>
                          <Input
                            value={formData.identity.firstName}
                            onChange={e => updateField("identity", "firstName", e.target.value)}
                            placeholder="Jean"
                            className="bg-gray-50 border-0 focus:bg-gray-100 focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[13px] font-medium text-gray-900">
                            Date de naissance<span className="text-red-500 ml-0.5">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={formData.identity.birthDate}
                            onChange={e => updateField("identity", "birthDate", e.target.value)}
                            className="bg-gray-50 border-0 focus:bg-gray-100 focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[13px] font-medium text-gray-900">Lieu de naissance</Label>
                          <Input
                            value={formData.identity.birthPlace}
                            onChange={e => updateField("identity", "birthPlace", e.target.value)}
                            placeholder="Paris, France"
                            className="bg-gray-50 border-0 focus:bg-gray-100 focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-900">
                          Adresse fiscale<span className="text-red-500 ml-0.5">*</span>
                        </Label>
                        <Textarea
                          value={formData.identity.address}
                          onChange={e => updateField("identity", "address", e.target.value)}
                          placeholder="12 rue de la Paix&#10;75002 Paris"
                          rows={3}
                          className="bg-gray-50 border-0 focus:bg-gray-100 focus:ring-2 focus:ring-gray-900 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Residence Section */}
                  {section.id === "residence" && (
                    <div className="space-y-6">
                      <p className="text-[13px] text-gray-500 p-4 bg-gray-50 rounded-lg border-l-2 border-gray-900">
                        Ces informations déterminent votre régime d'imposition.
                      </p>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-900">
                          Résident fiscal France sur l'année ?<span className="text-red-500 ml-0.5">*</span>
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {["Oui", "Non", "Partiel"].map(option => (
                            <button
                              key={option}
                              onClick={() => updateField("residence", "taxResident", option.toLowerCase())}
                              className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                formData.residence.taxResident === option.toLowerCase()
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-900">
                          Avez-vous vécu à l'étranger pendant l'année ?
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {["Oui", "Non"].map(option => (
                            <button
                              key={option}
                              onClick={() => updateField("residence", "livedAbroad", option.toLowerCase())}
                              className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                formData.residence.livedAbroad === option.toLowerCase()
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {formData.residence.livedAbroad === "oui" && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <Label className="text-[13px] font-medium text-gray-900">Pays et Période</Label>
                            <Input
                              value={formData.residence.abroadCountry}
                              onChange={e => updateField("residence", "abroadCountry", e.target.value)}
                              placeholder="Ex: Suisse (Jan - Juin)"
                              className="mt-2 bg-white border-0 focus:ring-2 focus:ring-gray-900"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Family Section */}
                  {section.id === "family" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-900">
                          Situation au 31/12<span className="text-red-500 ml-0.5">*</span>
                        </Label>
                        <Select
                          value={formData.family.status}
                          onValueChange={value => updateField("family", "status", value)}
                        >
                          <SelectTrigger className="bg-gray-50 border-0 focus:ring-2 focus:ring-gray-900">
                            <SelectValue placeholder="Sélectionnez..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Célibataire</SelectItem>
                            <SelectItem value="married">Marié(e)</SelectItem>
                            <SelectItem value="pacs">Pacsé(e)</SelectItem>
                            <SelectItem value="cohabiting">Concubinage</SelectItem>
                            <SelectItem value="separated">Séparé(e)</SelectItem>
                            <SelectItem value="divorced">Divorcé(e)</SelectItem>
                            <SelectItem value="widowed">Veuf/Veuve</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-900">
                          Changement de situation dans l'année ?
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {["Oui", "Non"].map(option => (
                            <button
                              key={option}
                              onClick={() => updateField("family", "hasChange", option.toLowerCase())}
                              className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                formData.family.hasChange === option.toLowerCase()
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Relations Section */}
                  {section.id === "relations" && (
                    <div className="space-y-6">
                      {["married", "pacs"].includes(formData.family.status) ? (
                        <>
                          <div className="flex items-center justify-between">
                            <Label className="text-[13px] font-medium text-gray-900">Conjoint actuel</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSpouseModalOpen(true)}
                              className="text-[13px] border-gray-200"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              {formData.spouse ? "Modifier" : "Ajouter"}
                            </Button>
                          </div>
                          {formData.spouse && (
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {formData.spouse.firstName} {formData.spouse.lastName}
                                  </div>
                                  <div className="text-[13px] text-gray-500 mt-1">
                                    {formData.spouse.birthDate && `Né(e) le ${formData.spouse.birthDate}`}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setFormData(prev => ({ ...prev, spouse: null }))}
                                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : ["divorced", "separated", "widowed"].includes(formData.family.status) ? (
                        <>
                          <div className="flex items-center justify-between">
                            <Label className="text-[13px] font-medium text-gray-900">Ex-conjoint</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExSpouseModalOpen(true)}
                              className="text-[13px] border-gray-200"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              {formData.exSpouse ? "Modifier" : "Ajouter"}
                            </Button>
                          </div>
                          {formData.exSpouse && (
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {formData.exSpouse.firstName} {formData.exSpouse.lastName}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setFormData(prev => ({ ...prev, exSpouse: null }))}
                                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-[13px] text-gray-400 text-center py-8">
                          Renseignez d'abord votre situation familiale pour voir les options disponibles.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Children Section */}
                  {section.id === "children" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-900">
                          Avez-vous des enfants ou personnes à charge ?
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {["Oui", "Non"].map(option => (
                            <button
                              key={option}
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                children: { ...prev.children, hasChildren: option.toLowerCase() }
                              }))}
                              className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                formData.children.hasChildren === option.toLowerCase()
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      {formData.children.hasChildren === "oui" && (
                        <>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setChildModalOpen(true)}
                              className="text-[13px] border-gray-200"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Ajouter un enfant
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {formData.children.list.length === 0 ? (
                              <p className="text-[13px] text-gray-400 text-center py-6">
                                Aucun enfant ajouté.
                              </p>
                            ) : (
                              formData.children.list.map(child => (
                                <div key={child.id} className="bg-gray-50 rounded-xl p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {child.firstName} {child.lastName}
                                      </div>
                                      <div className="text-[13px] text-gray-500 mt-1">
                                        {child.birthDate && `Né(e) le ${child.birthDate}`}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => deleteChild(child.id)}
                                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Pensions Section */}
                  {section.id === "pensions" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[13px] font-medium text-gray-900">
                          Versez-vous ou recevez-vous une pension ?
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {["Oui", "Non"].map(option => (
                            <button
                              key={option}
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                pensions: { ...prev.pensions, hasPension: option.toLowerCase() }
                              }))}
                              className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                formData.pensions.hasPension === option.toLowerCase()
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      {formData.pensions.hasPension === "oui" && (
                        <>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPensionModalOpen(true)}
                              className="text-[13px] border-gray-200"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Ajouter une pension
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {formData.pensions.list.length === 0 ? (
                              <p className="text-[13px] text-gray-400 text-center py-6">
                                Aucune pension ajoutée.
                              </p>
                            ) : (
                              formData.pensions.list.map(pension => (
                                <div key={pension.id} className="bg-gray-50 rounded-xl p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="font-medium text-gray-900">{pension.type}</div>
                                      <div className="text-[13px] text-gray-500 mt-1">
                                        {pension.beneficiary && `Bénéficiaire: ${pension.beneficiary} • `}
                                        {pension.amount}€/an
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => deletePension(pension.id)}
                                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Events Section */}
                  {section.id === "events" && (
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEventModalOpen(true)}
                          className="text-[13px] border-gray-200"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Ajouter un événement
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {formData.events.length === 0 ? (
                          <p className="text-[13px] text-gray-400 text-center py-6">
                            Aucun événement déclaré.
                          </p>
                        ) : (
                          formData.events.map(event => (
                            <div key={event.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">{event.type}</div>
                                  <div className="text-[13px] text-gray-500 mt-1">
                                    {event.date}{event.details && ` • ${event.details}`}
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteEvent(event.id)}
                                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Income Section */}
                  {section.id === "income" && (
                    <div className="space-y-6">
                      <p className="text-[13px] text-gray-500 p-4 bg-gray-50 rounded-lg border-l-2 border-gray-900">
                        Indiquez les types de revenus et obligations déclaratives pour cette année.
                      </p>
                      <div className="divide-y divide-gray-100">
                        {incomeToggles.map(toggle => (
                          <div key={toggle.id} className="flex items-center justify-between py-5">
                            <span className="text-[14px] font-medium text-gray-900">{toggle.label}</span>
                            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                              <button
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  income: { ...prev.income, [toggle.id]: true }
                                }))}
                                className={`px-3.5 py-2 text-[12px] font-medium rounded-md transition-all ${
                                  formData.income[toggle.id] === true
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                                }`}
                              >
                                Oui
                              </button>
                              <button
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  income: { ...prev.income, [toggle.id]: false }
                                }))}
                                className={`px-3.5 py-2 text-[12px] font-medium rounded-md transition-all ${
                                  formData.income[toggle.id] === false
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                                }`}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deductions Section */}
                  {section.id === "deductions" && (
                    <div className="space-y-6">
                      <div className="divide-y divide-gray-100">
                        {deductionToggles.map(toggle => (
                          <div key={toggle.id} className="flex items-center justify-between py-5">
                            <span className="text-[14px] font-medium text-gray-900">{toggle.label}</span>
                            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                              <button
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  deductions: { ...prev.deductions, [toggle.id]: true }
                                }))}
                                className={`px-3.5 py-2 text-[12px] font-medium rounded-md transition-all ${
                                  formData.deductions[toggle.id] === true
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                                }`}
                              >
                                Oui
                              </button>
                              <button
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  deductions: { ...prev.deductions, [toggle.id]: false }
                                }))}
                                className={`px-3.5 py-2 text-[12px] font-medium rounded-md transition-all ${
                                  formData.deductions[toggle.id] === false
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                                }`}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents Section */}
                  {section.id === "documents" && (
                    <div className="space-y-6">
                      {/* Dropzone */}
                      <label className="block border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Upload className="w-12 h-12 mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
                        <div className="text-[14px] font-medium text-gray-900 mb-1">
                          Glissez vos fichiers ici ou cliquez pour sélectionner
                        </div>
                        <div className="text-[13px] text-gray-400">
                          PDF, JPEG, PNG • Max 25 Mo
                        </div>
                      </label>

                      {/* Uploaded Files */}
                      {formData.documents.length > 0 && (
                        <div>
                          <h4 className="text-[13px] font-semibold text-gray-900 mb-3">Documents déposés</h4>
                          <div className="space-y-2">
                            {formData.documents.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-medium text-gray-900 truncate max-w-[200px]">
                                      {doc.name}
                                    </div>
                                    <div className="text-[12px] text-gray-400">
                                      {(doc.size / 1024).toFixed(1)} Ko
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteFile(doc.id)}
                                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Documents */}
                      <div>
                        <h4 className="text-[13px] font-semibold text-gray-900 mb-3">Documents suggérés</h4>
                        <div className="space-y-2">
                          {suggestedDocs.map((doc, i) => {
                            const isReceived = formData.documents.some(d => 
                              d.name.toLowerCase().includes(doc.name.toLowerCase().split(" ")[0])
                            )
                            return (
                              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <span className="text-[13px] font-medium text-gray-900">{doc.name}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                                  isReceived 
                                    ? "bg-emerald-50 text-emerald-600" 
                                    : "bg-amber-50 text-amber-600"
                                }`}>
                                  {isReceived ? "Reçu" : "Manquant"}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Section */}
                  {section.id === "review" && (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className="divide-y divide-gray-100">
                        <div className="flex justify-between py-3.5">
                          <span className="text-[13px] text-gray-500">Identité</span>
                          <span className="text-[13px] font-semibold text-gray-900">{clientName}</span>
                        </div>
                        <div className="flex justify-between py-3.5">
                          <span className="text-[13px] text-gray-500">Situation familiale</span>
                          <span className="text-[13px] font-semibold text-gray-900">
                            {formData.family.status || "Non renseigné"}
                          </span>
                        </div>
                        <div className="flex justify-between py-3.5">
                          <span className="text-[13px] text-gray-500">Documents déposés</span>
                          <span className="text-[13px] font-semibold text-gray-900">
                            {formData.documents.length} fichier(s)
                          </span>
                        </div>
                      </div>

                      {/* Confirmations */}
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={formData.confirmAccuracy}
                            onCheckedChange={checked => setFormData(prev => ({
                              ...prev,
                              confirmAccuracy: checked as boolean
                            }))}
                            className="mt-0.5"
                          />
                          <span className="text-[13px] text-gray-700">
                            Je certifie que les informations fournies sont exactes.
                          </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={formData.confirmProcessing}
                            onCheckedChange={checked => setFormData(prev => ({
                              ...prev,
                              confirmProcessing: checked as boolean
                            }))}
                            className="mt-0.5"
                          />
                          <span className="text-[13px] text-gray-700">
                            J'autorise le cabinet à traiter ces données.
                          </span>
                        </label>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-4 text-center">
                        <Button
                          onClick={handleSubmit}
                          disabled={!canSubmit}
                          className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                        >
                          Soumettre au cabinet
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="max-w-[720px] mx-auto flex items-center justify-between py-4 px-8">
          <span className="text-[13px] text-gray-400">Sauvegarde automatique activée</span>
          <Button
            onClick={() => {
              setOpenSections(["review"])
              window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
            }}
            disabled={progress < 30}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            Vérifier & Soumettre
          </Button>
        </div>
      </footer>

      {/* Child Modal */}
      <Dialog open={childModalOpen} onOpenChange={setChildModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Ajouter un enfant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Prénom</Label>
                <Input
                  value={tempChild.firstName || ""}
                  onChange={e => setTempChild(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-gray-50 border-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Nom</Label>
                <Input
                  value={tempChild.lastName || ""}
                  onChange={e => setTempChild(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-gray-50 border-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Date de naissance</Label>
              <Input
                type="date"
                value={tempChild.birthDate || ""}
                onChange={e => setTempChild(prev => ({ ...prev, birthDate: e.target.value }))}
                className="bg-gray-50 border-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Rattachement</Label>
              <Select
                value={tempChild.attachment || "exclusive"}
                onValueChange={value => setTempChild(prev => ({ ...prev, attachment: value }))}
              >
                <SelectTrigger className="bg-gray-50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">Rattachement exclusif</SelectItem>
                  <SelectItem value="shared">Garde alternée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveChild} className="bg-gray-900 hover:bg-gray-800">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pension Modal */}
      <Dialog open={pensionModalOpen} onOpenChange={setPensionModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Ajouter une pension</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Type de pension</Label>
              <Select
                value={tempPension.type || ""}
                onValueChange={value => setTempPension(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-gray-50 border-0">
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="versee">Pension alimentaire versée</SelectItem>
                  <SelectItem value="recue">Pension alimentaire reçue</SelectItem>
                  <SelectItem value="prestation">Prestation compensatoire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Bénéficiaire / Payeur</Label>
              <Input
                value={tempPension.beneficiary || ""}
                onChange={e => setTempPension(prev => ({ ...prev, beneficiary: e.target.value }))}
                placeholder="Nom du bénéficiaire ou payeur"
                className="bg-gray-50 border-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Montant annuel (€)</Label>
              <Input
                type="number"
                value={tempPension.amount || ""}
                onChange={e => setTempPension(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="bg-gray-50 border-0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={savePension} className="bg-gray-900 hover:bg-gray-800">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Modal */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Ajouter un événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Type d'événement</Label>
              <Select
                value={tempEvent.type || ""}
                onValueChange={value => setTempEvent(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-gray-50 border-0">
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mariage">Mariage</SelectItem>
                  <SelectItem value="pacs">PACS</SelectItem>
                  <SelectItem value="divorce">Divorce</SelectItem>
                  <SelectItem value="separation">Séparation</SelectItem>
                  <SelectItem value="deces">Décès du conjoint</SelectItem>
                  <SelectItem value="naissance">Naissance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Date de l'événement</Label>
              <Input
                type="date"
                value={tempEvent.date || ""}
                onChange={e => setTempEvent(prev => ({ ...prev, date: e.target.value }))}
                className="bg-gray-50 border-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Détails (optionnel)</Label>
              <Textarea
                value={tempEvent.details || ""}
                onChange={e => setTempEvent(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Précisions éventuelles..."
                className="bg-gray-50 border-0 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEvent} className="bg-gray-900 hover:bg-gray-800">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spouse Modal */}
      <Dialog open={spouseModalOpen} onOpenChange={setSpouseModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Conjoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Prénom</Label>
                <Input
                  value={tempSpouse.firstName || ""}
                  onChange={e => setTempSpouse(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-gray-50 border-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Nom</Label>
                <Input
                  value={tempSpouse.lastName || ""}
                  onChange={e => setTempSpouse(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-gray-50 border-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Date de naissance</Label>
              <Input
                type="date"
                value={tempSpouse.birthDate || ""}
                onChange={e => setTempSpouse(prev => ({ ...prev, birthDate: e.target.value }))}
                className="bg-gray-50 border-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Cohabitation au 31/12 ?</Label>
              <div className="flex gap-2">
                {["Oui", "Non"].map(option => (
                  <button
                    key={option}
                    onClick={() => setTempSpouse(prev => ({ ...prev, cohabiting: option === "Oui" }))}
                    className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                      (tempSpouse.cohabiting ?? true) === (option === "Oui")
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveSpouse(false)} className="bg-gray-900 hover:bg-gray-800">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ex-Spouse Modal */}
      <Dialog open={exSpouseModalOpen} onOpenChange={setExSpouseModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Ex-conjoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Prénom</Label>
                <Input
                  value={tempSpouse.firstName || ""}
                  onChange={e => setTempSpouse(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-gray-50 border-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Nom</Label>
                <Input
                  value={tempSpouse.lastName || ""}
                  onChange={e => setTempSpouse(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-gray-50 border-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Date de naissance</Label>
              <Input
                type="date"
                value={tempSpouse.birthDate || ""}
                onChange={e => setTempSpouse(prev => ({ ...prev, birthDate: e.target.value }))}
                className="bg-gray-50 border-0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveSpouse(true)} className="bg-gray-900 hover:bg-gray-800">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
