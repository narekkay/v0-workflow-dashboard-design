"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, XCircle, ChevronRight } from "lucide-react"

interface ClientRevenue {
  id: string
  categoryName: string
  sub_category_ids: number[]
  document_ids: number[]
  created_at: string
}

interface SubCategory {
  id: number
  nom: string
  hasAnnexe?: boolean
}

interface Document {
  id: number
  shortname: string
  status: "available" | "pending" | "missing"
  uploaded_at?: string
}

interface RevenueDetailTabProps {
  revenueId: string
  categoryName: string
  allRevenues: ClientRevenue[]
  onSwitchToRevenue: (revenueId: string, categoryName: string) => void
}

export function RevenueDetailTab({ revenueId, categoryName, allRevenues, onSwitchToRevenue }: RevenueDetailTabProps) {
  const [loading, setLoading] = useState(true)
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [createdAt, setCreatedAt] = useState<string>("")

  useEffect(() => {
    loadRevenueDetail()
  }, [revenueId])

  async function loadRevenueDetail() {
    const supabase = createBrowserClient()

    // Load revenue details
    const { data: revenue, error } = await supabase.from("client_revenues").select("*").eq("id", revenueId).single()

    if (error || !revenue) {
      console.error("[v0] Error loading revenue:", error)
      setLoading(false)
      return
    }

    setCreatedAt(revenue.created_at)

    // Load sub-categories
    const { data: subCats } = await supabase
      .from("categories_revenus_sub")
      .select("id, nom")
      .in("id", revenue.sub_category_ids)

    // Batch load annexes for all subcategories at once
    if (subCats && subCats.length > 0) {
      // Get all case codes for all subcategories in one query
      const { data: allCaseLabels } = await supabase
        .from("case_labels")
        .select("sub_category_id, case_code")
        .in("sub_category_id", subCats.map(s => s.id))
      
      // Get all annexes for all case codes in one query
      const allCodes = [...new Set(allCaseLabels?.map(cl => cl.case_code) || [])]
      const { data: allAnnexes } = await supabase
        .from("case_annexes")
        .select("case_code")
        .in("case_code", allCodes)
      
      const annexeCodeSet = new Set(allAnnexes?.map(a => a.case_code) || [])
      
      // Map annexe info to subcategories
      const subCatsWithAnnexe = subCats.map(subCat => {
        const hasAnnexe = allCaseLabels?.some(cl => 
          cl.sub_category_id === subCat.id && annexeCodeSet.has(cl.case_code)
        ) || false
        return { ...subCat, hasAnnexe }
      })

      setSubCategories(subCatsWithAnnexe)
    } else {
      setSubCategories(subCats || [])
    }

    // Load document names
    const { data: docs } = await supabase
      .from("documents_necessaires")
      .select("id, shortname")
      .in("id", revenue.document_ids)

    // Mock document status for now
    const docsWithStatus = (docs || []).map((doc, index) => ({
      ...doc,
      status: index === 0 ? "available" : index % 2 === 0 ? "pending" : ("missing" as const),
      uploaded_at: index === 0 ? new Date().toISOString() : undefined,
    }))

    setDocuments(docsWithStatus)
    setLoading(false)
  }

  const getNextRevenue = () => {
    const currentIndex = allRevenues.findIndex((r) => r.id === revenueId)
    if (currentIndex !== -1 && currentIndex < allRevenues.length - 1) {
      return allRevenues[currentIndex + 1]
    }
    return null
  }

  const nextRevenue = getNextRevenue()

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Chargement...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{categoryName}</h2>
          <p className="text-sm text-muted-foreground">
            Ajouté le {new Date(createdAt).toLocaleDateString("fr-FR")} à{" "}
            {new Date(createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {nextRevenue && (
          <button
            onClick={() => onSwitchToRevenue(nextRevenue.id, nextRevenue.categoryName)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {nextRevenue.categoryName}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sous-catégories sélectionnées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {subCategories.map((subCat) => (
              <Badge key={subCat.id} variant="secondary" className="flex items-center gap-1.5">
                {subCat.nom}
                {subCat.hasAnnexe && (
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded border border-purple-600 bg-purple-50 text-[10px] font-bold text-purple-600">
                    A
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents requis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Date d'envoi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.shortname}</TableCell>
                  <TableCell>
                    {doc.status === "available" ? (
                      <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="h-3 w-3" />
                        Disponible
                      </Badge>
                    ) : doc.status === "pending" ? (
                      <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <Clock className="h-3 w-3" />
                        En attente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="h-3 w-3" />
                        Manquant
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("fr-FR") : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
