"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertCircle, ArrowRight, Info, Mail, Upload, Check } from "lucide-react"

interface ClientRevenue {
  id: string
  category_id: number
  sub_category_ids: number[]
  document_ids: number[]
  created_at: string
}

interface DocumentNecessaire {
  id: number
  sub_category_id: number
  description: string
  shortname: string
}

interface ActionItem {
  id: string
  type: "missing" | "correction" | "validation"
  title: string
  badge: {
    label: string
    variant: "red" | "amber" | "blue" | "green"
    icon: typeof AlertCircle
  }
  description: string
  documents?: DocumentNecessaire[]
  categoryName?: string
}

interface ClientRevenuesTablePremiumProps {
  clientId: string
}

export function ClientRevenuesTablePremium({ clientId }: ClientRevenuesTablePremiumProps) {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [outboxDocuments, setOutboxDocuments] = useState<Set<number>>(new Set())
  const [totalActions, setTotalActions] = useState(0)
  const [resolvedActions, setResolvedActions] = useState(0)

  useEffect(() => {
    loadActions()
    loadOutboxDocuments()
  }, [clientId])

  async function loadOutboxDocuments() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("boite_envoi_files")
      .select("document_id")
      .eq("client_id", clientId)
      .not("document_id", "is", null)

    if (error) {
      console.error("[v0] Error loading outbox documents:", error)
      return
    }

    const docIds = new Set(data?.map((d) => d.document_id).filter(Boolean) as number[])
    setOutboxDocuments(docIds)
  }

  async function loadActions() {
    const supabase = createBrowserClient()

    // Load revenues for this client
    const { data: revenuesData, error } = await supabase
      .from("client_revenues")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading revenues:", error)
      setLoading(false)
      return
    }

    if (!revenuesData || revenuesData.length === 0) {
      setLoading(false)
      return
    }

    // Load category and subcategory names and documents
    const categoryIds = [...new Set(revenuesData.map((r) => r.category_id))]
    const allSubCategoryIds = [...new Set(revenuesData.flatMap((r) => r.sub_category_ids))]

    const [{ data: categories }, { data: subCategories }, { data: docsData }] = await Promise.all([
      supabase.from("categories_revenus").select("id, nom").in("id", categoryIds),
      supabase.from("categories_revenus_sub").select("id, nom").in("id", allSubCategoryIds),
      supabase.from("documents_necessaires").select("*").in("sub_category_id", allSubCategoryIds),
    ])

    const catMap = new Map()
    categories?.forEach((cat) => catMap.set(cat.id, cat.nom))

    const subCatMap = new Map()
    subCategories?.forEach((sub) => subCatMap.set(sub.id, sub.nom))

    // Group documents by revenue
    const actionsList: ActionItem[] = []
    let totalActionsCount = 0
    let resolvedActionsCount = 0

    for (const revenue of revenuesData) {
      const categoryName = catMap.get(revenue.category_id) || `Catégorie ${revenue.category_id}`
      const subCategoryLabels = revenue.sub_category_ids.map((id: number) => subCatMap.get(id)).filter(Boolean)

      // Get documents for this revenue's subcategories
      const relevantDocs = docsData?.filter((doc) => revenue.sub_category_ids.includes(doc.sub_category_id)) || []

      // Find documents not in outbox (missing)
      const { data: outboxFiles } = await supabase
        .from("boite_envoi_files")
        .select("document_id")
        .eq("client_id", clientId)
        .in(
          "document_id",
          relevantDocs.map((d) => d.id),
        )

      const outboxDocIds = new Set(outboxFiles?.map((f) => f.document_id) || [])
      const missingDocs = relevantDocs.filter((doc) => !outboxDocIds.has(doc.id))

      totalActionsCount += relevantDocs.length

      if (missingDocs.length > 0) {
        actionsList.push({
          id: `missing-${revenue.id}`,
          type: "missing",
          title: "Documents manquants",
          badge: {
            label: `${missingDocs.length} Manquant${missingDocs.length > 1 ? "s" : ""}`,
            variant: "red",
            icon: AlertCircle,
          },
          description: `${categoryName}${subCategoryLabels.length > 0 ? " • " + subCategoryLabels.join(", ") : ""}`,
          documents: missingDocs,
          categoryName,
        })
      } else {
        resolvedActionsCount += relevantDocs.length
      }
    }

    setActions(actionsList)
    setTotalActions(totalActionsCount)
    setResolvedActions(resolvedActionsCount)
    setLoading(false)
  }

  async function addToOutbox(docId: number, docName: string) {
    if (outboxDocuments.has(docId)) {
      return
    }

    const supabase = createBrowserClient()
    const { error } = await supabase.from("boite_envoi_files").insert({
      client_id: clientId,
      file_name: docName,
      document_id: docId,
      status: "en_attente",
    })

    if (error) {
      console.error("[v0] Error adding to outbox:", error)
      return
    }

    setOutboxDocuments((prev) => new Set(prev).add(docId))
    // Reload actions to update the UI
    loadActions()
  }

  if (loading) {
    return (
      <Card className="border shadow-sm rounded-2xl">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Chargement...</CardContent>
      </Card>
    )
  }

  if (actions.length === 0) {
    return (
      <Card className="border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-br from-green-50 to-white pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Actions prioritaires</CardTitle>
              <CardDescription className="mt-1">Tout est à jour !</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
              <Check className="h-3 w-3 mr-1" />
              Complet
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">Aucune action requise</p>
            <p className="text-sm mt-1">Tous les documents nécessaires sont disponibles</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = totalActions > 0 ? Math.round((resolvedActions / totalActions) * 100) : 0

  return (
    null
  )
}
