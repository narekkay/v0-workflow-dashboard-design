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
        style={{ height: "80px", borderColor: "#e5e5e5" }}
      >
        <div className="h-full px-20 flex items-center justify-between max-w-[1280px] mx-auto">
          {/* Left side */}
          <div className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase tracking-[0.1em] font-medium">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              <span>FISCALIA</span>
            </div>
            <h1 className="text-[28px] font-bold text-black leading-none">Jean Dupont</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[15px] font-semibold text-black">Cabinet Delmas</div>
              <div className="text-[13px] text-zinc-500 mt-0.5">
                Activité : il y a 2h
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[13px] font-semibold text-emerald-700">Sécurisé</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex max-w-[1280px] mx-auto px-20">
        {/* Sidebar */}
        <aside 
          className="sticky top-[80px] h-[calc(100vh-80px)] bg-transparent pt-12 pr-8"
          style={{ width: "240px" }}
        >
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("requests")}
              className={`w-full flex items-center gap-3 px-0 py-2 text-[15px] transition-colors ${
                activeTab === "requests"
                  ? "text-black font-medium"
                  : "text-zinc-500 hover:text-black"
              }`}
            >
              <FileText className="w-[18px] h-[18px]" />
              <span>Demandes en cours</span>
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`w-full flex items-center gap-3 px-0 py-2 text-[15px] transition-colors ${
                activeTab === "shared"
                  ? "text-black font-medium"
                  : "text-zinc-500 hover:text-black"
              }`}
            >
              <Upload className="w-[18px] h-[18px]" />
              <span>Fichiers partagés</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-12 pr-8">
          {activeTab === "requests" && (
            <div 
              className="bg-white rounded-lg border"
              style={{ borderColor: "#e5e5e5" }}
            >
              {/* Card Header */}
              <div className="px-8 py-6 border-b flex items-start justify-between" style={{ borderColor: "#e5e5e5" }}>
                <div>
                  <h2 className="text-[22px] font-bold text-black mb-1">Demandes en cours</h2>
                  <p className="text-[14px] text-zinc-500">Liste des justificatifs requis par votre avocat.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  className="text-[13px] font-medium text-black border-zinc-300 hover:bg-zinc-50 px-4 h-9"
                >
                  Historique
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-zinc-50/50" style={{ borderColor: "#e5e5e5" }}>
                      <th className="px-8 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-[0.08em]">
                        DOCUMENT
                      </th>
                      <th className="px-8 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-[0.08em]">
                        STATUT
                      </th>
                      <th className="px-8 py-4 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-[0.08em]">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#e5e5e5" }}>
                    {mockDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <FileText className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-[15px] text-black mb-0.5">{doc.name}</div>
                              <div className="text-[13px] text-zinc-500">{doc.description}</div>
                              {doc.fileName && (
                                <div className="text-[13px] text-zinc-400 mt-0.5">Reçu : {doc.fileName}</div>
                              )}
                              {doc.refusedReason && (
                                <div className="text-[13px] text-red-500 mt-0.5">{doc.refusedReason}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          {getStatusBadge(doc.status, doc.statusLabel)}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {doc.status === "validated" || doc.status === "in_review" ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleUpload}
                              className="text-[13px] font-medium text-black border-zinc-300 hover:bg-zinc-50 px-5 h-9"
                            >
                              Remplacer
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={handleUpload}
                              className="bg-black hover:bg-zinc-800 text-white text-[13px] font-medium px-5 h-9"
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
              <div className="px-8 py-6 border-t" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-[13px] text-zinc-500 mb-4">
                  Formats acceptés : PDF, JPEG, PNG, ZIP. Max 25Mo.
                </p>
                <Button 
                  className="w-full bg-black hover:bg-zinc-800 text-white h-12 text-[15px] font-semibold"
                  onClick={handleSubmitDocuments}
                >
                  Soumettre les documents
                </Button>
              </div>
            </div>
          )}

          {activeTab === "shared" && (
            <div 
              className="bg-white rounded-lg border"
              style={{ borderColor: "#e5e5e5" }}
            >
              {/* Card Header */}
              <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e5e5" }}>
                <h2 className="text-[22px] font-bold text-black mb-1">Fichiers partagés</h2>
                <p className="text-[14px] text-zinc-500">Documents mis à disposition par le cabinet.</p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-zinc-50/50" style={{ borderColor: "#e5e5e5" }}>
                      <th className="px-8 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-[0.08em]">
                        DOCUMENT
                      </th>
                      <th className="px-8 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-[0.08em]">
                        DATE
                      </th>
                      <th className="px-8 py-4 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-[0.08em]">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#e5e5e5" }}>
                    {mockSharedFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-zinc-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-zinc-400" />
                            <span className="font-semibold text-[15px] text-black">{file.name}</span>
                            <span className="text-[12px] text-zinc-400 uppercase">PDF</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-[14px] text-zinc-500">
                          {file.date}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-[13px] font-medium text-black border-zinc-300 hover:bg-zinc-50 px-5 h-9"
                          >
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

      {/* Footer */}
      <footer className="border-t py-6 mt-12" style={{ borderColor: "#e5e5e5" }}>
        <div className="max-w-[1280px] mx-auto px-20 flex items-center justify-between">
          <p className="text-[13px] text-zinc-500">
            © 2026 Fiscalia. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-[13px] text-black underline hover:no-underline">
              Support technique
            </a>
            <span className="text-zinc-300">—</span>
            <a href="#" className="text-[13px] text-black underline hover:no-underline">
              Mentions légales
            </a>
          </div>
        </div>
      </footer>

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
