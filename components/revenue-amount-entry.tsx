"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, ArrowLeft } from "lucide-react"

interface RevenueAmountEntryProps {
  clientId: string
  clientName: string
  categoryId: number
  categoryName: string
  onClose: () => void
}

interface SubCategory {
  id: number
  nom: string
  code?: string
  case_code?: string | null
}

export function RevenueAmountEntry({
  clientId,
  clientName,
  categoryId,
  categoryName,
  onClose,
}: RevenueAmountEntryProps) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [selectedSubCategories, setSelectedSubCategories] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [clientId, categoryId])

  async function loadData() {
    const supabase = createClient()

    const { data: revenueData } = await supabase
      .from("client_revenues")
      .select("sub_category_ids")
      .eq("client_id", clientId)
      .eq("category_id", categoryId)
      .single()

    if (revenueData?.sub_category_ids) {
      setSelectedSubCategories(revenueData.sub_category_ids)

      const { data: allCaseLabels, error: caseLabelError } = await supabase.from("case_labels").select("*")

      const filteredCaseLabels = allCaseLabels?.filter((label: any) =>
        revenueData.sub_category_ids.includes(label.sub_category_id),
      )

      const caseLabelMap = new Map(
        filteredCaseLabels?.map((label: any) => [label.sub_category_id, label.case_code]) || [],
      )

      const { data: subCatsData } = await supabase
        .from("categories_revenus_sub")
        .select(`
          id,
          nom,
          category_id,
          created_at
        `)
        .in("id", revenueData.sub_category_ids)
        .order("id", { ascending: true })

      if (subCatsData) {
        const subCatsWithCodes = subCatsData.map((subCat: any) => ({
          ...subCat,
          case_code: caseLabelMap.get(subCat.id) || null,
        }))

        setSubCategories(subCatsWithCodes)

        const allCaseCodes: string[] = []
        subCatsWithCodes.forEach((subCat) => {
          if (subCat.case_code) {
            for (let i = 0; i < 4; i++) {
              allCaseCodes.push(getCaseCodeForPerson(subCat.case_code, i))
            }
          }
        })

        const { data: existingAmounts } = await supabase
          .from("montants_case_2042")
          .select("case_code, montant")
          .eq("client_id", clientId)
          .in("case_code", allCaseCodes)

        if (existingAmounts) {
          const amountsMap: Record<string, string> = {}
          existingAmounts.forEach((entry: any) => {
            amountsMap[entry.case_code] = entry.montant.toString()
          })
          setAmounts(amountsMap)
        }
      }
    }

    setLoading(false)
  }

  const getCaseCodeForPerson = (baseCode: string | null | undefined, personIndex: number): string => {
    if (!baseCode || baseCode.length < 3) return ""

    if (personIndex === 0) return baseCode

    const firstChar = baseCode[0]
    const secondChar = baseCode[1]
    const restOfCode = baseCode.substring(2)

    const secondCharCode = secondChar.charCodeAt(0) - 65
    const newSecondCharCode = secondCharCode + personIndex
    const newSecondChar = String.fromCharCode(65 + newSecondCharCode)

    return firstChar + newSecondChar + restOfCode
  }

  const handleAmountChange = (caseCode: string, value: string) => {
    setAmounts((prev) => ({
      ...prev,
      [caseCode]: value,
    }))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    try {
      const dataToSave = Object.entries(amounts).map(([case_code, montant]) => ({
        client_id: clientId,
        case_code,
        montant: Number.parseFloat(montant) || 0,
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from("montants_case_2042").upsert(dataToSave, {
        onConflict: "client_id,case_code",
      })

      if (error) throw error

      setShowSuccessModal(true)
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      alert("Erreur lors de l'enregistrement des montants")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="border-b bg-white px-8 py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{categoryName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Client: {clientName}</p>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Enregistrement réussi !</h3>
                <p className="text-sm text-muted-foreground">
                  Les montants ont été enregistrés avec succès dans la base de données.
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowSuccessModal(false)
                  onClose()
                }}
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-4 font-medium text-muted-foreground w-2/5">Sous-catégorie</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Vous</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Conjoint</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Personne n°1</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Personne n°2</th>
                  </tr>
                </thead>
                <tbody>
                  {subCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Aucune sous-catégorie sélectionnée pour cette catégorie
                      </td>
                    </tr>
                  ) : (
                    subCategories.map((subCat, idx) => (
                      <tr key={subCat.id} className="border-b hover:bg-muted/30">
                        <td className="p-4 text-sm text-muted-foreground">{subCat.nom}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
                              {subCat.case_code ? getCaseCodeForPerson(subCat.case_code, 0) : "—"}
                            </span>
                            <Input
                              type="number"
                              value={subCat.case_code ? amounts[getCaseCodeForPerson(subCat.case_code, 0)] || "0" : "0"}
                              onChange={(e) =>
                                subCat.case_code &&
                                handleAmountChange(getCaseCodeForPerson(subCat.case_code, 0), e.target.value)
                              }
                              className="h-9 text-center max-w-[180px]"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
                              {subCat.case_code ? getCaseCodeForPerson(subCat.case_code, 1) : "—"}
                            </span>
                            <Input
                              type="number"
                              value={subCat.case_code ? amounts[getCaseCodeForPerson(subCat.case_code, 1)] || "0" : "0"}
                              onChange={(e) =>
                                subCat.case_code &&
                                handleAmountChange(getCaseCodeForPerson(subCat.case_code, 1), e.target.value)
                              }
                              className="h-9 text-center max-w-[180px]"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
                              {subCat.case_code ? getCaseCodeForPerson(subCat.case_code, 2) : "—"}
                            </span>
                            <Input
                              type="number"
                              value={subCat.case_code ? amounts[getCaseCodeForPerson(subCat.case_code, 2)] || "0" : "0"}
                              onChange={(e) =>
                                subCat.case_code &&
                                handleAmountChange(getCaseCodeForPerson(subCat.case_code, 2), e.target.value)
                              }
                              className="h-9 text-center max-w-[180px]"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
                              {subCat.case_code ? getCaseCodeForPerson(subCat.case_code, 3) : "—"}
                            </span>
                            <Input
                              type="number"
                              value={subCat.case_code ? amounts[getCaseCodeForPerson(subCat.case_code, 3)] || "0" : "0"}
                              onChange={(e) =>
                                subCat.case_code &&
                                handleAmountChange(getCaseCodeForPerson(subCat.case_code, 3), e.target.value)
                              }
                              className="h-9 text-center max-w-[180px]"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? "Enregistrement..." : "Enregistrer les montants"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
