"use client"

import { useState, useRef, useEffect } from "react"
import {
  Users,
  FolderOpen,
  Settings,
  LayoutDashboard,
  User,
  FileText,
  Files,
  Users2,
  Share2,
  ShieldAlert,
  Download,
  Send,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Sidebar menu item component
function SidebarItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 px-6 py-2.5 text-sm transition-colors relative",
        active
          ? "bg-[#f3f1eb] text-[#5a4ab7] font-medium"
          : "text-[#2a2a2a] hover:bg-[#f8f7f3]"
      )}
    >
      {active && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#5a4ab7]" />
      )}
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  )
}

// Summary stat column component
function SummaryStat({
  label,
  value,
  subtext,
  pill,
  pillColor,
  isFirst = false,
}: {
  label: string
  value?: string
  subtext?: string
  pill?: string
  pillColor?: "green" | "rose"
  isFirst?: boolean
}) {
  const pillStyles = {
    green: "bg-[#dcfce7] text-[#166534]",
    rose: "bg-[#fde4dc] text-[#712b13]",
  }

  return (
    <div
      className={cn(
        "flex-1 px-6 py-1",
        !isFirst && "border-l border-[#ececec]"
      )}
    >
      <p className="text-xs text-[#8a8a8a] mb-1">{label}</p>
      {pill ? (
        <span
          className={cn(
            "inline-block text-xs font-medium px-2.5 py-1 rounded-full",
            pillStyles[pillColor || "green"]
          )}
        >
          {pill}
        </span>
      ) : (
        <>
          <p className="text-2xl font-medium text-[#0a0a0a]">{value}</p>
          {subtext && <p className="text-xs text-[#8a8a8a]">{subtext}</p>}
        </>
      )}
    </div>
  )
}

// Argument block component
function ArgumentBlock({
  number,
  title,
  source,
  content,
  id,
  isHighlighted,
  onHover,
}: {
  number: string
  title: string
  source: string
  content: string
  id: string
  isHighlighted: boolean
  onHover: (hovering: boolean) => void
}) {
  return (
    <div
      id={id}
      className={cn(
        "bg-[#fafaf7] border-l-[3px] rounded-r-lg p-4 transition-all duration-300",
        isHighlighted ? "border-l-[#a855f7]" : "border-l-[#5a4ab7]"
      )}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#5a4ab7] text-white text-xs font-semibold">
            {number}
          </span>
          <span className="text-[15px] font-medium text-[#0a0a0a]">{title}</span>
        </div>
        <span className="text-xs font-medium bg-white border border-[#ececec] px-2 py-1 rounded-md">
          {source}
        </span>
      </div>
      <p className="text-sm text-[#1a1a1a] leading-relaxed italic">{content}</p>
      <div className="flex items-center gap-3 mt-3">
        <button className="text-xs font-medium text-[#5a4ab7] hover:underline">
          Voir le passage dans l&apos;avis &rarr;
        </button>
        <button className="text-xs font-medium text-[#8a8a8a] hover:underline">
          Sources (2)
        </button>
      </div>
    </div>
  )
}

export default function ControleProcedurePage() {
  const [highlightedVice, setHighlightedVice] = useState<number | null>(null)
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null)
  const responseRef = useRef<HTMLDivElement>(null)

  const handleHighlightClick = (viceNumber: number) => {
    setHighlightedVice(viceNumber)
    const element = document.getElementById(`vice-${viceNumber}`)
    if (element && responseRef.current) {
      responseRef.current.scrollTo({
        top: element.offsetTop - 100,
        behavior: "smooth",
      })
    }
    setTimeout(() => setHighlightedVice(null), 600)
  }

  const HighlightedText = ({
    children,
    viceNumber,
  }: {
    children: React.ReactNode
    viceNumber: number
  }) => (
    <mark
      className={cn(
        "bg-[#fde4dc] text-[#712b13] px-1 rounded cursor-pointer transition-all",
        hoveredBlock === viceNumber && "outline outline-1 outline-[#5a4ab7]"
      )}
      onClick={() => handleHighlightClick(viceNumber)}
    >
      {children}
    </mark>
  )

  return (
    <div className="flex h-screen bg-[#fafaf7]">
      {/* Sidebar */}
      <aside className="w-60 h-full bg-white border-r border-[#ececec] flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-6">
          <h1
            className="text-lg font-semibold bg-gradient-to-r from-[#5a4ab7] to-[#a855f7] bg-clip-text text-transparent"
          >
            Fiscalia
          </h1>
        </div>

        {/* Cabinet section */}
        <div className="px-6 mb-2">
          <p className="text-[11px] uppercase tracking-[0.06em] text-[#8a8a8a]">
            Cabinet
          </p>
        </div>
        <SidebarItem icon={Users} label="Clients" />
        <SidebarItem icon={FolderOpen} label="Documents" />
        <SidebarItem icon={Settings} label="Paramètres" />

        {/* Separator */}
        <div className="mx-6 my-4 border-t border-[#ececec]" />

        {/* Client section */}
        <div className="px-6 mb-2">
          <p className="text-[11px] uppercase tracking-[0.06em] text-[#8a8a8a]">
            Marc Duval
          </p>
        </div>
        <SidebarItem icon={LayoutDashboard} label="Aperçu général" />
        <SidebarItem icon={User} label="Fiche client" />
        <SidebarItem icon={FileText} label="Déclarations" />
        <SidebarItem icon={Files} label="Documents" />
        <SidebarItem icon={Users2} label="Foyer fiscal" />
        <SidebarItem icon={Share2} label="Partage" />
        <SidebarItem icon={ShieldAlert} label="Contrôle de procédure" active />

        <div className="flex-1" />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#ececec] flex items-center justify-between px-8 flex-shrink-0">
          <nav className="text-[13px] text-[#8a8a8a]">
            Clients &rsaquo; Marc Duval &rsaquo; Contrôle de procédure
          </nav>
          <div className="w-8 h-8 rounded-full bg-[#f3f1eb] flex items-center justify-center">
            <span className="text-xs font-medium text-[#5a4ab7]">MS</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[28px] font-medium text-[#0a0a0a] tracking-[-0.01em]">
                Contrôle de procédure
              </h1>
              <p className="text-[15px] text-[#4a4a4a] mt-1">
                Avis de vérification du 14 mars 2026 &middot; Marc Duval &middot;
                Exercices 2022 et 2023
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2a2a2a] bg-white border border-[#ececec] rounded-lg hover:bg-[#f8f7f3] transition-colors">
                <Download className="h-4 w-4" />
                Exporter le mémoire
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5a4ab7] rounded-lg hover:bg-[#4a3a9f] transition-colors">
                <Send className="h-4 w-4" />
                Envoyer à l&apos;administration
              </button>
            </div>
          </div>

          {/* Summary banner */}
          <div className="bg-white border border-[#ececec] rounded-xl px-0 py-5 mb-6 flex">
            <SummaryStat
              label="Statut"
              pill="Analyse complète"
              pillColor="green"
              isFirst
            />
            <SummaryStat
              label="Vices détectés"
              value="3"
              subtext="points annulants"
            />
            <SummaryStat
              label="Délai de réponse"
              value="27 jours restants"
              subtext="Échéance 22 mai 2026"
            />
            <SummaryStat label="Niveau de défense" pill="Solide" pillColor="rose" />
          </div>

          {/* Split view */}
          <div className="grid grid-cols-2 gap-5" style={{ height: "720px" }}>
            {/* Left column - Avis reçu */}
            <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden flex flex-col">
              {/* Card header */}
              <div className="px-5 py-4 border-b border-[#ececec] flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[#8a8a8a]">
                    Avis de vérification
                  </p>
                  <p className="text-sm font-medium text-[#0a0a0a] mt-0.5">
                    avis_verification_DGFiP_2026-03-14.pdf
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[#8a8a8a]">
                  <FileText className="h-[18px] w-[18px]" />
                  <span className="text-xs">2 pages</span>
                </div>
              </div>

              {/* Card body - Document */}
              <div className="flex-1 overflow-auto p-7 font-serif text-[13px] leading-[1.7] text-[#1a1a1a]">
                <div className="whitespace-pre-line">
                  <p className="font-bold mb-1">
                    DIRECTION GÉNÉRALE DES FINANCES PUBLIQUES
                  </p>
                  <p className="mb-6">
                    Direction départementale — Pôle de contrôle et d&apos;expertise
                  </p>

                  <div className="text-right mb-6">
                    <p>Monsieur Marc DUVAL</p>
                    <p>[Adresse]</p>
                    <p className="mt-4">Le 14 mars 2026</p>
                  </div>

                  <p className="mb-1">Référence : 2026-DV-04127</p>
                  <p className="mb-6">
                    Objet : Avis de vérification de comptabilité
                  </p>

                  <p className="mb-4">Monsieur,</p>

                  <p className="mb-4">
                    J&apos;ai l&apos;honneur de vous informer qu&apos;en application des
                    dispositions des articles L. 13 et suivants du Livre des
                    procédures fiscales, votre activité fera l&apos;objet d&apos;une
                    vérification de comptabilité portant sur{" "}
                    <HighlightedText viceNumber={1}>
                      l&apos;ensemble des exercices 2018 à 2023
                    </HighlightedText>{" "}
                    en matière d&apos;impôt sur le revenu et de prélèvements sociaux.
                  </p>

                  <p className="mb-4">
                    Les opérations débuteront le 7 avril 2026 dans nos locaux. Vous
                    êtes invité à nous transmettre l&apos;ensemble des pièces
                    justificatives utiles à la vérification.
                  </p>

                  <p className="mb-4">
                    Au cours des opérations préalables,{" "}
                    <HighlightedText viceNumber={2}>
                      des renseignements complémentaires ont été obtenus auprès de
                      tiers
                    </HighlightedText>
                    , permettant de préciser le périmètre du contrôle.
                  </p>

                  <p className="mb-4">
                    <HighlightedText viceNumber={3}>
                      Le présent avis vous est notifié sans qu&apos;un entretien
                      préalable n&apos;ait été organisé
                    </HighlightedText>
                    , compte tenu des contraintes de calendrier de notre service.
                  </p>

                  <p className="mb-6">
                    Vous avez la faculté de vous faire assister par un conseil de
                    votre choix.
                  </p>

                  <p className="mb-4">
                    Je vous prie d&apos;agréer, Monsieur, l&apos;expression de ma
                    considération distinguée.
                  </p>

                  <div className="text-right mt-8">
                    <p>L&apos;inspecteur des finances publiques</p>
                    <p className="italic">[Signature]</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Proposition de réponse */}
            <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden flex flex-col">
              {/* Card header */}
              <div className="px-5 py-4 border-b border-[#ececec] flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[#5a4ab7]">
                    Proposition de réponse
                  </p>
                  <p className="text-sm font-medium text-[#0a0a0a] mt-0.5">
                    Mémoire en réponse &middot; v1
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded-full">
                    Sourcée
                  </span>
                  <Sparkles className="h-4 w-4 text-[#5a4ab7]" />
                </div>
              </div>

              {/* Card body - Response */}
              <div
                ref={responseRef}
                className="flex-1 overflow-auto p-6 space-y-5"
              >
                <p className="text-[13px] italic text-[#4a4a4a] mb-4">
                  Trois vices de procédure détectés. Chaque argument est rattaché à
                  sa source légale et jurisprudentielle. Relisez, ajustez, validez.
                </p>

                <ArgumentBlock
                  id="vice-1"
                  number="01"
                  title="Délai de reprise expiré sur l'exercice 2018"
                  source="Art. L169 LPF"
                  content="Le droit de reprise de l'administration s'éteint à la fin de la troisième année qui suit celle au titre de laquelle l'imposition est due. L'avis vise expressément l'exercice 2018, dont le délai de reprise s'est éteint le 31 décembre 2021. La vérification ne peut porter sur cet exercice. Demande de retrait de l'exercice 2018 du périmètre du contrôle."
                  isHighlighted={highlightedVice === 1}
                  onHover={(hovering) => setHoveredBlock(hovering ? 1 : null)}
                />

                <ArgumentBlock
                  id="vice-2"
                  number="02"
                  title="Origine des renseignements obtenus de tiers non communiquée"
                  source="Art. L76 B LPF"
                  content="L'administration est tenue d'informer le contribuable de l'origine et de la teneur des renseignements obtenus auprès de tiers, avant la mise en recouvrement. L'avis mentionne ces renseignements sans en préciser ni l'origine ni la teneur. Demande de communication intégrale, sous peine de nullité de la procédure."
                  isHighlighted={highlightedVice === 2}
                  onHover={(hovering) => setHoveredBlock(hovering ? 2 : null)}
                />

                <ArgumentBlock
                  id="vice-3"
                  number="03"
                  title="Absence de débat oral et contradictoire"
                  source="CE 2 oct. 2003 n°245027"
                  content="La jurisprudence constante du Conseil d'État impose, en matière de vérification de comptabilité, l'organisation d'un débat oral et contradictoire avec le contribuable. Aucun entretien préalable n'a été proposé. Cette omission constitue un vice substantiel de procédure, susceptible d'entraîner la décharge des impositions."
                  isHighlighted={highlightedVice === 3}
                  onHover={(hovering) => setHoveredBlock(hovering ? 3 : null)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 pt-4 border-t border-[#ececec] flex items-center justify-between">
            <p className="text-xs text-[#8a8a8a]">
              Document de démonstration — tous éléments fictifs
            </p>
            <p className="text-xs text-[#8a8a8a]">
              Analysé en 4,2 s &middot; Modèle XAI activé &middot; Hébergement
              souverain France
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
