"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Mail, PenSquare, CheckCircle, Plus, ChevronDown, FileText } from "lucide-react"
import { createFileRequest } from "@/app/actions/azure-upload"
import { createClient } from "@/lib/supabase/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SendEmailDialogProps {
  clientEmail: string
  clientId: string
  documents: Array<{
    file_name: string
    document_id?: number | null
  }>
  onSendSuccess?: () => void
}

interface AvailableDocument {
  id: number
  shortname: string
  description: string | null
}

export function SendEmailDialog({
  clientEmail,
  clientId,
  documents: initialDocuments,
  onSendSuccess,
}: SendEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("Documents à fournir")
  const [cc, setCc] = useState("")
  const [emailText, setEmailText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const sendEmailRef = useRef(() => {})
  const [documents, setDocuments] = useState(initialDocuments)
  const [availableDocuments, setAvailableDocuments] = useState<AvailableDocument[]>([])

  useEffect(() => {
    async function loadAvailableDocuments() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documents_necessaires")
        .select("id, shortname, description")
        .order("shortname")

      if (!error && data) {
        setAvailableDocuments(data)
      }
    }

    if (open) {
      loadAvailableDocuments()
    }
  }, [open])

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const addDocument = (doc: AvailableDocument) => {
    if (documents.some((d) => d.document_id === doc.id)) {
      return
    }

    const newDoc = {
      file_name: doc.shortname,
      document_id: doc.id,
    }

    setDocuments((prev) => [...prev, newDoc])
  }

  const handleSend = async () => {
    setIsSending(true)
    try {
      console.log("[v0] Generating upload links for documents:", documents)

      const uploadLinksPromises = documents.map(async (doc) => {
        const fileRequest = await createFileRequest(clientId, doc.file_name, doc.document_id || undefined)

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        const uploadPageUrl = `${baseUrl}/upload/${fileRequest.id}`

        return {
          filename: doc.file_name,
          uploadLink: uploadPageUrl,
        }
      })

      const uploadLinks = await Promise.all(uploadLinksPromises)
      console.log("[v0] Generated upload page links:", uploadLinks)

      const documentsList = uploadLinks
        .map((link) => `• ${link.filename}\n  Lien d'upload: ${link.uploadLink}`)
        .join("\n\n")

      const emailBodyWithLinks = `Bonjour,

Veuillez télécharger les documents suivants en utilisant les liens ci-dessous :

${documentsList}

Cordialement.`

      const formattedBody = emailBodyWithLinks.replace(/\n/g, "<br>")

      const toEmails = cc ? `${clientEmail}, ${cc}` : clientEmail

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toEmails,
          subject: subject,
          body: formattedBody,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await moveOutboxToClientFiles(clientId)

        setOpen(false)
        setShowSuccessModal(true)
        onSendSuccess?.()
      } else {
        console.error("[v0] Email send error:", result)
        alert(`Erreur lors de l'envoi de l'email: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("[v0] Error sending email:", error)
      alert("Erreur lors de l'envoi de l'email")
    } finally {
      setIsSending(false)
    }
  }

  async function moveOutboxToClientFiles(clientId: string) {
    const supabase = createClient()

    const { data: outboxFiles, error: fetchError } = await supabase
      .from("boite_envoi_files")
      .select("*")
      .eq("client_id", clientId)

    if (fetchError || !outboxFiles || outboxFiles.length === 0) {
      console.log("[v0] No files in outbox to move")
      return
    }

    const historyEntries = outboxFiles
      .filter((file) => file.document_id)
      .map((file) => ({
        client_id: clientId,
        document_id: file.document_id,
        sent_at: new Date().toISOString(),
      }))

    if (historyEntries.length > 0) {
      const { error: historyError } = await supabase.from("sent_history").insert(historyEntries)
      if (historyError) {
        console.error("[v0] Error saving to sent_history:", historyError)
      } else {
        console.log("[v0] Saved", historyEntries.length, "entries to sent_history")
      }
    }

    const filesToInsert = outboxFiles.map((file) => ({
      client_id: clientId,
      file_name: file.file_name,
      status: "requested",
    }))

    const { error: insertError } = await supabase.from("client_files").insert(filesToInsert)

    if (insertError) {
      console.error("[v0] Error moving files to client_files:", insertError)
      return
    }

    const { error: deleteError } = await supabase.from("boite_envoi_files").delete().eq("client_id", clientId)

    if (deleteError) {
      console.error("[v0] Error clearing outbox:", deleteError)
    } else {
      console.log("[v0] Outbox cleared and files moved to client_files")
    }
  }

  useEffect(() => {
    sendEmailRef.current = handleSend
  }, [documents, clientEmail, onSendSuccess])

  useEffect(() => {
    if (open) {
      const documentsList = documents
        .map((doc) => `• ${doc.file_name}\n  Lien d'upload: [Sera généré lors de l'envoi]`)
        .join("\n\n")
      setEmailText(
        `Bonjour,

Veuillez télécharger les documents suivants en utilisant les liens ci-dessous :

${documentsList}

Cordialement.`,
      )
    }
  }, [open, documents])

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-transparent">
            <Mail className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Composer l'email</DialogTitle>
            <DialogDescription>À: {clientEmail}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet de l'email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cc:</label>
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Copie à (email optionnel)"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Ajouter un document
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto w-[400px]">
                  {availableDocuments.length === 0 ? (
                    <DropdownMenuItem disabled>Chargement...</DropdownMenuItem>
                  ) : (
                    availableDocuments.map((doc) => {
                      const isAlreadyAdded = documents.some((d) => d.document_id === doc.id)
                      return (
                        <DropdownMenuItem
                          key={doc.id}
                          onClick={() => addDocument(doc)}
                          disabled={isAlreadyAdded}
                          className={isAlreadyAdded ? "opacity-50" : ""}
                        >
                          <span className="truncate">{doc.shortname}</span>
                          {isAlreadyAdded && <span className="ml-2 text-xs text-muted-foreground">(ajouté)</span>}
                        </DropdownMenuItem>
                      )
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-1 flex-1">
                <Input
                  id="free-document-input"
                  placeholder="Document libre..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.currentTarget
                      const value = input.value.trim()
                      if (value) {
                        setDocuments((prev) => [...prev, { file_name: value, document_id: null }])
                        input.value = ""
                      }
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 bg-transparent"
                  onClick={() => {
                    const input = document.getElementById("free-document-input") as HTMLInputElement
                    const value = input?.value.trim()
                    if (value) {
                      setDocuments((prev) => [...prev, { file_name: value, document_id: null }])
                      input.value = ""
                    }
                  }}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">{documents.length} document(s) à envoyer</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSend} disabled={isSending} className="bg-blue-600 hover:bg-blue-700">
                {isSending ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">Email envoyé avec succès!</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              L'email a été envoyé à {clientEmail}
              {cc && ` et ${cc}`}
            </DialogDescription>
            <Button onClick={() => setShowSuccessModal(false)} className="mt-6 bg-green-600 hover:bg-green-700">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <button id="send-email-trigger" onClick={sendEmailRef.current} style={{ display: "none" }} aria-hidden="true" />
    </>
  )
}
