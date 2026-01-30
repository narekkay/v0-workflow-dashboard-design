"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { FileText, Upload, Download, History, Lock, File, FileSpreadsheet, FileImage, FileArchive, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface DocumentRequest {
  id: string
  name: string
  description: string
  status: "needed" | "review" | "validated" | "refused"
  active_file?: { filename: string; date: Date }
  refusal_reason?: string
}

interface SharedFile {
  id: string
  name: string
  filename: string
  date: Date
  size: string
}

interface HistoryEntry {
  id: string
  filename: string
  associated_doc: string
  date: Date
  status: "review" | "validated" | "refused"
}

// Helper functions
function fileKindFromName(filename: string) {
  const n = String(filename || "").toLowerCase().trim()
  if (n.endsWith(".pdf")) return "PDF"
  if (n.endsWith(".doc") || n.endsWith(".docx")) return "WORD"
  if (n.endsWith(".xls") || n.endsWith(".xlsx")) return "EXCEL"
  if (n.endsWith(".ppt") || n.endsWith(".pptx")) return "PPT"
  if (n.endsWith(".zip") || n.endsWith(".rar") || n.endsWith(".7z")) return "ZIP"
  if (n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png")) return "IMAGE"
  return "FILE"
}

function FileIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "PDF":
      return <FileText className="h-5 w-5" />
    case "EXCEL":
      return <FileSpreadsheet className="h-5 w-5" />
    case "IMAGE":
      return <FileImage className="h-5 w-5" />
    case "ZIP":
      return <FileArchive className="h-5 w-5" />
    default:
      return <File className="h-5 w-5" />
  }
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(12, 0, 0, 0)
  return d
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    needed: { label: "À fournir", className: "bg-muted text-muted-foreground border-border" },
    review: { label: "En revue", className: "bg-blue-50 text-blue-700 border-blue-200" },
    validated: { label: "Validé", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    refused: { label: "Refusé", className: "bg-red-50 text-red-700 border-red-200" },
  }
  const c = config[status] || config.needed
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>
}

// File item component
function FileItem({ filename, label }: { filename?: string; label: string }) {
  const kind = filename ? fileKindFromName(filename) : "FILE"
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
        <FileIcon kind={kind} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-sm truncate max-w-[300px]">{label}</span>
        {filename && <span className="text-xs text-muted-foreground">{kind}</span>}
      </div>
    </div>
  )
}

export default function MemberViewPage() {
  const params = useParams()
  const uuid = params.uuid as string
  const { toast } = useToast()
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"requests" | "shared">("requests")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historySearch, setHistorySearch] = useState("")
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all")
  const [historySort, setHistorySort] = useState<"desc" | "asc">("desc")

  // Mock data - in production, this would come from the database
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([
    { id: "doc_id", name: "Pièce d'identité", description: "CNI ou Passeport", status: "validated", active_file: { filename: "cni_jean.pdf", date: daysAgo(12) } },
    { id: "doc_income", name: "Revenus 2024", description: "Bulletins de salaire", status: "review", active_file: { filename: "revenus_v2.zip", date: daysAgo(1) } },
    { id: "doc_bank", name: "Relevés bancaires", description: "Comptes courants", status: "refused", active_file: { filename: "releves_flous.pdf", date: daysAgo(3) }, refusal_reason: "Document illisible" },
    { id: "doc_rent", name: "Taxe foncière", description: "Avis d'imposition", status: "needed" },
  ])

  const [sharedFiles] = useState<SharedFile[]>([
    { id: "s1", name: "Lettre de mission", filename: "lettre_mission.pdf", date: daysAgo(9), size: "240 KB" },
    { id: "s2", name: "Synthèse fiscale", filename: "synthese.docx", date: daysAgo(7), size: "180 KB" },
  ])

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([
    { id: "h1", filename: "cni_jean.pdf", associated_doc: "Pièce d'identité", date: daysAgo(12), status: "validated" },
    { id: "h2", filename: "revenus_v1.pdf", associated_doc: "Revenus 2024", date: daysAgo(6), status: "review" },
    { id: "h3", filename: "revenus_v2.zip", associated_doc: "Revenus 2024", date: daysAgo(1), status: "review" },
    { id: "h4", filename: "releves_flous.pdf", associated_doc: "Relevés bancaires", date: daysAgo(3), status: "refused" },
  ])

  useEffect(() => {
    async function loadClient() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, email")
        .eq("id", uuid)
        .maybeSingle()

      if (error) {
        console.error("[v0] Error loading client:", error)
      } else if (data) {
        setClient(data)
      }
      setLoading(false)
    }
    loadClient()
  }, [uuid])

  const handleFileUpload = (docId: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setDocumentRequests(prev => prev.map(doc => {
        if (doc.id === docId) {
          const wasNeeded = doc.status === "needed" || doc.status === "refused"
          return {
            ...doc,
            status: wasNeeded ? "review" : "review",
            active_file: { filename: file.name, date: new Date() },
            refusal_reason: undefined,
          }
        }
        return doc
      }))

      const docName = documentRequests.find(d => d.id === docId)?.name || "Document"
      setHistoryEntries(prev => [...prev, {
        id: `h${Date.now()}`,
        filename: file.name,
        associated_doc: docName,
        date: new Date(),
        status: "review",
      }])

      toast({
        title: "Upload réussi",
        description: `${file.name} a été téléversé avec succès.`,
      })
    }
    input.click()
  }

  const handleDownload = (filename: string) => {
    toast({
      title: "Téléchargement",
      description: `Téléchargement de ${filename} en cours...`,
    })
  }

  const handleSubmitAll = () => {
    toast({
      title: "Documents transmis",
      description: "Vos documents ont été envoyés à votre avocat.",
    })
  }

  // Filter and sort history
  const filteredHistory = historyEntries
    .filter(h => {
      if (historySearch && !(`${h.filename} ${h.associated_doc}`.toLowerCase().includes(historySearch.toLowerCase()))) return false
      if (historyStatusFilter !== "all" && h.status !== historyStatusFilter) return false
      return true
    })
    .sort((a, b) => historySort === "desc" ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime())

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  const clientName = client ? `${client.first_name} ${client.last_name}` : "Client"

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Header */}
      <header className="h-20 border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/?client=${params.uuid}&tab=overview`}>
              <Button variant="outline" size="lg" className="gap-2 h-11 px-5">
                <ArrowLeft className="h-5 w-5" />
                Retour
              </Button>
            </Link>
            <div className="flex flex-col justify-center">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
                Fiscalia
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{clientName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="font-medium">Cabinet Delmas</div>
              <div className="text-xs text-muted-foreground">Activité : il y a 2h</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Lock className="h-3 w-3" />
              Sécurisé
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <div className="flex gap-8 items-start">
          {/* Sidebar navigation */}
          <nav className="w-60 shrink-0 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("requests")}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "requests"
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Upload className="h-4 w-4" />
              Demandes en cours
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "shared"
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Download className="h-4 w-4" />
              Fichiers partagés
            </button>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {activeTab === "requests" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Demandes en cours</CardTitle>
                    <CardDescription>Liste des justificatifs requis par votre avocat.</CardDescription>
                  </div>
                  <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-2" />
                        Historique
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Historique des dépôts</DialogTitle>
                        <DialogDescription>Tous vos documents envoyés</DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-3 py-4 border-b">
                        <Input
                          placeholder="Rechercher..."
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Tous statuts" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous statuts</SelectItem>
                            <SelectItem value="review">En revue</SelectItem>
                            <SelectItem value="validated">Validé</SelectItem>
                            <SelectItem value="refused">Refusé</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={historySort} onValueChange={(v) => setHistorySort(v as "desc" | "asc")}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Récent</SelectItem>
                            <SelectItem value="asc">Ancien</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-h-[400px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fichier</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredHistory.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                  Aucun résultat.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredHistory.map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell>
                                    <FileItem filename={entry.filename} label={entry.filename} />
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {fileKindFromName(entry.filename)}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {formatDate(entry.date)}
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge status={entry.status} />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      <DialogFooter className="border-t pt-4">
                        <span className="text-sm text-muted-foreground mr-auto">
                          Total : {filteredHistory.length} documents
                        </span>
                        <Button onClick={() => setHistoryOpen(false)}>Fermer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="w-1/2 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-6">Document</TableHead>
                        <TableHead className="w-1/4 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-6">Statut</TableHead>
                        <TableHead className="w-1/4 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-6 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentRequests.map((doc) => {
                        const canUpload = doc.status === "needed" || doc.status === "refused"
                        return (
                          <TableRow key={doc.id} className="border-b last:border-0">
                            <TableCell className="py-5 px-6">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                                  <FileIcon kind={doc.active_file ? fileKindFromName(doc.active_file.filename) : "FILE"} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-sm">{doc.name}</span>
                                  <span className="text-xs text-muted-foreground mt-0.5">{doc.description}</span>
                                  {doc.active_file && (
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                      Reçu : {doc.active_file.filename}
                                    </span>
                                  )}
                                  {doc.refusal_reason && (
                                    <span className="text-xs text-red-600 mt-0.5">{doc.refusal_reason}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-5 px-6">
                              <StatusBadge status={doc.status} />
                            </TableCell>
                            <TableCell className="py-5 px-6 text-right">
                              <Button
                                variant={canUpload ? "default" : "outline"}
                                size="sm"
                              onClick={() => handleFileUpload(doc.id)}
                              >
                                {canUpload ? "Déposer" : "Remplacer"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="px-6 py-5 border-t bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-4">
                    Formats acceptés : PDF, JPEG, PNG, ZIP. Max 25Mo.
                  </p>
                  <Button className="w-full h-11" onClick={handleSubmitAll}>
                    Soumettre les documents
                  </Button>
                </div>
              </Card>
            )}

            {activeTab === "shared" && (
              <Card>
                <CardHeader>
                  <CardTitle>Fichiers partagés</CardTitle>
                  <CardDescription>Documents mis à disposition par le cabinet.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="w-1/2 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-6">Document</TableHead>
                        <TableHead className="w-1/4 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-6">Date</TableHead>
                        <TableHead className="w-1/4 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-6 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sharedFiles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Aucun document partagé.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sharedFiles.map((file) => (
                          <TableRow key={file.id} className="border-b last:border-0">
                            <TableCell className="py-5 px-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
                                  <FileIcon kind={fileKindFromName(file.filename)} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-sm">{file.filename}</span>
                                  <span className="text-xs text-muted-foreground">{fileKindFromName(file.filename)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-5 px-6 whitespace-nowrap text-sm">
                              {formatDate(file.date)}
                            </TableCell>
                            <TableCell className="py-5 px-6 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(file.filename)}
                              >
                                Télécharger
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t flex justify-between text-sm text-muted-foreground">
          <div>&copy; 2026 Fiscalia. Tous droits réservés.</div>
          <div className="flex gap-4">
            <a href="#" className="underline underline-offset-4 hover:text-foreground">Support technique</a>
            <a href="#" className="underline underline-offset-4 hover:text-foreground">Mentions légales</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
