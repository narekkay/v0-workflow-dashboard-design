"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { OnboardingProgress } from "./onboarding-progress"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Check, 
  X, 
  Clock, 
  User, 
  Home, 
  Users, 
  Wallet, 
  Receipt, 
  FileText,
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Edit3,
  ArrowLeft
} from "lucide-react"
import { confirmOnboarding, requestRevision, updateOnboardingNotes } from "@/app/actions/save-onboarding"
import type { Client } from "@/lib/types"

interface OnboardingViewProps {
  clientId: string
  onBack?: () => void
  onStatusChange?: () => void
}

type OnboardingStatus = "en_attente" | "soumis" | "en_revision" | "confirme"

const statusLabels: Record<OnboardingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: "En attente", color: "bg-gray-100 text-gray-700", icon: <Clock className="h-4 w-4" /> },
  soumis: { label: "Soumis", color: "bg-blue-100 text-blue-700", icon: <FileText className="h-4 w-4" /> },
  en_revision: { label: "En révision", color: "bg-amber-100 text-amber-700", icon: <Edit3 className="h-4 w-4" /> },
  confirme: { label: "Confirmé", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" /> },
}

export function OnboardingView({ clientId, onBack, onStatusChange }: OnboardingViewProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRevisionDialog, setShowRevisionDialog] = useState(false)
  const [showEditNotesDialog, setShowEditNotesDialog] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState("")
  const [confirmNotes, setConfirmNotes] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadClient = async () => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle()

    if (error) {
      console.error("Error loading client for onboarding:", error)
    } else if (data) {
      setClient(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadClient()
  }, [clientId])

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await confirmOnboarding(clientId, confirmNotes)
      setShowConfirmDialog(false)
      setConfirmNotes("")
      
      // Trigger tab reload with loading animation
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error("Erreur confirmation:", error)
      setIsSubmitting(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) return
    setIsSubmitting(true)
    try {
      await requestRevision(clientId, revisionNotes)
      await loadClient()
      setShowRevisionDialog(false)
      setRevisionNotes("")
    } catch (error) {
      console.error("Erreur demande révision:", error)
    }
    setIsSubmitting(false)
  }

  const handleUpdateNotes = async () => {
    setIsSubmitting(true)
    try {
      await updateOnboardingNotes(clientId, editNotes.trim() || null)
      await loadClient()
      setShowEditNotesDialog(false)
    } catch (error) {
      console.error("Erreur mise à jour notes:", error)
    }
    setIsSubmitting(false)
  }

  const openEditNotesDialog = () => {
    setEditNotes(client?.onboarding_notes_avocat || "")
    setShowEditNotesDialog(true)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!client) {
    return <div className="p-6">Client introuvable</div>
  }

  const status = (client.onboarding_status as OnboardingStatus) || "en_attente"
  const statusInfo = statusLabels[status]
  const isFormCompleted = client.onboarding_form_completed

  // Helper function to display yes/no
  const yesNo = (value: boolean | null | undefined) => {
    if (value === true) return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Oui</Badge>
    if (value === false) return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Non</Badge>
    return <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200">Non renseigné</Badge>
  }

  // Helper to format date
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Non renseigné"
    return new Date(date).toLocaleDateString("fr-FR")
  }

  // Helper for currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "Non renseigné"
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mt-1 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              Onboarding {client.first_name} {client.last_name}
            </h2>
            <p className="text-muted-foreground">
              {isFormCompleted 
                ? "Le client a complété son formulaire d'onboarding" 
                : "Le client n'a pas encore complété son formulaire"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${statusInfo.color} flex items-center gap-1.5 px-3 py-1`}>
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
          {client.onboarding_reference && (
            <Badge variant="outline" className="font-mono">
              {client.onboarding_reference}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Progress - Only show if form not yet submitted */}
      {!isFormCompleted && (
        <OnboardingProgress
          conventionSent={client.convention_sent ?? false}
          conventionSigned={client.convention_signed ?? false}
          formPending={client.onboarding_form_pending ?? false}
          formCompleted={client.onboarding_form_completed ?? false}
        />
      )}

      {/* Recap Section - Only show if form is completed */}
      {isFormCompleted && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Récapitulatif des informations</h3>
          </div>

          {/* Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Identité */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  Identité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom complet</span>
                  <span className="font-medium">{client.first_name} {client.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de naissance</span>
                  <span>{formatDate(client.date_naissance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adresse</span>
                  <span className="text-right max-w-[200px] truncate">{client.address || "Non renseignée"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Résidence Fiscale */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-500" />
                  Résidence fiscale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Résident fiscal France</span>
                  {yesNo(client.resident_fiscal_france)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">A vécu à l'étranger</span>
                  {yesNo(client.vecu_etranger)}
                </div>
                {client.vecu_etranger && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pays</span>
                      <span>{client.pays_etranger || "Non renseigné"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jours à l'étranger</span>
                      <span>{client.jours_etranger || "Non renseigné"}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Situation Familiale */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  Situation familiale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Situation</span>
                  <span className="capitalize">{client.situation_familiale || "Non renseignée"}</span>
                </div>
                {client.nom_conjoint && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conjoint</span>
                    <span>{client.nom_conjoint}</span>
                  </div>
                )}
                {client.regime_matrimonial && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Régime matrimonial</span>
                    <span className="capitalize">{client.regime_matrimonial}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Déclaration commune</span>
                  {yesNo(client.declaration_commune)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Changement de situation</span>
                  {yesNo(client.changement_situation_familiale)}
                </div>
              </CardContent>
            </Card>

            {/* Revenus */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-gray-500" />
                  Revenus déclarés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Salaires</span>
                  {yesNo(client.a_salaire)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pensions retraite</span>
                  {yesNo(client.a_pension)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Activité indépendante</span>
                  {yesNo(client.a_activite_independante)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Revenus fonciers</span>
                  {yesNo(client.a_revenus_fonciers)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">LMNP</span>
                  {yesNo(client.a_lmnp)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Crypto</span>
                  {yesNo(client.a_crypto)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Revenus étrangers</span>
                  {yesNo(client.a_revenus_etrangers)}
                </div>
              </CardContent>
            </Card>

            {/* Charges & Déductions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-500" />
                  Charges & Déductions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Dons</span>
                  {yesNo(client.a_dons)}
                </div>
                {client.a_dons && client.montant_dons && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant dons</span>
                    <span>{formatCurrency(client.montant_dons)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Frais de garde</span>
                  {yesNo(client.a_frais_garde)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Services à la personne</span>
                  {yesNo(client.a_services_personne)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pension alimentaire déductible</span>
                  {yesNo(client.a_deduction_pension)}
                </div>
              </CardContent>
            </Card>

            {/* Dates & Confirmation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Soumission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Soumis le</span>
                  <span>{formatDate(client.onboarding_soumis_le)}</span>
                </div>
                {client.onboarding_confirme_le && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confirmé le</span>
                    <span>{formatDate(client.onboarding_confirme_le)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Exactitude confirmée</span>
                  {yesNo(client.onboarding_exactitude_confirmee)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Traitement accepté</span>
                  {yesNo(client.onboarding_traitement_accepte)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes avocat */}
          {client.onboarding_notes_avocat && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  Notes de l'avocat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900">{client.onboarding_notes_avocat}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {status === "soumis" && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmer l'onboarding
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRevisionDialog(true)}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Demander des modifications
              </Button>
            </div>
          )}

          {status === "confirme" && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">
                  Onboarding confirmé le {formatDate(client.onboarding_confirme_le)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openEditNotesDialog}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {client.onboarding_notes_avocat ? "Modifier la note" : "Ajouter une note"}
              </Button>
            </div>
          )}

          {status === "en_revision" && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Edit3 className="h-5 w-5 text-amber-600" />
                <span className="text-amber-700 font-medium">
                  En attente de modifications du client
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Annuler la révision et confirmer
                </Button>
                <Button
                  variant="outline"
                  onClick={openEditNotesDialog}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Modifier la note
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* If form not completed - Show actions */}
      {!isFormCompleted && (
        <div className="space-y-6">
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">En attente du client</h3>
              <p className="text-sm text-muted-foreground">
                Le client n'a pas encore complété son formulaire d'onboarding.
              </p>
            </CardContent>
          </Card>
          
          {/* Actions disponibles - only when form not submitted */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  const link = `${window.location.origin}/onboarding/${clientId}`
                  navigator.clipboard.writeText(link)
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Copier le lien du formulaire
              </Button>
              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(`/onboarding/${clientId}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir le formulaire client
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'onboarding</DialogTitle>
            <DialogDescription>
              En confirmant, vous validez que toutes les informations fournies par le client sont correctes et complètes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes (optionnel)</label>
              <Textarea
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="Ajoutez des notes si nécessaire..."
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notes Dialog */}
      <Dialog open={showEditNotesDialog} onOpenChange={setShowEditNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la note</DialogTitle>
            <DialogDescription>
              Modifiez ou supprimez la note associée à cet onboarding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Note (optionnel)</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ajoutez une note..."
                className="mt-1.5"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditNotesDialog(false)}>
              Annuler
            </Button>
            {client?.onboarding_notes_avocat && (
              <Button 
                variant="outline"
                onClick={() => {
                  setEditNotes("")
                  handleUpdateNotes()
                }}
                disabled={isSubmitting}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Supprimer la note
              </Button>
            )}
            <Button 
              onClick={handleUpdateNotes} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander des modifications</DialogTitle>
            <DialogDescription>
              Décrivez les modifications que le client doit apporter à son formulaire.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Notes pour le client <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Décrivez les modifications nécessaires..."
                className="mt-1.5"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleRequestRevision} 
              disabled={isSubmitting || !revisionNotes.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Edit3 className="h-4 w-4 mr-2" />
              )}
              Demander des modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
