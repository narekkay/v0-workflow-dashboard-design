"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Check } from "lucide-react"

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

interface ClientRevenuesTableProps {
  clientId: string
}

export function ClientRevenuesTable({ clientId }: ClientRevenuesTableProps) {
  const [revenues, setRevenues] = useState<ClientRevenue[]>([])
  const [categoryNames, setCategoryNames] = useState<Map<number, string>>(new Map())
  const [subCategoryNames, setSubCategoryNames] = useState<Map<number, string>>(new Map())
  const [documents, setDocuments] = useState<Map<number, DocumentNecessaire[]>>(new Map())
  const [outboxDocuments, setOutboxDocuments] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRevenues()
    loadOutboxDocuments()
  }, [clientId])

  async function loadRevenues() {
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

    setRevenues(revenuesData || [])

    // Load category and subcategory names and documents
    if (revenuesData && revenuesData.length > 0) {
      const categoryIds = [...new Set(revenuesData.map((r) => r.category_id))]
      const allSubCategoryIds = [...new Set(revenuesData.flatMap((r) => r.sub_category_ids))]

      const [{ data: categories }, { data: subCategories }, { data: docsData }] = await Promise.all([
        supabase.from("categories_revenus").select("id, nom").in("id", categoryIds),
        supabase.from("categories_revenus_sub").select("id, nom").in("id", allSubCategoryIds),
        supabase.from("documents_necessaires").select("*").in("sub_category_id", allSubCategoryIds),
      ])

      const catMap = new Map()
      categories?.forEach((cat) => catMap.set(cat.id, cat.nom))
      setCategoryNames(catMap)

      const subCatMap = new Map()
      subCategories?.forEach((sub) => subCatMap.set(sub.id, sub.nom))
      setSubCategoryNames(subCatMap)

      // Group documents by sub_category_id
      const docsMap = new Map<number, DocumentNecessaire[]>()
      docsData?.forEach((doc) => {
        if (!docsMap.has(doc.sub_category_id)) {
          docsMap.set(doc.sub_category_id, [])
        }
        docsMap.get(doc.sub_category_id)!.push(doc)
      })
      setDocuments(docsMap)
    }

    setLoading(false)
  }

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

  async function addToOutbox(docId: number, docName: string) {
    if (outboxDocuments.has(docId)) {
      console.log("[v0] Document already in outbox:", docName)
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
      alert("Erreur lors de l'ajout à la boîte d'envoi")
      return
    }

    console.log("[v0] Added to outbox:", docName)
    setOutboxDocuments((prev) => new Set(prev).add(docId))
  }

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Chargement...</div>
  }

  if (revenues.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun revenu enregistré pour ce client
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents nécessaires par revenu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {revenues.map((revenue) => {
            const allDocs = revenue.sub_category_ids.flatMap((subCatId) => documents.get(subCatId) || [])

            if (allDocs.length === 0) return null

            return (
              <div key={revenue.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{categoryNames.get(revenue.category_id)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {revenue.sub_category_ids.map((id) => subCategoryNames.get(id)).join(", ")}
                  </span>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead className="w-[150px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDocs.map((doc) => {
                        const isInOutbox = outboxDocuments.has(doc.id)
                        return (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-sm">{doc.shortname || doc.description}</p>
                                {doc.shortname && <p className="text-xs text-muted-foreground">{doc.description}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isInOutbox ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Check className="h-3 w-3 mr-1" />
                                  Ajouté
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addToOutbox(doc.id, doc.shortname || doc.description)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Ajouter
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
