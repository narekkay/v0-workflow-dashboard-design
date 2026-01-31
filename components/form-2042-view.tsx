"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { Save, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Form2042ViewProps {
  clientId: string
  clientName: string
}

interface SubCategory {
  id: number
  nom: string
  code?: string // Tax form code like 1AJ, 1BJ, etc.
}

export function Form2042View({ clientId, clientName }: Form2042ViewProps) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({})
  const [saving, setSaving] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const { toast } = useToast()
  const uniqueMatchRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    loadTraitementsData()
    loadSavedValues()
  }, [clientId])

  // Auto-scroll to unique search result
  useEffect(() => {
    if (!searchFilter.trim()) return

    // Count all matching codes across all categories
    const searchLower = searchFilter.toLowerCase()
    let matchCount = 0
    
    // Count matches in "Traitements et salaires"
    taxCodes.forEach(row => {
      if (row.codes.some((code) => code.toLowerCase().includes(searchLower))) {
        matchCount += row.codes.filter((code) => code.toLowerCase().includes(searchLower)).length
      }
    })
    
    // Count matches in other categories
    const otherCategories = [
      [
        { label: "Pensions/retraites imposables", codes: ["1AS", "1BS", "1CS", "1DS"] },
        { label: "Pensions de retraite en capital taxables à 7,5%", codes: ["1AT", "1BT", "1CT", "1DT"] },
        { label: "Pensions en capital des plans d'épargne retraite", codes: ["1AI", "1BI", "1CI", "1DI"] },
        { label: "Pensions d'invalidité", codes: ["1AZ", "1BZ", "1CZ", "1DZ"] },
        { label: "Pensions alimentaires perçues", codes: ["1AO", "1BO", "1CO", "1DO"] },
      ],
      [
        { label: "Revenus des actions et parts (abattement de 40% si option barème)", code: "2DC" },
        { label: "Dividendes imposables des titres non cotés détenus dans le PEA ou le PEA-PME", code: "2FU" },
        { label: "Intérêts et autre produits de placement à revenu fixe", code: "2TR" },
        { label: "Autres revenus distribués", code: "2TS" },
        { label: "Intérets des prêts participatifs et des minibons", code: "2TT" },
        { label: "Intérets imposables des obligations remboursables en actions détenues dans le PEA-PME", code: "2TQ" },
        { label: "Produits des plans d'épargne retraite - sortie en capital", code: "2TZ" },
        { label: "Frais et charges (déductibles si option barème)", code: "2CA" },
        { label: "Crédits d'impôt sur valeurs étrangères", code: "2AB" },
        { label: "Prélèvement forfaitaire non libératoire déjà versé", code: "2CK" },
        { label: "Option barème (RCM)", code: "2OP", isCheckbox: true },
      ],
      [
        { label: "Gains nets de cession", code: "3VG" },
        { label: "Plus-value avant abattement", code: "3SG" },
        { label: "Moins-values nettes", code: "3VH" },
      ],
      [
        { label: "Micro-foncier (≤ 15 000 €)", code: "4BE" },
        { label: "dont recettes de source étrangère ouvrant droit à un crédit d'impôt égal à l'impôt français", code: "4BK" },
        { label: "Résultat foncier (réel) — bénéfice", code: "4BA" },
        { label: "dont revenus de source étrangère ouvrant droit à un crédit d'impôt égal à l'impôt français", code: "4BL" },
        { label: "Déficit imputable sur les revenus fonciers", code: "4BB" },
        { label: "Déficit imputable sur le revenu global", code: "4BC" },
        { label: "Déficits antérieurs non encore imputés", code: "4BD" },
      ],
      [
        { label: "Pensions alimentaires versées à des enfants majeurs (déclarant 1)", code: "6EL" },
        { label: "Pensions alimentaires versées à des enfants majeurs (déclarant 2)", code: "6EM" },
        { label: "Autres pensions alimentaires versées (enfants mineurs, ascendants..)", code: "6GU" },
        { label: "Cotisations sur les nouveaux plans d'épargne retraite (PER)", code: "6NS" },
        { label: "Cotisations PERP, PREFON, COREM, CGOS", code: "6RS" },
        { label: "Plafond de déduction", code: "6PS" },
      ],
    ]
    
    otherCategories.forEach(category => {
      category.forEach(row => {
        if ('codes' in row) {
          matchCount += row.codes.filter((code) => code.toLowerCase().includes(searchLower)).length
        } else if ('code' in row) {
          if (row.code.toLowerCase().includes(searchLower)) {
            matchCount++
          }
        }
      })
    })

    console.log("[v0] Search filter:", searchFilter, "Match count:", matchCount)
    
    // If exactly one match, scroll to it
    if (matchCount === 1 && uniqueMatchRef.current) {
      setTimeout(() => {
        uniqueMatchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }, [searchFilter])

  async function loadTraitementsData() {
    const supabase = createBrowserClient()

    // Load "Traitements & salaires" subcategories (category_id = 1)
    const { data, error } = await supabase
      .from("categories_revenus_sub")
      .select("*")
      .eq("category_id", 1)
      .order("id", { ascending: true })

    if (!error && data) {
      setSubCategories(data)
    }
    setLoading(false)
  }

  async function loadSavedValues() {
    const supabase = createBrowserClient()

    // Load saved values for this client
    const { data, error } = await supabase
      .from("montants_case_2042")
      .select("*")
      .eq("client_id", clientId)

    if (!error && data) {
      const values: Record<string, string | boolean> = {}
      data.forEach((row) => {
        // For checkbox fields (stored as 1 or 0), convert to boolean
        // For numeric fields, keep as string
        if (row.montant === 1) {
          values[row.case_code] = true
        } else if (row.montant === 0) {
          values[row.case_code] = false
        } else {
          values[row.case_code] = row.montant?.toString() || ""
        }
      })
      setFormValues(values)
    }
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createBrowserClient()

    try {
      console.log("[v0] Starting save operation for client:", clientId)
      
      // First, get all existing case codes for this client
      const { data: existingData } = await supabase
        .from("montants_case_2042")
        .select("case_code")
        .eq("client_id", clientId)
      
      const existingCaseCodes = new Set(existingData?.map(row => row.case_code) || [])
      
      // Prepare upsert data
      const upserts = Object.entries(formValues)
        .filter(([_, value]) => value !== "" && value !== false)
        .map(([caseCode, value]) => ({
          client_id: clientId,
          case_code: caseCode,
          // Store boolean as 1 (true) or 0 (false), string as numeric value
          montant: typeof value === "boolean" ? (value ? 1 : 0) : parseFloat(value as string) || 0,
        }))

      console.log("[v0] Upserting", upserts.length, "records")

      // Use upsert with onConflict to handle unique constraint
      if (upserts.length > 0) {
        const { error } = await supabase
          .from("montants_case_2042")
          .upsert(upserts, {
            onConflict: "client_id,case_code",
          })

        if (error) {
          throw error
        }
      }

      // Delete case codes that are no longer in formValues
      const currentCaseCodes = new Set(Object.keys(formValues).filter(code => formValues[code] !== "" && formValues[code] !== false))
      const codesToDelete = Array.from(existingCaseCodes).filter(code => !currentCaseCodes.has(code))
      
      if (codesToDelete.length > 0) {
        console.log("[v0] Deleting", codesToDelete.length, "obsolete records")
        const { error: deleteError } = await supabase
          .from("montants_case_2042")
          .delete()
          .eq("client_id", clientId)
          .in("case_code", codesToDelete)
        
        if (deleteError) {
          console.error("[v0] Error deleting obsolete records:", deleteError)
        }
      }

      console.log("[v0] Toast should display now")
      toast({
        title: "✓ Sauvegardé avec succès",
        description: "Les données du formulaire 2042 ont été enregistrées.",
      })
    } catch (error) {
      console.error("[v0] Error saving 2042 form:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  function handleInputChange(caseCode: string, value: string | boolean) {
    setFormValues((prev) => ({
      ...prev,
      [caseCode]: value,
    }))
  }

  // Map subcategories to their tax codes
  const taxCodes = [
    { label: "Traitements et salaires", codes: ["1AJ", "1BJ", "1CJ", "1DJ"] },
    { label: "Revenus des salariés des particuliers employeurs", codes: ["1AA", "1BA", "1CA", "1DA"] },
    {
      label: "Abattement forfaitaire : assistants maternels ou familiaux et journalistes",
      codes: ["1GA", "1HA", "1IA", "1JA"],
    },
    { label: "Revenus d'heures supplémentaires exonérés", codes: ["1GH", "1HH", "1IH", "1JH"] },
    { label: "Revenus des associés et gérants (art. 62 du CGI)", codes: ["1GB", "1HB", "1IB", "1JB"] },
    {
      label: "En 2021, vous ne percevez plus de salaires déclarés lignes 1GB, 1GF, 1GG et 1AG",
      codes: ["1GK", "1GL", "1GP", "1GQ"],
      isCheckbox: true,
    },
    { label: "Droits d'auteur, fonctionnaires chercheurs", codes: ["1GF", "1HF", "1IF", "1JF"] },
    { label: "Agents généraux d'assurance", codes: ["1GG", "1HG", "1IG", "1JG"] },
    { label: "Autres revenus imposables", codes: ["1AP", "1BP", "1CP", "1DP"] },
    { label: "Salaires perçus par les non-résidents", codes: ["1AF1", "1BF1", "1CF1", "1DF1"] },
  ]

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="sticky top-0 z-10 bg-background flex items-center justify-between mb-6 pb-4 border-b pt-4 -mx-6 px-6">
        <h1 className="text-3xl font-bold">2042</h1>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="Rechercher par code case (ex: 1AJ)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-[300px]"
          />
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Check className="h-4 w-4 animate-pulse" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        {/* Traitements et salaires */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Traitements et salaires</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-4 font-medium text-muted-foreground w-2/5"></th>
                    <th className="text-center p-4 font-semibold w-[15%]">Vous</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Conjoint</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Personne n°1</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Personne n°2</th>
                  </tr>
                </thead>
                <tbody>
                  {taxCodes
                    .filter((row) => {
                      if (!searchFilter.trim()) return true
                      const searchLower = searchFilter.toLowerCase()
                      return row.codes.some((code) => code.toLowerCase().includes(searchLower))
                    })
                    .map((row, idx) => {
                      const hasMatch = searchFilter.trim() && row.codes.some((code) => code.toLowerCase().includes(searchFilter.toLowerCase()))
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/30" ref={hasMatch ? uniqueMatchRef : null}>
                          <td className="p-4 text-sm text-muted-foreground">{row.label}</td>
                          {row.codes.map((code, codeIdx) => {
                            const isMatch = searchFilter.trim() && code.toLowerCase().includes(searchFilter.toLowerCase())
                            return (
                              <td key={codeIdx} className={`p-2 ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`text-xs ${isMatch ? 'text-yellow-900 dark:text-yellow-100 font-semibold' : 'text-muted-foreground'}`}>{code}</span>
                                  {row.isCheckbox ? (
                                    <Checkbox
                                      checked={!!formValues[code]}
                                      onCheckedChange={(checked) => handleInputChange(code, checked as boolean)}
                                    />
                                  ) : (
                                    <Input
                                      type="number"
                                      value={formValues[code] || ""}
                                      onChange={(e) => handleInputChange(code, e.target.value)}
                                      className="h-9 text-center min-w-[70px] w-full"
                                    />
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pensions et rentes */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Pensions et rentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-4 font-medium text-muted-foreground w-2/5"></th>
                    <th className="text-center p-4 font-semibold w-[15%]">Vous</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Conjoint</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Personne n°1</th>
                    <th className="text-center p-4 font-semibold w-[15%]">Personne n°2</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Pensions/retraites imposables", codes: ["1AS", "1BS", "1CS", "1DS"] },
                    { label: "Pensions de retraite en capital taxables à 7,5%", codes: ["1AT", "1BT", "1CT", "1DT"] },
                    { label: "Pensions en capital des plans d'épargne retraite", codes: ["1AI", "1BI", "1CI", "1DI"] },
                    { label: "Pensions d'invalidité", codes: ["1AZ", "1BZ", "1CZ", "1DZ"] },
                    { label: "Pensions alimentaires perçues", codes: ["1AO", "1BO", "1CO", "1DO"] },
                  ]
                    .filter((row) => {
                      if (!searchFilter.trim()) return true
                      const searchLower = searchFilter.toLowerCase()
                      return row.codes.some((code) => code.toLowerCase().includes(searchLower))
                    })
                    .map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/30">
                        <td className="p-4 text-sm text-muted-foreground">{row.label}</td>
                        {row.codes.map((code, codeIdx) => {
                          const isMatch = searchFilter.trim() && code.toLowerCase().includes(searchFilter.toLowerCase())
                          return (
                            <td key={codeIdx} className={`p-2 ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-xs ${isMatch ? 'text-yellow-900 dark:text-yellow-100 font-semibold' : 'text-muted-foreground'}`}>{code}</span>
                                <Input
                                  type="number"
                                  value={formValues[code] || ""}
                                  onChange={(e) => handleInputChange(code, e.target.value)}
                                  className="h-9 text-center min-w-[70px] w-full"
                                />
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revenus de capitaux mobiliers */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Revenus de capitaux mobiliers</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-4 font-medium text-muted-foreground w-3/5"></th>
                    <th className="text-center p-4 font-semibold w-2/5">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Revenus des actions et parts (abattement de 40% si option barème)", code: "2DC" },
                    { label: "Dividendes imposables des titres non cotés détenus dans le PEA ou le PEA-PME", code: "2FU" },
                    { label: "Intérêts et autre produits de placement à revenu fixe", code: "2TR" },
                    { label: "Autres revenus distribués", code: "2TS" },
                    { label: "Intérets des prêts participatifs et des minibons", code: "2TT" },
                    { label: "Intérets imposables des obligations remboursables en actions détenues dans le PEA-PME", code: "2TQ" },
                    { label: "Produits des plans d'épargne retraite - sortie en capital", code: "2TZ" },
                    { label: "Frais et charges (déductibles si option barème)", code: "2CA" },
                    { label: "Crédits d'impôt sur valeurs étrangères", code: "2AB" },
                    { label: "Prélèvement forfaitaire non libératoire déjà versé", code: "2CK" },
                    { label: "Option barème (RCM)", code: "2OP", isCheckbox: true },
                  ]
                    .filter((row) => {
                      if (!searchFilter.trim()) return true
                      const searchLower = searchFilter.toLowerCase()
                      return row.code.toLowerCase().includes(searchLower)
                    })
                    .map((row, idx) => {
                      const isMatch = searchFilter.trim() && row.code.toLowerCase().includes(searchFilter.toLowerCase())
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/30">
                          <td className="p-4 text-sm text-muted-foreground">{row.label}</td>
                          <td className={`p-2 ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs ${isMatch ? 'text-yellow-900 dark:text-yellow-100 font-semibold' : 'text-muted-foreground'}`}>{row.code}</span>
                              {row.isCheckbox ? (
                                <Checkbox
                                  checked={!!formValues[row.code]}
                                  onCheckedChange={(checked) => handleInputChange(row.code, checked as boolean)}
                                />
                              ) : (
                                <Input
                                  type="number"
                                  value={formValues[row.code] || ""}
                                  onChange={(e) => handleInputChange(row.code, e.target.value)}
                                  className="h-9 text-center min-w-[70px] w-full"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Plus-values mobilières */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Plus-values mobilières</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-4 font-medium text-muted-foreground w-3/5"></th>
                    <th className="text-center p-4 font-semibold w-2/5">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Gains nets de cession", code: "3VG" },
                    { label: "Plus-value avant abattement", code: "3SG" },
                    { label: "Moins-values nettes", code: "3VH" },
                  ]
                    .filter((row) => {
                      if (!searchFilter.trim()) return true
                      const searchLower = searchFilter.toLowerCase()
                      return row.code.toLowerCase().includes(searchLower)
                    })
                    .map((row, idx) => {
                      const isMatch = searchFilter.trim() && row.code.toLowerCase().includes(searchFilter.toLowerCase())
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/30">
                          <td className="p-4 text-sm text-muted-foreground">{row.label}</td>
                          <td className={`p-2 ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs ${isMatch ? 'text-yellow-900 dark:text-yellow-100 font-semibold' : 'text-muted-foreground'}`}>{row.code}</span>
                              <Input
                                type="number"
                                value={formValues[row.code] || ""}
                                onChange={(e) => handleInputChange(row.code, e.target.value)}
                                className="h-9 text-center min-w-[70px] w-full"
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revenus fonciers */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Revenus fonciers</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-4 font-medium text-muted-foreground w-3/5"></th>
                    <th className="text-center p-4 font-semibold w-2/5">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Micro-foncier (≤ 15 000 €)", code: "4BE" },
                    { label: "dont recettes de source étrangère ouvrant droit à un crédit d'impôt égal à l'impôt français", code: "4BK" },
                    { label: "Résultat foncier (réel) — bénéfice", code: "4BA" },
                    { label: "dont revenus de source étrangère ouvrant droit à un crédit d'impôt égal à l'impôt français", code: "4BL" },
                    { label: "Déficit imputable sur les revenus fonciers", code: "4BB" },
                    { label: "Déficit imputable sur le revenu global", code: "4BC" },
                    { label: "Déficits antérieurs non encore imputés", code: "4BD" },
                  ]
                    .filter((row) => {
                      if (!searchFilter.trim()) return true
                      const searchLower = searchFilter.toLowerCase()
                      return row.code.toLowerCase().includes(searchLower)
                    })
                    .map((row, idx) => {
                      const isMatch = searchFilter.trim() && row.code.toLowerCase().includes(searchFilter.toLowerCase())
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/30">
                          <td className="p-4 text-sm text-muted-foreground">{row.label}</td>
                          <td className={`p-2 ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs ${isMatch ? 'text-yellow-900 dark:text-yellow-100 font-semibold' : 'text-muted-foreground'}`}>{row.code}</span>
                              <Input
                                type="number"
                                value={formValues[row.code] || ""}
                                onChange={(e) => handleInputChange(row.code, e.target.value)}
                                className="h-9 text-center min-w-[70px] w-full"
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charges déductibles */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Charges déductibles</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-4 font-medium text-muted-foreground w-3/5"></th>
                    <th className="text-center p-4 font-semibold w-2/5">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Pensions alimentaires versées à des enfants majeurs (déclarant 1)", code: "6EL" },
                    { label: "Pensions alimentaires versées à des enfants majeurs (déclarant 2)", code: "6EM" },
                    { label: "Autres pensions alimentaires versées (enfants mineurs, ascendants..)", code: "6GU" },
                    { label: "Cotisations sur les nouveaux plans d'épargne retraite (PER)", code: "6NS" },
                    { label: "Cotisations PERP, PREFON, COREM, CGOS", code: "6RS" },
                    { label: "Plafond de déduction", code: "6PS" },
                  ]
                    .filter((row) => {
                      if (!searchFilter.trim()) return true
                      const searchLower = searchFilter.toLowerCase()
                      return row.code.toLowerCase().includes(searchLower)
                    })
                    .map((row, idx) => {
                      const isMatch = searchFilter.trim() && row.code.toLowerCase().includes(searchFilter.toLowerCase())
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/30">
                          <td className="p-4 text-sm text-muted-foreground">{row.label}</td>
                          <td className={`p-2 ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs ${isMatch ? 'text-yellow-900 dark:text-yellow-100 font-semibold' : 'text-muted-foreground'}`}>{row.code}</span>
                              <Input
                                type="number"
                                value={formValues[row.code] || ""}
                                onChange={(e) => handleInputChange(row.code, e.target.value)}
                                className="h-9 text-center min-w-[70px] w-full"
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
