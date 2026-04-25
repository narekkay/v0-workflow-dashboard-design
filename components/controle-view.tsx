"use client"

import { useRef, useState } from "react"
import { Download, Send, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const VIOLET = "#5a4ab7"
const HIGHLIGHT_BG = "#fde4dc"
const HIGHLIGHT_COLOR = "#712b13"
const GREEN_BG = "#dcfce7"
const GREEN_COLOR = "#166534"

interface Argument {
  id: number
  num: string
  title: string
  source: string
  text: string
  passageIndex: number
}

const ARGUMENTS: Argument[] = [
  {
    id: 1,
    num: "01",
    title: "Délai de reprise expiré sur l'exercice 2018",
    source: "Art. L169 LPF",
    text: "Le droit de reprise de l'administration s'éteint à la fin de la troisième année qui suit celle au titre de laquelle l'imposition est due. L'avis vise expressément l'exercice 2018, dont le délai de reprise s'est éteint le 31 décembre 2021. La vérification ne peut porter sur cet exercice. Demande de retrait de l'exercice 2018 du périmètre du contrôle.",
    passageIndex: 0,
  },
  {
    id: 2,
    num: "02",
    title: "Origine des renseignements obtenus de tiers non communiquée",
    source: "Art. L76 B LPF",
    text: "L'administration est tenue d'informer le contribuable de l'origine et de la teneur des renseignements obtenus auprès de tiers, avant la mise en recouvrement. L'avis mentionne ces renseignements sans en préciser ni l'origine ni la teneur. Demande de communication intégrale, sous peine de nullité de la procédure.",
    passageIndex: 1,
  },
  {
    id: 3,
    num: "03",
    title: "Absence de débat oral et contradictoire",
    source: "CE 2 oct. 2003 n°245027",
    text: "La jurisprudence constante du Conseil d'État impose, en matière de vérification de comptabilité, l'organisation d'un débat oral et contradictoire avec le contribuable. Aucun entretien préalable n'a été proposé. Cette omission constitue un vice substantiel de procédure, susceptible d'entraîner la décharge des impositions.",
    passageIndex: 2,
  },
]

export function ControleView() {
  const argRefs = useRef<(HTMLDivElement | null)[]>([])
  const passageRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [activeArg, setActiveArg] = useState<number | null>(null)
  const [flashArg, setFlashArg] = useState<number | null>(null)
  const [hoveredArg, setHoveredArg] = useState<number | null>(null)

  function handlePassageClick(argIndex: number) {
    const el = argRefs.current[argIndex]
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    setFlashArg(argIndex)
    setActiveArg(argIndex)
    setTimeout(() => setFlashArg(null), 700)
  }

  function getArgBorderColor(index: number) {
    if (flashArg === index) return "#a855f7"
    return VIOLET
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#fafaf7" }}>
      {/* Sticky header */}
      <div
        className="flex-shrink-0"
        style={{
          height: 64,
          background: "#fff",
          borderBottom: "1px solid #ececec",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
        }}
      >
        <span style={{ fontSize: 13, color: "#8a8a8a" }}>
          Clients{" "}
          <span style={{ margin: "0 4px" }}>›</span>
          Marc Duval{" "}
          <span style={{ margin: "0 4px" }}>›</span>
          Contrôle de procédure
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#f3f1eb",
            color: VIOLET,
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Utilisateur MS"
        >
          MS
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 32 }}>

        {/* Page header */}
        <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 500,
                color: "#0a0a0a",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Contrôle de procédure
            </h1>
            <p style={{ fontSize: 15, color: "#4a4a4a", marginTop: 4, marginBottom: 0 }}>
              Avis de vérification du 14 mars 2026 · Marc Duval · Exercices 2022 et 2023
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-sm"
              style={{ borderColor: "#ececec", color: "#2a2a2a" }}
            >
              <Download className="h-4 w-4" />
              Exporter le mémoire
            </Button>
            <Button
              size="sm"
              className="gap-2 text-sm text-white"
              style={{ background: VIOLET, borderColor: VIOLET }}
            >
              <Send className="h-4 w-4" />
              Envoyer à l&apos;administration
            </Button>
          </div>
        </div>

        {/* Summary banner */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #ececec",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 20,
            display: "flex",
          }}
        >
          {[
            {
              label: "Statut",
              content: (
                <span
                  style={{
                    background: GREEN_BG,
                    color: GREEN_COLOR,
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: 999,
                    display: "inline-block",
                  }}
                >
                  Analyse complète
                </span>
              ),
            },
            {
              label: "Vices détectés",
              content: (
                <div>
                  <span style={{ fontSize: 24, fontWeight: 500, color: "#0a0a0a" }}>3</span>
                  <span style={{ fontSize: 12, color: "#8a8a8a", marginLeft: 6 }}>points annulants</span>
                </div>
              ),
            },
            {
              label: "Délai de réponse",
              content: (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#0a0a0a" }}>27 jours restants</div>
                  <div style={{ fontSize: 12, color: "#8a8a8a" }}>Échéance 22 mai 2026</div>
                </div>
              ),
            },
            {
              label: "Niveau de défense",
              content: (
                <span
                  style={{
                    background: HIGHLIGHT_BG,
                    color: HIGHLIGHT_COLOR,
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: 999,
                    display: "inline-block",
                  }}
                >
                  Solide
                </span>
              ),
            },
          ].map((col, i) => (
            <div
              key={col.label}
              style={{
                flex: 1,
                paddingLeft: i > 0 ? 24 : 0,
                borderLeft: i > 0 ? "1px solid #ececec" : "none",
                marginLeft: i > 0 ? 24 : 0,
              }}
            >
              <div style={{ fontSize: 12, color: "#8a8a8a", marginBottom: 8, fontWeight: 500 }}>
                {col.label}
              </div>
              {col.content}
            </div>
          ))}
        </div>

        {/* Split view */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Left — document */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #ececec",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #ececec",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#8a8a8a",
                    marginBottom: 4,
                  }}
                >
                  Avis de vérification
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0a0a0a" }}>
                  avis_verification_DGFiP_2026-03-14.pdf
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText style={{ width: 18, height: 18, color: "#8a8a8a" }} />
                <span style={{ fontSize: 12, color: "#8a8a8a" }}>2 pages</span>
              </div>
            </div>

            {/* Document body */}
            <div
              style={{
                padding: "28px 32px",
                fontFamily: "Georgia, 'Times New Roman', Times, serif",
                fontSize: 13,
                lineHeight: 1.7,
                color: "#1a1a1a",
                whiteSpace: "pre-wrap",
                flex: 1,
              }}
            >
              {`DIRECTION GÉNÉRALE DES FINANCES PUBLIQUES
Direction départementale — Pôle de contrôle et d'expertise

`}
              <span style={{ display: "block", textAlign: "right" }}>
                {`Monsieur Marc DUVAL
[Adresse]

Le 14 mars 2026`}
              </span>
              {`
Référence : 2026-DV-04127
Objet : Avis de vérification de comptabilité

Monsieur,

J'ai l'honneur de vous informer qu'en application des
dispositions des articles L. 13 et suivants du Livre des
procédures fiscales, votre activité fera l'objet d'une
vérification de comptabilité portant sur `}
              <span
                ref={(el) => { passageRefs.current[0] = el }}
                onClick={() => handlePassageClick(0)}
                style={{
                  background: HIGHLIGHT_BG,
                  color: HIGHLIGHT_COLOR,
                  padding: "1px 3px",
                  borderRadius: 3,
                  cursor: "pointer",
                  outline: hoveredArg === 0 ? `1px solid ${VIOLET}` : "none",
                  transition: "outline 150ms",
                }}
              >
                l&apos;ensemble des exercices 2018 à 2023
              </span>
              {`
en matière d'impôt sur le revenu et de prélèvements
sociaux.

Les opérations débuteront le 7 avril 2026 dans nos
locaux. Vous êtes invité à nous transmettre l'ensemble
des pièces justificatives utiles à la vérification.

Au cours des opérations préalables, `}
              <span
                ref={(el) => { passageRefs.current[1] = el }}
                onClick={() => handlePassageClick(1)}
                style={{
                  background: HIGHLIGHT_BG,
                  color: HIGHLIGHT_COLOR,
                  padding: "1px 3px",
                  borderRadius: 3,
                  cursor: "pointer",
                  outline: hoveredArg === 1 ? `1px solid ${VIOLET}` : "none",
                  transition: "outline 150ms",
                }}
              >
                des renseignements complémentaires ont été obtenus
auprès de tiers
              </span>
              {`, permettant de préciser le périmètre
du contrôle.

`}
              <span
                ref={(el) => { passageRefs.current[2] = el }}
                onClick={() => handlePassageClick(2)}
                style={{
                  background: HIGHLIGHT_BG,
                  color: HIGHLIGHT_COLOR,
                  padding: "1px 3px",
                  borderRadius: 3,
                  cursor: "pointer",
                  outline: hoveredArg === 2 ? `1px solid ${VIOLET}` : "none",
                  transition: "outline 150ms",
                }}
              >
                Le présent avis vous est notifié sans
qu&apos;un entretien préalable n&apos;ait été organisé
              </span>
              {`, compte
tenu des contraintes de calendrier de notre service.

Vous avez la faculté de vous faire assister par un
conseil de votre choix.

Je vous prie d'agréer, Monsieur, l'expression de ma
considération distinguée.

`}
              <span style={{ display: "block", textAlign: "right" }}>
                {`L'inspecteur des finances publiques
[Signature]`}
              </span>
            </div>
          </div>

          {/* Right — response */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #ececec",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #ececec",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: VIOLET,
                    marginBottom: 4,
                  }}
                >
                  Proposition de réponse
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0a0a0a" }}>
                  Mémoire en réponse · v1
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    background: GREEN_BG,
                    color: GREEN_COLOR,
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  Sourcée
                </span>
                <Sparkles style={{ width: 16, height: 16, color: VIOLET }} />
              </div>
            </div>

            {/* Response body */}
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
              <p
                style={{
                  fontSize: 13,
                  fontStyle: "italic",
                  color: "#4a4a4a",
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                Trois vices de procédure détectés. Chaque argument est rattaché à sa source légale et
                jurisprudentielle. Relisez, ajustez, validez.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {ARGUMENTS.map((arg, i) => (
                  <div
                    key={arg.id}
                    ref={(el) => { argRefs.current[i] = el }}
                    onMouseEnter={() => setHoveredArg(i)}
                    onMouseLeave={() => setHoveredArg(null)}
                    style={{
                      background: "#fafaf7",
                      borderLeft: `3px solid ${getArgBorderColor(i)}`,
                      borderRadius: "0 8px 8px 0",
                      padding: "16px 18px",
                      transition: "border-color 600ms",
                    }}
                  >
                    {/* Top row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: VIOLET,
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {arg.num}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "#0a0a0a" }}>
                          {arg.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          background: "#fff",
                          border: "1px solid #ececec",
                          padding: "3px 8px",
                          borderRadius: 6,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          color: "#2a2a2a",
                        }}
                      >
                        {arg.source}
                      </span>
                    </div>

                    {/* Argumentaire */}
                    <p
                      style={{
                        fontSize: 14,
                        color: "#1a1a1a",
                        lineHeight: 1.6,
                        marginTop: 10,
                        marginBottom: 0,
                      }}
                    >
                      {arg.text}
                    </p>

                    {/* Bottom row */}
                    <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
                      <button
                        onClick={() => {
                          const el = passageRefs.current[arg.passageIndex]
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
                        }}
                        style={{
                          fontSize: 12,
                          color: VIOLET,
                          fontWeight: 500,
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        Voir le passage dans l&apos;avis →
                      </button>
                      <button
                        style={{
                          fontSize: 12,
                          color: "#8a8a8a",
                          fontWeight: 500,
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        Sources (2)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid #ececec",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#8a8a8a" }}>
            Document de démonstration — tous éléments fictifs
          </span>
          <span style={{ fontSize: 12, color: "#8a8a8a" }}>
            Analysé en 4,2 s · Modèle XAI activé · Hébergement souverain France
          </span>
        </div>
      </div>
    </div>
  )
}
