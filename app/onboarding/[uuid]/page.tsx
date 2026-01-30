"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Check, ChevronDown, ChevronUp, FileText, Trash2, Upload, X, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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
  hasIfi: boolean
  hasCrypto: boolean
  hasLmnp: boolean
  hasSci: boolean
  hasForeignAccounts: boolean
}

interface UploadedFile {
  id: string
  name: string
  type: string
  url: string
}

type SaveStatus = "saved" | "saving" | "error"

export default function ClientOnboardingPage() {
  const params = useParams()
  const clientId = params.uuid as string
  
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState("Nouveau Dossier")
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const [submitted, setSubmitted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [expandedSections, setExpandedSections] = useState<string[]>(["identity"])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  
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
    hasIfi: false,
    hasCrypto: false,
    hasLmnp: false,
    hasSci: false,
    hasForeignAccounts: false,
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
          hasIfi: data.has_ifi || false,
          hasCrypto: data.has_crypto || false,
          hasLmnp: data.has_lmnp || false,
          hasSci: data.has_sci || false,
          hasForeignAccounts: data.has_foreign_accounts || false,
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
          has_ifi: formData.hasIfi,
          has_crypto: formData.hasCrypto,
          has_lmnp: formData.hasLmnp,
          has_sci: formData.hasSci,
          has_foreign_accounts: formData.hasForeignAccounts,
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
      case "documents":
        return uploadedFiles.length > 0
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-gray-900">Fiscalia</span>
              <div className="w-px h-6 bg-gray-300" />
              <span className="text-gray-600">{clientName}</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Soumis
            </Badge>
          </div>
        </header>

        {/* Success Content */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              Profil en cours de validation
            </h1>
            <p className="text-gray-500 mb-12">
              Votre dossier a bien ete soumis. Votre avocat va le verifier prochainement.
            </p>

            {/* Timeline */}
            <div className="max-w-md mx-auto text-left">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Formulaire soumis</p>
                  <p className="text-sm text-gray-500">Vos informations ont ete envoyees</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">En attente de verification</p>
                  <p className="text-sm text-gray-500">Votre avocat examine votre dossier</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-400">Declaration fiscale</p>
                  <p className="text-sm text-gray-400">Preparation de votre declaration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900">Fiscalia</span>
            <div className="w-px h-6 bg-gray-300" />
            <span className="text-gray-600">{clientName}</span>
          </div>
          <Badge 
            className={`
              ${saveStatus === "saved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ""}
              ${saveStatus === "saving" ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse" : ""}
              ${saveStatus === "error" ? "bg-red-50 text-red-600 border-red-200" : ""}
              hover:bg-opacity-100
            `}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${
              saveStatus === "saved" ? "bg-emerald-500" : 
              saveStatus === "saving" ? "bg-amber-500" : "bg-red-500"
            }`} />
            {saveStatus === "saved" && "Enregistre"}
            {saveStatus === "saving" && "Enregistrement..."}
            {saveStatus === "error" && "Erreur"}
          </Badge>
        </div>
      </header>

      {/* Privacy Notice */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <p className="text-center text-sm text-gray-500">
          Vos informations sont traitees par votre cabinet dans le cadre de votre dossier fiscal.{" "}
          <a href="#" className="text-gray-900 underline">Confidentialite</a> · <a href="#" className="text-gray-900 underline">Mentions legales</a>
        </p>
      </div>

      {/* Progress Card */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Form Accordion */}
      <div className="max-w-3xl mx-auto px-6 pb-32">
        <Accordion 
          type="multiple" 
          value={expandedSections}
          onValueChange={setExpandedSections}
          className="space-y-4"
        >
          {/* Section 1: Identity */}
          <AccordionItem value="identity" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isSectionComplete("identity") ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  {isSectionComplete("identity") ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-gray-500">1</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Identite & coordonnees</p>
                  <p className="text-sm text-gray-500">Informations personnelles de base</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {/* Info Callout */}
              <div className="mb-6 pl-4 border-l-4 border-gray-900 bg-gray-50/50 py-3 pr-4 rounded-r">
                <p className="text-sm text-gray-600">
                  Ces informations sont obligatoires pour etablir votre declaration fiscale (2042).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Dupont"
                    className="border-gray-200 focus:border-gray-400 focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700">
                    Prenom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="Jean"
                    className="border-gray-200 focus:border-gray-400 focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-700">
                    Date de naissance <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                    className="border-gray-200 focus:border-gray-400 focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthPlace" className="text-gray-700">
                    Lieu de naissance
                  </Label>
                  <Input
                    id="birthPlace"
                    value={formData.birthPlace}
                    onChange={(e) => updateField("birthPlace", e.target.value)}
                    placeholder="Paris, France"
                    className="border-gray-200 focus:border-gray-400 focus:ring-0"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="fiscalAddress" className="text-gray-700">
                  Adresse fiscale <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="fiscalAddress"
                  value={formData.fiscalAddress}
                  onChange={(e) => updateField("fiscalAddress", e.target.value)}
                  placeholder="12 rue de la Paix, 75002 Paris"
                  className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
                  rows={3}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Family */}
          <AccordionItem value="family" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isSectionComplete("family") ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  {isSectionComplete("family") ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-gray-500">2</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Situation familiale</p>
                  <p className="text-sm text-gray-500">Conjoint et enfants a charge</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                {/* Marital Status */}
                <div className="space-y-3">
                  <Label className="text-gray-700">Situation matrimoniale</Label>
                  <RadioGroup
                    value={formData.maritalStatus}
                    onValueChange={(v) => updateField("maritalStatus", v)}
                    className="flex flex-wrap gap-4"
                  >
                    {[
                      { value: "single", label: "Celibataire" },
                      { value: "married", label: "Marie(e)" },
                      { value: "pacs", label: "Pacse(e)" },
                      { value: "divorced", label: "Divorce(e)" },
                      { value: "widowed", label: "Veuf/Veuve" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Spouse Info (conditional) */}
                {(formData.maritalStatus === "married" || formData.maritalStatus === "pacs") && (
                  <div className="p-4 bg-gray-50/50 rounded-lg space-y-4">
                    <h4 className="font-medium text-gray-900">Informations du conjoint</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="spouseFirstName" className="text-gray-700">Prenom</Label>
                        <Input
                          id="spouseFirstName"
                          value={formData.spouseFirstName}
                          onChange={(e) => updateField("spouseFirstName", e.target.value)}
                          className="border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spouseLastName" className="text-gray-700">Nom</Label>
                        <Input
                          id="spouseLastName"
                          value={formData.spouseLastName}
                          onChange={(e) => updateField("spouseLastName", e.target.value)}
                          className="border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spouseBirthDate" className="text-gray-700">Date de naissance</Label>
                        <Input
                          id="spouseBirthDate"
                          type="date"
                          value={formData.spouseBirthDate}
                          onChange={(e) => updateField("spouseBirthDate", e.target.value)}
                          className="border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spouseBirthPlace" className="text-gray-700">Lieu de naissance</Label>
                        <Input
                          id="spouseBirthPlace"
                          value={formData.spouseBirthPlace}
                          onChange={(e) => updateField("spouseBirthPlace", e.target.value)}
                          className="border-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Children */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700">Enfants a charge</Label>
                    <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-gray-200">
                          Ajouter un enfant
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter un enfant</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Prenom</Label>
                              <Input
                                value={newChild.firstName}
                                onChange={(e) => setNewChild({ ...newChild, firstName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Nom</Label>
                              <Input
                                value={newChild.lastName}
                                onChange={(e) => setNewChild({ ...newChild, lastName: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Date de naissance</Label>
                            <Input
                              type="date"
                              value={newChild.birthDate}
                              onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                            />
                          </div>
                          <Button onClick={addChild} className="w-full bg-gray-900 hover:bg-gray-800">
                            Ajouter
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {formData.children.length > 0 && (
                    <div className="space-y-2">
                      {formData.children.map((child, index) => (
                        <Card key={index} className="border-gray-200">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {child.firstName} {child.lastName}
                              </p>
                              {child.birthDate && (
                                <p className="text-sm text-gray-500">
                                  Ne(e) le {new Date(child.birthDate).toLocaleDateString("fr-FR")}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeChild(index)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lived Abroad */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Avez-vous vecu a l'etranger ?</p>
                    <p className="text-sm text-gray-500">Durant l'annee fiscale concernee</p>
                  </div>
                  <Switch
                    checked={formData.livedAbroad}
                    onCheckedChange={(v) => updateField("livedAbroad", v)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Income Types */}
          <AccordionItem value="income" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isSectionComplete("income") ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  {isSectionComplete("income") ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-gray-500">3</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Revenus & patrimoine</p>
                  <p className="text-sm text-gray-500">Types de revenus et situations particulieres</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-3">
                {[
                  { key: "hasIfi" as const, label: "IFI (Impot sur la Fortune Immobiliere)", desc: "Patrimoine immobilier > 1,3M€" },
                  { key: "hasCrypto" as const, label: "Crypto-actifs", desc: "Cessions de cryptomonnaies" },
                  { key: "hasLmnp" as const, label: "LMNP", desc: "Location meublee non professionnelle" },
                  { key: "hasSci" as const, label: "SCI", desc: "Societe civile immobiliere" },
                  { key: "hasForeignAccounts" as const, label: "Comptes a l'etranger", desc: "Comptes bancaires hors France" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <Switch
                      checked={formData[item.key]}
                      onCheckedChange={(v) => updateField(item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Documents */}
          <AccordionItem value="documents" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isSectionComplete("documents") ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  {isSectionComplete("documents") ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-gray-500">4</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Documents</p>
                  <p className="text-sm text-gray-500">Pieces justificatives necessaires</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {/* Dropzone */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">Deposez vos fichiers ici</p>
                <p className="text-sm text-gray-400">PDF, JPG, PNG (max 10 Mo)</p>
              </div>

              {/* Suggested Documents */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Documents suggeres</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700">Piece d'identite</span>
                    </div>
                    <Badge className="bg-amber-50 text-amber-600 border-amber-200">Manquant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700">Avis d'imposition N-1</span>
                    </div>
                    <Badge className="bg-amber-50 text-amber-600 border-amber-200">Manquant</Badge>
                  </div>
                  {formData.hasIfi && (
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Justificatifs patrimoine IFI</span>
                      </div>
                      <Badge className="bg-amber-50 text-amber-600 border-amber-200">Manquant</Badge>
                    </div>
                  )}
                  {formData.hasCrypto && (
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Releves crypto (Binance, etc.)</span>
                      </div>
                      <Badge className="bg-amber-50 text-amber-600 border-amber-200">Manquant</Badge>
                    </div>
                  )}
                  {formData.hasForeignAccounts && (
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Releves comptes etrangers</span>
                      </div>
                      <Badge className="bg-amber-50 text-amber-600 border-amber-200">Manquant</Badge>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">Sauvegarde automatique activee</p>
          <Button 
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90"
          >
            Verifier & Soumettre
          </Button>
        </div>
      </div>
    </div>
  )
}
