"use client"

import { useState } from "react"
import { Sparkles, Loader2, Lock, Unlock, CheckCircle2, User, Building2, RotateCcw } from "lucide-react"
import { buildAuthenticatedJsonHeaders } from "@/lib/firebase/api-auth"
import type { WorkflowIrdState, ClientIrdImporte, ClassificationClient } from "@/types/preterme-ird"

type Props = {
  workflow: WorkflowIrdState
  onUpdate: (w: WorkflowIrdState) => Promise<void>
  onRefresh: () => Promise<void>
  onAdvance: () => void
}

const AGENCES = ["H91358", "H92083"]

function ClientCard({
  client,
  locked,
  onToggle,
}: {
  client: ClientIrdImporte
  locked: boolean
  onToggle: () => void
}) {
  const wasFixed = client.corrigeParUtilisateur

  return (
    <button
      onClick={() => !locked && onToggle()}
      disabled={locked}
      className="w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `0.5px solid ${wasFixed ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.07)"}`,
        cursor: locked ? "default" : "pointer",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontSize: 11, color: "#f0eeff", lineHeight: 1.3 }}>
          {client.nomClient}
        </span>
        {wasFixed && (
          <div
            className="flex-shrink-0 px-1.5 py-0.5 rounded-full"
            style={{
              fontSize: 9,
              background: "rgba(251,191,36,0.1)",
              color: "#fbbf24",
              border: "0.5px solid rgba(251,191,36,0.3)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            modifié
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: "rgba(200,196,230,0.4)", marginTop: 2, fontFamily: "DM Mono, monospace" }}>
        {client.numeroContrat}
      </div>
    </button>
  )
}

function AgenceClassif({
  codeAgence,
  workflow,
  classifying,
  onToggle,
  onLock,
  onUnlock,
  onClassify,
  onReset,
}: {
  codeAgence: string
  workflow: WorkflowIrdState
  classifying: boolean
  onToggle: (code: string, numeroContrat: string) => void
  onLock: (code: string) => void
  onUnlock: (code: string) => void
  onClassify: (code: string) => void
  onReset: (code: string) => void
}) {
  const agence = workflow.agences[codeAgence]
  if (!agence) return null

  const isBlocked = agence.etape3Statut === "bloqué"
  const retenus = agence.clients.filter(c => c.retenu)
  const particuliers = retenus.filter(c => c.classificationFinale === "particulier")
  const entreprises = retenus.filter(c => c.classificationFinale === "entreprise")

  return (
    <div
      className="rounded-xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: isBlocked
          ? "0.5px solid rgba(45,197,150,0.35)"
          : "0.5px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
            Agence {codeAgence}
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            {[
              { label: "Retenus", val: retenus.length, color: "rgba(200,196,230,0.6)" },
              { label: "Particuliers", val: particuliers.length, color: "#9b87f5" },
              { label: "Entreprises", val: entreprises.length, color: "#ef9f27" },
            ].map(k => (
              <span key={k.label} style={{ fontSize: 11, color: k.color }}>
                <strong>{k.val}</strong>{" "}
                <span style={{ color: "rgba(200,196,230,0.4)", fontSize: 10 }}>{k.label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBlocked ? (
            <>
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full"
                style={{
                  fontSize: 10,
                  background: "rgba(45,197,150,0.1)",
                  color: "#2dc596",
                  border: "0.5px solid rgba(45,197,150,0.3)",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                <Lock style={{ width: 9, height: 9 }} />
                BLOQUÉE
              </div>
              <button
                onClick={() => onUnlock(codeAgence)}
                className="rounded-lg p-1.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(200,196,230,0.5)",
                }}
                title="Débloquer"
              >
                <Unlock style={{ width: 12, height: 12 }} />
              </button>
            </>
          ) : (
            <>
              {retenus.some(c => c.classificationFinale !== null) && !classifying && (
                <button
                  onClick={() => onReset(codeAgence)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all"
                  style={{
                    fontSize: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "rgba(200,196,230,0.5)",
                    fontFamily: "Syne, sans-serif",
                  }}
                  title="Remettre à zéro et relancer"
                >
                  <RotateCcw style={{ width: 11, height: 11 }} />
                  Relancer
                </button>
              )}

              {retenus.length > 0 && !classifying && retenus.every(c => c.classificationFinale === null) && (
                <button
                  onClick={() => onClassify(codeAgence)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all"
                  style={{
                    fontSize: 12,
                    background: "rgba(239,159,39,0.1)",
                    border: "0.5px solid rgba(239,159,39,0.3)",
                    color: "#ef9f27",
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  <Sparkles style={{ width: 12, height: 12 }} />
                  Analyser
                </button>
              )}

              {retenus.length > 0 && !classifying && retenus.some(c => c.classificationFinale !== null) && (
                <button
                  onClick={() => onLock(codeAgence)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all"
                  style={{
                    fontSize: 12,
                    background: "rgba(45,197,150,0.1)",
                    border: "0.5px solid rgba(45,197,150,0.3)",
                    color: "#2dc596",
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  <Lock style={{ width: 12, height: 12 }} />
                  Bloquer
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {classifying && (
        <div className="flex items-center gap-3 px-5 py-4">
          <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: "#ef9f27" }} />
          <span style={{ fontSize: 12, color: "rgba(200,196,230,0.55)" }}>
            Classification Gemini en cours...
          </span>
        </div>
      )}

      {!classifying && retenus.length > 0 && (
        <div className="grid grid-cols-2 gap-0">
          <div style={{ padding: "16px 12px 16px 16px", borderRight: "0.5px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-3">
              <User style={{ width: 13, height: 13, color: "#9b87f5" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9b87f5", fontFamily: "DM Mono, monospace" }}>
                PARTICULIERS ({particuliers.length})
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {particuliers.map(c => (
                <ClientCard
                  key={c.numeroContrat}
                  client={c}
                  locked={isBlocked}
                  onToggle={() => onToggle(codeAgence, c.numeroContrat)}
                />
              ))}
              {particuliers.length === 0 && (
                <span style={{ fontSize: 11, color: "rgba(200,196,230,0.3)" }}>Aucun</span>
              )}
            </div>
          </div>

          <div style={{ padding: "16px 16px 16px 12px" }}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 style={{ width: 13, height: 13, color: "#ef9f27" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#ef9f27", fontFamily: "DM Mono, monospace" }}>
                ENTREPRISES ({entreprises.length})
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {entreprises.map(c => (
                <ClientCard
                  key={c.numeroContrat}
                  client={c}
                  locked={isBlocked}
                  onToggle={() => onToggle(codeAgence, c.numeroContrat)}
                />
              ))}
              {entreprises.length === 0 && (
                <span style={{ fontSize: 11, color: "rgba(200,196,230,0.3)" }}>Aucune</span>
              )}
            </div>
          </div>
        </div>
      )}

      {!classifying && retenus.length === 0 && (
        <div className="px-5 py-4">
          <span style={{ fontSize: 12, color: "rgba(200,196,230,0.4)" }}>Aucun client retenu dans cette agence.</span>
        </div>
      )}
    </div>
  )
}

export function Step3ClassificationIrd({ workflow, onUpdate, onRefresh, onAdvance }: Props) {
  const [classifyingMap, setClassifyingMap] = useState<Record<string, boolean>>({})

  const bothBlocked = AGENCES.every(code => workflow.agences[code]?.etape3Statut === "bloqué")

  async function handleReset(codeAgence: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    const clients = agence.clients.map(c =>
      c.retenu
        ? { ...c, classificationIA: null, classificationFinale: null, corrigeParUtilisateur: false }
        : c
    )
    const updated: WorkflowIrdState = {
      ...workflow,
      agences: { ...workflow.agences, [codeAgence]: { ...agence, clients, etape3Statut: "en_attente" } },
    }
    await onUpdate(updated)
    await triggerClassify(codeAgence)
  }

  async function triggerClassify(codeAgence: string) {
    setClassifyingMap(prev => ({ ...prev, [codeAgence]: true }))
    try {
      const headers = await buildAuthenticatedJsonHeaders()
      await fetch("/api/admin/preterme-ird/classify", {
        method: "POST",
        headers,
        body: JSON.stringify({ moisKey: workflow.moisKey, codeAgence }),
      })
      await onRefresh()
    } catch {}
    setClassifyingMap(prev => ({ ...prev, [codeAgence]: false }))
  }

  function handleToggle(codeAgence: string, numeroContrat: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    const clients = agence.clients.map(c => {
      if (c.numeroContrat !== numeroContrat) return c
      const next: ClassificationClient = c.classificationFinale === "particulier" ? "entreprise" : "particulier"
      return { ...c, classificationFinale: next, corrigeParUtilisateur: true }
    })
    const updated: WorkflowIrdState = {
      ...workflow,
      agences: { ...workflow.agences, [codeAgence]: { ...agence, clients } },
    }
    onUpdate(updated)
  }

  async function handleLock(codeAgence: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    const updated: WorkflowIrdState = {
      ...workflow,
      agences: { ...workflow.agences, [codeAgence]: { ...agence, etape3Statut: "bloqué" } },
    }
    await onUpdate(updated)
  }

  async function handleUnlock(codeAgence: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    const updated: WorkflowIrdState = {
      ...workflow,
      agences: { ...workflow.agences, [codeAgence]: { ...agence, etape3Statut: "analysé" } },
    }
    await onUpdate(updated)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              background: "rgba(239,159,39,0.1)",
              border: "0.5px solid rgba(239,159,39,0.3)",
            }}
          >
            <Sparkles style={{ width: 16, height: 16, color: "#ef9f27" }} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#ef9f27",
              letterSpacing: "0.08em",
              fontFamily: "DM Mono, monospace",
            }}
          >
            ÉTAPE 3 — IA
          </span>
        </div>

        <h3
          className="font-bold"
          style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
        >
          Classification Particulier / Entreprise
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Gemini classifie automatiquement chaque client retenu. Cliquez sur une carte pour la
          basculer dans l&apos;autre colonne si besoin, puis bloquez chaque agence.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {AGENCES.map(code => (
          <AgenceClassif
            key={code}
            codeAgence={code}
            workflow={workflow}
            classifying={!!classifyingMap[code]}
            onToggle={handleToggle}
            onLock={handleLock}
            onUnlock={handleUnlock}
            onClassify={triggerClassify}
            onReset={handleReset}
          />
        ))}
      </div>

      {bothBlocked && (
        <button
          onClick={onAdvance}
          className="self-start flex items-center gap-2 rounded-xl font-semibold"
          style={{
            height: 44,
            paddingInline: 24,
            background: "rgba(155,135,245,0.15)",
            border: "0.5px solid rgba(155,135,245,0.4)",
            color: "#c4b5fd",
            fontSize: 14,
            fontFamily: "Syne, sans-serif",
            boxShadow: "0 0 16px rgba(155,135,245,0.2)",
          }}
        >
          <CheckCircle2 style={{ width: 16, height: 16 }} />
          Passer aux gérants
        </button>
      )}
    </div>
  )
}
