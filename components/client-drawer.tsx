"use client"

import { useEffect, useState } from "react"
import { FileText, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Client } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface ClientDrawerProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Document {
  id: string
  name: string
  created_at: string
}

function getStatusBadgeConfig(status: string) {
  switch (status) {
    case "onboarding":
      return { label: "Onboarding", className: "bg-blue-50 text-blue-700 border-blue-200" }
    case "complete":
      return { label: "Complet", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    case "incomplete":
      return { label: "Incomplet", className: "bg-amber-50 text-amber-700 border-amber-200" }
    case "action":
      return { label: "Action requise", className: "bg-orange-50 text-orange-700 border-orange-200" }
    default:
      return { label: "Actif", className: "bg-slate-50 text-slate-700 border-slate-200" }
  }
}

function computeStatus(client: Client): string {
  if (client.onboarding_form_completed === false) {
    return "onboarding"
  }
  return "complete"
}

export function ClientDrawer({ client, open, onOpenChange }: ClientDrawerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  async function loadRecentDocuments() {
    if (!client) return
    
    setLoading(true)
    const supabase = createClient()
    
    const { data } = await supabase
      .from("client_documents")
      .select("id, name, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(3)
    
    setDocuments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (open && client) {
      loadRecentDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client])

  if (!client) return null

  const status = computeStatus(client)
  const statusConfig = getStatusBadgeConfig(status)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-xl">
            {client.first_name} {client.last_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Statut du dossier</h3>
            <Badge variant="outline" className={`${statusConfig.className} font-medium`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Recent Documents */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">3 derniers fichiers</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun fichier disponible</p>
            )}
          </div>

          {/* Client Info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Informations</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{client.email}</p>
              </div>
              {client.phone && (
                <div>
                  <span className="text-muted-foreground">Téléphone:</span>
                  <p className="font-medium">{client.phone}</p>
                </div>
              )}
              {client.address && (
                <div>
                  <span className="text-muted-foreground">Adresse:</span>
                  <p className="font-medium">{client.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
