"use client"

import type React from "react" // ClientTabs component
import { useState, useEffect } from "react"
import {
  Home,
  User,
  FileText,
  FolderOpen,
  Eye,
  Pencil,
  Trash2,
  Search,
  Edit,
  Plus,
  Check,
  Clock,
  X,
  Inbox,
  Upload,
  Scan,
  Users,
  AlertTriangle,
  Link,
  Download,
  Scale,
  Paperclip,
  Lock,
  Mail,
  MoreVertical,
  Settings,
  ClipboardList,
  Share2,
  Link2,
  QrCode,
  RotateCcw,
  MoreHorizontal,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createBrowserClient } from "@/lib/supabase/client"
import { AddRevenueDialog } from "./add-revenue-dialog"
import { SendEmailDialog } from "./send-email-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Client, TaxProfile, Document } from "@/lib/types"
import { RevenueDetailTab } from "@/components/revenue-detail-tab"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { DossierStatusBar, type DossierStats } from "@/components/dossier-status-bar"
import { ShareSpaceDialog } from "@/components/share-space-dialog"
import { DocumentDetailsSheet, type DocumentRequest } from "@/components/document-details-sheet"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Removed this import as it's defined below: import { PartageTabContent } from "@/components/partage-tab-content"
import { ClientRevenuesTablePremium } from "@/components/client-revenues-table-premium"

interface ClientRevenue {
  id: string
  category_id: number
  sub_category_ids: number[]
  document_ids: number[]
  created_at: string
  categoryName?: string // Add optional categoryName
  hasAnnexe?: boolean // Add flag to track if category has annexe
}

interface RevenueTab {
  id: string
  revenueId: string
  categoryName: string
}

interface YearTab {
  id: string
  year: number
}

interface OutboxFile {
  id: string
  client_id: string
  file_name: string
  status: "en_attente" | "uploaded"
  created_at: string
  last_requested_at?: string
}

interface ClientFile {
  id: string
  client_id: string
  file_name: string
  status: "requested" | "pending" | "ok" // Or other relevant statuses
  created_at: string
}

interface Annexe {
  id: number
  annexe_name: string
  case_code: string
}

interface AnnexeDocument {
  id: number
  shortname: string
  description: string
  status: "en_attente" | "uploaded" | null
  last_requested_at?: string
}

interface SidebarRevenueTab {
  id: string
  categoryName: string
}

interface SidebarYearTab {
  id: string
  year: number
}

interface ClientTabsProps {
  client: Client
  taxProfiles: TaxProfile[]
  documents: Document[]
  onClose: () => void
  onRefresh: (clientId: string) => void
  onOpenRevenuePage: (
    clientId: string,
    clientName: string,
    categoryName: string,
    categoryId: number,
    subCategoryIds?: number[],
    revenueId?: string,
  ) => void
  onOpenRevenueDetail: (revenueId: string, categoryName: string) => void
  shouldOpenRevenueModal: boolean
  onRevenueModalClose: () => void
  onOpen2042View: (clientId: string, clientName: string) => void
  onOpenAmountEntry: (clientId: string, clientName: string, categoryId: number, categoryName: string) => void
  activeTab: string
  onTabChange: (tabId: string) => void
  revenueTabs: SidebarRevenueTab[]
  onRevenueTabsChange: React.Dispatch<React.SetStateAction<SidebarRevenueTab[]>>
  yearTabs: SidebarYearTab[]
  onYearTabsChange: React.Dispatch<React.SetStateAction<SidebarYearTab[]>>
}

interface Child {
  first_name: string
  last_name: string
  date_of_birth: string
}

export function ClientTabs({
  client,
  taxProfiles,
  documents,
  onClose,
  onRefresh,
  onOpenRevenuePage,
  onOpenRevenueDetail,
  shouldOpenRevenueModal,
  onRevenueModalClose,
  onOpen2042View,
  onOpenAmountEntry,
  activeTab,
  onTabChange,
  revenueTabs,
  onRevenueTabsChange,
  yearTabs,
  onYearTabsChange,
}: ClientTabsProps) {
  const [revenues, setRevenues] = useState<ClientRevenue[]>([])
  const [categoryNames, setCategoryNames] = useState<Map<number, string>>(new Map())
  const [loadingRevenues, setLoadingRevenues] = useState(true)
  const [outboxFiles, setOutboxFiles] = useState<OutboxFile[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [deleteClientFileModalOpen, setDeleteClientFileModalOpen] = useState(false)
  const [clientFileToDelete, setClientFileToDelete] = useState<string | null>(null)
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([])
  const [documentSearchTerm, setDocumentSearchTerm] = useState("")
  const [selectedOutboxFiles, setSelectedOutboxFiles] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [annexes, setAnnexes] = useState<Annexe[]>([])
  const [loadingAnnexes, setLoadingAnnexes] = useState(true)
  const [annexeCompletionStats, setAnnexeCompletionStats] = useState<Map<number, { completed: number; total: number }>>(new Map())

  const [selectedAnnexe, setSelectedAnnexe] = useState<Annexe | null>(null)
  const [annexeDocuments, setAnnexeDocuments] = useState<AnnexeDocument[]>([])
  const [loadingAnnexeDocuments, setLoadingAnnexeDocuments] = useState(false)
  const [annexeModalOpen, setAnnexeModalOpen] = useState(false)

  const [newDeclarationModalOpen, setNewDeclarationModalOpen] = useState(false)
  const [newDeclarationName, setNewDeclarationName] = useState("")
  const [newDeclarationFile, setNewDeclarationFile] = useState<File | null>(null)

  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditingCustomFields, setIsEditingCustomFields] = useState(false)
  const [children, setChildren] = useState<Child[]>((client.children as Child[]) || [])
  const [isEditingChildren, setIsEditingChildren] = useState(false)
  const [spouseChildren, setSpouseChildren] = useState<Child[]>([])
  const [isEditingSpouseChildren, setIsEditingSpouseChildren] = useState(false)
  const [customFields, setCustomFields] = useState<Array<{ name: string; value: string }>>(
    (client.custom_fields as Array<{ name: string; value: string }>) || [],
  )
  const [editedClient, setEditedClient] = useState({
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
    phone: client.phone || "",
    address: client.address || "",
    accountant: "",
  })
  const [editedSpouse, setEditedSpouse] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    accountant: "",
  })

  const [foyerEditMode, setFoyerEditMode] = useState<string | null>(null)
  const [situationFamiliale, setSituationFamiliale] = useState("Séparé")
  const [changementSituation, setChangementSituation] = useState("Oui")
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2025")

  const [expertMode, setExpertMode] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentRequest | null>(null)
  const [documentSheetOpen, setDocumentSheetOpen] = useState(false)
  const [isRelancingDocs, setIsRelancingDocs] = useState(false)
  const [lastReminderAt, setLastReminderAt] = useState<string | undefined>(undefined)
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const mockDocumentRequests: DocumentRequest[] = [
    {
      id: "1",
      name: "Avis d'imposition 2023",
      lastRequestAt: "2024-01-15",
      status: "pending",
      requiredAction: "Attente du document",
      isBlocking: true,
      criticality: "blocking",
      origin: "auto",
      revenueSubcategoryLabel: "Revenus fonciers",
      impactedCases: ["4BA", "4BB", "4BC"],
      ocr: { state: "idle" },
      history: [
        { date: "2024-01-15", action: "Demande créée", user: "Système" },
        { date: "2024-01-20", action: "Relance envoyée", user: "Marie D." },
      ],
    },
    {
      id: "2",
      name: "Relevé de compte titre",
      lastRequestAt: "2024-01-10",
      status: "received",
      isBlocking: false,
      criticality: "important",
      origin: "auto",
      revenueSubcategoryLabel: "Revenus de capitaux mobiliers",
      impactedCases: ["2TR", "2BH"],
      ocr: {
        state: "done",
        extracted: { "Plus-values": "12 450 €", Dividendes: "3 200 €", Période: "2023" },
        confidenceScore: 0.92,
        rawJson: { raw: "data", confidence: 0.92, fields: ["plus_values", "dividendes"] },
      },
      history: [
        { date: "2024-01-10", action: "Demande créée", user: "Système" },
        { date: "2024-01-18", action: "Document reçu", user: "Client" },
        { date: "2024-01-18", action: "OCR terminé", user: "Système" },
      ],
    },
    {
      id: "3",
      name: "Attestation employeur",
      lastRequestAt: "2024-01-12",
      status: "error",
      isBlocking: true,
      criticality: "blocking",
      origin: "manual",
      revenueSubcategoryLabel: "Traitements et salaires",
      impactedCases: ["1AJ", "1BJ"],
      ocr: { state: "error" },
      history: [
        { date: "2024-01-12", action: "Demande créée", user: "Marie D." },
        { date: "2024-01-22", action: "Document reçu", user: "Client" },
        { date: "2024-01-22", action: "Échec OCR", user: "Système" },
      ],
    },
    {
      id: "4",
      name: "Justificatif don association",
      lastRequestAt: "2024-01-08",
      status: "validated",
      isBlocking: false,
      criticality: "accessory",
      origin: "annex",
      revenueSubcategoryLabel: "Réductions d'impôt",
      impactedCases: ["7UF"],
      ocr: {
        state: "done",
        extracted: { Montant: "500 €", Association: "Restos du Coeur" },
        confidenceScore: 0.98,
      },
      history: [
        { date: "2024-01-08", action: "Demande créée", user: "Système" },
        { date: "2024-01-14", action: "Document reçu", user: "Client" },
        { date: "2024-01-14", action: "OCR terminé", user: "Système" },
        { date: "2024-01-15", action: "Validé", user: "Marie D." },
      ],
    },
    {
      id: "5",
      name: "UK Employment Certificate",
      lastRequestAt: "2024-01-20",
      status: "received",
      isBlocking: false,
      criticality: "important",
      origin: "manual",
      revenueSubcategoryLabel: "Salaires étrangers",
      impactedCases: ["1AF"],
      ocr: {
        state: "done",
        extracted: {
          "Annual Salary": "45,000 £",
          Employer: "London Financial Ltd",
          Period: "2023",
        },
        confidenceScore: 0.95,
        textRaw:
          "EMPLOYMENT CERTIFICATE\n\nThis is to certify that John Doe has been employed by London Financial Ltd from January 1st 2023 to December 31st 2023.\n\nAnnual Salary: £45,000\nPosition: Financial Analyst\n\nSigned by HR Department",
        detectedLanguage: "en",
        languageConfidence: 0.92,
        rawJson: {
          employer: "London Financial Ltd",
          salary: "45000",
          currency: "GBP",
          period: "2023",
          position: "Financial Analyst",
        },
      },
      history: [
        { date: "2024-01-20", action: "Demande créée", user: "Marie D." },
        { date: "2024-01-25", action: "Document reçu", user: "Client" },
        { date: "2024-01-25", action: "OCR terminé (EN détecté)", user: "Système" },
      ],
    },
  ]

  const dossierStats: DossierStats = {
    totalExpected: mockDocumentRequests.length + clientFiles.length + documents.length,
    exploitable: mockDocumentRequests.filter((d) => d.ocr.state === "done").length,
    incomplete: mockDocumentRequests.filter((d) => d.status === "pending" || d.status === "error").length,
    missingBlocking: mockDocumentRequests.filter((d) => d.isBlocking && d.status !== "validated").length,
    lastReminderAt,
  }

  const handleRelanceBloquants = async () => {
    setIsRelancingDocs(true)
    await new Promise((r) => setTimeout(r, 1500))
    setIsRelancingDocs(false)
    setLastReminderAt(new Date().toISOString())
    toast({
      title: "Relances envoyées",
      description: `${dossierStats.missingBlocking} document(s) bloquant(s) relancé(s)`,
    })
  }

  const handleExportChecklist = () => {
    toast({
      title: "Export en cours",
      description: "La checklist PDF sera téléchargée dans quelques instants",
    })
  }

  const handleDocumentRowClick = (docId: string) => {
    const doc = mockDocumentRequests.find((d) => d.id === docId)
    if (doc) {
      setSelectedDocument(doc)
      setDocumentSheetOpen(true)
    }
  }

  useEffect(() => {
    loadRevenues()
    loadOutboxFiles()
    loadClientFiles()
    loadAnnexes()
  }, [client.id])

  async function loadRevenues() {
    const supabase = createBrowserClient()

    const { data: revenuesData, error } = await supabase
      .from("client_revenues")
      .select("*")
      .eq("client_id", client.id)
      .order("category_id", { ascending: true })

    if (error) {
      setLoadingRevenues(false)
      return
    }

    if (revenuesData && revenuesData.length > 0) {
      const categoryIds = [...new Set(revenuesData.map((r) => r.category_id))]

      const { data: categories } = await supabase.from("categories_revenus").select("id, nom").in("id", categoryIds)

      const catMap = new Map()
      categories?.forEach((cat) => catMap.set(cat.id, cat.nom))
      setCategoryNames(catMap)

      const revenuesWithNames = await Promise.all(
        revenuesData.map(async (r) => {
          let hasAnnexe = false

          console.log(
            `[v0] Checking annexe for client ${client.id}, category ${r.category_id}, sub_category_ids:`,
            r.sub_category_ids,
          )

          if (r.sub_category_ids && r.sub_category_ids.length > 0) {
            // Get case codes for these sub-categories
            const { data: caseCodes } = await supabase
              .from("case_labels")
              .select("case_code")
              .in("sub_category_id", r.sub_category_ids)

            console.log(`[v0] Found case codes for sub-categories:`, caseCodes)

            if (caseCodes && caseCodes.length > 0) {
              const codes = caseCodes.map((c) => c.case_code)

              // Check if any of these case codes have annexes
              const { data: annexes } = await supabase.from("case_annexes").select("id").in("case_code", codes).limit(1)

              console.log(`[v0] Found annexes for case codes:`, annexes)

              hasAnnexe = !!annexes && annexes.length > 0
            }
          }

          console.log(`[v0] Final hasAnnexe value for category ${r.category_id}:`, hasAnnexe)

          return {
            ...r,
            categoryName: catMap.get(r.category_id) || `Catégorie ${r.category_id}`,
            hasAnnexe,
          }
        }),
      )

      setRevenues(revenuesWithNames)
    } else {
      setRevenues(revenuesData || [])
    }

    setLoadingRevenues(false)
  }

  async function loadAnnexes() {
    setLoadingAnnexes(true)
    const supabase = createBrowserClient()

    // Get all revenues for this client
    const { data: revenuesData } = await supabase
      .from("client_revenues")
      .select("sub_category_ids")
      .eq("client_id", client.id)

    if (!revenuesData || revenuesData.length === 0) {
      setLoadingAnnexes(false)
      return
    }

    // Collect all sub-category IDs
    const allSubCategoryIds = revenuesData.flatMap((r) => r.sub_category_ids || [])

    if (allSubCategoryIds.length === 0) {
      setLoadingAnnexes(false)
      return
    }

    // Get case codes for these sub-categories
    const { data: caseCodes } = await supabase
      .from("case_labels")
      .select("case_code")
      .in("sub_category_id", allSubCategoryIds)

    if (!caseCodes || caseCodes.length === 0) {
      setLoadingAnnexes(false)
      return
    }

    const codes = [...new Set(caseCodes.map((c) => c.case_code))]

    // Get annexes for these case codes
    const { data: annexesData } = await supabase
      .from("case_annexes")
      .select("id, annexe_name, case_code")
      .in("case_code", codes)

    setAnnexes(annexesData || [])

    // Load completion stats for each annexe
    if (annexesData && annexesData.length > 0) {
      const statsMap = new Map<number, { completed: number; total: number }>()
      
      for (const annexe of annexesData) {
        // Get sub-categories for this annexe's case_code
        const { data: caseLabelsData } = await supabase
          .from("case_labels")
          .select("sub_category_id")
          .eq("case_code", annexe.case_code)
        
        if (caseLabelsData && caseLabelsData.length > 0) {
          const subCatIds = caseLabelsData.map((cl) => cl.sub_category_id)
          
          // Get total documents for these sub-categories
          const { data: docsData } = await supabase
            .from("documents_necessaires")
            .select("id")
            .in("sub_category_id", subCatIds)
          
          const totalDocs = docsData?.length || 0
          
          if (totalDocs > 0) {
            const docIds = docsData.map((d) => d.id)
            
            // Get completed documents from boite_envoi_files where status is "uploaded"
            const { data: completedData } = await supabase
              .from("boite_envoi_files")
              .select("id")
              .eq("client_id", client.id)
              .in("document_id", docIds)
              .eq("status", "uploaded")
            
            const completedDocs = completedData?.length || 0
            statsMap.set(annexe.id, { completed: completedDocs, total: totalDocs })
          }
        }
      }
      
      setAnnexeCompletionStats(statsMap)
    }

    setLoadingAnnexes(false)
  }

  async function loadAnnexeDocuments(annexe: Annexe) {
    setLoadingAnnexeDocuments(true)
    setSelectedAnnexe(annexe)
    setAnnexeModalOpen(true)

    const supabase = createBrowserClient()

    // Get sub-categories that have this case_code
    const { data: caseLabels } = await supabase
      .from("case_labels")
      .select("sub_category_id")
      .eq("case_code", annexe.case_code)

    if (!caseLabels || caseLabels.length === 0) {
      setAnnexeDocuments([])
      setLoadingAnnexeDocuments(false)
      return
    }

    const subCategoryIds = caseLabels.map((cl) => cl.sub_category_id)

    // Get required documents for these sub-categories
    const { data: documents } = await supabase
      .from("documents_necessaires")
      .select("id, shortname, description")
      .in("sub_category_id", subCategoryIds)

    if (!documents || documents.length === 0) {
      setAnnexeDocuments([])
      setLoadingAnnexeDocuments(false)
      return
    }

    const { data: outboxFiles } = await supabase
      .from("boite_envoi_files")
      .select("document_id, status, last_requested_at")
      .eq("client_id", client.id)
      .in(
        "document_id",
        documents.map((d) => d.id),
      )

    const { data: sentHistory } = await supabase
      .from("sent_history")
      .select("document_id, sent_at")
      .eq("client_id", client.id)
      .in(
        "document_id",
        documents.map((d) => d.id),
      )
      .order("sent_at", { ascending: false })

    console.log("[v0] Outbox files with last_requested_at:", outboxFiles)
    console.log("[v0] Sent history:", sentHistory)

    const statusMap = new Map<number, { status: "en_attente" | "uploaded"; last_requested_at: string }>()
    outboxFiles?.forEach((file) => {
      statusMap.set(file.document_id, {
        status: file.status as "en_attente" | "uploaded",
        last_requested_at: file.last_requested_at,
      })
    })

    const historyMap = new Map<number, string>()
    sentHistory?.forEach((history) => {
      if (!historyMap.has(history.document_id)) {
        historyMap.set(history.document_id, history.sent_at)
      }
    })

    const documentsWithStatus: AnnexeDocument[] = documents.map((doc) => {
      const fileData = statusMap.get(doc.id)
      const lastSentDate = historyMap.get(doc.id)

      const lastRequestedAt = fileData?.last_requested_at || lastSentDate

      console.log(`[v0] Document ${doc.id} (${doc.shortname}):`, {
        status: fileData?.status || null,
        last_requested_at: lastRequestedAt,
        from_outbox: !!fileData?.last_requested_at,
        from_history: !!lastSentDate,
      })

      return {
        id: doc.id,
        shortname: doc.shortname || doc.description || "Document sans nom",
        description: doc.description || "",
        status: fileData?.status || null,
        last_requested_at: lastRequestedAt,
      }
    })

    setAnnexeDocuments(documentsWithStatus)
    setLoadingAnnexeDocuments(false)
  }

  async function addDocumentToOutbox(documentId: number) {
    const supabase = createBrowserClient()

    // Get document info
    const { data: docData } = await supabase
      .from("documents_necessaires")
      .select("shortname, description")
      .eq("id", documentId)
      .single()

    if (!docData) return

    const fileName = docData.shortname || docData.description || "Document"

    const { data: existingDoc } = await supabase
      .from("boite_envoi_files")
      .select("id")
      .eq("client_id", client.id)
      .eq("document_id", documentId)
      .single()

    if (existingDoc) {
      const { error } = await supabase
        .from("boite_envoi_files")
        .update({ last_requested_at: new Date().toISOString() })
        .eq("id", existingDoc.id)

      if (error) {
        console.error("Error updating document request date:", error)
        alert("Erreur lors de la mise à jour de la date de demande")
        return
      }
    } else {
      const { error } = await supabase.from("boite_envoi_files").insert({
        client_id: client.id,
        document_id: documentId,
        file_name: fileName,
        status: "en_attente",
        last_requested_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error adding document to outbox:", error)
        alert("Erreur lors de l'ajout du document")
        return
      }
    }

    // Reload the documents to update the status
    if (selectedAnnexe) {
      await loadAnnexeDocuments(selectedAnnexe)
    }
    await loadOutboxFiles()
  }

  async function addAllMissingDocumentsToOutbox() {
    const missingDocs = annexeDocuments.filter((doc) => !doc.status)

    if (missingDocs.length === 0) {
      alert("Tous les documents sont déjà dans la boîte d'envoi")
      return
    }

    const supabase = createBrowserClient()

    const inserts = missingDocs.map((doc) => ({
      client_id: client.id,
      document_id: doc.id,
      file_name: doc.shortname,
      status: "en_attente" as const,
      last_requested_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from("boite_envoi_files").insert(inserts)

    if (error) {
      console.error("Error adding documents to outbox:", error)
      alert("Erreur lors de l'ajout des documents")
      return
    }

    // Reload the documents to update the status
    if (selectedAnnexe) {
      await loadAnnexeDocuments(selectedAnnexe)
    }
    await loadOutboxFiles()
  }

  async function loadOutboxFiles() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("boite_envoi_files")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading outbox files:", error)
      return
    }

    setOutboxFiles(data || [])
  }

  async function loadClientFiles() {
    const supabase = createBrowserClient()
    
    // Load from client_files, documents, and conventions tables
    const [clientFilesResult, documentsResult, conventionsResult] = await Promise.all([
      supabase
        .from("client_files")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("client_id", client.id),
      supabase
        .from("conventions")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
    ])

    if (clientFilesResult.error) {
      console.error("[v0] Error loading client files:", clientFilesResult.error)
    }
    
    if (documentsResult.error) {
      console.error("[v0] Error loading documents:", documentsResult.error)
    }
    
    if (conventionsResult.error) {
      console.error("[v0] Error loading conventions:", conventionsResult.error)
    }

    // Merge all three sources
    const allFiles = [
      ...(clientFilesResult.data || []),
      ...(documentsResult.data || []).map(doc => ({
        ...doc,
        file_name: doc.name,
        file_url: doc.url,
        file_type: doc.type,
      })),
      ...(conventionsResult.data || [])
        .filter(conv => conv.document_url)
        .map(conv => ({
          ...conv,
          file_name: conv.document_name || 'Convention',
          file_url: conv.document_url,
          file_type: 'application/pdf',
        }))
    ]

    setClientFiles(allFiles)
  }

  async function handleDeleteOutboxFile(fileId: string) {
    setFileToDelete(fileId)
    setDeleteModalOpen(true)
  }

  async function confirmDeleteOutboxFile() {
    if (!fileToDelete) return

    const supabase = createBrowserClient()
    const { error } = await supabase.from("boite_envoi_files").delete().eq("id", fileToDelete)

    if (error) {
      console.error("Error deleting outbox file:", error)
      alert("Erreur lors de la suppression du fichier")
      setDeleteModalOpen(false)
      setFileToDelete(null)
      return
    }

    await loadOutboxFiles()
    setDeleteModalOpen(false)
    setFileToDelete(null)
  }

  const handleBulkDeleteOutboxFiles = async () => {
    if (selectedOutboxFiles.size === 0) return

    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedOutboxFiles.size} fichier(s) ?`)
    if (!confirmed) return

    const supabase = createBrowserClient()
    const fileIds = Array.from(selectedOutboxFiles)

    const { error } = await supabase.from("boite_envoi_files").delete().in("id", fileIds)

    if (error) {
      console.error("Error bulk deleting outbox files:", error)
      alert("Erreur lors de la suppression des fichiers")
      return
    }

    setSelectedOutboxFiles(new Set())
    setShowBulkActions(false)
    await loadOutboxFiles()
  }

  async function handleDeleteClientFile(fileId: string) {
    setClientFileToDelete(fileId)
    setDeleteClientFileModalOpen(true)
  }

  async function confirmDeleteClientFile() {
    if (!clientFileToDelete) return

    const supabase = createBrowserClient()
    const { error } = await supabase.from("client_files").delete().eq("id", clientFileToDelete)

    if (error) {
      console.error("Error deleting client file:", error)
      alert("Erreur lors de la suppression du fichier")
      setDeleteClientFileModalOpen(false)
      setClientFileToDelete(null)
      return
    }

    await loadClientFiles()
    setDeleteClientFileModalOpen(false)
    setClientFileToDelete(null)
  }

  // Renamed to loadClientRevenues to avoid conflict with loadRevenues
  const loadClientRevenues = async () => {
    await loadRevenues()
  }

  const handleRevenueAdded = async (categoryName: string, categoryId: number) => {
    onOpenRevenuePage(client.id, `${client.first_name} ${client.last_name}`, categoryName, categoryId)
    await handleAddedRevenue()
  }

  const handleOpenRevenueDetailTab = (revenueId: string, categoryName: string) => {
    // Find the revenue to get its category_id
    const revenue = revenues.find((r) => r.id === revenueId)
    if (revenue) {
      onOpenRevenuePage(
        client.id,
        `${client.first_name} ${client.last_name}`,
        categoryName,
        revenue.category_id,
        revenue.sub_category_ids, // Pass the existing selections
        revenueId, // Pass the revenue ID for update mode
      )
    }
  }

  const handleCloseRevenueTab = (tabId: string) => {
    onRevenueTabsChange((prev) => prev.filter((tab) => tab.id !== tabId))
    if (activeTab === tabId) {
      onTabChange("overview")
    }
  }

  const handleCloseYearTab = (tabId: string) => {
    onYearTabsChange((prev) => prev.filter((tab) => tab.id !== tabId))
    if (activeTab === tabId) {
      onTabChange("declarations")
    }
  }

  const handleOpenYearTab = (year: number) => {
    const tabId = `year-${year}`
    // Check if tab already exists
    if (!yearTabs.find((tab) => tab.id === tabId)) {
      onYearTabsChange((prev) => [...prev, { id: tabId, year }])
    }
    onTabChange(tabId)
  }

  const handleSwitchToRevenue = (revenueId: string, categoryName: string) => {
    const currentRevenueTabIndex = revenueTabs.findIndex((tab) => tab.id === activeTab)

    if (currentRevenueTabIndex !== -1) {
      // Replace the current revenue tab
      const newRevenueTabs = [...revenueTabs]
      newRevenueTabs[currentRevenueTabIndex] = {
        id: `revenue-${revenueId}`,
        categoryName,
      }
      onRevenueTabsChange(newRevenueTabs)
      onTabChange(`revenue-${revenueId}`)
    }
  }

  const handleNavigateToNextRevenue = () => {
    const currentRevenueTabIndex = revenueTabs.findIndex((tab) => tab.id === activeTab)
    if (currentRevenueTabIndex !== -1 && currentRevenueTabIndex < revenueTabs.length - 1) {
      const nextTab = revenueTabs[currentRevenueTabIndex + 1]
      onTabChange(nextTab.id)
    }
  }

  const getCurrentRevenueIndex = () => {
    return revenueTabs.findIndex((tab) => tab.id === activeTab)
  }

  const getNextCategoryName = () => {
    const currentIndex = getCurrentRevenueIndex()
    if (currentIndex !== -1 && currentIndex < revenueTabs.length - 1) {
      return revenueTabs[currentIndex + 1].categoryName
    }
    return undefined
  }

  const handleDeleteRevenue = async (revenueId: string, categoryName: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ? Cette action est irréversible.`,
    )

    if (!confirmed) return

    const supabase = createBrowserClient()
    const { error } = await supabase.from("client_revenues").delete().eq("id", revenueId)

    if (error) {
      alert("Erreur lors de la suppression de la catégorie")
      return
    }

    await loadRevenues()
  }

  async function handleAddedRevenue() {
    await loadRevenues()
    await loadOutboxFiles()
  }

  const handleSaveChanges = async () => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("clients")
        .update({
          first_name: editedClient.first_name,
          last_name: editedClient.last_name,
          email: editedClient.email,
          phone: editedClient.phone,
          address: editedClient.address,
          custom_fields: customFields,
        })
        .eq("id", client.id)

      if (error) throw error

      setIsEditMode(false)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error saving changes:", error)
      alert("Erreur lors de la sauvegarde des modifications")
    }
  }

  const handleResetChanges = () => {
    setEditedClient({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || "",
      address: client.address || "",
      accountant: "",
    })
    setEditedSpouse({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      accountant: "",
    })
    setCustomFields((client.custom_fields as Array<{ name: string; value: string }>) || [])
    setIsEditMode(false)
  }

  const addCustomField = () => {
    setCustomFields([...customFields, { name: "", value: "" }])
    setIsEditingCustomFields(true)
  }

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const updateCustomField = (index: number, field: "name" | "value", newValue: string) => {
    const updated = [...customFields]
    updated[index][field] = newValue
    setCustomFields(updated)
  }

  const handleSaveCustomFields = async () => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("clients")
        .update({
          custom_fields: customFields,
        })
        .eq("id", client.id)

      if (error) throw error

      setIsEditingCustomFields(false)
      alert("Champs personnalisés sauvegardés avec succès")
    } catch (error) {
      console.error("[v0] Error saving custom fields:", error)
      alert("Erreur lors de la sauvegarde des champs personnalisés")
    }
  }

  const handleResetCustomFields = () => {
    setCustomFields((client.custom_fields as Array<{ name: string; value: string }>) || [])
    setIsEditingCustomFields(false)
  }

  const addChild = () => {
    setChildren([...children, { first_name: "", last_name: "", date_of_birth: "" }])
    setIsEditingChildren(true)
  }

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index))
  }

  const updateChild = (index: number, field: keyof Child, value: string) => {
    const updated = [...children]
    updated[index][field] = value
    setChildren(updated)
  }

  const handleSaveChildren = async () => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("clients")
        .update({
          children: children,
        })
        .eq("id", client.id)

      if (error) throw error

      setIsEditingChildren(false)
      alert("Enfants à charge sauvegardés avec succès")
    } catch (error) {
      console.error("[v0] Error saving children:", error)
      alert("Erreur lors de la sauvegarde des enfants")
    }
  }

  const handleResetChildren = () => {
    setChildren((client.children as Child[]) || [])
    setIsEditingChildren(false)
  }

  const addSpouseChild = () => {
    setSpouseChildren([...spouseChildren, { first_name: "", last_name: "", date_of_birth: "" }])
    setIsEditingSpouseChildren(true)
  }

  const removeSpouseChild = (index: number) => {
    setSpouseChildren(spouseChildren.filter((_, i) => i !== index))
  }

  const updateSpouseChild = (index: number, field: keyof Child, value: string) => {
    const updated = [...spouseChildren]
    updated[index][field] = value
    setSpouseChildren(updated)
  }

  const handleSaveSpouseChildren = async () => {
    try {
      const supabase = createBrowserClient()
      // Note: This assumes you have a spouse_children field in the database
      // You may need to adjust this based on your schema
      const { error } = await supabase
        .from("clients")
        .update({
          spouse_children: spouseChildren,
        })
        .eq("id", client.id)

      if (error) throw error

      setIsEditingSpouseChildren(false)
      alert("Enfants du conjoint sauvegardés avec succès")
    } catch (error) {
      console.error("[v0] Error saving spouse children:", error)
      alert("Erreur lors de la sauvegarde des enfants du conjoint")
    }
  }

  const handleResetSpouseChildren = () => {
    setSpouseChildren([])
    setIsEditingSpouseChildren(false)
  }

  const toggleOutboxFileSelection = (fileId: string) => {
    setSelectedOutboxFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const toggleAllOutboxFiles = () => {
    if (selectedOutboxFiles.size === outboxFiles.length) {
      setSelectedOutboxFiles(new Set())
    } else {
      setSelectedOutboxFiles(new Set(outboxFiles.map((f) => f.id)))
    }
  }

  const filteredDocuments = documents.filter((doc) => doc.name.toLowerCase().includes(documentSearchTerm.toLowerCase()))

  return (
    <div className="p-6">
      {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CardTitle>Catégories de revenus</CardTitle>
                      <AddRevenueDialog
                        clientId={client.id}
                        clientName={`${client.first_name} ${client.last_name}`}
                        onRevenueAdded={handleRevenueAdded}
                        onSuccess={() => {
                          loadClientRevenues()
                          loadOutboxFiles()
                        }}
                        shouldOpen={shouldOpenRevenueModal}
                        onOpenChange={onRevenueModalClose}
                        existingCategoryIds={revenues.map((r) => r.category_id)}
                        trigger={
                          <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent">
                            <Plus className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingRevenues ? (
                      <p className="text-sm text-muted-foreground">Chargement...</p>
                    ) : revenues.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune catégorie de revenus pour le moment</p>
                    ) : (
                      <div className="space-y-2">
                        {revenues.map((revenue) => (
                          <div key={revenue.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {revenue.categoryName || `Catégorie ${revenue.category_id}`}
                              </p>
                              {revenue.hasAnnexe && (
                                <span className="inline-flex items-center justify-center h-6 w-6 rounded border-red-600 text-xs font-bold text-red-500 bg-transparent border mr-1.5">
                                  A
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() =>
                                  onOpenAmountEntry(
                                    client.id,
                                    `${client.first_name} ${client.last_name}`,
                                    revenue.category_id,
                                    revenue.categoryName || `Catégorie ${revenue.category_id}`,
                                  )
                                }
                              >
                                <Eye className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => handleOpenRevenueDetailTab(revenue.id, revenue.categoryName || "")}
                              >
                                <Pencil className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => handleDeleteRevenue(revenue.id, revenue.categoryName || "")}
                                className="text-red-600 hover:text-red-700 hover:border-red-600"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Déclarations</CardTitle>
                        
                      </div>
                      <Button size="sm" onClick={() => setNewDeclarationModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 items-start">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-50 border-blue-200 hover:bg-blue-100 w-24 justify-center"
                        onClick={() => onOpen2042View(client.id, `${client.first_name} ${client.last_name}`)}
                      >
                        <span className="font-semibold text-blue-700">2042</span>
                      </Button>
                      {loadingAnnexes ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
                      ) : (
                        annexes.map((annexe) => {
                          const stats = annexeCompletionStats.get(annexe.id)
                          return (
                            <Button
                              key={annexe.id}
                              variant="outline"
                              size="sm"
                              className="bg-transparent justify-between gap-2 min-w-[120px]"
                              onClick={() => {
                                loadAnnexeDocuments(annexe)
                              }}
                            >
                              <span className="font-semibold">{annexe.annexe_name}</span>
                              {stats && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  Documents
                                  <Badge 
                                    variant={stats.completed === stats.total ? "default" : "secondary"}
                                    className={stats.completed === stats.total ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                                  >
                                    {stats.completed}/{stats.total}
                                  </Badge>
                                </span>
                              )}
                            </Button>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <ClientRevenuesTablePremium clientId={client.id} />

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Boîte d'envoi</CardTitle>
                    <div className="flex items-center gap-2">
                      {outboxFiles.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setShowBulkActions(!showBulkActions)}>
                          {showBulkActions ? "Annuler sélection" : "Sélection multiple"}
                        </Button>
                      )}
                      <SendEmailDialog
                        clientEmail={client.email || ""}
                        clientId={client.id}
                        documents={outboxFiles}
                        onSendSuccess={loadOutboxFiles}
                      />
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          const trigger = document.getElementById("send-email-trigger") as HTMLButtonElement
                          if (trigger) trigger.click()
                        }}
                      >
                        Envoyer
                      </Button>
                    </div>
                  </div>
                  <CardDescription>Fichiers demandés</CardDescription>
                </CardHeader>
                <CardContent>
                  {showBulkActions && outboxFiles.length > 0 && (
                    <div
                      className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={toggleAllOutboxFiles}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedOutboxFiles.size === outboxFiles.length}
                          onChange={toggleAllOutboxFiles}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 cursor-pointer"
                        />
                        <span className="text-sm font-medium">Tout sélectionner</span>
                        <span className="text-sm text-muted-foreground">
                          ({selectedOutboxFiles.size} sélectionné(s))
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedOutboxFiles.size === 0}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBulkDeleteOutboxFiles()
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {outboxFiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Aucun fichier dans la boîte d'envoi</p>
                    ) : (
                      <ul className="space-y-2">
                        {outboxFiles.map((file) => (
                          <li key={file.id} className="flex items-center gap-3 text-sm">
                            {showBulkActions && (
                              <input
                                type="checkbox"
                                checked={selectedOutboxFiles.has(file.id)}
                                onChange={() => toggleOutboxFileSelection(file.id)}
                                className="h-4 w-4 cursor-pointer"
                              />
                            )}
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            <span className="flex-1">{file.file_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {file.status === "en_attente" ? "En attente" : "Uploadé"}
                            </Badge>
                            {!showBulkActions && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOutboxFile(file.id)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex items-center justify-end gap-2">
                {!isEditMode ? (
                  <Button onClick={() => setIsEditMode(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Mode édition
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleResetChanges} variant="outline" size="sm">
                      Réinitialiser
                    </Button>
                    <Button onClick={handleSaveChanges} size="sm">
                      Valider les changements
                    </Button>
                  </>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Client Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fiche client</CardTitle>
                    <CardDescription>Informations du titulaire</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Prénom</p>
                        {isEditMode ? (
                          <Input
                            value={editedClient.first_name}
                            onChange={(e) => setEditedClient({ ...editedClient, first_name: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">{client.first_name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        {isEditMode ? (
                          <Input
                            value={editedClient.last_name}
                            onChange={(e) => setEditedClient({ ...editedClient, last_name: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">{client.last_name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        {isEditMode ? (
                          <Input
                            type="email"
                            value={editedClient.email}
                            onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">{client.email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                        {isEditMode ? (
                          <Input
                            value={editedClient.phone}
                            onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">{client.phone || "-"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                        {isEditMode ? (
                          <Input
                            value={editedClient.address}
                            onChange={(e) => setEditedClient({ ...editedClient, address: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">{client.address || "-"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                        <p className="text-sm">{new Date(client.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div>
                        
                        
                      </div>
                    </div>

                    <details className="group">
                      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline">
                        <span>Enfants à charge ({children.length})</span>
                      </summary>
                      <div className="mt-4 space-y-3 rounded-lg border p-4 bg-muted/30">
                        {children.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Aucun enfant à charge</p>
                        ) : (
                          <div className="space-y-4">
                            {children.map((child, index) => (
                              <div key={index} className="p-3 border rounded-lg bg-background space-y-2">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-medium">Enfant {index + 1}</p>
                                  {isEditingChildren && (
                                    <Button
                                      onClick={() => removeChild(index)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Prénom</p>
                                    {isEditingChildren ? (
                                      <Input
                                        value={child.first_name}
                                        onChange={(e) => updateChild(index, "first_name", e.target.value)}
                                        placeholder="Prénom"
                                        className="h-8 mt-1"
                                      />
                                    ) : (
                                      <p className="text-sm mt-1">{child.first_name || "-"}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Nom</p>
                                    {isEditingChildren ? (
                                      <Input
                                        value={child.last_name}
                                        onChange={(e) => updateChild(index, "last_name", e.target.value)}
                                        placeholder="Nom"
                                        className="h-8 mt-1"
                                      />
                                    ) : (
                                      <p className="text-sm mt-1">{child.last_name || "-"}</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Date de naissance</p>
                                  {isEditingChildren ? (
                                    <Input
                                      type="date"
                                      value={child.date_of_birth}
                                      onChange={(e) => updateChild(index, "date_of_birth", e.target.value)}
                                      className="h-8 mt-1"
                                    />
                                  ) : (
                                    <p className="text-sm mt-1">
                                      {child.date_of_birth
                                        ? new Date(child.date_of_birth).toLocaleDateString("fr-FR")
                                        : "-"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button onClick={addChild} size="sm" variant="outline" className="flex-1 bg-transparent">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un enfant
                          </Button>
                          {isEditingChildren && (
                            <>
                              <Button onClick={handleResetChildren} size="sm" variant="outline">
                                Annuler
                              </Button>
                              <Button onClick={handleSaveChildren} size="sm">
                                Valider
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </details>
                  </CardContent>
                </Card>

                {/* Spouse Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conjoint</CardTitle>
                    <CardDescription>Informations du conjoint</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Prénom</p>
                        {isEditMode ? (
                          <Input
                            value={editedSpouse.first_name}
                            onChange={(e) => setEditedSpouse({ ...editedSpouse, first_name: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        {isEditMode ? (
                          <Input
                            value={editedSpouse.last_name}
                            onChange={(e) => setEditedSpouse({ ...editedSpouse, last_name: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        {isEditMode ? (
                          <Input
                            type="email"
                            value={editedSpouse.email}
                            onChange={(e) => setEditedSpouse({ ...editedSpouse, email: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                        {isEditMode ? (
                          <Input
                            value={editedSpouse.phone}
                            onChange={(e) => setEditedSpouse({ ...editedSpouse, phone: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                        {isEditMode ? (
                          <Input
                            value={editedSpouse.address}
                            onChange={(e) => setEditedSpouse({ ...editedSpouse, address: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">-</p>
                        )}
                      </div>
                      <div>
                        
                        
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                        <p className="text-sm">-</p>
                      </div>
                      <div>
                        
                        
                      </div>
                    </div>

                    

                    <details className="group">
                      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline">
                        <span>Enfants à charge ({spouseChildren.length})</span>
                      </summary>
                      <div className="mt-4 space-y-3 rounded-lg border p-4 bg-muted/30">
                        {spouseChildren.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Aucun enfant à charge</p>
                        ) : (
                          <div className="space-y-4">
                            {spouseChildren.map((child, index) => (
                              <div key={index} className="p-3 border rounded-lg bg-background space-y-2">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-medium">Enfant {index + 1}</p>
                                  {isEditingSpouseChildren && (
                                    <Button
                                      onClick={() => removeSpouseChild(index)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Prénom</p>
                                    {isEditingSpouseChildren ? (
                                      <Input
                                        value={child.first_name}
                                        onChange={(e) => updateSpouseChild(index, "first_name", e.target.value)}
                                        placeholder="Prénom"
                                        className="h-8 mt-1"
                                      />
                                    ) : (
                                      <p className="text-sm mt-1">{child.first_name || "-"}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Nom</p>
                                    {isEditingSpouseChildren ? (
                                      <Input
                                        value={child.last_name}
                                        onChange={(e) => updateSpouseChild(index, "last_name", e.target.value)}
                                        placeholder="Nom"
                                        className="h-8 mt-1"
                                      />
                                    ) : (
                                      <p className="text-sm mt-1">{child.last_name || "-"}</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Date de naissance</p>
                                  {isEditingSpouseChildren ? (
                                    <Input
                                      type="date"
                                      value={child.date_of_birth}
                                      onChange={(e) => updateSpouseChild(index, "date_of_birth", e.target.value)}
                                      className="h-8 mt-1"
                                    />
                                  ) : (
                                    <p className="text-sm mt-1">
                                      {child.date_of_birth
                                        ? new Date(child.date_of_birth).toLocaleDateString("fr-FR")
                                        : "-"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            onClick={addSpouseChild}
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un enfant
                          </Button>
                          {isEditingSpouseChildren && (
                            <>
                              <Button onClick={handleResetSpouseChildren} size="sm" variant="outline">
                                Annuler
                              </Button>
                              <Button onClick={handleSaveSpouseChildren} size="sm">
                                Valider
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              </div>

              
            </div>
          )}

          {activeTab === "declarations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{"Millésimes"}</h3>
                  <p className="text-sm text-muted-foreground">Gérez les déclarations et profils fiscaux du client</p>
                </div>
                <Button onClick={() => setNewDeclarationModalOpen(true)}>Ajouter un profil</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Bloc 2025 */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="space-y-3">
                      <CardTitle className="text-base">Année 2025</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant="secondary" 
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          onClick={() => onOpen2042View(client.id, `${client.first_name} ${client.last_name}`)}
                        >
                          2042
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          onClick={() => handleOpenYearTab(2025)}
                        >
                          2042 C
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          onClick={() => handleOpenYearTab(2025)}
                        >
                          IFU
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          onClick={() => handleOpenYearTab(2025)}
                        >
                          IFI
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {taxProfiles.find(p => p.tax_year === 2025)?.notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Notes</p>
                          <p className="text-sm">{taxProfiles.find(p => p.tax_year === 2025)?.notes}</p>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button className="bg-blue-600"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenYearTab(2025)
                          }}
                        >
                          Ouvrir →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloc 2024 */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="space-y-3">
                      <CardTitle className="text-base">Année 2024</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant="secondary" 
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          onClick={() => onOpen2042View(client.id, `${client.first_name} ${client.last_name}`)}
                        >
                          2042
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          onClick={() => handleOpenYearTab(2024)}
                        >
                          2042 C
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {taxProfiles.find(p => p.tax_year === 2024)?.notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Notes</p>
                          <p className="text-sm">{taxProfiles.find(p => p.tax_year === 2024)?.notes}</p>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button className="bg-blue-600"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenYearTab(2024)
                          }}
                        >
                          Ouvrir →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {yearTabs.map((yearTab) => {
            if (activeTab !== yearTab.id) return null

            // Filter annexes for this year's profile
            const profile = taxProfiles.find((p) => p.tax_year === yearTab.year)

            return (
              <div key={yearTab.id} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Année {yearTab.year}</h3>
                  <p className="text-sm text-muted-foreground">
                    Déclarations associées pour l'année fiscale {yearTab.year}
                  </p>
                </div>

                {loadingAnnexes ? (
                  <p className="text-sm text-muted-foreground">Chargement des déclarations...</p>
                ) : annexes.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Aucune déclaration associée pour cette année
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                      onClick={() => onOpen2042View(client.id, `${client.first_name} ${client.last_name}`)}
                    >
                      <span className="font-semibold text-blue-700">2042</span>
                    </Button>
                    {annexes.map((annexe) => (
                      <Button
                        key={annexe.id}
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => loadAnnexeDocuments(annexe)}
                      >
                        <span className="font-semibold">{annexe.annexe_name}</span>
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => {}}
                    >
                      <span className="font-semibold">IFU</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => {}}
                    >
                      <span className="font-semibold">IFI</span>
                    </Button>
                  </div>
                )}
              </div>
            )
          })}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Documents</h3>
                  <p className="text-sm text-muted-foreground">Gérez les documents partagés avec le client</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Mode expert toggle */}
                  <div className="flex items-center gap-2">
                    <Switch id="expert-mode" checked={expertMode} onCheckedChange={setExpertMode} />
                    <label htmlFor="expert-mode" className="text-sm text-muted-foreground cursor-pointer">
                      Mode documents déc
                    </label>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Rechercher un document..."
                      value={documentSearchTerm}
                      onChange={(e) => setDocumentSearchTerm(e.target.value)}
                      className="h-10 w-64 rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <ShareSpaceDialog clientId={client.id} clientName={`${client.first_name} ${client.last_name}`} />
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleExportChecklist}>
                    <Download className="h-4 w-4" />
                    Exporter PDF
                  </Button>
                  <Button>Télécharger un document</Button>
                  {/* Kebab menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => toast({ title: "Fonctionnalité à implémenter" })}
                      >
                        <ClipboardList className="h-4 w-4" />
                        Journal d'audit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => toast({ title: "Fonctionnalité à implémenter" })}
                      >
                        <Settings className="h-4 w-4" />
                        Paramètres des relances
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <DossierStatusBar stats={dossierStats} onRelance={handleRelanceBloquants} isRelancing={isRelancingDocs} />

              {/* Merged table: DB-sourced with premium onclick styles */}
              {clientFiles.length === 0 && outboxFiles.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aucun document pour le moment
                  </CardContent>
                </Card>
              ) : (
                <div className="border rounded-lg">
                  <div className="px-4 py-3 border-b bg-muted/50">
                    <h4 className="text-sm font-medium">Documents du dossier</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Document</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Dernière demande
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Criticité</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">OCR</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {/* Outbox files - En attente */}
                        {outboxFiles
                          .filter((file) => file.file_name.toLowerCase().includes(documentSearchTerm.toLowerCase()))
                          .map((file) => (
                            <tr
                              key={file.id}
                              onClick={() => {
                                // Convert outbox file to DocumentRequest format
                                const docRequest: DocumentRequest = {
                                  id: file.id,
                                  name: file.file_name,
                                  lastRequestAt: file.last_requested_at || file.created_at,
                                  status: file.status === "uploaded" ? "received" : "pending",
                                  isBlocking: true,
                                  criticality: "blocking",
                                  origin: "auto",
                                  revenueSubcategoryLabel: "Documents requis",
                                  impactedCases: [],
                                  ocr: { state: file.status === "uploaded" ? "pending" : "idle" },
                                  history: [
                                    {
                                      date: file.last_requested_at || file.created_at,
                                      action: "Document demandé",
                                      user: "Système",
                                    },
                                  ],
                                }
                                setSelectedDocument(docRequest)
                                setDocumentSheetOpen(true)
                              }}
                              className="hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{file.file_name}</span>
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {file.last_requested_at
                                  ? new Date(file.last_requested_at).toLocaleDateString("fr-FR")
                                  : new Date(file.created_at).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className={
                                    file.status === "uploaded"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-orange-50 text-orange-700 border-orange-200"
                                  }
                                >
                                  {file.status === "uploaded" ? "Reçu" : "En attente"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  Bloquant
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  {file.status === "uploaded" ? "En attente" : "N/A"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteOutboxFile(file.id)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}

                        {/* Client files - Documents reçus/validés */}
                        {clientFiles
                          .filter((file) => {
                            const fileName = file.file_name || (file as any).name || ''
                            return fileName.toLowerCase().includes(documentSearchTerm.toLowerCase())
                          })
                          .map((file) => {
                            const fileName = file.file_name || (file as any).name || 'Document sans nom'
                            return (
                            <tr
                              key={file.id}
                              onClick={() => {
                                // Convert client file to DocumentRequest format
                                const fileDate = file.created_at || new Date().toISOString()
                                const docRequest: DocumentRequest = {
                                  id: String(file.id),
                                  name: fileName,
                                  lastRequestAt: fileDate,
                                  status:
                                    file.status === "ok"
                                      ? "validated"
                                      : file.status === "pending"
                                        ? "received"
                                        : "pending",
                                  isBlocking: false,
                                  criticality: "important",
                                  origin: "manual",
                                  revenueSubcategoryLabel: "Documents validés",
                                  impactedCases: [],
                                  ocr: {
                                    state: file.status === "ok" ? "done" : "pending",
                                    extracted: file.status === "ok" ? { Sample: "Data" } : undefined,
                                    confidenceScore: file.status === "ok" ? 0.95 : undefined,
                                  },
                                  history: [
                                    {
                                      date: fileDate,
                                      action: "Document reçu",
                                      user: "Client",
                                    },
                                  ],
                                }
                                setSelectedDocument(docRequest)
                                setDocumentSheetOpen(true)
                              }}
                              className="hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{fileName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {file.created_at ? new Date(file.created_at).toLocaleDateString("fr-FR") : "-"}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className={
                                    file.status === "ok"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : file.status === "pending"
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                  }
                                >
                                  {file.status === "ok"
                                    ? "Validé"
                                    : file.status === "pending"
                                      ? "En attente"
                                      : "Disponible"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  Important
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Extrait
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteClientFile(file.id)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <DocumentDetailsSheet
                document={selectedDocument}
                open={documentSheetOpen}
                onOpenChange={setDocumentSheetOpen}
                expertMode={expertMode}
              />
            </div>
          )}

          {activeTab === "foyer" && (
            <div className="max-w-[1320px] mx-auto">
              {/* HEADER */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {client.first_name} {client.last_name}
                  </h2>
                  <p className="text-muted-foreground">Foyer fiscal</p>
                </div>
                  
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">Année fiscale :</span>
                  <Select value={selectedFiscalYear} onValueChange={setSelectedFiscalYear}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une relation
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Déclarer un événement
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Relancer le client
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Exporter
                  </Button>
                </div>
              </div>

              {/* Grid layout en îlot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BLOC 1 — Situation familiale */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">📌 Situation familiale</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFoyerEditMode(foyerEditMode === "situation" ? null : "situation")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {foyerEditMode === "situation" ? (
                    <>
                      <div className="space-y-3">
                        <Label>Situation au 31/12/2025</Label>
                        <RadioGroup
                          value={situationFamiliale}
                          onValueChange={setSituationFamiliale}
                          className="flex flex-wrap gap-4"
                        >
                          {["Célibataire", "Marié", "PACS", "Concubinage", "Séparé", "Divorcé", "Veuf"].map(
                            (option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={option} />
                                <Label htmlFor={option} className="font-normal">
                                  {option}
                                </Label>
                              </div>
                            ),
                          )}
                        </RadioGroup>
                      </div>
                      <div className="space-y-3">
                        <Label>Changement de situation pendant l'année 2025 ?</Label>
                        <RadioGroup
                          value={changementSituation}
                          onValueChange={setChangementSituation}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Oui" id="changement-oui" />
                            <Label htmlFor="changement-oui" className="font-normal">
                              Oui
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Non" id="changement-non" />
                            <Label htmlFor="changement-non" className="font-normal">
                              Non
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => setFoyerEditMode(null)}>
                          Enregistrer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setFoyerEditMode(null)}>
                          Annuler
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Situation au 31/12/2025</p>
                          <p className="font-medium">{situationFamiliale}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Changement de situation pendant l'année 2025 ?
                          </p>
                          <p className="font-medium">{changementSituation}</p>
                        </div>
                      </div>
                      {changementSituation === "Oui" && (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-700 italic">
                              ℹ️ Un ou plusieurs événements doivent être renseignés pour l'année sélectionnée.
                            </p>
                          </div>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter un événement
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* BLOC 2 — Relations du foyer */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">👥 Relations du foyer</CardTitle>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      🧑‍🤝‍🧑 Conjoint / Ex-conjoint
                    </h4>

                    {/* Ex-conjoint card */}
                    <Card className="border-red-200 bg-red-50/30 mb-4">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-semibold">🔴 Ex-conjoint</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Nom :</span> —
                          </p>
                          <p>
                            <span className="text-muted-foreground">Type de relation :</span> Conjoint
                          </p>
                          <p>
                            <span className="text-muted-foreground">Période :</span> du 01/01/2018 au 15/06/2025
                          </p>
                          <p>
                            <span className="text-muted-foreground">Fin de relation :</span> Séparation
                          </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Voir détails
                          </Button>
                          <Button variant="outline" size="sm">
                            <Scale className="h-3 w-3 mr-1" />
                            Ajouter une pension
                          </Button>
                          <Button variant="outline" size="sm">
                            <Paperclip className="h-3 w-3 mr-1" />
                            Ajouter justificatif
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* État vide conjoint actif */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="font-medium mb-2">📭 Aucun conjoint actif</p>
                      <p className="text-sm text-muted-foreground italic mb-3">
                        Le client n'a pas de conjoint au 31/12/2025.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter un conjoint
                        </Button>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Déclarer un divorce
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* BLOC 3 — Enfants, pensions & obligations financières */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">🧒 Enfants, pensions & obligations financières</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFoyerEditMode(foyerEditMode === "enfants" ? null : "enfants")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Section Enfants */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Enfants & personnes à charge</h4>
                    {/* Enfant #1 */}
                    <Card>
                      <CardContent className="pt-4 space-y-2">
                        <p className="font-semibold flex items-center gap-2">👶 Enfant #1</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Nom :</span> Léa Khatchatrian
                          </p>
                          <p>
                            <span className="text-muted-foreground">Date de naissance :</span> 12/03/2016
                          </p>
                        </div>
                        {foyerEditMode === "enfants" ? (
                          <div className="space-y-3 pt-2">
                            <div>
                              <Label>Type de charge</Label>
                              <RadioGroup defaultValue="garde-alternee" className="flex flex-wrap gap-4 mt-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="garde-alternee" id="garde-alternee" />
                                  <Label htmlFor="garde-alternee" className="font-normal">
                                    Garde alternée
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="charge-exclusive" id="charge-exclusive" />
                                  <Label htmlFor="charge-exclusive" className="font-normal">
                                    Charge exclusive
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="non-charge" id="non-charge" />
                                  <Label htmlFor="non-charge" className="font-normal">
                                    Non à charge
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Quote-part fiscale</Label>
                                <Input defaultValue="50 %" className="mt-1" />
                              </div>
                              <div>
                                <Label>Depuis</Label>
                                <Input defaultValue="15/06/2025" className="mt-1" />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" onClick={() => setFoyerEditMode(null)}>
                                Enregistrer
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setFoyerEditMode(null)}>
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Type de charge</p>
                                <p className="font-medium">Garde alternée</p>
                              </div>
                              <p>
                                <span className="text-muted-foreground">Quote-part fiscale :</span> 50 %
                              </p>
                              <p>
                                <span className="text-muted-foreground">Depuis :</span> 15/06/2025
                              </p>
                            </div>
                            <p className="text-sm">
                              📎 Justificatif de garde : <span className="text-green-600">✅ Reçu</span>
                            </p>
                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm">
                                <Pencil className="h-3 w-3 mr-1" />
                                Modifier
                              </Button>
                              <Button variant="outline" size="sm">
                                <Paperclip className="h-3 w-3 mr-1" />
                                Voir justificatif
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un enfant
                    </Button>
                  </div>

                  {/* Section Pensions */}
                  <div className="space-y-4 border-t pt-6">
                    <h4 className="font-semibold text-sm">Pensions & obligations financières</h4>
                    
                    {/* Pension versée */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">Pension alimentaire versée</h5>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Nature :</span> Pension alimentaire pour enfant
                        </p>
                        <p>
                          <span className="text-muted-foreground">Bénéficiaire :</span> Léa Khatchatrian
                        </p>
                        <p>
                          <span className="text-muted-foreground">Montant :</span> 300 €
                        </p>
                        <p>
                          <span className="text-muted-foreground">Périodicité :</span> Mensuelle
                        </p>
                        <p>
                          <span className="text-muted-foreground">Début :</span> 01/10/2025
                        </p>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm font-medium">📎 Justificatifs requis</p>
                        <ul className="text-sm list-inside">
                          <li>❌ Décision judiciaire ou convention</li>
                          <li>⚠️ Preuves de paiement (2/3 reçues)</li>
                        </ul>
                      </div>
                      <p className="text-sm text-orange-600 italic">🟠 Déclaration incomplète — pièces manquantes</p>
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Demander les pièces manquantes
                        </Button>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      </div>
                    </div>

                    {/* Pension reçue */}
                    <div>
                      <h5 className="font-medium text-sm">Pension alimentaire reçue</h5>
                      <p className="text-sm text-muted-foreground">📭 Aucune pension reçue déclarée</p>
                    </div>

                    {/* Prestation compensatoire */}
                    <div>
                      <h5 className="font-medium text-sm">Prestation compensatoire</h5>
                      <p className="text-sm text-muted-foreground">📭 Aucune prestation compensatoire déclarée</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* BLOC 4 — Événements familiaux */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    🕒 Événements familiaux — Année 2025
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Événement 1 - Séparation */}
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      <p className="font-semibold">📜 Séparation</p>
                      <p className="text-sm">📅 15/06/2025</p>
                      <p className="text-sm">👥 Personnes concernées : Client + ex-conjoint</p>
                      <div className="pt-2">
                        <p className="text-sm font-medium">Conséquences fiscales</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          <li>Fin de la vie commune</li>
                          <li>Changement de situation familiale</li>
                          <li>Impact sur la charge des enfants</li>
                        </ul>
                      </div>
                      <p className="text-sm">
                        📎 Justificatif : <span className="text-red-600">❌ Manquant</span>
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Paperclip className="h-3 w-3 mr-1" />
                          Ajouter justificatif
                        </Button>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Événement 2 - Pension alimentaire */}
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      <p className="font-semibold">💰 Début de pension alimentaire — enfant</p>
                      <p className="text-sm">📅 01/10/2025</p>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Bénéficiaire :</span> Léa Khatchatrian
                        </p>
                        <p>
                          <span className="text-muted-foreground">Montant :</span> 300 € / mois
                        </p>
                        <p>
                          <span className="text-muted-foreground">Mode de paiement :</span> Virement bancaire
                        </p>
                      </div>
                      <p className="text-sm">
                        📎 Justificatifs : <span className="text-orange-600">⚠️ Partiels</span>
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Paperclip className="h-3 w-3 mr-1" />
                          Compléter les justificatifs
                        </Button>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un événement
                  </Button>
                </CardContent>
              </Card>



              </div>

              {/* Seconde rangée de grille */}
              

              {/* Troisième rangée */}
              
            </div>
          )}

          {activeTab === "partage" && <PartageTabContent clientName={`${client.first_name} ${client.last_name}`} />}

      {revenueTabs.some((tab) => tab.id === activeTab) && (
        <RevenueDetailTab
          revenueId={revenueTabs.find((tab) => tab.id === activeTab)?.revenueId || ""}
          categoryName={revenueTabs.find((tab) => tab.id === activeTab)?.categoryName || ""}
          allRevenues={revenues}
          onSwitchToRevenue={handleSwitchToRevenue}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce fichier de la boîte d'envoi ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDeleteOutboxFile}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Client File Confirmation Modal */}
      <Dialog open={deleteClientFileModalOpen} onOpenChange={setDeleteClientFileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteClientFileModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDeleteClientFile}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Annexe Documents Modal */}
      <Dialog open={annexeModalOpen} onOpenChange={setAnnexeModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <DialogTitle className="flex-shrink-0">{selectedAnnexe?.annexe_name}</DialogTitle>
              {annexeDocuments.length > 0 && (
                <span className="text-sm font-semibold">
                  {Math.round(
                    (annexeDocuments.filter((d) => d.status === "uploaded").length / annexeDocuments.length) * 100,
                  )}
                  %
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Documents nécessaires pour cette annexe</h3>
              {annexeDocuments.filter((d) => !d.status).length > 0 && (
                <Button onClick={addAllMissingDocumentsToOutbox} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter tout ({annexeDocuments.filter((d) => !d.status).length})
                  <Inbox className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Documents list */}
            {loadingAnnexeDocuments ? (
              <p className="text-center text-sm text-muted-foreground py-8">Chargement...</p>
            ) : annexeDocuments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Aucun document requis</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {annexeDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{doc.shortname}</p>
                      {doc.last_requested_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Dernière demande : {new Date(doc.last_requested_at).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === "uploaded" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          <Check className="h-3 w-3" />
                          Reçu
                        </span>
                      ) : doc.status === "en_attente" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                          <Clock className="h-3 w-3" />
                          En attente
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            <X className="h-3 w-3" />
                            Non fourni
                          </span>
                          <Button size="sm" variant="outline" onClick={() => addDocumentToOutbox(doc.id)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter
                            <Inbox className="h-3 w-3 ml-1" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => console.log("Déposer document:", doc.id)}>
                            <Upload className="h-3 w-3 mr-1" />
                            Déposer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnexeModalOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Declaration Modal */}
      <Dialog open={newDeclarationModalOpen} onOpenChange={setNewDeclarationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle déclaration</DialogTitle>
            <DialogDescription>Créer une nouvelle déclaration fiscale</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom de la déclaration</label>
              <Input
                placeholder="Ex: 2042 RICI, Annexe 2044..."
                value={newDeclarationName}
                onChange={(e) => setNewDeclarationName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Document</label>
            </div>

            <Button
              className="w-full bg-transparent"
              variant="outline"
              onClick={() => {
                console.log("[v0] Scan button clicked")
                // TODO: Implement scan logic
              }}
            >
              <Scan className="h-4 w-4 mr-2" />
              Scanner le document
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Pour un scan optimal, assurez-vous d'utiliser une encre noire sur papier blanc
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewDeclarationModalOpen(false)
                setNewDeclarationName("")
                setNewDeclarationFile(null)
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                console.log("[v0] Creating declaration:", {
                  name: newDeclarationName,
                  file: newDeclarationFile?.name,
                })
                // TODO: Implement save logic
                setNewDeclarationModalOpen(false)
                setNewDeclarationName("")
                setNewDeclarationFile(null)
              }}
              disabled={!newDeclarationName}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PartageTabContent({ clientName }: { clientName: string }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [openDropdownId, setOpenDropdownId] = useState<string | null>("2")
  const [currentPage, setCurrentPage] = useState(1)

  const sharedDocuments = [
    {
      id: "1",
      name: "Projet de déclaration fiscale",
      subtext: "Déclaration",
      type: "PDF",
      status: "consulte" as const,
      sharedAt: "24 av. 2024 10:17",
      consultedAt: "24 av. 2024 10:43",
      category: "declaration",
    },
    {
      id: "2",
      name: "Lettre de relance pièces manquantes",
      subtext: "Courrier",
      type: "DOCX",
      status: "partage" as const,
      sharedAt: "23 av. 2024 14:30",
      consultedAt: null,
      category: "courrier",
    },
    {
      id: "3",
      name: "Mandat de représentation fiscale",
      subtext: "Mandat",
      type: "PDF",
      status: "partage" as const,
      sharedAt: "21 av. 2024 17:22",
      consultedAt: null,
      category: "mandat",
    },
    {
      id: "4",
      name: "Relevé bancaire",
      subtext: "Pièce jointe",
      type: "PDF",
      status: "expire" as const,
      sharedAt: "20 mr. 2024 09:15",
      consultedAt: null,
      category: "piece_jointe",
    },
    {
      id: "5",
      name: "Relevé bancaire",
      subtext: "Pièce jointe",
      type: "PDF",
      status: null,
      sharedAt: "20 mr. 2024 09:15",
      consultedAt: "20 mar. 2024 03:15",
      category: "piece_jointe",
    },
  ]

  const categories = [
    { id: "all", label: "Tous", count: 4 },
    { id: "declaration", label: "Déclaration", count: 1 },
    { id: "mandat", label: "Mandat", count: 1 },
    { id: "courrier", label: "Courrier", count: 1 },
    { id: "piece_jointe", label: "Pièce jointe", count: 1 },
    { id: "autre", label: "Autre", count: 1 },
    { id: "expire", label: "Expiré", count: 1 },
  ]

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "consulte":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Consulté</Badge>
      case "partage":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Partagé</Badge>
      case "expire":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Expiré</Badge>
      default:
        return <span className="text-muted-foreground">—</span>
    }
  }

  const getFileIcon = (type: string) => {
    return (
      <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center text-xs font-medium text-red-600">
        {type}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with title and CTAs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partage avocat → client</h1>
          <p className="text-sm text-muted-foreground">Documents envoyés à {clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Importer
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <QrCode className="h-4 w-4" />
            Scanner
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Card with table */}
      <Card>
        <CardContent className="p-6">
          {/* Search and filters row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="consulte">Consulté</SelectItem>
                <SelectItem value="partage">Partagé</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? "default" : "outline"}
                size="sm"
                className={categoryFilter === cat.id ? "" : "bg-transparent"}
                onClick={() => setCategoryFilter(cat.id)}
              >
                {cat.label} ({cat.count})
              </Button>
            ))}
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <div className="flex items-center gap-1">
                    Nom du document
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Type
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Statut
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Partagé le
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Consulté le
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharedDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.type)}
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.subtext}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-sm">{doc.sharedAt}</TableCell>
                  <TableCell className="text-sm">{doc.consultedAt || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Eye className="h-3 w-3" />
                        Voir
                      </Button>
                      <DropdownMenu
                        open={openDropdownId === doc.id}
                        onOpenChange={(open) => setOpenDropdownId(open ? doc.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link2 className="h-4 w-4 mr-2" />
                            Copier le lien
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Relancer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Remplacer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Retirer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-1 mt-4">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[1, 2, 3, 4].map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 ${currentPage === page ? "" : "bg-transparent"}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
