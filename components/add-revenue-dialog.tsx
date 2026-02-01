"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, ChevronDown, ArrowLeft, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface RevenueCategory {
  id: string
  code: string
  name: string
}

interface AddRevenueDialogProps {
  clientId: string
  clientName: string
  trigger?: React.ReactNode
  existingCategoryIds?: number[]
  onSuccess?: () => void
}

function RevenueFullPageMulti({
  clientId,
  clientName,
  selectedCategoryIds,
  categories,
  onClose,
  onSuccess,
}: {
  clientId: string
  clientName: string
  selectedCategoryIds: number[]
  categories: RevenueCategory[]
  onClose: () => void
  onSuccess?: () => void
}) {
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [subBisCategories, setSubBisCategories] = useState<any[]>([])
  const [selectedSubCategories, setSelectedSubCategories] = useState<Set<number>>(new Set())
  const [selectedSubBisCategories, setSelectedSubBisCategories] = useState<Set<number>>(new Set())
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<number>>(new Set())
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    loadSubCategories()
  }, [selectedCategoryIds])

  useEffect(() => {
    if (selectedSubCategories.size > 0) {
      loadSubBisCategories()
    } else {
      setSubBisCategories([])
    }
  }, [Array.from(selectedSubCategories).join(",")])

  useEffect(() => {
    loadDocuments()
  }, [Array.from(selectedSubCategories).join(","), Array.from(selectedSubBisCategories).join(",")])

  const loadSubCategories = async () => {
    setIsLoadingData(true)
    const supabase = createBrowserClient()

    const { data, error } = await supabase
      .from("categories_revenus_sub")
      .select("*")
      .in("category_id", selectedCategoryIds)
      .order("nom")

    if (error) {
      console.error("Error loading subcategories:", error)
    } else {
      setSubCategories(data || [])
    }
    setIsLoadingData(false)
  }

  const loadSubBisCategories = async () => {
    if (selectedSubCategories.size === 0) return

    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("categories_revenus_sub_bis")
      .select("*")
      .in("sub_category_id", Array.from(selectedSubCategories))
      .order("nom")

    if (error) {
      console.error("Error loading sub-bis categories:", error)
    } else {
      setSubBisCategories(data || [])
    }
  }

  const loadDocuments = async () => {
    if (selectedSubCategories.size === 0 && selectedSubBisCategories.size === 0) {
      setDocuments([])
      return
    }

    const supabase = createBrowserClient()
    const queryParts = []

    if (selectedSubCategories.size > 0) {
      queryParts.push(`sub_category_id.in.(${Array.from(selectedSubCategories).join(",")})`)
    }
    if (selectedSubBisCategories.size > 0) {
      queryParts.push(`sub_bis_category_id.in.(${Array.from(selectedSubBisCategories).join(",")})`)
    }

    const { data, error } = await supabase.from("documents_necessaires").select("*").or(queryParts.join(","))

    if (error) {
      console.error("Error loading documents:", error)
    } else {
      setDocuments(data || [])
    }
  }

  const toggleSubCategory = (id: number) => {
    setSelectedSubCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleExpandSubCategory = (id: number) => {
    setExpandedSubCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSubBisCategory = (id: number) => {
    setSelectedSubBisCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleFileUpload = (docId: string, file: File) => {
    console.log("File selected:", file.name, "for document:", docId)
    setDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, file, status: "uploaded" } : doc)))
  }

  const triggerFileInput = (docId: string) => {
    fileInputRefs.current[docId]?.click()
  }

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createBrowserClient()
    
    try {
      const allSubCategoryIds = Array.from(selectedSubCategories)
      const allSubBisCategoryIds = Array.from(selectedSubBisCategories)
      
      console.log("[v0] Saving subcategories:", allSubCategoryIds)
      console.log("[v0] Saving sub-bis categories:", allSubBisCategoryIds)
      
      // Group subcategories by their parent category_id
      const categoryGroups = new Map<number, number[]>()
      
      for (const subId of allSubCategoryIds) {
        const sub = subCategories.find(s => s.id === subId)
        if (sub) {
          if (!categoryGroups.has(sub.category_id)) {
            categoryGroups.set(sub.category_id, [])
          }
          categoryGroups.get(sub.category_id)!.push(subId)
        }
      }
      
      // Insert one row per category with array of subcategory IDs
      const inserts = Array.from(categoryGroups.entries()).map(([categoryId, subIds]) => ({
        client_id: clientId,
        category_id: categoryId,
        sub_category_ids: subIds,
        document_ids: [] // Empty for now, can be populated later
      }))
      
      console.log("[v0] Inserting client_revenues:", inserts)
      
      const { error } = await supabase
        .from("client_revenues")
        .insert(inserts)
      
      if (error) {
        console.error("[v0] Error saving categories:", error)
        throw error
      }
      
      console.log("[v0] Categories saved successfully")
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error("[v0] Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Group subcategories by category
  const groupedSubCategories = subCategories.reduce(
    (acc, sub) => {
      const catId = sub.category_id
      if (!acc[catId]) acc[catId] = []
      acc[catId].push(sub)
      return acc
    },
    {} as Record<number, any[]>,
  )

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 border-b bg-gray-50 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Plusieurs catégories</h1>
            <p className="mt-1 text-sm text-muted-foreground">Client: {clientName}</p>
          </div>
        </div>

        {/* Content - 3 columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Categories + Subcategories */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="flex h-16 items-center border-b bg-gray-50 px-6 flex-shrink-0">
              <h2 className="text-lg font-semibold text-foreground">Catégories</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoadingData ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">Chargement...</div>
              ) : (
                Object.entries(groupedSubCategories).map(([categoryId, subs]) => {
                  const category = categories.find((c) => Number(c.id) === Number(categoryId))
                  return (
                    <div key={categoryId}>
                      {/* Sticky category header */}
                      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 sticky top-0 z-10">
                        <span className="text-sm font-semibold text-blue-800">
                          {category?.name || `Catégorie ${categoryId}`}
                        </span>
                      </div>
                      {/* Subcategories under this category */}
                      {(subs as any[]).map((sub) => {
                        const isSelected = selectedSubCategories.has(sub.id)
                        const isExpanded = expandedSubCategories.has(sub.id)
                        const subBisForThisSub = subBisCategories.filter((sb) => sb.sub_category_id === sub.id)
                        const hasSubBis = subBisForThisSub.length > 0

                        return (
                          <div key={sub.id}>
                            <div
                              onClick={() => toggleSubCategory(sub.id)}
                              className={cn(
                                "flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-gray-50 border-b",
                                isSelected && "bg-blue-50",
                              )}
                            >
                              <Checkbox checked={isSelected} />
                              <span className="flex-1 text-sm">{sub.nom}</span>
                              {isSelected && hasSubBis && (
                                <ChevronDown
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleExpandSubCategory(sub.id)
                                  }}
                                  className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
                                />
                              )}
                            </div>
                            {/* Sub-bis categories collapsible */}
                            {isSelected && isExpanded && hasSubBis && (
                              <div className="ml-8 border-l bg-gray-50">
                                {subBisForThisSub.map((subBis) => (
                                  <div
                                    key={subBis.id}
                                    onClick={() => toggleSubBisCategory(subBis.id)}
                                    className={cn(
                                      "flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 border-b",
                                      selectedSubBisCategories.has(subBis.id) && "bg-blue-100",
                                    )}
                                  >
                                    <Checkbox checked={selectedSubBisCategories.has(subBis.id)} />
                                    <span className="text-sm">{subBis.nom}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Column 2: Selected items summary */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="flex h-16 items-center border-b bg-gray-50 px-6 flex-shrink-0">
              <h2 className="text-lg font-semibold text-foreground">Sélection</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedSubCategories.size === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Sélectionnez des sous-catégories dans la colonne de gauche
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from(selectedSubCategories).map((subId) => {
                    const sub = subCategories.find((s) => s.id === subId)
                    return (
                      <div key={subId} className="rounded-lg border bg-blue-50 border-blue-200 p-3">
                        <span className="text-sm font-medium">{sub?.nom}</span>
                        {/* Show selected sub-bis under this sub */}
                        {Array.from(selectedSubBisCategories)
                          .filter((sbId) => {
                            const sb = subBisCategories.find((s) => s.id === sbId)
                            return sb?.sub_category_id === subId
                          })
                          .map((sbId) => {
                            const sb = subBisCategories.find((s) => s.id === sbId)
                            return (
                              <div key={sbId} className="ml-4 mt-1 text-xs text-blue-700">
                                • {sb?.nom}
                              </div>
                            )
                          })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Documents */}
          <div className="w-1/3 flex flex-col">
            <div className="flex h-16 items-center border-b bg-gray-50 px-6 flex-shrink-0">
              <h2 className="text-lg font-semibold text-foreground">Documents requis</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {documents.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Sélectionnez des sous-catégories pour voir les documents requis
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3",
                        doc.file ? "bg-green-50 border-green-200" : "bg-white",
                      )}
                    >
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{doc.shortname || doc.nom}</p>
                      </div>
                      <input
                        type="file"
                        ref={(el) => {
                          fileInputRefs.current[doc.id] = el
                        }}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(doc.id, file)
                        }}
                      />
                      <Button size="sm" variant="outline" onClick={() => triggerFileInput(doc.id)}>
                        <Upload className="h-3 w-3 mr-1" />
                        {doc.file ? "Remplacer" : "Déposer"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 border-t bg-gray-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedSubCategories.size === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AddRevenueDialog({
  clientId,
  clientName,
  trigger,
  existingCategoryIds = [],
  onSuccess,
}: AddRevenueDialogProps) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<RevenueCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<RevenueCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showFullPage, setShowFullPage] = useState(false)
  const [multiCategoryData, setMultiCategoryData] = useState<{ categoryId: number; categoryName: string } | null>(null)
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [creditsSubCategories, setCreditsSubCategories] = useState<Array<{ id: number; nom: string }>>([])
  const [selectedCreditsOptions, setSelectedCreditsOptions] = useState<number[]>([])
  const [isLoadingCreditsSubCategories, setIsLoadingCreditsSubCategories] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCategories(categories)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredCategories(
        categories.filter((cat) => cat.name.toLowerCase().includes(query) || cat.code.toLowerCase().includes(query)),
      )
    }
  }, [searchQuery, categories])

  const loadCategories = async () => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("categories_revenus").select("id, code, nom").order("code")

    if (error) {
      console.error("Erreur lors du chargement des catégories:", error)
      return
    }

    const mappedData = (data || []).map((cat) => ({
      id: String(cat.id),
      code: cat.code || "",
      name: cat.nom,
    }))

    setCategories(mappedData)
    setFilteredCategories(mappedData)
  }

  const handleCategoryToggle = (categoryId: string) => {
    if (existingCategoryIds.includes(Number.parseInt(categoryId))) return

    const category = categories.find((c) => c.id === categoryId)
    if (category?.name.includes("Crédits") || category?.name.includes("Réductions")) {
      setExpandedCategories((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId)
        } else {
          newSet.add(categoryId)
          loadCreditsSubCategories(Number.parseInt(categoryId))
        }
        return newSet
      })
      return
    }

    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleNext = async () => {
    if (selectedCategories.length === 0 && selectedCreditsOptions.length === 0) return

    setOpen(false)

    if (selectedCategories.length === 1) {
      const categoryId = Number.parseInt(selectedCategories[0])
      const category = categories.find((c) => c.id === selectedCategories[0])
      if (category) {
        setMultiCategoryData({ categoryId, categoryName: category.name })
        setShowFullPage(true)
      }
    } else {
      setMultiCategoryData({
        categoryId: -1,
        categoryName: "Plusieurs catégories",
      })
      setShowFullPage(true)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedCategories([])
    setSearchQuery("")
    setSelectedSubCategories([])
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose()
    } else {
      setOpen(newOpen)
    }
  }

  const handleFullPageClose = () => {
    setShowFullPage(false)
    setMultiCategoryData(null)
    setSelectedCategories([])
    setSelectedSubCategories([])
  }

  const handleSave = async () => {
    const setIsSaving = () => {} // Placeholder to satisfy lint rule
    setIsSaving(true)
    // Simulate saving process
    setTimeout(() => {
      setIsSaving(false)
      if (onSuccess) {
        onSuccess()
      }
    }, 2000)
  }

  const handleFileUpload = (docId: string, file: File) => {
    console.log("[v0] File selected:", file.name, "for document:", docId)
    setCategories((prev) => prev.map((cat) => (cat.id === docId ? { ...cat, file } : cat))) // Use setCategories
  }

  const triggerFileInput = (docId: string) => {
    fileInputRefs.current[docId]?.click()
  }

  const loadCreditsSubCategories = async (categoryId: number) => {
    setIsLoadingCreditsSubCategories(true)
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("categories_revenus_sub")
        .select("id, nom")
        .eq("category_id", categoryId)
        .order("nom")

      if (error) {
        console.error("[v0] Error loading credits subcategories:", error)
        return
      }

      console.log("[v0] Loaded credits subcategories:", data)
      setCreditsSubCategories(data || [])
    } catch (err) {
      console.error("[v0] Error loading credits subcategories:", err)
    } finally {
      setIsLoadingCreditsSubCategories(false)
    }
  }

  const handleCreditsOptionToggle = (subCategoryId: number) => {
    setSelectedCreditsOptions((prev) =>
      prev.includes(subCategoryId) ? prev.filter((id) => id !== subCategoryId) : [...prev, subCategoryId],
    )

    const creditsCategoryId = categories.find((c) => c.name.includes("Crédits") || c.name.includes("Réductions"))?.id
    if (creditsCategoryId && !selectedCategories.includes(creditsCategoryId)) {
      setSelectedCategories((prev) => [...prev, creditsCategoryId])
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="flex h-[80vh] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Sélectionner des revenus</DialogTitle>
            <DialogDescription>Choisissez une ou plusieurs déclarations à créer pour {clientName}</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher une déclaration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-2">
            {filteredCategories.map((category) => {
              const isAlreadyUsed = existingCategoryIds.includes(Number.parseInt(category.id))
              const isSelected = selectedCategories.includes(category.id)
              const isCreditsCategory = category.name.includes("Crédits") || category.name.includes("Réductions")
              const isExpanded = expandedCategories.has(category.id)

              return (
                <div key={category.id}>
                  <div
                    onClick={() => {
                      if (!isAlreadyUsed) {
                        handleCategoryToggle(category.id)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      isAlreadyUsed ? "cursor-not-allowed bg-green-50 opacity-50" : "hover:bg-gray-50 cursor-pointer",
                      isSelected && !isAlreadyUsed ? "border-blue-600 bg-blue-50" : "border-gray-200",
                    )}
                  >
                    {isCreditsCategory && !isAlreadyUsed ? (
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    ) : (
                      <Checkbox checked={isSelected} disabled={isAlreadyUsed} />
                    )}
                    <span className="flex-1 text-sm">{category.name}</span>
                    {isAlreadyUsed && <span className="text-xs text-gray-500 font-medium">Déjà utilisé</span>}
                    {isSelected && !isAlreadyUsed && !isCreditsCategory && (
                      <span className="text-xs text-blue-600 font-medium">Sélectionné</span>
                    )}
                  </div>

                  {isCreditsCategory && isExpanded && !isAlreadyUsed && (
                    <div className="ml-8 mt-2 space-y-2">
                      {isLoadingCreditsSubCategories ? (
                        <p className="text-sm text-muted-foreground">Chargement...</p>
                      ) : creditsSubCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune sous-catégorie disponible</p>
                      ) : (
                        creditsSubCategories.map((subCat) => (
                          <div
                            key={subCat.id}
                            onClick={() => handleCreditsOptionToggle(subCat.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border p-2 transition-colors cursor-pointer hover:bg-gray-50",
                              selectedCreditsOptions.includes(subCat.id)
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200",
                            )}
                          >
                            <Checkbox checked={selectedCreditsOptions.includes(subCat.id)} />
                            <span className="text-sm">{subCat.nom}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleNext}
              disabled={selectedCategories.length === 0 && selectedCreditsOptions.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Suivant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showFullPage && multiCategoryData && (
        <RevenueFullPageMulti
          clientId={clientId}
          clientName={clientName}
          selectedCategoryIds={selectedCategories.map((id) => Number.parseInt(id))}
          categories={categories}
          onClose={handleFullPageClose}
          onSuccess={onSuccess}
        />
      )}
    </>
  )
}
