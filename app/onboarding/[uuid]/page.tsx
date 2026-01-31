"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  ChevronDown, Upload, FileText, Folder, Check, X, Trash2, 
  AlertCircle, CheckCircle2, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  saveIdentity,
  saveResidenceFiscale,
  saveSituationFamiliale,
  saveRevenus,
  saveChargesDeductions,
  saveFiles,
  finalizeSubmission,
} from "@/app/actions/save-onboarding"

// ============================================
// TYPES
// ============================================

interface Child {
  id: string
  name: string
  birthDate: string
  custody: "principale" | "alternee"
}

interface UploadedFile {
  id: string
  name: string
  size: number
  file: File
  uploadedAt: Date
}

interface FormData {
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

interface SuggestedDocument {
  id: string
  name: string
  keywords: string[]
  mandatory: boolean
  note?: string
  status: "received" | "missing" | "optional"
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = "fiscalia_onboarding_data"

const COUNTRIES = [
  "Allemagne", "Belgique", "Espagne", "États-Unis", "Italie", 
  "Luxembourg", "Maroc", "Portugal", "Royaume-Uni", "Suisse", "Autre"
]

const FAMILY_STATUSES = [
  { value: "single", label: "Célibataire" },
  { value: "married", label: "Marié(e)" },
  { value: "pacs", label: "Pacsé(e)" },
  { value: "cohabiting", label: "Union libre" },
  { value: "divorced", label: "Divorcé(e)" },
  { value: "separated", label: "Séparé(e)" },
  { value: "widowed", label: "Veuf/Veuve" },
]

const MATRIMONIAL_REGIMES = [
  { value: "community", label: "Communauté" },
  { value: "separation", label: "Séparation de biens" },
  { value: "participation", label: "Participation aux acquêts" },
]

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  birthDate: "",
  address: "",
  taxResident: null,
  livedAbroad: null,
  abroadCountry: "",
  abroadDays: "",
  familyStatus: "",
  spouseName: "",
  matrimonialRegime: "",
  jointDeclaration: null,
  exSpouseName: "",
  alimonyPaid: null,
  alimonyAmount: "",
  children: [],
  familyChange: false,
  salary: false,
  salaryExpenses: "standard",
  salaryExpensesAmount: "",
  pension: false,
  pensionCount: "",
  unemployment: false,
  unemploymentStart: "",
  unemploymentEnd: "",
  independent: false,
  independentType: "",
  independentRegime: "micro",
  independentCharges: "",
  foncier: false,
  foncierCount: "",
  foncierRegime: "micro",
  lmnp: false,
  lmnpCount: "",
  lmnpRegime: "micro",
  foreign: false,
  foreignCountry: "",
  foreignAmount: "",
  foreignTaxPaid: null,
  foreignTaxAmount: "",
  interest: false,
  interestPfu: null,
  dividends: false,
  dividendsPfu: null,
  crypto: false,
  cryptoTransactions: "",
  cryptoPlatforms: "",
  donations: false,
  donationsAmount: "",
  childcare: false,
  childcareAmount: "",
  homeServices: false,
  homeServicesType: "",
  homeServicesAmount: "",
  alimonyDeduction: false,
  alimonyBeneficiary: "",
  alimonyDeductionAmount: "",
  accuracy: false,
  processing: false,
}

// ============================================
// HOOKS CUSTOM
// ============================================

function useAutosave(data: FormData, uploadedFiles: UploadedFile[]) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  
  useEffect(() => {
    setSaveStatus("saving")
    
    const timeout = setTimeout(() => {
      try {
        const dataToSave = {
          ...data,
          uploadedFilesMetadata: uploadedFiles.map(f => ({
            id: f.id,
            name: f.name,
            size: f.size,
            uploadedAt: f.uploadedAt.toISOString()
          }))
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }, 800)
    
    return () => clearTimeout(timeout)
  }, [data, uploadedFiles])
  
  return saveStatus
}

function useProgressCalculation(data: FormData, uploadedFiles: UploadedFile[]) {
  return useMemo(() => {
    let completed = 0
    
    // 1. Identité complète
    if (data.firstName && data.lastName && data.address) completed++
    
    // 2. Résidence fiscale renseignée
    if (data.taxResident !== null) completed++
    
    // 3. Situation familiale renseignée
    if (data.familyStatus) completed++
    
    // 4. Au moins 1 document uploadé
    if (uploadedFiles.length > 0) completed++
    
    return Math.round((completed / 4) * 100)
  }, [data.firstName, data.lastName, data.address, data.taxResident, data.familyStatus, uploadedFiles.length])
}

function useDocumentSuggestions(data: FormData, uploadedFiles: UploadedFile[]): SuggestedDocument[] {
  return useMemo(() => {
    const suggestions: SuggestedDocument[] = []
    
    const normalize = (text: string) => 
      text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    
    const checkFileMatch = (keywords: string[]) => {
      return uploadedFiles.some(file => {
        const normalizedName = normalize(file.name)
        return keywords.some(kw => normalizedName.includes(normalize(kw)))
      })
    }
    
    const addDoc = (id: string, name: string, keywords: string[], mandatory: boolean, note?: string) => {
      const matched = checkFileMatch(keywords)
      suggestions.push({
        id,
        name,
        keywords,
        mandatory,
        note,
        status: matched ? "received" : (mandatory ? "missing" : "optional")
      })
    }
    
    // DOCUMENTS OBLIGATOIRES POUR TOUS
    addDoc("iban", "Liste IBAN de vos comptes bancaires", ["iban", "rib", "compte", "bancaire"], true)
    addDoc("identity", "Pièce d'identité", ["identite", "identité", "carte", "passeport", "cni"], true)
    
    // SALAIRES
    if (data.salary) {
      addDoc("salary-slips", "Bulletins de salaire", ["bulletin", "salaire", "paie", "fiche"], true, "Au minimum le dernier bulletin de décembre")
      addDoc("employer-cert", "Attestation employeur / récapitulatif annuel", ["attestation", "employeur", "recap", "récap"], false, "Optionnel si bulletin insuffisant")
      if (data.salaryExpenses === "real") {
        addDoc("real-expenses", "Justificatifs frais réels", ["frais", "kilometrique", "kilomètre", "repas", "deplacement", "déplacement"], true)
      }
    }
    
    // PENSIONS
    if (data.pension) {
      addDoc("pension-cert", "Attestation annuelle de pension", ["pension", "retraite", "attestation", "carsat", "cnav"], true, "Pensions retraite ou invalidité")
    }
    
    // CHÔMAGE
    if (data.unemployment) {
      addDoc("unemployment-cert", "Attestation Pôle emploi", ["pole", "pôle", "emploi", "chomage", "chômage", "allocation"], true, "Montants imposables")
    }
    
    // INDÉPENDANTS
    if (data.independent) {
      if (data.independentRegime === "real") {
        addDoc("tax-return", "Liasse fiscale", ["liasse", "fiscal", "2031", "2033", "bilan"], true, "Déclaration complète régime réel")
        if (data.independentCharges) {
          addDoc("charges-proof", "Justificatifs de charges", ["charge", "facture", "depense", "dépense"], false, "Charges déductibles BNC/BIC")
        }
      } else {
        addDoc("income-table", "Tableau recettes/dépenses", ["recette", "micro", "chiffre", "affaires"], true, "Livre des recettes micro")
      }
    }
    
    // FONCIER
    if (data.foncier) {
      addDoc("rent-receipts", "Quittances / loyers encaissés", ["quittance", "loyer", "bail", "locataire"], true, "Montants bruts perçus")
      addDoc("property-tax", "Taxe foncière", ["taxe", "fonciere", "foncière", "impot", "impôt"], true, "Charge déductible")
      addDoc("condo-charges", "Charges de copropriété", ["copro", "syndic", "charge"], false, "Déductibles selon cas")
    }
    
    // LMNP
    if (data.lmnp) {
      addDoc("lmnp-income", "Tableau recettes LMNP", ["lmnp", "recette", "meuble", "meublé"], true, "Base micro ou réel")
      if (data.lmnpRegime === "real") {
        addDoc("lmnp-depreciation", "Tableau amortissements", ["amortissement", "lmnp", "reel", "réel"], false, "Spécifique régime réel")
        addDoc("lmnp-charges", "Factures charges LMNP", ["facture", "lmnp", "charge"], false, "Charges déductibles")
      }
    }
    
    // REVENUS ÉTRANGERS
    if (data.foreign) {
      addDoc("foreign-income", "Justificatifs revenus étrangers", ["etranger", "étranger", "foreign", "international"], true, "Avant crédits d'impôt")
      if (data.foreignTaxPaid) {
        addDoc("foreign-tax", "Justificatif impôt payé à l'étranger", ["impot", "impôt", "etranger", "étranger", "credit", "crédit"], false, "Pour crédit d'impôt ou exonération")
      }
    }
    
    // INTÉRÊTS
    if (data.interest) {
      addDoc("ifu-interest", "IFU / attestation bancaire (intérêts)", ["ifu", "interet", "intérêt", "bancaire", "livret"], true, "Imprimé Fiscal Unique")
    }
    
    // DIVIDENDES
    if (data.dividends) {
      addDoc("ifu-dividends", "IFU dividendes", ["ifu", "dividende", "action"], true, "Flat tax ou barème")
    }
    
    // CRYPTO
    if (data.crypto) {
      addDoc("crypto-history", "Historique des cessions crypto", ["crypto", "cession", "bitcoin", "blockchain", "binance"], true, "Calcul plus-values")
      addDoc("crypto-statements", "Relevés plateformes crypto", ["plateforme", "crypto", "exchange", "releve", "relevé"], false, "Traçabilité des transactions")
    }
    
    // DONS
    if (data.donations) {
      addDoc("donation-receipts", "Reçus fiscaux (dons)", ["don", "recu", "reçu", "cerfa", "association"], true, "Réduction d'impôt")
    }
    
    // GARDE ENFANTS
    if (data.childcare) {
      addDoc("childcare-cert", "Attestation garde d'enfants", ["garde", "enfant", "creche", "crèche", "assistante"], true, "Crédit d'impôt")
    }
    
    // SERVICES À LA PERSONNE
    if (data.homeServices) {
      addDoc("home-services-cert", "Attestation services à la personne", ["service", "personne", "sap", "menage", "ménage"], true, "Crédit d'impôt 50%")
    }
    
    // PENSION ALIMENTAIRE
    if (data.alimonyDeduction) {
      addDoc("alimony-proof", "Justificatifs pension alimentaire", ["pension", "alimentaire", "versement", "virement"], true, "Déduction plafonnée")
    }
    
    // CHANGEMENT SITUATION FAMILIALE
    if (data.familyChange) {
      addDoc("family-book", "Livret de famille", ["livret", "famille", "mariage", "divorce", "naissance"], false, "Justificatif changement situation")
    }
    
    return suggestions.sort((a, b) => {
      const order = { missing: 0, optional: 1, received: 2 }
      return order[a.status] - order[b.status]
    })
  }, [data, uploadedFiles])
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function OnboardingPage() {
  const params = useParams()
  const uuid = params.uuid as string
  
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [openSections, setOpenSections] = useState<string[]>(["identity"])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showChildDialog, setShowChildDialog] = useState(false)
  const [newChild, setNewChild] = useState({ name: "", birthDate: "", custody: "principale" as const })
  const [referenceNumber, setReferenceNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStep, setSubmissionStep] = useState(0)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  
  const submissionSteps = [
    { id: 1, label: "Sauvegarde de l'identité", icon: "user" },
    { id: 2, label: "Résidence fiscale", icon: "home" },
    { id: 3, label: "Situation familiale", icon: "users" },
    { id: 4, label: "Revenus & patrimoine", icon: "wallet" },
    { id: 5, label: "Charges & déductions", icon: "receipt" },
    { id: 6, label: "Upload des documents", icon: "folder" },
    { id: 7, label: "Finalisation", icon: "check" },
  ]
  
  const saveStatus = useAutosave(formData, uploadedFiles)
  const progress = useProgressCalculation(formData, uploadedFiles)
  const suggestedDocuments = useDocumentSuggestions(formData, uploadedFiles)
  
  const mandatoryMissing = suggestedDocuments.filter(d => d.mandatory && d.status === "missing").length
  const canSubmit = progress === 100 && formData.accuracy && formData.processing && mandatoryMissing === 0
  
  // Charger les données du client et localStorage
  useEffect(() => {
    const loadData = async () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setFormData(prev => ({ ...prev, ...parsed }))
        } catch {}
      }
      
      const supabase = createClient()
      const { data } = await supabase
        .from("clients")
        .select("first_name, last_name")
        .eq("id", uuid)
        .single()
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          firstName: prev.firstName || data.first_name || "",
          lastName: prev.lastName || data.last_name || ""
        }))
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [uuid])
  
  // Nom du client dans le header (mise à jour instantanée)
  const displayName = useMemo(() => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName} ${formData.lastName}`
    }
    if (formData.firstName) return formData.firstName
    if (formData.lastName) return formData.lastName
    return "Nouveau Dossier"
  }, [formData.firstName, formData.lastName])
  
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])
  
  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }
  
  const isSectionComplete = (sectionId: string): boolean => {
    switch (sectionId) {
      case "identity":
        return !!(formData.firstName && formData.lastName && formData.address)
      case "residence":
        return formData.taxResident !== null
      case "family":
        return !!formData.familyStatus
      case "income":
        return formData.salary || formData.pension || formData.unemployment || 
               formData.independent || formData.foncier || formData.lmnp ||
               formData.foreign || formData.interest || formData.dividends || formData.crypto
      case "deductions":
        return formData.donations || formData.childcare || formData.homeServices || formData.alimonyDeduction
      case "documents":
        return uploadedFiles.length > 0
      case "summary":
        return canSubmit
      default:
        return false
    }
  }
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      file,
      uploadedAt: new Date()
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }
  
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }
  
  const addChild = () => {
    if (!newChild.name || !newChild.birthDate) return
    
    const child: Child = {
      id: crypto.randomUUID(),
      ...newChild
    }
    
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, child]
    }))
    
    setNewChild({ name: "", birthDate: "", custody: "principale" })
    setShowChildDialog(false)
  }
  
  const removeChild = (id: string) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter(c => c.id !== id)
    }))
  }
  
  const handleSubmit = async () => {
    setShowConfirmDialog(false)
    setIsSubmitting(true)
    setSubmissionStep(0)
    setSubmissionError(null)
    
    try {
      // Étape 1: Identité
      setSubmissionStep(1)
      await saveIdentity(uuid, formData)
      await new Promise(r => setTimeout(r, 400)) // Petit délai pour l'UX
      
      // Étape 2: Résidence fiscale
      setSubmissionStep(2)
      await saveResidenceFiscale(uuid, formData)
      await new Promise(r => setTimeout(r, 400))
      
      // Étape 3: Situation familiale
      setSubmissionStep(3)
      await saveSituationFamiliale(uuid, formData)
      await new Promise(r => setTimeout(r, 400))
      
      // Étape 4: Revenus
      setSubmissionStep(4)
      await saveRevenus(uuid, formData)
      await new Promise(r => setTimeout(r, 400))
      
      // Étape 5: Charges & déductions
      setSubmissionStep(5)
      await saveChargesDeductions(uuid, formData)
      await new Promise(r => setTimeout(r, 400))
      
      // Étape 6: Fichiers
      setSubmissionStep(6)
      // Convertir les fichiers en base64 pour l'envoi
      const filesData = await Promise.all(
        uploadedFiles.map(async (f) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(f.file)
          })
          return {
            id: f.id,
            name: f.name,
            size: f.size,
            base64,
            type: f.file.type,
          }
        })
      )
      await saveFiles(uuid, filesData)
      await new Promise(r => setTimeout(r, 400))
      
      // Étape 7: Finalisation
      setSubmissionStep(7)
      const result = await finalizeSubmission(uuid, formData)
      await new Promise(r => setTimeout(r, 600))
      
      // Nettoyer localStorage
      localStorage.removeItem(STORAGE_KEY)
      
      // Succès
      setReferenceNumber(result.referenceNumber)
      setIsSubmitting(false)
      setIsSubmitted(true)
      
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Une erreur est survenue")
      setIsSubmitting(false)
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }
  
  const showSpouseInfo = ["married", "pacs", "cohabiting"].includes(formData.familyStatus)
  const showExSpouseInfo = ["divorced", "separated"].includes(formData.familyStatus)
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
  
  // ÉCRAN DE SOUMISSION EN COURS
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enregistrement en cours</h1>
            <p className="text-gray-500">Veuillez patienter pendant la sauvegarde de vos données...</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progression</span>
              <span>{Math.round((submissionStep / submissionSteps.length) * 100)}%</span>
            </div>
            <Progress 
              value={(submissionStep / submissionSteps.length) * 100} 
              className="h-2 bg-gray-100"
            />
          </div>
          
          {/* Stepper */}
          <div className="space-y-3">
            {submissionSteps.map((step) => {
              const isCompleted = submissionStep > step.id
              const isCurrent = submissionStep === step.id
              const isPending = submissionStep < step.id
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                    isCompleted ? "bg-emerald-50" :
                    isCurrent ? "bg-gray-100" :
                    "bg-gray-50"
                  }`}
                >
                  {/* Icône */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isCompleted ? "bg-emerald-500" :
                    isCurrent ? "bg-gray-900" :
                    "bg-gray-200"
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <span className="text-xs font-medium text-gray-500">{step.id}</span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    isCompleted ? "text-emerald-700" :
                    isCurrent ? "text-gray-900" :
                    "text-gray-400"
                  }`}>
                    {step.label}
                  </span>
                  
                  {/* Status */}
                  {isCompleted && (
                    <span className="ml-auto text-xs text-emerald-600 font-medium">Terminé</span>
                  )}
                  {isCurrent && (
                    <span className="ml-auto text-xs text-gray-500">En cours...</span>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Message d'erreur si échec */}
          {submissionError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Erreur lors de la sauvegarde</p>
                  <p className="text-sm text-red-600 mt-1">{submissionError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                    onClick={() => {
                      setIsSubmitting(false)
                      setSubmissionError(null)
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // ÉCRAN DE SUCCÈS
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil soumis avec succès !</h1>
          <p className="text-gray-500 mb-4">Votre dossier est en cours de validation par notre équipe.</p>
          <p className="text-sm font-mono text-gray-400 mb-8">Référence : #{referenceNumber}</p>
          
          <div className="space-y-4 text-left mb-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Profil soumis</p>
                <p className="text-sm text-gray-500">{new Date().toLocaleString("fr-FR")}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
              </div>
              <div>
                <p className="font-medium text-gray-900">En cours de validation</p>
                <p className="text-sm text-gray-500">Délai estimé : 24-48h</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
              </div>
              <div>
                <p className="font-medium text-gray-400">Validation complète</p>
                <p className="text-sm text-gray-400">En attente</p>
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="w-full" onClick={() => window.location.href = "/dashboard"}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }
  
  const sections = [
    { id: "identity", title: "Identité", subtitle: "Informations personnelles" },
    { id: "residence", title: "Résidence fiscale", subtitle: "Votre domiciliation" },
    { id: "family", title: "Situation familiale", subtitle: "Conjoint et enfants" },
    { id: "income", title: "Revenus & Patrimoine", subtitle: "Sources de revenus" },
    { id: "deductions", title: "Charges & Déductions", subtitle: "Réductions d'impôt" },
    { id: "documents", title: "Documents", subtitle: "Pièces justificatives" },
    { id: "summary", title: "Récapitulatif", subtitle: "Validation finale" },
  ]
  
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: "antialiased" }}>
      {/* HEADER STICKY GLASSMORPHISM */}
      <header className="sticky top-0 z-50 h-[72px] bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[720px] mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tight text-gray-900">Fiscalia</span>
            <div className="w-px h-6 bg-gray-200" />
            <span className="text-lg font-semibold text-gray-900 transition-all duration-200">{displayName}</span>
          </div>
          
          <Badge 
            variant="secondary"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-300 ${
              saveStatus === "saved" 
                ? "bg-emerald-50 text-emerald-700" 
                : saveStatus === "saving"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
              saveStatus === "saved" 
                ? "bg-emerald-500" 
                : saveStatus === "saving"
                ? "bg-amber-500 animate-pulse"
                : "bg-red-500"
            }`} />
            {saveStatus === "saved" ? "Enregistré" : saveStatus === "saving" ? "Enregistrement..." : "Erreur"}
          </Badge>
        </div>
      </header>
      
      {/* CONTENU PRINCIPAL */}
      <main className="max-w-[720px] mx-auto px-6 py-8">
        {/* BARRE DE PROGRESSION */}
        <div className="bg-gray-50 rounded-lg p-5 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Complétion du profil</span>
            <span className="text-sm font-semibold text-gray-900">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-200 [&>div]:bg-gray-900 [&>div]:transition-all [&>div]:duration-500" />
        </div>
        
        {/* ACCORDÉON */}
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* HEADER SECTION */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isSectionComplete(section.id) 
                    ? "bg-emerald-100" 
                    : "bg-gray-100"
                }`}>
                  {isSectionComplete(section.id) ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.subtitle}</p>
                </div>
                
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                  openSections.includes(section.id) ? "rotate-180" : ""
                }`} />
              </button>
              
              {/* CONTENU SECTION */}
              {openSections.includes(section.id) && (
                <div className="px-5 pb-6 pt-2 border-t border-gray-100">
                  {/* SECTION IDENTITÉ */}
                  {section.id === "identity" && (
                    <div className="space-y-4 pl-10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Prénom *</Label>
                          <Input
                            value={formData.firstName}
                            onChange={e => updateField("firstName", e.target.value)}
                            placeholder="Jean"
                            className="bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-900 focus:ring-gray-900 rounded-md"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Nom *</Label>
                          <Input
                            value={formData.lastName}
                            onChange={e => updateField("lastName", e.target.value)}
                            placeholder="Dupont"
                            className="bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-900 focus:ring-gray-900 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Date de naissance</Label>
                        <Input
                          type="date"
                          value={formData.birthDate}
                          onChange={e => updateField("birthDate", e.target.value)}
                          className="bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-900 focus:ring-gray-900 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Adresse fiscale *</Label>
                        <Textarea
                          value={formData.address}
                          onChange={e => updateField("address", e.target.value)}
                          placeholder="Numéro, rue, code postal, ville"
                          rows={3}
                          className="bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-900 focus:ring-gray-900 rounded-md resize-none"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* SECTION RÉSIDENCE */}
                  {section.id === "residence" && (
                    <div className="space-y-4 pl-10">
                      <div>
                        <Label className="text-sm text-gray-600 mb-3 block">Êtes-vous résident fiscal français ?</Label>
                        <div className="flex gap-2">
                          {[{ value: true, label: "Oui" }, { value: false, label: "Non" }].map(opt => (
                            <button
                              key={String(opt.value)}
                              onClick={() => updateField("taxResident", opt.value)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                                formData.taxResident === opt.value
                                  ? "bg-gray-900 text-white border-gray-900"
                                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {formData.taxResident === false && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                          <Label className="text-sm text-gray-600 mb-3 block">Avez-vous vécu à l'étranger en 2024 ?</Label>
                          <div className="flex gap-2 mb-4">
                            {[{ value: true, label: "Oui" }, { value: false, label: "Non" }].map(opt => (
                              <button
                                key={String(opt.value)}
                                onClick={() => updateField("livedAbroad", opt.value)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                                  formData.livedAbroad === opt.value
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          
                          {formData.livedAbroad && (
                            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                              <div>
                                <Label className="text-sm text-gray-600 mb-1.5 block">Pays de résidence</Label>
                                <Select value={formData.abroadCountry} onValueChange={v => updateField("abroadCountry", v)}>
                                  <SelectTrigger className="bg-white border-gray-200 focus:ring-gray-900 rounded-md">
                                    <SelectValue placeholder="Sélectionner un pays" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COUNTRIES.map(c => (
                                      <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-600 mb-1.5 block">Nombre de jours</Label>
                                <Input
                                  type="number"
                                  value={formData.abroadDays}
                                  onChange={e => updateField("abroadDays", e.target.value)}
                                  placeholder="0"
                                  className="bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md"
                                />
                                <p className="text-xs text-gray-400 mt-1">Indiquez le nombre de jours passés dans ce pays</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* SECTION FAMILLE */}
                  {section.id === "family" && (
                    <div className="space-y-4 pl-10">
                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Statut matrimonial</Label>
                        <Select value={formData.familyStatus} onValueChange={v => updateField("familyStatus", v)}>
                          <SelectTrigger className="bg-gray-50 border-gray-200 focus:ring-gray-900 rounded-md">
                            <SelectValue placeholder="Sélectionner votre statut" />
                          </SelectTrigger>
                          <SelectContent>
                            {FAMILY_STATUSES.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {showSpouseInfo && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
                          <h4 className="font-medium text-gray-900">Informations Conjoint</h4>
                          <div>
                            <Label className="text-sm text-gray-600 mb-1.5 block">Nom du conjoint</Label>
                            <Input
                              value={formData.spouseName}
                              onChange={e => updateField("spouseName", e.target.value)}
                              className="bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600 mb-1.5 block">Régime matrimonial</Label>
                            <Select value={formData.matrimonialRegime} onValueChange={v => updateField("matrimonialRegime", v)}>
                              <SelectTrigger className="bg-white border-gray-200 focus:ring-gray-900 rounded-md">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                {MATRIMONIAL_REGIMES.map(r => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600 mb-3 block">Déclaration commune</Label>
                            <div className="flex gap-2">
                              {[{ value: true, label: "Oui" }, { value: false, label: "Non" }].map(opt => (
                                <button
                                  key={String(opt.value)}
                                  onClick={() => updateField("jointDeclaration", opt.value)}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                                    formData.jointDeclaration === opt.value
                                      ? "bg-gray-900 text-white border-gray-900"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {showExSpouseInfo && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
                          <h4 className="font-medium text-gray-900">Informations Ex-Conjoint</h4>
                          <div>
                            <Label className="text-sm text-gray-600 mb-1.5 block">Nom de l'ex-conjoint</Label>
                            <Input
                              value={formData.exSpouseName}
                              onChange={e => updateField("exSpouseName", e.target.value)}
                              className="bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600 mb-3 block">Pension alimentaire versée</Label>
                            <div className="flex gap-2">
                              {[{ value: true, label: "Oui" }, { value: false, label: "Non" }].map(opt => (
                                <button
                                  key={String(opt.value)}
                                  onClick={() => updateField("alimonyPaid", opt.value)}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                                    formData.alimonyPaid === opt.value
                                      ? "bg-gray-900 text-white border-gray-900"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          {formData.alimonyPaid && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                              <Label className="text-sm text-gray-600 mb-1.5 block">Montant annuel</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={formData.alimonyAmount}
                                  onChange={e => updateField("alimonyAmount", e.target.value)}
                                  className="bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <Label className="text-sm text-gray-900">Changement de situation familiale en 2024</Label>
                          <p className="text-xs text-gray-500">Mariage, divorce, naissance...</p>
                        </div>
                        <Switch
                          checked={formData.familyChange}
                          onCheckedChange={v => updateField("familyChange", v)}
                        />
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Enfants à charge</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowChildDialog(true)}
                            className="text-sm border-gray-200"
                          >
                            + Ajouter un enfant
                          </Button>
                        </div>
                        
                        {formData.children.length > 0 && (
                          <div className="space-y-2">
                            {formData.children.map(child => (
                              <div key={child.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div>
                                  <p className="font-medium text-gray-900">{child.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(child.birthDate).toLocaleDateString("fr-FR")} • Garde {child.custody === "principale" ? "principale" : "alternée"}
                                  </p>
                                </div>
                                <button onClick={() => removeChild(child.id)} className="text-gray-400 hover:text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* SECTION REVENUS */}
                  {section.id === "income" && (
                    <div className="space-y-1 pl-10">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2 pb-3">Revenus du travail</p>
                      
                      {/* Salaires */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-gray-900">Salaires et traitements</Label>
                          <Switch checked={formData.salary} onCheckedChange={v => updateField("salary", v)} />
                        </div>
                        {formData.salary && (
                          <div className="mt-3 pl-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div>
                              <Label className="text-sm text-gray-600 mb-2 block">Frais réels ou abattement 10% ?</Label>
                              <div className="flex gap-2">
                                {[{ value: "standard", label: "Abattement 10%" }, { value: "real", label: "Frais réels" }].map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => updateField("salaryExpenses", opt.value as "standard" | "real")}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                      formData.salaryExpenses === opt.value
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {formData.salaryExpenses === "real" && (
                              <div className="animate-in slide-in-from-top-2 duration-200">
                                <Label className="text-sm text-gray-600 mb-1.5 block">Montant des frais réels</Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={formData.salaryExpensesAmount}
                                    onChange={e => updateField("salaryExpensesAmount", e.target.value)}
                                    className="bg-gray-50 border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md pr-8"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Pensions */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Pensions / retraites</Label>
                            <p className="text-xs text-gray-500">Retraite, invalidité, etc.</p>
                          </div>
                          <Switch checked={formData.pension} onCheckedChange={v => updateField("pension", v)} />
                        </div>
                        {formData.pension && (
                          <div className="mt-3 pl-4 animate-in slide-in-from-top-2 duration-200">
                            <Label className="text-sm text-gray-600 mb-1.5 block">Nombre de pensions</Label>
                            <Input
                              type="number"
                              value={formData.pensionCount}
                              onChange={e => updateField("pensionCount", e.target.value)}
                              className="bg-gray-50 border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md w-24"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Chômage */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Allocations chômage</Label>
                            <p className="text-xs text-gray-500">Indemnités Pôle emploi</p>
                          </div>
                          <Switch checked={formData.unemployment} onCheckedChange={v => updateField("unemployment", v)} />
                        </div>
                      </div>
                      
                      {/* Indépendants */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-gray-900">Revenus indépendants (BIC/BNC/BA)</Label>
                          <Switch checked={formData.independent} onCheckedChange={v => updateField("independent", v)} />
                        </div>
                        {formData.independent && (
                          <div className="mt-3 pl-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div>
                              <Label className="text-sm text-gray-600 mb-1.5 block">Type d'activité</Label>
                              <Input
                                value={formData.independentType}
                                onChange={e => updateField("independentType", e.target.value)}
                                placeholder="Ex: Consultant, Artisan..."
                                className="bg-gray-50 border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-gray-600 mb-2 block">Régime fiscal</Label>
                              <div className="flex gap-2">
                                {[{ value: "micro", label: "Micro-entreprise" }, { value: "real", label: "Réel" }].map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => updateField("independentRegime", opt.value as "micro" | "real")}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                      formData.independentRegime === opt.value
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-6 pb-3">Immobilier</p>
                      
                      {/* Foncier */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Revenus fonciers (location nue)</Label>
                            <p className="text-xs text-gray-500">Locations vides uniquement</p>
                          </div>
                          <Switch checked={formData.foncier} onCheckedChange={v => updateField("foncier", v)} />
                        </div>
                      </div>
                      
                      {/* LMNP */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Location meublée (LMNP)</Label>
                            <p className="text-xs text-gray-500">Locations meublées non professionnelles</p>
                          </div>
                          <Switch checked={formData.lmnp} onCheckedChange={v => updateField("lmnp", v)} />
                        </div>
                      </div>
                      
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-6 pb-3">International</p>
                      
                      {/* Revenus étrangers */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-gray-900">Revenus étrangers</Label>
                          <Switch checked={formData.foreign} onCheckedChange={v => updateField("foreign", v)} />
                        </div>
                      </div>
                      
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-6 pb-3">Épargne & Placements</p>
                      
                      {/* Intérêts */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Intérêts et placements</Label>
                            <p className="text-xs text-gray-500">Livrets, comptes à terme, obligations</p>
                          </div>
                          <Switch checked={formData.interest} onCheckedChange={v => updateField("interest", v)} />
                        </div>
                      </div>
                      
                      {/* Dividendes */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Dividendes</Label>
                            <p className="text-xs text-gray-500">Actions, parts sociales</p>
                          </div>
                          <Switch checked={formData.dividends} onCheckedChange={v => updateField("dividends", v)} />
                        </div>
                      </div>
                      
                      {/* Crypto */}
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Cryptomonnaies</Label>
                            <p className="text-xs text-gray-500">Cessions d'actifs numériques</p>
                          </div>
                          <Switch checked={formData.crypto} onCheckedChange={v => updateField("crypto", v)} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* SECTION CHARGES & DÉDUCTIONS */}
                  {section.id === "deductions" && (
                    <div className="space-y-1 pl-10">
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Dons aux associations</Label>
                            <p className="text-xs text-gray-500">Dons à des organismes d'intérêt général</p>
                          </div>
                          <Switch checked={formData.donations} onCheckedChange={v => updateField("donations", v)} />
                        </div>
                        {formData.donations && (
                          <div className="mt-3 pl-4 animate-in slide-in-from-top-2 duration-200">
                            <Label className="text-sm text-gray-600 mb-1.5 block">Montant total des dons</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={formData.donationsAmount}
                                onChange={e => updateField("donationsAmount", e.target.value)}
                                className="bg-gray-50 border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md pr-8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Frais de garde d'enfants</Label>
                            <p className="text-xs text-gray-500">Crèche, assistante maternelle agréée</p>
                          </div>
                          <Switch checked={formData.childcare} onCheckedChange={v => updateField("childcare", v)} />
                        </div>
                      </div>
                      
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Services à la personne</Label>
                            <p className="text-xs text-gray-500">50% de crédit d'impôt plafonné</p>
                          </div>
                          <Switch checked={formData.homeServices} onCheckedChange={v => updateField("homeServices", v)} />
                        </div>
                      </div>
                      
                      <div className="py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-900">Pension alimentaire versée</Label>
                            <p className="text-xs text-gray-500">Déduction plafonnée</p>
                          </div>
                          <Switch checked={formData.alimonyDeduction} onCheckedChange={v => updateField("alimonyDeduction", v)} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* SECTION DOCUMENTS */}
                  {section.id === "documents" && (
                    <div className="space-y-6 pl-10">
                      <label className="block">
                        <div className="h-40 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700">Glissez vos documents ici ou cliquez pour parcourir</p>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPEG, PNG • Max 10 Mo par fichier</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpeg,.jpg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Documents uploadés</h4>
                          {uploadedFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Documents à fournir</h4>
                        <p className="text-xs text-gray-500 mb-4">Selon votre situation</p>
                        
                        <div className="space-y-2">
                          {suggestedDocuments.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all duration-200">
                              <div className="flex items-center gap-3">
                                <Folder className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm text-gray-900">{doc.name}</p>
                                  {doc.note && <p className="text-xs text-gray-500">{doc.note}</p>}
                                </div>
                              </div>
                              <Badge 
                                variant="secondary"
                                className={`text-xs ${
                                  doc.status === "received" 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : doc.status === "missing"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {doc.status === "received" ? "Reçu" : doc.status === "missing" ? "Manquant" : "Optionnel"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* SECTION RÉCAPITULATIF */}
                  {section.id === "summary" && (
                    <div className="space-y-6 pl-10">
                      <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Nom complet</p>
                          <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Statut familial</p>
                          <p className="text-sm font-medium text-gray-900">
                            {FAMILY_STATUSES.find(s => s.value === formData.familyStatus)?.label || "Non renseigné"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Nombre d'enfants</p>
                          <p className="text-sm font-medium text-gray-900">{formData.children.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Revenus déclarés</p>
                          <p className="text-sm font-medium text-gray-900">
                            {[formData.salary, formData.pension, formData.unemployment, formData.independent, 
                              formData.foncier, formData.lmnp, formData.foreign, formData.interest, 
                              formData.dividends, formData.crypto].filter(Boolean).length} type(s)
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Charges déductibles</p>
                          <p className="text-sm font-medium text-gray-900">
                            {[formData.donations, formData.childcare, formData.homeServices, formData.alimonyDeduction].filter(Boolean).length} type(s)
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Documents uploadés</p>
                          <p className="text-sm font-medium text-gray-900">{uploadedFiles.length}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Documents obligatoires manquants</p>
                          <p className={`text-sm font-medium ${mandatoryMissing > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {mandatoryMissing > 0 && <AlertCircle className="inline h-4 w-4 mr-1" />}
                            {mandatoryMissing}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={formData.accuracy}
                            onCheckedChange={v => updateField("accuracy", v as boolean)}
                            className="mt-0.5"
                          />
                          <span className="text-sm text-gray-700">Je certifie l'exactitude des informations fournies</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={formData.processing}
                            onCheckedChange={v => updateField("processing", v as boolean)}
                            className="mt-0.5"
                          />
                          <span className="text-sm text-gray-700">J'autorise le traitement de mes données fiscales conformément au RGPD</span>
                        </label>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button
                                onClick={() => setShowConfirmDialog(true)}
                                disabled={!canSubmit}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Soumettre mon dossier
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!canSubmit && (
                            <TooltipContent>
                              <p>Complétez toutes les sections et fournissez les documents obligatoires</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      
      {/* DIALOG AJOUTER ENFANT */}
      <Dialog open={showChildDialog} onOpenChange={setShowChildDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un enfant</DialogTitle>
            <DialogDescription>Renseignez les informations de l'enfant à charge</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Prénom</Label>
              <Input
                value={newChild.name}
                onChange={e => setNewChild(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Prénom de l'enfant"
                className="bg-gray-50 border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Date de naissance</Label>
              <Input
                type="date"
                value={newChild.birthDate}
                onChange={e => setNewChild(prev => ({ ...prev, birthDate: e.target.value }))}
                className="bg-gray-50 border-gray-200 focus:border-gray-900 focus:ring-gray-900 rounded-md"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Type de garde</Label>
              <div className="flex gap-2">
                {[{ value: "principale", label: "Principale" }, { value: "alternee", label: "Alternée" }].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setNewChild(prev => ({ ...prev, custody: opt.value as "principale" | "alternee" }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                      newChild.custody === opt.value
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChildDialog(false)}>Annuler</Button>
            <Button onClick={addChild} className="bg-gray-900 hover:bg-gray-800 text-white">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* DIALOG CONFIRMATION */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la soumission</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir soumettre votre dossier ?
              <br />
              <span className="text-gray-500">Vous pourrez encore modifier certaines informations après validation.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Annuler</Button>
            <Button onClick={handleSubmit} className="bg-gray-900 hover:bg-gray-800 text-white">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
