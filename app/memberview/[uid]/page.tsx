"use client"

import { useState, useRef } from "react"
import { FileText, Upload, Shield, Clock, ChevronDown, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

// Types
interface Document {
  id: string
  name: string
  description: string
  fileName?: string
  status: "validated" | "in_review" | "refused" | "needed"
  statusLabel: string
  refusedReason?: string
}

interface SharedFile {
  id: string
  name: string
  date: string
}

// Mock data
const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Pièce d'identité",
    description: "CNI ou Passeport.",
    fileName: "cni_jean.pdf",
    status: "validated",
    statusLabel: "Validé",
  },
  {
    id: "2",
    name: "Revenus 2024",
    description: "Bulletins de salaire.",
    fileName: "revenus_v2.zip",
    status: "in_review",
    statusLabel: "V2 en revue",
  },
  {
    id: "3",
    name: "Relevés bancaires",
    description: "Comptes courants.",
    fileName: "releves_flous.pdf",
    status: "refused",
    statusLabel: "Refusé",
    refusedReason: "Illisible.",
  },
  {
    id: "4",
    name: "Taxe foncière",
    description: "Avis d'imposition.",
    status: "needed",
    statusLabel: "À fournir",
  },
]

const mockSharedFiles: SharedFile[] = [
  { id: "1", name: "Lettre de mission.pdf", date: "15 jan. 2024" },
  { id: "2", name: "Synthèse fiscale 2023.pdf", date: "20 jan. 2024" },
  { id: "3", name: "Convention d'honoraires.pdf", date: "10 jan. 2024" },
]

const mockHistory = [
  { date: "15 jan. 2024, 14:32", action: "Document validé", document: "Pièce d'identité" },
  { date: "14 jan. 2024, 09:15", action: "Document déposé", document: "Revenus 2024 (v2)" },
  { date: "13 jan. 2024, 16:45", action: "Document refusé", document: "Relevés bancaires" },
  { date: "12 jan. 2024, 11:20", action: "Document déposé", document: "Pièce d'identité" },
]

export default function MemberViewPage({ params }: { params: { uid: string } }) {
  const [activeTab, setActiveTab] = useState<"requests" | "shared">("requests")
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      toast({
        title: "Upload réussi",
        description: `Fichier "${e.target.files[0].name}" téléversé avec succès.`,
      })
      e.target.value = ""
    }
  }

  const handleSubmitDocuments = () => {
    toast({
      title: "Documents soumis",
      description: "Vos documents ont été envoyés à votre avocat.",
    })
  }

  const getStatusBadge = (status: Document["status"], label: string) => {
    const styles = {
      validated: "bg-emerald-100 text-emerald-700",
      in_review: "bg-blue-100 text-blue-700",
      refused: "bg-red-100 text-red-700",
      needed: "bg-zinc-100 text-zinc-600",
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
        {label}
      </span>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fafafa", fontFamily: "Inter, sans-serif" }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpeg,.jpg,.png,.zip"
      />

      {/* Header */}
      <header 
        className="sticky top-0 z-50 bg-white border-b"
        style={{ height: "80px", borderColor: "#e4e4e7" }}
      >
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left side */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-widest mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              <span>Fiscalia</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-950">Jean Dupont</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-zinc-900">Cabinet Delmas</div>
              <div className="text-xs text-zinc-500 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                Activité : il y a 2h
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
              <Shield className="w-4 h-4" />
              Sécurisé
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside 
          className="sticky top-[80px] h-[calc(100vh-80px)] bg-white border-r p-4"
          style={{ width: "240px", borderColor: "#e4e4e7" }}
        >
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("requests")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "requests"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              Demandes en cours
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "shared"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Upload className="w-4 h-4" />
              Fichiers partagés
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === "requests" && (
            <div 
              className="bg-white rounded-xl shadow-sm"
              style={{ borderColor: "#e4e4e7", border: "1px solid #e4e4e7" }}
            >
              {/* Card Header */}
              <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "#e4e4e7" }}>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950">Demandes en cours</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">Liste des justificatifs requis par votre avocat.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  className="text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                >
                  Historique
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#e4e4e7" }}>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#e4e4e7" }}>
                    {mockDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <FileText className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                              <div className="font-medium text-zinc-900">{doc.name}</div>
                              <div className="text-sm text-zinc-500">{doc.description}</div>
                              {doc.fileName && (
                                <div className="text-sm text-zinc-400">Reçu : {doc.fileName}</div>
                              )}
                              {doc.refusedReason && (
                                <div className="text-sm text-red-500">{doc.refusedReason}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(doc.status, doc.statusLabel)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {doc.status === "validated" || doc.status === "in_review" ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleUpload}
                              className="text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                            >
                              Remplacer
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={handleUpload}
                              className="bg-zinc-900 hover:bg-zinc-800 text-white"
                            >
                              Déposer
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 border-t" style={{ borderColor: "#e4e4e7" }}>
                <p className="text-sm text-zinc-500 mb-4">
                  Formats acceptés : PDF, JPEG, PNG, ZIP. Max 25Mo.
                </p>
                <Button 
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-11"
                  onClick={handleSubmitDocuments}
                >
                  Soumettre les documents
                </Button>
              </div>
            </div>
          )}

          {activeTab === "shared" && (
            <div 
              className="bg-white rounded-xl shadow-sm"
              style={{ borderColor: "#e4e4e7", border: "1px solid #e4e4e7" }}
            >
              {/* Card Header */}
              <div className="px-6 py-5 border-b" style={{ borderColor: "#e4e4e7" }}>
                <h2 className="text-lg font-semibold text-zinc-950">Fichiers partagés</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Documents envoyés par votre avocat.</p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#e4e4e7" }}>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#e4e4e7" }}>
                    {mockSharedFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-zinc-400" />
                            <span className="font-medium text-zinc-900">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {file.date}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                          >
                            <Download className="w-4 h-4 mr-1.5" />
                            Télécharger
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Historique des actions</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500 uppercase">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500 uppercase">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mockHistory.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm text-zinc-500">{item.date}</td>
                    <td className="px-4 py-3 text-sm text-zinc-900">{item.action}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{item.document}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
