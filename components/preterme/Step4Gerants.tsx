"use client"

import { useState, useEffect } from "react"
import { Users, Lock, Unlock, CheckCircle2, Building2, BookUser } from "lucide-react"
import { getGerantsMemo, saveGerantsMemo } from "@/lib/firebase/preterme"
import type { WorkflowState } from "@/types/preterme"

type Props = {
  workflow: WorkflowState
  onUpdate: (w: WorkflowState) => Promise<void>
  onAdvance: () => void
}

const AGENCES = ["H91358", "H92083"]

function AgenceGerants({
  codeAgence,
  workflow,
  memoGerants,
  onGerantChange,
  onLock,
  onUnlock,
}: {
  codeAgence: string
  workflow: WorkflowState
  memoGerants: Record<string, string>
  onGerantChange: (code: string, numeroContrat: string, gerant: string) => void
  onLock: (code: string) => void
  onUnlock: (code: string) => void
}) {
  const agence = workflow.agences[codeAgence]
  if (!agence) return null

  const isBlocked = agence.etape4Statut === "bloqué"
  const entreprises = agence.clients.filter(c => c.retenu && c.classificationFinale === "entreprise")
  const allFilled = entreprises.length > 0 && entreprises.every(c => c.gerant?.trim())

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
        <div className="flex items-center gap-3">
          <Building2 style={{ width: 16, height: 16, color: "#ef9f27" }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
              Agence {codeAgence}
            </span>
            <div style={{ fontSize: 11, color: "rgba(200,196,230,0.4)", marginTop: 2 }}>
              {entreprises.length} entreprise{entreprises.length !== 1 ? "s" : ""}
            </div>
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
              >
                <Unlock style={{ width: 12, height: 12 }} />
              </button>
            </>
          ) : allFilled ? (
            <button
              onClick={() => onLock(codeAgence)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium"
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
          ) : null}
        </div>
      </div>

      {/* Entreprises list */}
      <div className="p-5">
        {entreprises.length === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <CheckCircle2 style={{ width: 14, height: 14, color: "#2dc596" }} />
            <span style={{ fontSize: 12, color: "rgba(200,196,230,0.5)" }}>
              Aucune entreprise dans cette agence — étape non requise.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entreprises.map(client => (
              <div
                key={client.numeroContrat}
                className="flex flex-col gap-1.5 rounded-lg px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `0.5px solid ${!client.gerant?.trim() && !isBlocked ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#f0eeff" }}>
                    {client.nomClient}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(200,196,230,0.4)", fontFamily: "DM Mono, monospace" }}>
                    {client.numeroContrat}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nom du gérant *"
                    value={client.gerant ?? ""}
                    disabled={isBlocked}
                    onChange={e => onGerantChange(codeAgence, client.numeroContrat, e.target.value)}
                    className="w-full rounded-lg outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `0.5px solid ${client.gerant?.trim() ? "rgba(155,135,245,0.3)" : "rgba(255,255,255,0.1)"}`,
                      color: "#f0eeff",
                      padding: "8px 12px",
                      paddingRight: memoGerants[client.nomClient] ? 90 : 12,
                      fontSize: 12,
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  />
                  {memoGerants[client.nomClient] && (
                    <div
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full pointer-events-none"
                      style={{
                        fontSize: 9,
                        background: "rgba(155,135,245,0.12)",
                        color: "#9b87f5",
                        border: "0.5px solid rgba(155,135,245,0.3)",
                        fontFamily: "DM Mono, monospace",
                      }}
                    >
                      <BookUser style={{ width: 8, height: 8 }} />
                      mémorisé
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function Step4Gerants({ workflow, onUpdate, onAdvance }: Props) {
  const [memoGerants, setMemoGerants] = useState<Record<string, string>>({})

  // Charger la mémoire des gérants au montage
  useEffect(() => {
    const allEntreprises = AGENCES.flatMap(code =>
      (workflow.agences[code]?.clients ?? [])
        .filter(c => c.retenu && c.classificationFinale === "entreprise")
        .map(c => c.nomClient)
    )
    if (allEntreprises.length === 0) return

    getGerantsMemo(allEntreprises).then(memo => {
      setMemoGerants(memo)
      // Pré-remplir les gérants non encore renseignés
      let updated = workflow
      AGENCES.forEach(code => {
        const agence = updated.agences[code]
        if (!agence) return
        const clients = agence.clients.map(c => {
          if (!c.retenu || c.classificationFinale !== "entreprise") return c
          if (c.gerant?.trim()) return c // déjà renseigné manuellement → ne pas écraser
          const fromMemo = memo[c.nomClient]
          return fromMemo ? { ...c, gerant: fromMemo } : c
        })
        updated = { ...updated, agences: { ...updated.agences, [code]: { ...agence, clients } } }
      })
      onUpdate(updated)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bothBlocked = AGENCES.every(code => {
    const agence = workflow.agences[code]
    if (!agence) return true
    const entreprises = agence.clients.filter(c => c.retenu && c.classificationFinale === "entreprise")
    return entreprises.length === 0 || agence.etape4Statut === "bloqué"
  })

  function handleGerantChange(codeAgence: string, numeroContrat: string, gerant: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    const clients = agence.clients.map(c =>
      c.numeroContrat === numeroContrat ? { ...c, gerant } : c
    )
    onUpdate({
      ...workflow,
      agences: { ...workflow.agences, [codeAgence]: { ...agence, clients } },
    })
  }

  async function handleLock(codeAgence: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    // Mémoriser les gérants renseignés pour les prochains mois
    const entries = agence.clients
      .filter(c => c.retenu && c.classificationFinale === "entreprise" && c.gerant?.trim())
      .map(c => ({ nomClient: c.nomClient, gerant: c.gerant! }))
    await saveGerantsMemo(entries)
    await onUpdate({
      ...workflow,
      agences: { ...workflow.agences, [codeAgence]: { ...agence, etape4Statut: "bloqué" } },
    })
  }

  async function handleUnlock(codeAgence: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    await onUpdate({
      ...workflow,
      agences: { ...workflow.agences, [codeAgence]: { ...agence, etape4Statut: "complet" } },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
            <Users style={{ width: 16, height: 16, color: "#ef9f27" }} />
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
            ÉTAPE 4
          </span>
        </div>

        <h3
          className="font-bold"
          style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
        >
          Détermination des gérants
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Pour chaque entreprise retenue, renseignez le nom du gérant. Ce champ est obligatoire et
          sera inclus dans la carte Trello.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {AGENCES.map(code => (
          <AgenceGerants
            key={code}
            codeAgence={code}
            workflow={workflow}
            memoGerants={memoGerants}
            onGerantChange={handleGerantChange}
            onLock={handleLock}
            onUnlock={handleUnlock}
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
          Passer au dispatch Trello
        </button>
      )}
    </div>
  )
}
