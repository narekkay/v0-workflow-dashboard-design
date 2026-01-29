"use client"

import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { useRef } from "react"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, FileText, Clock, FolderOpen, Check, X, FileUp, ChevronRight, Save, Eye, CheckCircle2, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { uploadDocument } from "@/app/actions/upload-document"
import { generateAndUploadConventionPdf } from "@/lib/pdf-utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { ConventionEditor } from "@/components/convention-editor"

interface AddClientPageProps {
  onSuccess: (client: { id: string; first_name: string; last_name: string; email: string }) => void
  onCancel: () => void
}

type ConventionType = "forfait" | "temps_passe" | "existant"

interface Convention {
  id: ConventionType
  title: string
  icon: React.ElementType
  description: string
}

const conventions: Convention[] = [
  {
    id: "forfait",
    title: "Honoraires au forfait",
    icon: FileText,
    description: "Tarification fixe pour une prestation définie",
  },
  {
    id: "temps_passe",
    title: "Honoraires au temps passé",
    icon: Clock,
    description: "Facturation basée sur le temps consacré au dossier",
  },
  {
    id: "existant",
    title: "Contrat existant",
    icon: FolderOpen,
    description: "Utiliser une convention déjà établie",
  },
]

// Sample data for pre-filling
const firstNames = ["Jean", "Marie", "Pierre", "Sophie", "Luc", "Anne", "Marc", "Claire", "François", "Isabelle"]
const lastNames = ["Dupont", "Martin", "Bernard", "Laurent", "Simon", "Michel", "Garcia", "David", "Petit", "Lefevre"]
const domains = ["gmail.com", "outlook.com", "yahoo.fr", "example.com", "business.fr"]
const cities = ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux", "Lille", "Rennes", "Montpellier"]

function generateRandomData() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`
  const phone = `+33 ${Math.floor(Math.random() * 9) + 1} ${String(Math.floor(Math.random() * 99)).padStart(2, "0")} ${String(Math.floor(Math.random() * 99)).padStart(2, "0")} ${String(Math.floor(Math.random() * 99)).padStart(2, "0")}`
  const city = cities[Math.floor(Math.random() * cities.length)]
  const streetNum = Math.floor(Math.random() * 999) + 1
  const address = `${streetNum} Rue de la République, 75001 ${city}`

  return { firstName, lastName, email, phone, address }
}

function generateConventionHtml(
  conventionType: string, 
  hasResultClause: boolean, 
  clientData: { firstName: string; lastName: string; email: string; address: string }
) {
  const mode = conventionType === "temps_passe" ? "AU TEMPS PASSÉ" : "AU FORFAIT"
  const today = new Date().toLocaleDateString("fr-FR")
  
  return `
    <div class="document-content">
      <h1 style="text-align: center; font-size: 18pt; margin-bottom: 24px;">
        CONTRAT DE MISSION ET DE RÉMUNÉRATION<br/>
        <span style="font-size: 14pt;">${mode}</span>
      </h1>

      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14pt; font-weight: bold;">ENTRE LES SOUSSIGNÉS :</h2>
        <p style="margin-bottom: 10px;">
          <strong>Le Cabinet :</strong><br/>
          Cabinet Martin & Associés, représenté par Me Sophie Martin, Avocat inscrit au Barreau de Paris,<br/>
          Adresse : 25 Avenue Montaigne, 75008 Paris<br/>
          Email : contact@martin-avocats.fr<br/>
          Téléphone : +33 1 45 67 89 00
        </p>
        <p style="text-align: center; margin: 10px 0;">ET</p>
        <p>
          <strong>Le Client :</strong><br/>
          ${clientData.firstName} ${clientData.lastName}, demeurant ${clientData.address || "adresse à compléter"}<br/>
          Email : ${clientData.email}
        </p>
      </section>

      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14pt; font-weight: bold;">PRÉAMBULE</h2>
        <p>
          Le Client souhaite confier à l'Avocat une mission de conseil et consultation juridique.
          La présente convention a pour objet de définir les modalités de cette mission ainsi que les conditions de rémunération de l'Avocat.
        </p>
      </section>

      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14pt; font-weight: bold;">ARTICLE 1 – MISSION</h2>
        <p style="margin-bottom: 10px;">
          <strong>Nature de la mission :</strong> Conseil et assistance juridique dans le cadre de la déclaration d'impôt sur le revenu.
        </p>
        <p>
          <strong>Diligences incluses :</strong> Rendez-vous et échanges, Étude du dossier et des pièces, Rédaction d'actes, Suivi client.
        </p>
      </section>

      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14pt; font-weight: bold;">ARTICLE 2 – DÉTERMINATION DES HONORAIRES</h2>
        ${conventionType === "forfait" ? `
        <p style="margin-bottom: 10px;">
          Les honoraires de l'Avocat sont fixés de manière forfaitaire à 3 000 € HT,
          soit 3 600 € TTC (TVA à 20%).
        </p>
        <p>
          Ce forfait couvre l'ensemble des diligences décrites à l'article précédent.
          Toute prestation complémentaire fera l'objet d'un avenant.
        </p>
        ` : `
        <p style="margin-bottom: 10px;">
          Les honoraires de l'Avocat sont calculés au temps passé selon les taux horaires suivants :
        </p>
        <ul style="margin-left: 20px; margin-bottom: 10px;">
          <li>Associé : 350 € HT / heure</li>
          <li>Collaborateur : 200 € HT / heure</li>
        </ul>
        <p>TVA applicable : 20%</p>
        `}
      </section>

      ${hasResultClause ? `
      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14pt; font-weight: bold;">ARTICLE 3 – HONORAIRE COMPLÉMENTAIRE DE RÉSULTAT</h2>
        <p>
          En sus des honoraires ${conventionType === "forfait" ? "forfaitaires" : "au temps passé"} prévus ci-dessus, 
          un honoraire complémentaire de résultat est convenu entre les parties, égal à 10% de l'économie réalisée.
        </p>
      </section>
      ` : ""}

      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14pt; font-weight: bold;">ARTICLE ${hasResultClause ? "4" : "3"} – FRAIS, DÉBOURS ET DÉPENS</h2>
        <p>
          Les frais et débours engagés par l'Avocat sont refacturés au Client à l'identique.
          Les dépens sont à la charge de la partie condamnée, conformément à la décision de justice.
        </p>
      </section>

      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14pt; font-weight: bold;">ARTICLE ${hasResultClause ? "5" : "4"} – RÈGLEMENT</h2>
        <p>
          Les honoraires sont payables à réception de la facture, par virement bancaire.
        </p>
      </section>

      <section style="margin-top: 40px;">
        <p>Fait à Paris, le ${today}</p>
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 45%;">
            <p><strong>Le Cabinet</strong></p>
            <p style="margin-top: 60px;">Signature :</p>
          </div>
          <div style="width: 45%;">
            <p><strong>Le Client</strong></p>
            <p style="margin-top: 60px;">Signature :</p>
          </div>
        </div>
      </section>
    </div>
  `
}

export function AddClientPage({ onSuccess, onCancel }: AddClientPageProps) {
  const [selectedConvention, setSelectedConvention] = useState<ConventionType | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [existantFile, setExistantFile] = useState<any | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [hasResultClause, setHasResultClause] = useState(false)
  const [conventionSkipped, setConventionSkipped] = useState(false)
  const [showConventionEditor, setShowConventionEditor] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const existantFileInputRef = useRef<HTMLInputElement | null>(null)
  const randomData = generateRandomData()
  const [formData, setFormData] = useState({
    firstName: randomData.firstName,
    lastName: randomData.lastName,
    email: randomData.email,
    phone: randomData.phone,
    address: randomData.address,
    notes: "Client créé via le dashboard",
    isComplex: false,
  })
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  const validateStep1 = (): boolean => {
    const errors = {
      firstName: "",
      lastName: "",
      email: "",
    }
    
    if (!formData.firstName.trim()) {
      errors.firstName = "Le prénom est requis"
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Le nom est requis"
    }
    
    if (!formData.email.trim()) {
      errors.email = "L'email est requis"
    } else if (!validateEmail(formData.email)) {
      errors.email = "Format d'email invalide"
    }
    
    setFormErrors(errors)
    return !errors.firstName && !errors.lastName && !errors.email
  }
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

  const steps = [
    { id: 1, title: "Informations" },
    { id: 2, title: "Convention" },
    { id: 3, title: "Créer le client" },
  ]

  const handleSelectConvention = (type: ConventionType) => {
    // Allow selecting "existant" only if a file has been uploaded
    if (type === "existant" && !existantFile) {
      return
    }
    setSelectedConvention(type)
    console.log("[v0] Convention selected:", type)
  }

  const handleUploadExistantFile = async (files: FileList) => {
    if (files.length === 0) return
    
    setShowUploadModal(true)
    setUploadSuccess(false)
    setIsUploading(true)
    
    try {
      const file = files[0]
      console.log("[v0] Starting upload for:", file.name)
      
      // Create FormData for server action
      const formData = new FormData()
      formData.append("file", file)
      
      const result = await uploadDocument(formData)
      console.log("[v0] Upload result:", result)
      
      if (result.success && result.data) {
        setExistantFile(result.data)
        setPdfPreviewUrl(result.data.url)
        setSelectedConvention("existant")
        setUploadSuccess(true)
        
        console.log("[v0] File uploaded successfully:", result.data.url)
        
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          setShowUploadModal(false)
        }, 2000)
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setShowUploadModal(false)
      toast({
        title: "Erreur d'upload",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        
        const result = await uploadDocument(formData)
        console.log("[v0] Upload successful:", result.data?.url)

        // Add to uploaded files list
        if (result.success && result.data) {
          setUploadedFiles(prev => [
            ...prev,
            result.data,
          ])

          toast({
            title: "✓ Fichier uploadé",
            description: `${result.data.name} a été ajouté avec succès`,
          })
        } else {
          throw new Error(result.error || "Upload failed")
        }
      } catch (error) {
        console.error("[v0] Upload error:", error)
        toast({
          title: "Erreur d'upload",
          description: error instanceof Error ? error.message : "Une erreur est survenue",
          variant: "destructive",
        })
      }
    }

    setIsUploading(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleDeleteExistantFile = async () => {
    if (!existantFile) return
    
    try {
      const supabase = createBrowserClient()
      
      // Delete from database if it exists
      if (existantFile.id) {
        const { error } = await supabase
          .from("documents")
          .delete()
          .eq("id", existantFile.id)
        
        if (error) {
          console.error("[v0] Error deleting file from database:", error)
        }
      }
      
      // Reset visual state
      setExistantFile(null)
      setPdfPreviewUrl(null)
      setUploadSuccess(false)
      if (selectedConvention === "existant") {
        setSelectedConvention(null)
      }
      
      toast({
        title: "Fichier supprimé",
        description: "Le contrat a été supprimé avec succès",
      })
    } catch (error) {
      console.error("[v0] Error deleting file:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    console.log("[v0] Form submitted", formData)
    setIsLoading(true)

    const supabase = createBrowserClient()

    try {
      console.log("[v0] Inserting client into database...")
      
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          is_complex: formData.isComplex || false,
        })
        .select()
        .single()

      if (clientError) {
        console.error("[v0] Client creation error:", clientError)
        throw clientError
      }

      console.log("[v0] Client created successfully:", client)

      // Generate and save convention PDF if a convention type was selected (not existant)
      if (selectedConvention && selectedConvention !== "existant") {
        console.log("[v0] Generating convention PDF:", selectedConvention)
        
        const conventionTitle = selectedConvention === "forfait" 
          ? "Convention d'honoraires au forfait"
          : "Convention d'honoraires au temps passé"
        
        try {
          // Generate convention HTML content
          const clientName = `${formData.firstName} ${formData.lastName}`
          const conventionHtml = generateConventionHtml(selectedConvention, hasResultClause, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            address: formData.address || "",
          })
          
          console.log("[v0] Generating and uploading PDF to Vercel Blob...")
          
          // Generate PDF and upload to Vercel Blob via API route
          const fileName = `convention_${selectedConvention}_${clientName.replace(/\s+/g, '_')}_${Date.now()}`
          const { url, size } = await generateAndUploadConventionPdf(conventionHtml, fileName)
          
          console.log("[v0] Convention PDF uploaded:", url)
          
          const { error: conventionDocError } = await supabase.from("documents").insert({
            client_id: client.id,
            name: conventionTitle,
            url: url,
            type: "text/html",
            size: size,
            category: "convention",
            convention_type: selectedConvention,
            has_result_clause: hasResultClause,
          })

          if (conventionDocError) {
            console.error("[v0] Convention document save error:", conventionDocError)
          } else {
            console.log("[v0] Convention document saved successfully")
          }
        } catch (error) {
          console.error("[v0] Convention PDF generation/upload failed:", error)
        }
      }

      // Save existant contract file if uploaded
      if (existantFile) {
        console.log("[v0] Saving existant contract file:", existantFile.name)
        
        const { error: existantError } = await supabase.from("documents").insert({
          client_id: client.id,
          name: existantFile.name,
          url: existantFile.url,
          type: existantFile.type || "application/pdf",
          size: existantFile.size,
          category: "contrat_existant",
        })

        if (existantError) {
          console.error("[v0] Existant contract save error:", existantError)
        } else {
          console.log("[v0] Existant contract saved successfully")
        }
      }

      // Save uploaded documents to database
      if (uploadedFiles.length > 0) {
        console.log("[v0] Saving", uploadedFiles.length, "documents to database")
        
        const documentInserts = uploadedFiles.map((file) => ({
          client_id: client.id,
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
        }))

        const { error: docError } = await supabase.from("documents").insert(documentInserts)

        if (docError) {
          console.error("[v0] Document save error:", docError)
          toast({
            title: "Attention",
            description: "Le client a été créé mais certains documents n'ont pas pu être sauvegardés",
            variant: "destructive",
          })
        } else {
          console.log("[v0] Documents saved successfully")
        }
      }

      toast({
        title: "✓ Client créé",
        description: uploadedFiles.length > 0 
          ? `Le client et ${uploadedFiles.length} document(s) ont été ajoutés avec succès`
          : "Le client a été ajouté avec succès",
      })

      // Pass the created client back to parent for navigation
      onSuccess({
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
      })
    } catch (error) {
      console.error("[v0] Error creating client:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show Convention Editor as full-screen overlay
  if (showConventionEditor) {
    return (
      <ConventionEditor
        conventionType={selectedConvention}
        hasResultClause={hasResultClause}
        clientData={{
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        }}
        onBack={() => setShowConventionEditor(false)}
  onValidate={() => {
    setShowConventionEditor(false)
    handleSubmit()
  }}
      />
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="flex flex-col items-center gap-6 border-none shadow-lg">
          {uploadSuccess ? (
            <>
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Contrat uploadé avec succès</h2>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-6">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Upload en cours...</h2>
                <p className="text-sm text-muted-foreground">Veuillez patienter</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nouveau client</h1>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted z-0">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps */}
  {steps.map((step) => {
    const canNavigate = step.id < 3 && (step.id === 1 || (step.id > 1 && formData.firstName && formData.lastName && formData.email))
            
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => canNavigate && setCurrentStep(step.id)}
                disabled={!canNavigate}
                className="flex flex-col items-center relative z-10 group disabled:cursor-not-allowed cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep > step.id
                      ? "bg-primary border-primary text-primary-foreground group-hover:scale-110"
                      : currentStep === step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : canNavigate
                          ? "bg-background border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50 group-hover:scale-105"
                          : "bg-background border-muted-foreground/20 text-muted-foreground/50"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium transition-colors ${
                    currentStep >= step.id 
                      ? "text-foreground" 
                      : canNavigate 
                        ? "text-muted-foreground group-hover:text-foreground" 
                        : "text-muted-foreground/50"
                  }`}
                >
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
  <CardTitle>
    {currentStep === 1 && "Informations du client"}
    {currentStep === 2 && "Choisir la convention"}
  </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Profile Information */}
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value })
                        if (formErrors.firstName) {
                          setFormErrors({ ...formErrors, firstName: "" })
                        }
                      }}
                      placeholder="Jean"
                      className={formErrors.firstName ? "border-red-500" : ""}
                    />
                    {formErrors.firstName && (
                      <p className="text-xs text-red-500">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value })
                        if (formErrors.lastName) {
                          setFormErrors({ ...formErrors, lastName: "" })
                        }
                      }}
                      placeholder="Dupont"
                      className={formErrors.lastName ? "border-red-500" : ""}
                    />
                    {formErrors.lastName && (
                      <p className="text-xs text-red-500">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (formErrors.email) {
                        setFormErrors({ ...formErrors, email: "" })
                      }
                    }}
                    placeholder="jean.dupont@example.com"
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-500">{formErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    placeholder="Ajoutez des notes ou informations supplémentaires..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <Checkbox
                    id="isComplex"
                    checked={formData.isComplex || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isComplex: checked as boolean })}
                    className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                  <Label htmlFor="isComplex" className="text-sm font-medium cursor-pointer">
                    Cas complexe
                  </Label>
                </div>
              </>
            )}

            {/* Step 2: Convention Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {conventions.map((convention) => {
                    const Icon = convention.icon
                    const isSelected = selectedConvention === convention.id
                    const isExistant = convention.id === "existant"
                    const hasFile = isExistant && existantFile
                    
                    return (
                      <Card
                        key={convention.id}
                        className={`transition-all duration-300 ${
                          (!isExistant || hasFile) && 'cursor-pointer hover:shadow-lg'
                        } ${
                          isSelected ? 'ring-2 ring-primary shadow-lg' : (
                            (!isExistant || hasFile) ? 'hover:border-primary/50' : ''
                          )
                        } ${
                          isSelected && hasFile ? 'md:col-span-2 lg:col-span-1 flex-grow' : ''
                        }`}
                        onClick={() => (!isExistant || hasFile) && handleSelectConvention(convention.id)}
                      >
                        <CardContent className="flex flex-col h-full p-6 space-y-4">
                          <div className="flex-1 flex flex-col items-center text-center space-y-4">
                            <div className="rounded-full bg-primary/10 p-4">
                              <Icon className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">{convention.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {convention.description}
                            </p>
                            {hasFile && (
                              <div className="w-full mt-2 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  <p className="text-sm font-medium text-green-700 truncate">{existantFile.name}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteExistantFile()
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Buttons at bottom */}
                          <div className="flex flex-col gap-2 pt-4 border-t">
                            {isExistant ? (
                              <>
                                <input
                                  ref={existantFileInputRef}
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      handleUploadExistantFile(e.target.files)
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant={hasFile ? "outline" : "default"}
                                  size="sm"
                                  className="w-full gap-2"
                                  onClick={() => existantFileInputRef.current?.click()}
                                  disabled={isUploading}
                                >
                                  <FileUp className="h-4 w-4" />
                                  {isUploading ? "Upload..." : "Importer"}
                                </Button>
                                {hasFile && pdfPreviewUrl && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2 bg-transparent"
                                    onClick={() => window.open(pdfPreviewUrl, "_blank")}
                                  >
                                    <Eye className="h-4 w-4" />
                                    Voir le PDF
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className="w-full"
                                onClick={() => handleSelectConvention(convention.id)}
                              >
                                Sélectionner
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Options below cards */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="resultClause" 
                      checked={hasResultClause}
                      onCheckedChange={(checked) => setHasResultClause(checked === true)}
                    />
                    <label
                      htmlFor="resultClause"
                      className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Clause d'honoraires complémentaires de résultat
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConventionSkipped(true)
                      setSelectedConvention(null)
                      setCurrentStep(3)
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Passer
                  </Button>
                </div>
              </div>
            )}


            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentStep === 1) {
                    onCancel()
                  } else {
                    setCurrentStep(currentStep - 1)
                  }
                }}
                disabled={isLoading}
              >
                {currentStep === 1 ? "Annuler" : "Précédent"}
              </Button>
              <div className="flex gap-3">
                {currentStep === 2 && selectedConvention === "existant" && existantFile ? (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? "Création..." : "Accéder à la page client"}
                  </Button>
                ) : currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (currentStep === 1) {
                        // Validate step 1 before proceeding
                        if (!validateStep1()) {
                          toast({
                            title: "Erreur de validation",
                            description: "Veuillez remplir tous les champs obligatoires correctement",
                            variant: "destructive"
                          })
                          return
                        }
                        setCurrentStep(2)
                      } else if (currentStep === 2 && selectedConvention && selectedConvention !== "existant") {
                        // Open editor directly at step 2 if a convention is selected
                        setCurrentStep(3)
                        setShowConventionEditor(true)
                      } else {
                        setCurrentStep(currentStep + 1)
                      }
                    }}
                    disabled={
                      isLoading ||
                      (currentStep === 2 && !selectedConvention && !conventionSkipped)
                    }
                    className="gap-2"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
