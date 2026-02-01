"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  RefreshCw,
  Eye,
  AlertTriangle,
  MessageSquare,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  Wand2,
  Languages,
  Copy,
  Columns2,
  Rows2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export interface DocumentRequest {
  id: string
  name: string
  lastRequestAt: string
  status: "pending" | "received" | "processing" | "validated" | "error"
  requiredAction?: string
  confidence?: number
  isBlocking: boolean
  criticality: "blocking" | "important" | "accessory"
  origin: "auto" | "manual" | "annex"
  revenueSubcategoryLabel?: string
  impactedCases: string[]
  fileUrl?: string
  ocr: {
    state: "idle" | "running" | "done" | "error"
    extracted?: Record<string, string | number>
    confidenceScore?: number
    rawJson?: object
    textRaw?: string
    detectedLanguage?: string // ex: "en", "de", "es"
    languageConfidence?: number // ex: 0.96
  }
  translation?: {
    state: "idle" | "running" | "done" | "error"
    translatedText?: string
    targetLang?: "fr"
    provider?: "stub"
    cacheKey?: string
    createdAt?: string
  }
  history: Array<{
    date: string
    action: string
    user?: string
  }>
}

function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

const translationCache = new Map<string, string>()

function getTranslationCacheKey(docId: string, textRaw: string, fromLang: string): string {
  return `${docId}:${cyrb53(textRaw)}:${fromLang}->fr`
}

function getCachedTranslation(cacheKey: string): string | null {
  // Check memory cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }
  // Check localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(`translation:${cacheKey}`)
    if (stored) {
      translationCache.set(cacheKey, stored)
      return stored
    }
  }
  return null
}

function setCachedTranslation(cacheKey: string, translatedText: string): void {
  translationCache.set(cacheKey, translatedText)
  if (typeof window !== "undefined") {
    localStorage.setItem(`translation:${cacheKey}`, translatedText)
  }
}

async function translateText(text: string, fromLang: string, toLang = "fr"): Promise<string> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1500))
  // Stub: return simulated translation
  const truncated = text.length > 5000 ? text.slice(0, 5000) + "…" : text
  return `[Traduction FR simulée depuis ${fromLang.toUpperCase()}]\n\n${truncated}`
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const languageNames: Record<string, string> = {
  en: "Anglais",
  de: "Allemand",
  es: "Espagnol",
  it: "Italien",
  pt: "Portugais",
  nl: "Néerlandais",
  pl: "Polonais",
  ru: "Russe",
  zh: "Chinois",
  ja: "Japonais",
  ar: "Arabe",
  fr: "Français",
}

interface DocumentDetailsSheetProps {
  document: DocumentRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  expertMode: boolean
}

export function DocumentDetailsSheet({ document, open, onOpenChange, expertMode }: DocumentDetailsSheetProps) {
  const [comment, setComment] = useState("")
  const [isRelancing, setIsRelancing] = useState(false)
  const [markNADialogOpen, setMarkNADialogOpen] = useState(false)
  const [naReason, setNaReason] = useState("")
  const { toast } = useToast()

  const [translationDialogOpen, setTranslationDialogOpen] = useState(false)
  const [translationState, setTranslationState] = useState<"idle" | "running" | "done" | "error">("idle")
  const [translatedText, setTranslatedText] = useState<string>("")
  const [twoColumnView, setTwoColumnView] = useState(true)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)

  if (!document) return null

  const canShowTranslateButton =
    document.ocr.state === "done" &&
    document.ocr.textRaw &&
    document.ocr.detectedLanguage &&
    document.ocr.detectedLanguage !== "fr" &&
    document.ocr.languageConfidence !== undefined &&
    document.ocr.languageConfidence >= 0.8

  const handleTranslate = async (forceRetranslate = false) => {
    if (!document.ocr.textRaw || !document.ocr.detectedLanguage) return

    const cacheKey = getTranslationCacheKey(document.id, document.ocr.textRaw, document.ocr.detectedLanguage)

    // Check cache first (unless forcing retranslation)
    if (!forceRetranslate) {
      const cached = getCachedTranslation(cacheKey)
      if (cached) {
        setTranslatedText(cached)
        setTranslationState("done")
        return
      }
    }

    setTranslationState("running")
    setTranslatedText("")

    try {
      const result = await translateText(document.ocr.textRaw, document.ocr.detectedLanguage, "fr")
      setCachedTranslation(cacheKey, result)
      setTranslatedText(result)
      setTranslationState("done")
    } catch (error) {
      setTranslationState("error")
      toast({
        title: "Erreur de traduction",
        description: "La traduction a échoué. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const openTranslationDialog = () => {
    setTranslationDialogOpen(true)
    // Auto-start translation when opening
    if (translationState === "idle" || translationState === "error") {
      handleTranslate()
    }
  }

  const handleCopyTranslation = async () => {
    if (!translatedText) return
    const success = await copyToClipboard(translatedText)
    toast({
      title: success ? "Copié !" : "Échec de la copie",
      description: success ? "La traduction a été copiée dans le presse-papiers" : "Impossible de copier le texte",
    })
  }

  const handleRelance = async () => {
    setIsRelancing(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsRelancing(false)
    toast({
      title: "Relance envoyée",
      description: `Une relance a été envoyée pour "${document.name}"`,
    })
  }

  const handleRelanceOCR = async () => {
    toast({
      title: "OCR relancé",
      description: "L'extraction OCR a été relancée",
    })
  }

  const handleSaveComment = () => {
    if (!comment.trim()) return
    toast({
      title: "Commentaire enregistré",
      description: "Votre commentaire a été ajouté au document",
    })
    setComment("")
  }

  const handleMarkNA = () => {
    toast({
      title: "Document marqué non applicable",
      description: `Raison: ${naReason || "Non spécifiée"}`,
    })
    setMarkNADialogOpen(false)
    setNaReason("")
  }

  const statusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: "En attente", class: "bg-orange-100 text-orange-700 border-orange-200" },
    received: { label: "Reçu", class: "bg-blue-100 text-blue-700 border-blue-200" },
    processing: { label: "En traitement", class: "bg-purple-100 text-purple-700 border-purple-200" },
    validated: { label: "Validé", class: "bg-green-100 text-green-700 border-green-200" },
    error: { label: "Erreur", class: "bg-red-100 text-red-700 border-red-200" },
  }
  
  const currentStatus = statusConfig[document.status] || statusConfig.pending

  const criticalityConfig: Record<string, { label: string; class: string }> = {
    blocking: { label: "Bloquant", class: "bg-red-100 text-red-700 border-red-200" },
    important: { label: "Important", class: "bg-orange-100 text-orange-700 border-orange-200" },
    accessory: { label: "Accessoire", class: "bg-gray-100 text-gray-700 border-gray-200" },
  }
  
  const currentCriticality = criticalityConfig[document.criticality] || criticalityConfig.important

  const originLabels: Record<string, string> = {
    auto: "Automatique",
    manual: "Manuel",
    annex: "Annexe",
  }

  const ocrStateConfig: Record<string, { label: string; icon: React.ElementType; class: string }> = {
    idle: { label: "En attente", icon: Clock, class: "text-gray-500" },
    running: { label: "En cours", icon: RefreshCw, class: "text-blue-500 animate-spin" },
    done: { label: "Terminé", icon: CheckCircle2, class: "text-green-500" },
    error: { label: "Échec", icon: XCircle, class: "text-red-500" },
  }

  const ocrConfig = ocrStateConfig[document.ocr?.state] || ocrStateConfig.idle
  const OcrIcon = ocrConfig.icon

  const getOcrExtractionSummary = () => {
    if (document.status === "pending" || document.status === "error" || document.ocr.state !== "done") {
      return null
    }

    const documentName = document.name.toLowerCase()
    
    // IFU distributions
    if (documentName.includes("ifu") && documentName.includes("distribution")) {
      return {
        title: "RÉSUMÉ DE L'EXTRACTION",
        items: [
          { label: "Émetteur", value: "Boursorama Banque" },
          { label: "Revenus d'actions (2AB)", value: "1 250,00 €" },
          { label: "Prélèvement forfaitaire (2CK)", value: "160,00 €" },
          { label: "Crédit d'impôt", value: "12,40 €" },
        ],
      }
    }
    
    // IFU retenue libératoire
    if (documentName.includes("ifu") && (documentName.includes("retenue") || documentName.includes("libératoire"))) {
      return {
        title: "RÉSUMÉ DE L'EXTRACTION",
        items: [
          { label: "Émetteur", value: "Fortuneo" },
          { label: "Produits de placement à taux fixe", value: "840,00 €" },
          { label: "Retenue à la source", value: "201,60 €" },
          { label: "Prélèvements sociaux", value: "144,48 €" },
        ],
      }
    }
    
    // Justificatifs frais
    if (documentName.includes("frais") || documentName.includes("déplacement")) {
      return {
        title: "RÉSUMÉ DE L'EXTRACTION",
        items: [
          { label: "Type", value: "Frais de déplacement (SNCF)" },
          { label: "Date", value: "12/11/2025" },
          { label: "Montant TTC", value: "142,00 €" },
          { label: "TVA déductible", value: "12,90 €" },
        ],
      }
    }
    
    // Relevés crédits impôt / CESU
    if (documentName.includes("crédit") || documentName.includes("cesu") || documentName.includes("impôt")) {
      return {
        title: "RÉSUMÉ DE L'EXTRACTION",
        items: [
          { label: "Organisme", value: "URSSAF / CESU" },
          { label: "Nature", value: "Emploi d'un salarié à domicile" },
          { label: "Total versé 2025", value: "3 600,00 €" },
          { label: "Avantage fiscal (50%)", value: "1 800,00 €" },
        ],
      }
    }
    
    // Avis d'opéré et relevé gains / Trade Republic
    if (documentName.includes("avis") || documentName.includes("opéré") || documentName.includes("gains") || documentName.includes("trade republic")) {
      return {
        title: "RÉSUMÉ DE L'EXTRACTION",
        items: [
          { label: "Plateforme", value: "Trade Republic" },
          { label: "Opération", value: "Vente d'actifs (ETP/Actions)" },
          { label: "Plus-value brute", value: "2 140,50 €" },
          { label: "Total net imposable", value: "2 140,50 €" },
        ],
      }
    }
    
    // Relevés PER capital / SwissLife
    if (documentName.includes("per") || documentName.includes("swisslife")) {
      return {
        title: "RÉSUMÉ DE L'EXTRACTION",
        items: [
          { label: "Assureur", value: "SwissLife" },
          { label: "Versements déductibles (6NS)", value: "4 500,00 €" },
          { label: "Économie d'impôt", value: "1 350,00 €" },
          { label: "Solde actuel", value: "18 230,15 €" },
        ],
      }
    }
    
    return null
  }

  const extractionSummary = getOcrExtractionSummary()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.name}
          </SheetTitle>
          <SheetDescription>Détails et actions sur ce document</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-6">
          {/* A) Identité du doc */}
          <section>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Identité</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dernière demande</span>
                <span className="text-sm">{new Date(document.lastRequestAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Statut</span>
                <Badge variant="outline" className={currentStatus.class}>
                  {currentStatus.label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Origine</span>
                <span className="text-sm">{originLabels[document.origin]}</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* B) Contexte fiscal */}
          <section>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Contexte fiscal
            </h4>
            <div className="space-y-3">
              {document.revenueSubcategoryLabel && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Sous-catégorie de revenu</span>
                  <span className="text-sm font-medium">{document.revenueSubcategoryLabel}</span>
                </div>
              )}
              {document.impactedCases.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Cases impactées</span>
                  <div className="flex flex-wrap gap-1">
                    {document.impactedCases.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Criticité</span>
                <Badge variant="outline" className={currentCriticality.class}>
                  {currentCriticality.label}
                </Badge>
              </div>
            </div>
          </section>

          <Separator />

          {/* C) OCR & exploitation */}
          <section>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              OCR & Exploitation
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut OCR</span>
                <div className="flex items-center gap-2">
                  <OcrIcon className={cn("h-4 w-4", ocrConfig.class)} />
                  <span className="text-sm">{ocrConfig.label}</span>
                </div>
              </div>

              {document.ocr.state === "done" && document.ocr.detectedLanguage && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Langue détectée</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {languageNames[document.ocr.detectedLanguage] || document.ocr.detectedLanguage.toUpperCase()}
                    </Badge>
                    {document.ocr.languageConfidence && (
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(document.ocr.languageConfidence * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {document.ocr.state === "done" && document.ocr.extracted && (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-3 text-blue-900">Résumé de l'extraction (OCR)</p>
                    <div className="space-y-2">
                      {Object.entries(document.ocr.extracted).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-blue-700">{key} :</span>
                          <span className="font-medium text-blue-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    {document.ocr.confidenceScore && (
                      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between text-xs">
                        <span className="text-blue-700">Confiance globale</span>
                        <span className={document.ocr.confidenceScore > 0.8 ? "text-green-600 font-semibold" : "text-orange-600 font-semibold"}>
                          {Math.round(document.ocr.confidenceScore * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium mb-2">Données brutes extraites</p>
                    <div className="space-y-1">
                      {Object.entries(document.ocr.extracted).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {document.ocr.state === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    L'extraction OCR a échoué. Veuillez réessayer ou signaler un problème.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 bg-transparent"
                  onClick={() => {
                    if (document.fileUrl) {
                      setPdfViewerOpen(true)
                    } else {
                      toast({
                        title: "Fichier non disponible",
                        description: "L'URL du document n'est pas disponible",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Voir le document
                </Button>
                {document.ocr.state === "done" && (
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <Wand2 className="h-4 w-4" />
                    Corriger
                  </Button>
                )}
                {(document.ocr.state === "error" || document.ocr.state === "idle") && (
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent" onClick={handleRelanceOCR}>
                    <RefreshCw className="h-4 w-4" />
                    Relancer OCR
                  </Button>
                )}
                {document.ocr.state === "error" && (
                  <Button variant="ghost" size="sm" className="gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Signaler
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Résumé de l'extraction (toujours affiché) */}
          <>
            <Separator />
            <section>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                {extractionSummary?.title || "RÉSUMÉ DE L'EXTRACTION"}
              </h4>
              {extractionSummary ? (
                <div className="space-y-2">
                  {extractionSummary.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm pl-2">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm pl-2">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">Document fiscal</span>
                  </div>
                  <div className="flex justify-between text-sm pl-2">
                    <span className="text-muted-foreground">Année</span>
                    <span className="font-medium">2024</span>
                  </div>
                  <div className="flex justify-between text-sm pl-2">
                    <span className="text-muted-foreground">Montant principal</span>
                    <span className="font-medium">À extraire</span>
                  </div>
                </div>
              )}
            </section>
          </>



          {/* Mode expert - Détails techniques */}
          {expertMode && document.ocr.rawJson && (
            <>
              <Separator />
              <section>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Détails techniques OCR
                </h4>
                <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto max-h-48">
                  {JSON.stringify(document.ocr.rawJson, null, 2)}
                </pre>
              </section>
            </>
          )}

          <Separator />

          {/* D) Actions avancées */}
          <section>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Actions</h4>
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={handleRelance}
                disabled={isRelancing}
              >
                <RefreshCw className={cn("h-4 w-4", isRelancing && "animate-spin")} />
                {isRelancing ? "Envoi en cours..." : "Relancer le client"}
              </Button>

              <Dialog open={markNADialogOpen} onOpenChange={setMarkNADialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent">
                    <XCircle className="h-4 w-4" />
                    Marquer non applicable
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Marquer comme non applicable</DialogTitle>
                    <DialogDescription>Indiquez pourquoi ce document n'est pas requis</DialogDescription>
                  </DialogHeader>
                  <RadioGroup value={naReason} onValueChange={setNaReason} className="mt-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="aucun_revenu" id="aucun_revenu" />
                      <Label htmlFor="aucun_revenu">Aucun revenu de ce type</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="compte_cloture" id="compte_cloture" />
                      <Label htmlFor="compte_cloture">Compte clôturé</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="exonere" id="exonere" />
                      <Label htmlFor="exonere">Exonéré</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="autre" id="autre" />
                      <Label htmlFor="autre">Autre</Label>
                    </div>
                  </RadioGroup>
                  <Button onClick={handleMarkNA} className="mt-4 w-full">
                    Confirmer
                  </Button>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent">
                <Upload className="h-4 w-4" />
                Remplacer le document
              </Button>

              {canShowTranslateButton && (
                <Dialog open={translationDialogOpen} onOpenChange={setTranslationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 bg-transparent"
                      onClick={openTranslationDialog}
                    >
                      <Languages className="h-4 w-4" />
                      Traduire le document (FR)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                          <Languages className="h-5 w-5" />
                          Traduction du document
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                          {/* Copy button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyTranslation}
                            disabled={translationState !== "done"}
                            aria-label="Copier la traduction"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {/* Retranslate button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTranslate(true)}
                            disabled={translationState === "running"}
                            aria-label="Retraduire"
                          >
                            <RefreshCw className={cn("h-4 w-4", translationState === "running" && "animate-spin")} />
                          </Button>
                          {/* View toggle */}
                          <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                            <Button
                              variant={twoColumnView ? "secondary" : "ghost"}
                              size="icon"
                              onClick={() => setTwoColumnView(true)}
                              aria-label="Vue 2 colonnes"
                            >
                              <Columns2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={!twoColumnView ? "secondary" : "ghost"}
                              size="icon"
                              onClick={() => setTwoColumnView(false)}
                              aria-label="Vue 1 colonne"
                            >
                              <Rows2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border border-blue-200">
                          Langue détectée :{" "}
                          {languageNames[document.ocr.detectedLanguage!] ||
                            document.ocr.detectedLanguage!.toUpperCase()}{" "}
                          ({Math.round(document.ocr.languageConfidence! * 100)}%)
                        </Badge>
                      </div>
                    </DialogHeader>

                    {/* Disclaimer */}
                    <Alert className="mt-4 flex-shrink-0 bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        Traduction assistée. Le document original fait foi. Vérifiez en cas de doute.
                      </AlertDescription>
                    </Alert>

                    {/* Content area */}
                    <div className="flex-1 min-h-0 mt-4">
                      {translationState === "running" && (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
                          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Traduction en cours…</p>
                          <div className="w-full max-w-md space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                        </div>
                      )}

                      {translationState === "error" && (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
                          <AlertTriangle className="h-8 w-8 text-red-500" />
                          <p className="text-sm text-red-600">La traduction a échoué</p>
                          <Button variant="outline" onClick={() => handleTranslate(true)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Relancer la traduction
                          </Button>
                        </div>
                      )}

                      {translationState === "done" && (
                        <div className={cn("h-full", twoColumnView ? "grid grid-cols-2 gap-4" : "")}>
                          {/* Original column - only in 2-column view */}
                          {twoColumnView && (
                            <div className="flex flex-col min-h-0">
                              <h5 className="text-sm font-medium mb-2 text-muted-foreground">Original (OCR)</h5>
                              <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/30">
                                <pre className="text-sm whitespace-pre-wrap font-sans">{document.ocr.textRaw}</pre>
                              </ScrollArea>
                            </div>
                          )}

                          {/* Translation column */}
                          <div className="flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-muted-foreground">Traduction (FR)</h5>
                              {!twoColumnView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTwoColumnView(true)}
                                  className="text-xs"
                                >
                                  Voir l'original
                                </Button>
                              )}
                            </div>
                            <ScrollArea className="flex-1 border rounded-lg p-4 bg-background">
                              <pre className="text-sm whitespace-pre-wrap font-sans">{translatedText}</pre>
                            </ScrollArea>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <div className="space-y-2">
                <Textarea
                  placeholder="Ajouter un commentaire interne..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveComment}
                  disabled={!comment.trim()}
                  className="gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </section>

          <Separator />

          {/* E) Historique */}
          <section>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Historique</h4>
            <div className="space-y-2">
              {document.history.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p>{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString("fr-FR")} {event.user && `• ${event.user}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {document.name}
            </DialogTitle>
            <DialogDescription>
              Visualisation du document
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-4">
            {document.fileUrl ? (
              <iframe
                src={document.fileUrl}
                className="w-full h-full rounded-lg border"
                title={document.name}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucun fichier disponible
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => document.fileUrl && window.open(document.fileUrl, "_blank")}
            >
              Ouvrir dans un nouvel onglet
            </Button>
            <Button onClick={() => setPdfViewerOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
