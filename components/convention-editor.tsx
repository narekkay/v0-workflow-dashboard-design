"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, RotateCcw, Clock, AlertCircle, CheckCircle2 } from "lucide-react"

interface ConventionEditorProps {
  conventionType: "forfait" | "temps_passe" | "existant" | null
  hasResultClause: boolean
  clientData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
  }
  onBack: () => void
  onValidate: () => void
}

interface AuditEntry {
  field: string
  oldValue: string
  newValue: string
  timestamp: Date
}

// Mock data for pre-filling
const defaultCabinetData = {
  cabinet: "Cabinet Martin & Associés",
  avocat: "Me Sophie Martin",
  barreau: "Paris",
  adresseCabinet: "25 Avenue Montaigne, 75008 Paris",
  emailCabinet: "contact@martin-avocats.fr",
  telephone: "+33 1 45 67 89 00",
}

export function ConventionEditor({
  conventionType,
  hasResultClause: initialHasResultClause,
  clientData,
  onBack,
  onValidate,
}: ConventionEditorProps) {
  // Cabinet data
  const [cabinet, setCabinet] = useState(defaultCabinetData.cabinet)
  const [avocat, setAvocat] = useState(defaultCabinetData.avocat)
  const [barreau, setBarreau] = useState(defaultCabinetData.barreau)
  const [adresseCabinet, setAdresseCabinet] = useState(defaultCabinetData.adresseCabinet)
  const [emailCabinet, setEmailCabinet] = useState(defaultCabinetData.emailCabinet)
  const [telephoneCabinet, setTelephoneCabinet] = useState(defaultCabinetData.telephone)

  // Client data
  const [clientType, setClientType] = useState<"particulier" | "societe">("particulier")
  const [clientNom, setClientNom] = useState(clientData.lastName)
  const [clientPrenom, setClientPrenom] = useState(clientData.firstName)
  const [clientAdresse, setClientAdresse] = useState(clientData.address)
  const [clientEmail, setClientEmail] = useState(clientData.email)
  // Société fields
  const [societeNom, setSocieteNom] = useState("")
  const [societeForme, setSocieteForme] = useState("SAS")
  const [societeCapital, setSocieteCapital] = useState("")
  const [societeAdresse, setSocieteAdresse] = useState("")
  const [societeRcs, setSocieteRcs] = useState("")
  const [societeSiren, setSocieteSiren] = useState("")
  const [societeRepresentant, setSocieteRepresentant] = useState("")

  // Mission
  const [natureMission, setNatureMission] = useState("conseil")
  const [juridiction, setJuridiction] = useState("")
  const [juridictionAutre, setJuridictionAutre] = useState("")
  const [descriptionMission, setDescriptionMission] = useState("Conseil et assistance juridique dans le cadre d'un litige commercial.")
  const [diligences, setDiligences] = useState({
    rdv: true,
    etude: true,
    redaction: true,
    audiences: false,
    negociation: true,
    suivi: true,
  })

  // Honoraires - Forfait
  const [montantForfait, setMontantForfait] = useState("3000")
  const [tva, setTva] = useState("20")
  const [tauxAssocie, setTauxAssocie] = useState("350")
  const [tauxCollaborateur, setTauxCollaborateur] = useState("200")
  const [anneeReference, setAnneeReference] = useState("2026")
  const [echeancier, setEcheancier] = useState("1x")
  const [echeancierCustom, setEcheancierCustom] = useState({ part1: "50", part2: "50", part3: "40" })

  // Honoraires - Temps passé
  const [uniteTemps, setUniteTemps] = useState("6")
  const [periodiciteFacturation, setPeriodiciteFacturation] = useState("mensuelle")
  const [revisionTaux, setRevisionTaux] = useState(true)
  const [budgetPrevisionnel, setBudgetPrevisionnel] = useState(false)
  const [estimationHonoraires, setEstimationHonoraires] = useState("")
  const [tauxEstimation, setTauxEstimation] = useState(tauxAssocie)
  const [estimationFrais, setEstimationFrais] = useState("")
  const [seuilAlerte, setSeuilAlerte] = useState("20")

  // Paiement
  const [echeancePaiement, setEcheancePaiement] = useState("reception")
  const [modeReglement, setModeReglement] = useState("virement")
  const [provisionActive, setProvisionActive] = useState(false)
  const [provisionType, setProvisionType] = useState("montant")
  const [provisionValeur, setProvisionValeur] = useState("")

  // Frais
  const [deplacementsRefactures, setDeplacementsRefactures] = useState(true)

  // RGPD
  const [rgpdActive, setRgpdActive] = useState(true)
  const [responsableTraitement, setResponsableTraitement] = useState(`Le Cabinet / ${avocat}`)
  const [emailDpo, setEmailDpo] = useState(emailCabinet)
  const [adresseRgpd, setAdresseRgpd] = useState(adresseCabinet)
  const [hebergementExterne, setHebergementExterne] = useState(false)
  const [nomPrestataire, setNomPrestataire] = useState("")
  const [paysHebergement, setPaysHebergement] = useState("")
  const [transfertHorsUe, setTransfertHorsUe] = useState(false)

  // Contestation
  const [villeBatonnier, setVilleBatonnier] = useState("Paris")

  // Rétractation
  const [conventionDistance, setConventionDistance] = useState(false)
  const [clientConsommateur, setClientConsommateur] = useState(clientType === "particulier")

  // Clause de résultat
  const [clauseResultat, setClauseResultat] = useState(initialHasResultClause)
  const [typeCalculResultat, setTypeCalculResultat] = useState("economie")
  const [pourcentageResultat, setPourcentageResultat] = useState("10")
  const [sommesMaxReclamees, setSommesMaxReclamees] = useState("")
  const [resultatMinimum, setResultatMinimum] = useState("")
  const [plafondActif, setPlafondActif] = useState(false)
  const [plafondValeur, setPlafondValeur] = useState("")
  const [inclureArticle700, setInclureArticle700] = useState(true)
  const [resultatDessaisissement, setResultatDessaisissement] = useState(true)

  // UI State
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [manualEdits, setManualEdits] = useState<Date[]>([])
  const documentRef = useRef<HTMLDivElement>(null)

  // Computed values
  const montantTTC = parseFloat(montantForfait || "0") * (1 + parseFloat(tva || "0") / 100)
  const mode = conventionType === "temps_passe" ? "temps_passe" : "forfait"

  // Check if ready for signature
  const isReadyForSignature = useCallback(() => {
    const baseRequired = cabinet && avocat && adresseCabinet && descriptionMission && echeancePaiement
    const clientRequired = clientType === "particulier" 
      ? clientNom && clientPrenom && clientAdresse
      : societeNom && societeAdresse
    const honorairesRequired = mode === "forfait"
      ? montantForfait
      : tauxAssocie && uniteTemps && periodiciteFacturation
    const clauseResultatRequired = !clauseResultat || (pourcentageResultat && (
      typeCalculResultat === "economie" ? true :
      typeCalculResultat === "gain" ? resultatMinimum :
      typeCalculResultat === "condamnation" ? (!plafondActif || plafondValeur) : true
    ))
    
    return baseRequired && clientRequired && honorairesRequired && clauseResultatRequired
  }, [cabinet, avocat, adresseCabinet, descriptionMission, echeancePaiement, clientType, clientNom, clientPrenom, clientAdresse, societeNom, societeAdresse, mode, montantForfait, tauxAssocie, uniteTemps, periodiciteFacturation, clauseResultat, pourcentageResultat, typeCalculResultat, resultatMinimum, plafondActif, plafondValeur])

  // Log audit entry
  const logAudit = useCallback((field: string, oldValue: string, newValue: string) => {
    setAuditLog(prev => [...prev, { field, oldValue, newValue, timestamp: new Date() }])
    setLastUpdate(new Date())
  }, [])

  // Update client consumer status when client type changes
  useEffect(() => {
    setClientConsommateur(clientType === "particulier")
  }, [clientType])

  // Generate document HTML with tokens
  const generateDocument = useCallback(() => {
    const clientInfo = clientType === "particulier"
      ? `${clientPrenom} ${clientNom}, demeurant ${clientAdresse}`
      : `${societeNom}, ${societeForme} au capital de ${societeCapital} euros, dont le siège social est situé ${societeAdresse}, immatriculée au RCS de ${societeRcs} sous le numéro ${societeSiren}, représentée par ${societeRepresentant}`

    const diligencesList = Object.entries(diligences)
      .filter(([, v]) => v)
      .map(([k]) => {
        const labels: Record<string, string> = {
          rdv: "Rendez-vous et échanges",
          etude: "Étude du dossier et des pièces",
          redaction: "Rédaction d'actes et conclusions",
          audiences: "Représentation aux audiences",
          negociation: "Négociation",
          suivi: "Suivi client",
        }
        return labels[k]
      })
      .join(", ")

    const echeancierText = echeancier === "1x" ? "en une seule fois"
      : echeancier === "2x" ? `en deux versements de ${echeancierCustom.part1}% et ${echeancierCustom.part2}%`
      : `en trois versements de ${echeancierCustom.part1}%, ${echeancierCustom.part2}% et ${echeancierCustom.part3}%`

    const missionNatures: Record<string, string> = {
      conseil: "Conseil et consultation juridique",
      contentieux: "Représentation en contentieux",
      negociation: "Négociation et transaction",
      redaction: "Rédaction d'actes",
      autre: "Autre mission juridique",
    }

    let articleNumber = 1

    return `
      <div class="document-content">
        <h1 class="text-xl font-bold text-center mb-6 uppercase">
          CONTRAT DE MISSION ET DE RÉMUNÉRATION<br/>
          <span class="text-lg">${mode === "forfait" ? "AU FORFAIT" : "AU TEMPS PASSÉ"}</span>
        </h1>

        <section class="mb-6">
          <h2 class="font-bold mb-2">ENTRE LES SOUSSIGNÉS :</h2>
          <p class="mb-2">
            <strong>Le Cabinet :</strong><br/>
            <span data-token="cabinet" data-last="${cabinet}">${cabinet}</span>, représenté par 
            <span data-token="avocat" data-last="${avocat}">${avocat}</span>, Avocat inscrit au Barreau de 
            <span data-token="barreau" data-last="${barreau}">${barreau}</span>,<br/>
            Adresse : <span data-token="adresseCabinet" data-last="${adresseCabinet}">${adresseCabinet}</span><br/>
            ${emailCabinet ? `Email : <span data-token="emailCabinet" data-last="${emailCabinet}">${emailCabinet}</span><br/>` : ""}
            ${telephoneCabinet ? `Téléphone : <span data-token="telephoneCabinet" data-last="${telephoneCabinet}">${telephoneCabinet}</span>` : ""}
          </p>
          <p class="text-center my-2">ET</p>
          <p>
            <strong>Le Client :</strong><br/>
            <span data-token="clientInfo" data-last="${clientInfo}">${clientInfo}</span><br/>
            ${clientEmail ? `Email : <span data-token="clientEmail" data-last="${clientEmail}">${clientEmail}</span>` : ""}
          </p>
        </section>

        <section class="mb-6">
          <h2 class="font-bold mb-2">PRÉAMBULE</h2>
          <p>
            Le Client souhaite confier à l'Avocat une mission de ${missionNatures[natureMission]?.toLowerCase() || natureMission}.
            La présente convention a pour objet de définir les modalités de cette mission ainsi que les conditions de rémunération de l'Avocat.
          </p>
        </section>

        ${rgpdActive ? `
        <section class="mb-6">
          <h2 class="font-bold mb-2">ARTICLE PRÉLIMINAIRE – PROTECTION DES DONNÉES PERSONNELLES</h2>
          <p class="mb-2">
            Dans le cadre de l'exécution de la présente convention, l'Avocat est amené à collecter et traiter des données personnelles du Client.
            Le responsable du traitement est <span data-token="responsableTraitement" data-last="${responsableTraitement}">${responsableTraitement}</span>.
          </p>
          <p class="mb-2">
            Les données collectées sont traitées pour les finalités suivantes : gestion du dossier, facturation, respect des obligations légales.
            Conformément au RGPD, le Client dispose d'un droit d'accès, de rectification, d'effacement et de portabilité de ses données.
          </p>
          <p>
            Pour exercer ces droits, le Client peut contacter : <span data-token="emailDpo" data-last="${emailDpo}">${emailDpo}</span>
            ou par courrier : <span data-token="adresseRgpd" data-last="${adresseRgpd}">${adresseRgpd}</span>.
          </p>
          ${hebergementExterne ? `
          <p class="mt-2">
            Les données peuvent être hébergées par ${nomPrestataire} (${paysHebergement}).
            ${transfertHorsUe ? "En cas de transfert hors UE, les clauses contractuelles types de la Commission européenne s'appliquent." : ""}
          </p>
          ` : ""}
        </section>
        ` : ""}

        <section class="mb-6">
          <h2 class="font-bold mb-2">ARTICLE ${articleNumber++} – MISSION</h2>
          <p class="mb-2">
            <strong>Nature de la mission :</strong> ${missionNatures[natureMission] || natureMission}
            ${natureMission === "contentieux" && juridiction ? ` devant ${juridiction === "autre" ? juridictionAutre : juridiction}` : ""}
          </p>
          <p class="mb-2">
            <strong>Description :</strong><br/>
            <span data-token="descriptionMission" data-last="${descriptionMission}">${descriptionMission}</span>
          </p>
          ${diligencesList ? `
          <p>
            <strong>Diligences incluses :</strong> ${diligencesList}.
          </p>
          ` : ""}
        </section>

        <section class="mb-6">
          <h2 class="font-bold mb-2">ARTICLE ${articleNumber++} – DÉTERMINATION DES HONORAIRES</h2>
          ${mode === "forfait" ? `
          <p class="mb-2">
            Les honoraires de l'Avocat sont fixés de manière forfaitaire à 
            <span data-token="montantForfait" data-last="${montantForfait}">${montantForfait}</span> € HT,
            soit <span data-token="montantTTC" data-last="${montantTTC.toFixed(2)}">${montantTTC.toFixed(2)}</span> € TTC 
            (TVA à <span data-token="tva" data-last="${tva}">${tva}</span>%).
          </p>
          <p class="mb-2">
            Ce forfait couvre l'ensemble des diligences décrites à l'article précédent.
            Toute prestation complémentaire fera l'objet d'un avenant.
          </p>
          <p class="mb-2">
            <strong>Modalités de paiement :</strong> ${echeancierText}.
          </p>
          <p class="text-sm text-muted-foreground">
            À titre informatif, les taux horaires du Cabinet sont de ${tauxAssocie} €/h HT (associé) et ${tauxCollaborateur} €/h HT (collaborateur) - Année ${anneeReference}.
          </p>
          ` : `
          <p class="mb-2">
            Les honoraires de l'Avocat sont calculés au temps passé selon les taux horaires suivants :
          </p>
          <ul class="list-disc ml-6 mb-2">
            <li>Associé : <span data-token="tauxAssocie" data-last="${tauxAssocie}">${tauxAssocie}</span> € HT / heure</li>
            <li>Collaborateur : <span data-token="tauxCollaborateur" data-last="${tauxCollaborateur}">${tauxCollaborateur}</span> € HT / heure</li>
          </ul>
          <p class="mb-2">
            TVA applicable : <span data-token="tva" data-last="${tva}">${tva}</span>%
          </p>
          <p class="mb-2">
            <strong>Unité de temps facturable :</strong> ${uniteTemps} minutes<br/>
            <strong>Périodicité de facturation :</strong> ${periodiciteFacturation}
          </p>
          ${revisionTaux ? `<p class="mb-2">Les taux horaires sont susceptibles d'être révisés à chaque date anniversaire de la convention.</p>` : ""}
          ${budgetPrevisionnel && estimationHonoraires ? `
          <p class="mb-2">
            <strong>Budget prévisionnel :</strong><br/>
            Estimation honoraires : ${estimationHonoraires} € HT (au taux de ${tauxEstimation} €/h)<br/>
            ${estimationFrais ? `Estimation frais et débours : ${estimationFrais} € HT` : ""}
          </p>
          ` : ""}
          `}
        </section>

        ${clauseResultat ? `
        <section class="mb-6">
          <h2 class="font-bold mb-2">ARTICLE ${articleNumber++} – HONORAIRE COMPLÉMENTAIRE DE RÉSULTAT</h2>
          <p class="mb-2">
            En sus des honoraires ${mode === "forfait" ? "forfaitaires" : "au temps passé"} prévus ci-dessus, 
            un honoraire complémentaire de résultat est convenu entre les parties.
          </p>
          ${typeCalculResultat === "economie" ? `
          <p class="mb-2">
            Cet honoraire sera calculé sur l'économie réalisée (E), définie comme la différence entre 
            les sommes maximales initialement réclamées${sommesMaxReclamees ? ` (${sommesMaxReclamees} €)` : ""} (R) 
            et les sommes effectivement dues à l'issue du litige (C).
          </p>
          <p class="mb-2">
            L'honoraire de résultat sera égal à <span data-token="pourcentageResultat" data-last="${pourcentageResultat}">${pourcentageResultat}</span>% 
            de l'économie réalisée (E = R - C).
          </p>
          ` : typeCalculResultat === "gain" ? `
          <p class="mb-2">
            Cet honoraire sera calculé sur le gain obtenu (G), défini comme la différence entre 
            les sommes effectivement obtenues (C) et le résultat minimum prévu (P = ${resultatMinimum} €).
          </p>
          <p class="mb-2">
            L'honoraire de résultat sera égal à <span data-token="pourcentageResultat" data-last="${pourcentageResultat}">${pourcentageResultat}</span>% 
            du gain obtenu (G = C - P).
          </p>
          ` : `
          <p class="mb-2">
            L'honoraire de résultat sera égal à <span data-token="pourcentageResultat" data-last="${pourcentageResultat}">${pourcentageResultat}</span>% 
            des sommes effectivement obtenues à titre de condamnation.
            ${plafondActif && plafondValeur ? `Cet honoraire est plafonné à ${plafondValeur} €.` : ""}
          </p>
          `}
          ${inclureArticle700 ? `<p class="mb-2">Les sommes allouées au titre de l'article 700 du CPC sont incluses dans l'assiette de calcul.</p>` : ""}
          ${resultatDessaisissement ? `<p class="mb-2">L'honoraire de résultat reste dû même en cas de dessaisissement de l'Avocat, si le résultat est ultérieurement obtenu.</p>` : ""}
        </section>
        ` : ""}

        <section class="mb-6">
          <h2 class="font-bold mb-2">ARTICLE ${articleNumber++} – FRAIS, DÉBOURS ET DÉPENS</h2>
          <p class="mb-2">
            Les frais et débours engagés par l'Avocat (huissier, copies, timbres, expertises, etc.) sont refacturés au Client à l'identique.
            Les dépens sont à la charge de la partie condamnée, conformément à la décision de justice.
          </p>
          ${deplacementsRefactures ? `<p>Les frais de déplacement sont refacturés selon le barème kilométrique fiscal en vigueur.</p>` : ""}
        </section>

        <section class="mb-6">
          <h2 class="font-bold mb-2">ARTICLE ${articleNumber++} – RÈGLEMENT</h2>
          <p class="mb-2">
            <strong>Échéance de paiement :</strong> ${
              echeancePaiement === "reception" ? "À réception de la facture" :
              echeancePaiement === "7" ? "7 jours après réception" :
              echeancePaiement === "15" ? "15 jours après réception" :
              echeancePaiement === "30" ? "30 jours après réception" :
              "45 jours fin de mois"
            }<br/>
            <strong>Mode de règlement :</strong> ${modeReglement === "virement" ? "Virement bancaire" : modeReglement === "carte" ? "Carte bancaire" : "Prélèvement automatique"}
          </p>
          ${provisionActive ? `
          <p class="mb-2">
            <strong>Provision :</strong> Une provision de ${provisionType === "montant" ? `${provisionValeur} €` : `${provisionValeur}%`} 
            est demandée avant le début de la mission.
          </p>
          ` : ""}
          <p>
            En cas de retard de paiement, des intérêts de retard au taux légal majoré seront appliqués de plein droit, 
            sans mise en demeure préalable, conformément à l'article L.441-10 du Code de commerce.
          </p>
        </section>

        <section class="mb-6">
          <h2 class="font-bold mb-2">ARTICLE ${articleNumber++} – CONTESTATIONS</h2>
          <p class="mb-2">
            En cas de contestation des honoraires, le Client peut saisir le Bâtonnier de l'Ordre des Avocats de 
            <span data-token="villeBatonnier" data-last="${villeBatonnier}">${villeBatonnier}</span>.
          </p>
          <p>
            En cas de différend persistant, les parties peuvent recourir à la médiation de la consommation 
            auprès du Médiateur de la Consommation de la profession d'Avocat (CNB).
          </p>
        </section>

        ${conventionDistance && clientConsommateur ? `
        <section class="mb-6">
          <h2 class="font-bold mb-2">ARTICLE ${articleNumber++} – DROIT DE RÉTRACTATION</h2>
          <p class="mb-2">
            Conformément aux articles L.221-18 et suivants du Code de la consommation, le Client consommateur 
            dispose d'un délai de 14 jours pour exercer son droit de rétractation, sans avoir à motiver sa décision.
          </p>
          <p class="mb-2">
            Ce délai court à compter de la conclusion du contrat. Le Client peut utiliser le formulaire de rétractation 
            ci-annexé ou toute autre déclaration dénuée d'ambiguïté.
          </p>
          <div class="border p-4 mt-4">
            <h3 class="font-bold mb-2">FORMULAIRE DE RÉTRACTATION</h3>
            <p class="text-sm">
              À l'attention de ${cabinet}, ${adresseCabinet}<br/><br/>
              Je notifie par la présente ma rétractation du contrat de mission conclu le ____/____/________.<br/><br/>
              Nom du Client : ____________________<br/>
              Adresse : ____________________<br/>
              Signature (si notification papier) : ____________________<br/>
              Date : ____/____/________
            </p>
          </div>
        </section>
        ` : ""}

        <section class="mt-8">
          <p class="mb-4">
            Fait à <span data-token="villeBatonnier" data-last="${villeBatonnier}">${villeBatonnier}</span>, 
            le ____/____/________
          </p>
          <p class="mb-2">En deux exemplaires originaux.</p>
          <div class="grid grid-cols-2 gap-8 mt-8">
            <div>
              <p class="font-bold mb-2">L'Avocat</p>
              <p class="text-sm mb-4">${avocat}</p>
              <p class="text-sm text-muted-foreground">(signature précédée de la mention "Lu et approuvé")</p>
              <div class="h-24 border-b border-dashed mt-4"></div>
            </div>
            <div>
              <p class="font-bold mb-2">Le Client</p>
              <p class="text-sm mb-4">${clientType === "particulier" ? `${clientPrenom} ${clientNom}` : societeNom}</p>
              <p class="text-sm text-muted-foreground">(signature précédée de la mention "Lu et approuvé")</p>
              <div class="h-24 border-b border-dashed mt-4"></div>
            </div>
          </div>
        </section>
      </div>
    `
  }, [mode, cabinet, avocat, barreau, adresseCabinet, emailCabinet, telephoneCabinet, clientType, clientNom, clientPrenom, clientAdresse, clientEmail, societeNom, societeForme, societeCapital, societeAdresse, societeRcs, societeSiren, societeRepresentant, natureMission, juridiction, juridictionAutre, descriptionMission, diligences, montantForfait, tva, montantTTC, tauxAssocie, tauxCollaborateur, anneeReference, echeancier, echeancierCustom, uniteTemps, periodiciteFacturation, revisionTaux, budgetPrevisionnel, estimationHonoraires, tauxEstimation, estimationFrais, clauseResultat, typeCalculResultat, pourcentageResultat, sommesMaxReclamees, resultatMinimum, plafondActif, plafondValeur, inclureArticle700, resultatDessaisissement, deplacementsRefactures, echeancePaiement, modeReglement, provisionActive, provisionType, provisionValeur, rgpdActive, responsableTraitement, emailDpo, adresseRgpd, hebergementExterne, nomPrestataire, paysHebergement, transfertHorsUe, villeBatonnier, conventionDistance, clientConsommateur])

  // Handle document manual edit
  const handleDocumentInput = useCallback(() => {
    setManualEdits(prev => [...prev, new Date()])
    setLastUpdate(new Date())
  }, [])

  // Reset document
  const handleReset = useCallback(() => {
    if (documentRef.current) {
      documentRef.current.innerHTML = generateDocument()
    }
    setShowResetModal(false)
    setManualEdits([])
    setLastUpdate(new Date())
  }, [generateDocument])

  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Convention d'honoraires</h1>
            <Badge variant={isReadyForSignature() ? "default" : "secondary"} className={isReadyForSignature() ? "bg-green-600" : ""}>
              {isReadyForSignature() ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Prêt à signature</>
              ) : (
                "Brouillon"
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Dernière mise à jour : {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Parameters */}
          <div className="w-[420px] border-r overflow-y-auto p-6 space-y-6">
            <Tabs defaultValue="parties" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="parties">Parties</TabsTrigger>
                <TabsTrigger value="mission">Mission</TabsTrigger>
                <TabsTrigger value="honoraires">Honoraires</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>

              {/* Parties Tab */}
              <TabsContent value="parties" className="space-y-6 mt-4">
                {/* Cabinet */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Avocat / Cabinet</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cabinet *</Label>
                      <Input value={cabinet} onChange={(e) => setCabinet(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nom de l'avocat *</Label>
                      <Input value={avocat} onChange={(e) => setAvocat(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Barreau</Label>
                        <Input value={barreau} onChange={(e) => setBarreau(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Téléphone</Label>
                        <Input value={telephoneCabinet} onChange={(e) => setTelephoneCabinet(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Adresse *</Label>
                      <Input value={adresseCabinet} onChange={(e) => setAdresseCabinet(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email</Label>
                      <Input value={emailCabinet} onChange={(e) => setEmailCabinet(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                {/* Client */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={clientType === "particulier" ? "default" : "outline"}
                        onClick={() => setClientType("particulier")}
                        className="flex-1"
                      >
                        Particulier
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={clientType === "societe" ? "default" : "outline"}
                        onClick={() => setClientType("societe")}
                        className="flex-1"
                      >
                        Société
                      </Button>
                    </div>

                    {clientType === "particulier" ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Prénom *</Label>
                            <Input value={clientPrenom} onChange={(e) => setClientPrenom(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Nom *</Label>
                            <Input value={clientNom} onChange={(e) => setClientNom(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Adresse *</Label>
                          <Input value={clientAdresse} onChange={(e) => setClientAdresse(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email</Label>
                          <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Dénomination sociale *</Label>
                          <Input value={societeNom} onChange={(e) => setSocieteNom(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Forme juridique</Label>
                            <Select value={societeForme} onValueChange={setSocieteForme}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SAS">SAS</SelectItem>
                                <SelectItem value="SASU">SASU</SelectItem>
                                <SelectItem value="SARL">SARL</SelectItem>
                                <SelectItem value="EURL">EURL</SelectItem>
                                <SelectItem value="SA">SA</SelectItem>
                                <SelectItem value="SCI">SCI</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Capital (€)</Label>
                            <Input value={societeCapital} onChange={(e) => setSocieteCapital(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Adresse siège *</Label>
                          <Input value={societeAdresse} onChange={(e) => setSocieteAdresse(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">RCS + Ville</Label>
                            <Input value={societeRcs} onChange={(e) => setSocieteRcs(e.target.value)} placeholder="Paris" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">SIREN/SIRET</Label>
                            <Input value={societeSiren} onChange={(e) => setSocieteSiren(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Représentant (Nom / Qualité)</Label>
                          <Input value={societeRepresentant} onChange={(e) => setSocieteRepresentant(e.target.value)} placeholder="M. Dupont, Président" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mission Tab */}
              <TabsContent value="mission" className="space-y-6 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Nature de la mission</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type de mission *</Label>
                      <Select value={natureMission} onValueChange={setNatureMission}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conseil">Conseil / consultation</SelectItem>
                          <SelectItem value="contentieux">Contentieux</SelectItem>
                          <SelectItem value="negociation">Négociation / transaction</SelectItem>
                          <SelectItem value="redaction">Rédaction d'actes</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {natureMission === "contentieux" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Juridiction</Label>
                        <Select value={juridiction} onValueChange={setJuridiction}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TJ">Tribunal Judiciaire</SelectItem>
                            <SelectItem value="CA">Cour d'Appel</SelectItem>
                            <SelectItem value="CE">Conseil d'État</SelectItem>
                            <SelectItem value="CJUE">CJUE</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        {juridiction === "autre" && (
                          <Input 
                            className="mt-2" 
                            placeholder="Précisez la juridiction" 
                            value={juridictionAutre} 
                            onChange={(e) => setJuridictionAutre(e.target.value)} 
                          />
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs">Description de la mission *</Label>
                      <Textarea 
                        rows={3} 
                        value={descriptionMission} 
                        onChange={(e) => setDescriptionMission(e.target.value)}
                        placeholder="Décrivez brièvement la mission..."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Diligences incluses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries({
                      rdv: "RDV / échanges",
                      etude: "Étude du dossier & pièces",
                      redaction: "Rédaction",
                      audiences: "Audiences",
                      negociation: "Négociation",
                      suivi: "Suivi client",
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={diligences[key as keyof typeof diligences]}
                          onCheckedChange={(checked) => setDiligences({ ...diligences, [key]: checked === true })}
                        />
                        <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Honoraires Tab */}
              <TabsContent value="honoraires" className="space-y-6 mt-4">
                {mode === "forfait" ? (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Forfait</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Montant HT (€) *</Label>
                            <Input type="number" value={montantForfait} onChange={(e) => setMontantForfait(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">TVA (%)</Label>
                            <Select value={tva} onValueChange={setTva}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5.5">5.5%</SelectItem>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="20">20%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium">Total TTC : {montantTTC.toFixed(2)} €</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Échéancier</Label>
                          <Select value={echeancier} onValueChange={setEcheancier}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1x">Paiement unique</SelectItem>
                              <SelectItem value="2x">2 versements</SelectItem>
                              <SelectItem value="3x">3 versements</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Taux horaires (informatif)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Associé (€/h HT)</Label>
                            <Input type="number" value={tauxAssocie} onChange={(e) => setTauxAssocie(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Collaborateur (€/h HT)</Label>
                            <Input type="number" value={tauxCollaborateur} onChange={(e) => setTauxCollaborateur(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Année de référence</Label>
                          <Input value={anneeReference} onChange={(e) => setAnneeReference(e.target.value)} />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Taux horaires</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Associé (€/h HT) *</Label>
                            <Input type="number" value={tauxAssocie} onChange={(e) => setTauxAssocie(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Collaborateur (€/h HT)</Label>
                            <Input type="number" value={tauxCollaborateur} onChange={(e) => setTauxCollaborateur(e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">TVA (%)</Label>
                            <Select value={tva} onValueChange={setTva}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5.5">5.5%</SelectItem>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="20">20%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Année</Label>
                            <Input value={anneeReference} onChange={(e) => setAnneeReference(e.target.value)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Facturation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Unité de temps *</Label>
                          <Select value={uniteTemps} onValueChange={setUniteTemps}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6">6 minutes</SelectItem>
                              <SelectItem value="10">10 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 heure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Périodicité *</Label>
                          <Select value={periodiciteFacturation} onValueChange={setPeriodiciteFacturation}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                              <SelectItem value="bimensuelle">Bimensuelle</SelectItem>
                              <SelectItem value="mensuelle">Mensuelle</SelectItem>
                              <SelectItem value="cloture">À la clôture</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Révision annuelle des taux</Label>
                          <Switch checked={revisionTaux} onCheckedChange={setRevisionTaux} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Budget prévisionnel</CardTitle>
                          <Switch checked={budgetPrevisionnel} onCheckedChange={setBudgetPrevisionnel} />
                        </div>
                      </CardHeader>
                      {budgetPrevisionnel && (
                        <CardContent className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Estimation honoraires HT (€)</Label>
                            <Input type="number" value={estimationHonoraires} onChange={(e) => setEstimationHonoraires(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Estimation frais HT (€)</Label>
                            <Input type="number" value={estimationFrais} onChange={(e) => setEstimationFrais(e.target.value)} />
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Paiement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Échéance *</Label>
                      <Select value={echeancePaiement} onValueChange={setEcheancePaiement}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reception">À réception</SelectItem>
                          <SelectItem value="7">7 jours</SelectItem>
                          <SelectItem value="15">15 jours</SelectItem>
                          <SelectItem value="30">30 jours</SelectItem>
                          <SelectItem value="45fm">45 jours fin de mois</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mode de règlement</Label>
                      <Select value={modeReglement} onValueChange={setModeReglement}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="virement">Virement</SelectItem>
                          <SelectItem value="carte">Carte bancaire</SelectItem>
                          <SelectItem value="prelevement">Prélèvement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Provision / acompte</Label>
                      <Switch checked={provisionActive} onCheckedChange={setProvisionActive} />
                    </div>
                    {provisionActive && (
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={provisionType} onValueChange={setProvisionType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="montant">Montant fixe (€)</SelectItem>
                            <SelectItem value="pourcentage">Pourcentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" value={provisionValeur} onChange={(e) => setProvisionValeur(e.target.value)} placeholder={provisionType === "montant" ? "€" : "%"} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Options Tab */}
              <TabsContent value="options" className="space-y-6 mt-4">
                {/* Clause de résultat */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Honoraire de résultat</CardTitle>
                      <Switch checked={clauseResultat} onCheckedChange={setClauseResultat} />
                    </div>
                  </CardHeader>
                  {clauseResultat && (
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type de calcul</Label>
                        <Select value={typeCalculResultat} onValueChange={setTypeCalculResultat}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="economie">Économie réalisée (R - C)</SelectItem>
                            <SelectItem value="gain">Gain obtenu (C - P)</SelectItem>
                            <SelectItem value="condamnation">% de condamnation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Pourcentage (%) *</Label>
                        <Input type="number" value={pourcentageResultat} onChange={(e) => setPourcentageResultat(e.target.value)} />
                      </div>
                      {typeCalculResultat === "economie" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Sommes max réclamées (R) €</Label>
                          <Input type="number" value={sommesMaxReclamees} onChange={(e) => setSommesMaxReclamees(e.target.value)} />
                        </div>
                      )}
                      {typeCalculResultat === "gain" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Résultat minimum (P) € *</Label>
                          <Input type="number" value={resultatMinimum} onChange={(e) => setResultatMinimum(e.target.value)} />
                        </div>
                      )}
                      {typeCalculResultat === "condamnation" && (
                        <>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Plafond</Label>
                            <Switch checked={plafondActif} onCheckedChange={setPlafondActif} />
                          </div>
                          {plafondActif && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">Plafond (€)</Label>
                              <Input type="number" value={plafondValeur} onChange={(e) => setPlafondValeur(e.target.value)} />
                            </div>
                          )}
                        </>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Inclure article 700 CPC</Label>
                        <Switch checked={inclureArticle700} onCheckedChange={setInclureArticle700} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Dû même si dessaisissement</Label>
                        <Switch checked={resultatDessaisissement} onCheckedChange={setResultatDessaisissement} />
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* RGPD */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Article RGPD</CardTitle>
                      <Switch checked={rgpdActive} onCheckedChange={setRgpdActive} />
                    </div>
                  </CardHeader>
                  {rgpdActive && (
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Responsable traitement</Label>
                        <Input value={responsableTraitement} onChange={(e) => setResponsableTraitement(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email DPO</Label>
                        <Input value={emailDpo} onChange={(e) => setEmailDpo(e.target.value)} />
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Rétractation */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Droit de rétractation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Convention à distance</Label>
                      <Switch checked={conventionDistance} onCheckedChange={setConventionDistance} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Client consommateur</Label>
                      <Switch checked={clientConsommateur} onCheckedChange={setClientConsommateur} />
                    </div>
                    {conventionDistance && clientConsommateur && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        L'article de rétractation et le formulaire seront inclus.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Frais */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Frais et débours</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Débours et dépens refacturés à l'identique.
                    </p>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Déplacements refacturés</Label>
                      <Switch checked={deplacementsRefactures} onCheckedChange={setDeplacementsRefactures} />
                    </div>
                  </CardContent>
                </Card>

                {/* Contestation */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Contestation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Bâtonnier (ville)</Label>
                      <Input value={villeBatonnier} onChange={(e) => setVilleBatonnier(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Document */}
          <div className="flex-1 flex overflow-hidden">
            {/* Document Preview */}
            <div className="flex-1 overflow-y-auto bg-muted/30 p-8">
              <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-sm">
                <div 
                  ref={documentRef}
                  className="p-12 min-h-[297mm] prose prose-sm max-w-none [&_[data-token]]:bg-yellow-50 [&_[data-token]]:px-0.5 [&_[data-token]]:rounded"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleDocumentInput}
                  dangerouslySetInnerHTML={{ __html: generateDocument() }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Revenir
          </Button>
          <Button onClick={onValidate} disabled={!isReadyForSignature()}>
            Valider et créer le client
          </Button>
        </div>

        {/* Reset Modal */}
        <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Réinitialiser la convention ?</DialogTitle>
              <DialogDescription>
                Cette action va régénérer le document et effacer toutes les modifications manuelles.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetModal(false)}>Annuler</Button>
              <Button variant="destructive" onClick={handleReset}>Réinitialiser</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diff Modal */}
        <Dialog open={showDiffModal} onOpenChange={setShowDiffModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comparaison</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm font-mono">
              <p className="text-red-600">- Anciennes valeurs</p>
              <p className="text-green-600">+ Nouvelles valeurs</p>
              <Separator />
              {auditLog.slice(-5).map((entry, i) => (
                <div key={i}>
                  <p className="text-red-600">- {entry.field}: {entry.oldValue}</p>
                  <p className="text-green-600">+ {entry.field}: {entry.newValue}</p>
                </div>
              ))}
              {auditLog.length === 0 && <p className="text-muted-foreground">Aucune modification à comparer</p>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
