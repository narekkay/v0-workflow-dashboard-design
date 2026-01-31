"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { ArrowLeft, FileText, Plus, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { createBrowserClient } from "@/lib/supabase/client"

interface RevenueFullPageProps {
  clientName: string
  categoryName: string
  categoryId: number
  clientId: string
  existingSubCategoryIds?: number[] // Add optional prop for pre-loading selections
  revenueId?: string // Add optional prop for revenue ID (update mode)
  onClose: (openModal?: boolean) => void
}

interface SubCategory {
  id: string
  nom: string
  category_id: string
  case_code?: string // Added case_code field
}

interface DocumentNecessaire {
  id: string
  sub_category_id: string | null
  sub_bis_category_id: string | null // Added sub_bis_category_id to support level 3 documents
  description: string
  shortname: string
}

interface Case {
  id: string
  nom: string
  sub_category_id: string
}

export function RevenueFullPage({
  clientName,
  categoryName,
  categoryId,
  clientId,
  existingSubCategoryIds,
  revenueId,
  onClose,
}: RevenueFullPageProps) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentNecessaire[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalState, setModalState] = useState<"loading" | "success">("loading")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [hasExistingData, setHasExistingData] = useState(false)
  const [caseCodesWithAnnexe, setCaseCodesWithAnnexe] = useState<Set<string>>(new Set())
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [uploadedFiles, setUploadedFiles] = useState<{ [docId: string]: File }>({})

  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ]

  function getColorForSubCategory(index: number): string {
    return colors[index % colors.length]
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoadingData(true)
    const supabase = createBrowserClient()

    const { data: subCatsData, error: subCatsError } = await supabase
      .from("categories_revenus_sub")
      .select("*")
      .eq("category_id", categoryId)
      .order("nom")

    if (subCatsError) {
      console.error("Error loading subcategories:", subCatsError)
    }

    const { data: caseLabelsData, error: caseLabelsError } = await supabase.from("case_labels").select("*")

    if (caseLabelsError) {
      console.error("Error loading case labels:", caseLabelsError)
    }

    const { data: caseAnnexesData, error: caseAnnexesError } = await supabase.from("case_annexes").select("case_code")

    if (caseAnnexesError) {
      console.error("Error loading case annexes:", caseAnnexesError)
    } else if (caseAnnexesData) {
      const annexeCodes = new Set(caseAnnexesData.map((item: any) => item.case_code))
      setCaseCodesWithAnnexe(annexeCodes)
    }

    const caseCodeMap = new Map<string, string>()
    if (caseLabelsData) {
      caseLabelsData.forEach((label: any) => {
        caseCodeMap.set(String(label.sub_category_id), label.case_code)
      })
    }

    const subCategoriesWithCodes = (subCatsData || []).map((sub) => ({
      ...sub,
      case_code: caseCodeMap.get(String(sub.id)),
    }))

    setSubCategories(subCategoriesWithCodes)

    const { data: revenueData, error: revenueError } = await supabase
      .from("client_revenues")
      .select("sub_category_ids")
      .eq("client_id", clientId)
      .eq("category_id", categoryId)
      .single()

    if (revenueError) {
      if (revenueError.code !== "PGRST116") {
        console.error("Error loading existing revenue data:", revenueError)
      }
      setHasExistingData(false)
    } else if (revenueData && revenueData.sub_category_ids) {
      const idsToSelect = revenueData.sub_category_ids.map((id: number) => String(id))
      setSelectedSubCategories(idsToSelect)
      setHasExistingData(true)
    }

    setIsLoadingData(false)
  }

  useEffect(() => {
    if (selectedSubCategories.length > 0) {
      loadDocuments()
    } else {
      setDocuments([])
    }
  }, [selectedSubCategories])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  async function loadDocuments() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("documents_necessaires")
      .select("*")
      .or(
        `sub_category_id.in.(${selectedSubCategories.join(",")}),sub_bis_category_id.in.(${selectedSubCategories.join(",")})`,
      )

    if (error) {
      console.error("Error loading documents:", error)
    } else {
      setDocuments(data || [])
    }
  }

  function toggleSubCategory(id: string) {
    const stringId = String(id)

    setSelectedSubCategories((prev) => {
      return prev.includes(stringId) ? prev.filter((subId) => subId !== stringId) : [...prev, stringId]
    })
  }

  const selectedSubCategoriesData = subCategories.filter((sub) => selectedSubCategories.includes(String(sub.id)))

  async function handleAddRevenue() {
    if (selectedSubCategories.length === 0) {
      alert("Veuillez sélectionner au moins une sous-catégorie")
      return
    }

    setShowModal(true)
    setModalState("loading")
    setIsSaving(true)

    const supabase = createBrowserClient()
    const documentIds = documents.map((doc) => Number.parseInt(doc.id))
    const subCategoryIds = selectedSubCategories.map((id) => Number.parseInt(id))

    const { error } = await supabase.from("client_revenues").upsert(
      {
        client_id: clientId,
        category_id: categoryId,
        sub_category_ids: subCategoryIds,
        document_ids: documentIds,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "client_id,category_id",
      },
    )

    if (error) {
      console.error("Error saving revenue:", error)
      alert("Erreur lors de l'enregistrement")
      setShowModal(false)
      setIsSaving(false)
      return
    }

    const { data: existingClientFiles, error: clientFilesError } = await supabase
      .from("client_files")
      .select("file_name")
      .eq("client_id", clientId)

    if (clientFilesError) {
      console.error("Error checking client_files:", clientFilesError)
    }

    const existingClientFileNames = new Set(existingClientFiles?.map((f) => f.file_name) || [])

    const { data: existingOutboxFiles, error: existingFilesError } = await supabase
      .from("boite_envoi_files")
      .select("document_id")
      .eq("client_id", clientId)

    if (existingFilesError) {
      console.error("Error checking existing files:", existingFilesError)
    }

    const existingDocumentIds = new Set(existingOutboxFiles?.map((f) => f.document_id) || [])

    const filesToSave = documents
      .filter((doc) => {
        const fileName = uploadedFiles[doc.id] ? uploadedFiles[doc.id].name : doc.shortname
        return !existingDocumentIds.has(Number.parseInt(doc.id)) && !existingClientFileNames.has(fileName)
      })
      .map((doc) => ({
        client_id: clientId,
        file_name: uploadedFiles[doc.id] ? uploadedFiles[doc.id].name : doc.shortname,
        document_id: Number.parseInt(doc.id),
        status: uploadedFiles[doc.id] ? "uploaded" : "en_attente",
      }))

    console.log("[v0] Filtered files to save (excluding duplicates from both tables):", filesToSave)

    if (filesToSave.length > 0) {
      const { error: filesError } = await supabase.from("boite_envoi_files").insert(filesToSave)

      if (filesError) {
        console.error("Error saving files to outbox:", filesError)
        alert("Erreur lors de l'enregistrement des fichiers")
        setShowModal(false)
        setIsSaving(false)
        return
      }

      console.log("[v0] Successfully saved", filesToSave.length, "new documents to boite_envoi_files")
    } else {
      console.log("[v0] No new files to save (all already exist)")
    }

    setModalState("success")
    setTimeout(() => {
      setShowModal(false)
      setIsSaving(false)
      onClose(false)
    }, 1000)
  }

  function handleFileUpload(docId: string, file: File) {
    console.log("[v0] File selected:", file.name, "for document:", docId)
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: file,
    }))
  }

  function triggerFileInput(docId: string) {
    fileInputRefs.current[docId]?.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="border-b bg-white px-8 py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => onClose(false)} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{categoryName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Client: {clientName}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r">
          <div className="flex h-16 items-center border-b bg-gray-50 px-6">
            <h2 className="text-lg font-semibold text-foreground">Sous-catégories</h2>
          </div>
          <div className="overflow-y-auto">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center px-6 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-sm text-muted-foreground">Chargement des données...</p>
              </div>
            ) : subCategories.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">Aucune sous-catégorie</div>
            ) : (
              subCategories.map((subCategory) => (
                <div
                  key={subCategory.id}
                  onClick={() => toggleSubCategory(subCategory.id)}
                  className={`flex w-full cursor-pointer items-center border-b px-6 py-4 transition-colors hover:bg-gray-50 ${
                    selectedSubCategories.includes(String(subCategory.id)) ? "bg-blue-50" : ""
                  }`}
                >
                  <Checkbox
                    checked={selectedSubCategories.includes(String(subCategory.id))}
                    className="mr-3 pointer-events-none"
                  />
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-foreground">
                      {subCategory.nom}
                      {subCategory.case_code && (
                        <span className="ml-1.5 text-xs text-muted-foreground">({subCategory.case_code})</span>
                      )}
                      {subCategory.case_code && caseCodesWithAnnexe.has(subCategory.case_code) && (
                        <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded border border-red-500 bg-transparent text-xs font-semibold text-red-500">
                          A
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-1/3 border-r bg-blue-50/30">
          <div className="flex h-16 items-center justify-between border-b border-l-4 border-l-blue-600 bg-blue-100 px-6">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Sélection</h2>
              <p className="text-xs text-blue-700">
                {selectedSubCategoriesData.length} élément{selectedSubCategoriesData.length !== 1 ? "s" : ""}{" "}
                sélectionné
                {selectedSubCategoriesData.length !== 1 ? "s" : ""}
              </p>
            </div>
            {hasExistingData && selectedSubCategoriesData.length > 0 && (
              <Button variant="ghost" onClick={() => onClose(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="overflow-y-auto">
            {selectedSubCategoriesData.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                Sélectionnez des sous-catégories
              </div>
            ) : (
              selectedSubCategoriesData.map((subCategory, index) => {
                const color = getColorForSubCategory(index)

                return (
                  <div key={subCategory.id} className="border-b bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{subCategory.nom}</span>
                        {subCategory.case_code && caseCodesWithAnnexe.has(subCategory.case_code) && (
                          <span className="inline-flex items-center rounded border border-red-500 bg-transparent px-2 py-0.5 text-xs font-semibold text-red-500">
                            Annexe
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="w-1/3 flex flex-col">
          <div className="flex h-16 items-center border-b bg-gray-50 px-6">
            <h2 className="text-lg font-semibold text-foreground">Documents</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selectedSubCategoriesData.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Sélectionnez des sous-catégories pour voir les documents
              </div>
            ) : (
              <div className="space-y-4">
                {selectedSubCategoriesData.map((subCategory, index) => {
                  const subCategoryDocuments = documents.filter(
                    (doc) => doc.sub_category_id === subCategory.id || doc.sub_bis_category_id === subCategory.id,
                  )
                  const color = getColorForSubCategory(index)

                  if (subCategoryDocuments.length === 0) return null

                  return (
                    <div key={subCategory.id}>
                      {subCategoryDocuments.map((doc, docIndex) => (
                        <div key={doc.id} className="mb-3 flex items-start gap-3">
                          <div
                            className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex flex-1 items-center justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{doc.shortname}</p>
                              {uploadedFiles[doc.id] && (
                                <p className="text-xs text-green-600 mt-0.5">✓ {uploadedFiles[doc.id].name}</p>
                              )}
                            </div>
                            <div>
                              <input
                                type="file"
                                ref={(el) => (fileInputRefs.current[doc.id] = el)}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleFileUpload(doc.id, file)
                                  }
                                }}
                                accept="*/*"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs bg-transparent"
                                onClick={() => triggerFileInput(doc.id)}
                              >
                                {uploadedFiles[doc.id] ? "Modifier" : "Upload"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t bg-gray-100 p-4">
            {documents.length > 0 && (
              <p className="mb-2 text-xs text-muted-foreground text-center">
                {documents.length} élément{documents.length !== 1 ? "s" : ""} seront ajoutés à la boîte d'envoi
              </p>
            )}
            <Button
              onClick={handleAddRevenue}
              disabled={selectedSubCategories.length === 0 || isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isSaving ? "Enregistrement..." : revenueId ? `Mettre à jour (${documents.length})` : "Ajouter revenus"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            {modalState === "loading" ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="mt-4 text-lg font-medium text-foreground">Enregistrement en cours...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-green-100 p-3">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
                <p className="mt-4 text-lg font-medium text-green-700">Revenu ajouté avec succès!</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
