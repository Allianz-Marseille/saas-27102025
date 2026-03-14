"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Users, Lock, Unlock, CheckCircle2, Building2, BookUser, Save } from "lucide-react"
import { getGerantsMemo, saveGerantsMemo } from "@/lib/firebase/preterme"
import type { WorkflowState } from "@/types/preterme"

type Props = {
  workflow: WorkflowState
  onUpdate: (w: WorkflowState) => Promise<void>
  onAdvance: () => void
}

const AGENCES = ["H91358", "H92083"]

// ─── Sous-composant agence ────────────────────────────────────────────────────

function AgenceGerants({
  codeAgence,
  workflow,
  localGerants,
  memoGerants,
  onLocalChange,
  onBlurSave,
  onLock,
  onUnlock,
}: {
  codeAgence: string
  workflow: WorkflowState
  localGerants: Record<string, string>
  memoGerants: Record<string, string>
  onLocalChange: (numeroContrat: string, nomClient: string, gerant: string) => void
  onBlurSave: () => void
  onLock: (code: string) => void
  onUnlock: (code: string) => void
}) {
  const agence = workflow.agences[codeAgence]
  if (!agence) return null

  const isBlocked = agence.etape4Statut === "bloqué"
  const entreprises = agence.clients.filter(c => c.retenu && c.classificationFinale === "entreprise")
  const allFilled = entreprises.length > 0 && entreprises.every(c => localGerants[c.numeroContrat]?.trim())

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
            {entreprises.map(client => {
              const localVal = localGerants[client.numeroContrat] ?? ""
              const isMemo = !!memoGerants[client.nomClient]
              const isFilled = localVal.trim().length > 0

              return (
                <div
                  key={client.numeroContrat}
                  className="flex flex-col gap-1.5 rounded-lg px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `0.5px solid ${!isFilled && !isBlocked ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
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
                      value={localVal}
                      disabled={isBlocked}
                      onChange={e => onLocalChange(client.numeroContrat, client.nomClient, e.target.value)}
                      onBlur={onBlurSave}
                      className="w-full rounded-lg outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `0.5px solid ${isFilled ? "rgba(155,135,245,0.3)" : "rgba(255,255,255,0.1)"}`,
                        color: "#f0eeff",
                        padding: "8px 12px",
                        paddingRight: isMemo ? 90 : 12,
                        fontSize: 12,
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    />
                    {isMemo && (
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function Step4Gerants({ workflow, onUpdate, onAdvance }: Props) {
  // State local pour la saisie (découplé de Firestore)
  const [localGerants, setLocalGerants] = useState<Record<string, string>>({})
  const [memoGerants, setMemoGerants] = useState<Record<string, string>>({})
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)

  // Toutes les entreprises à plat (pour la propagation inter-contrats)
  const allEntreprises = useMemo(
    () =>
      AGENCES.flatMap(code =>
        (workflow.agences[code]?.clients ?? []).filter(
          c => c.retenu && c.classificationFinale === "entreprise"
        )
      ),
    [workflow]
  )

  // Initialiser le local state depuis le workflow (sans écraser ce que l'user est en train de taper)
  useEffect(() => {
    setLocalGerants(prev => {
      const merged = { ...prev }
      allEntreprises.forEach(c => {
        if (merged[c.numeroContrat] === undefined) {
          merged[c.numeroContrat] = c.gerant ?? ""
        }
      })
      return merged
    })
  }, [allEntreprises])

  // Charger la mémoire gérants au montage et pré-remplir les champs vides
  useEffect(() => {
    const noms = allEntreprises.map(c => c.nomClient)
    if (noms.length === 0) return

    getGerantsMemo(noms).then(memo => {
      setMemoGerants(memo)
      setLocalGerants(prev => {
        const updated = { ...prev }
        allEntreprises.forEach(c => {
          if (!updated[c.numeroContrat]?.trim() && memo[c.nomClient]) {
            updated[c.numeroContrat] = memo[c.nomClient]
          }
        })
        return updated
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Saisie : mise à jour locale + propagation immédiate aux autres contrats de la même société
  function handleLocalChange(numeroContrat: string, nomClient: string, gerant: string) {
    setLocalGerants(prev => {
      const updated = { ...prev, [numeroContrat]: gerant }
      // Propager aux contrats du même nomClient (même société, contrats différents)
      allEntreprises.forEach(c => {
        if (c.nomClient === nomClient && c.numeroContrat !== numeroContrat) {
          updated[c.numeroContrat] = gerant
        }
      })
      return updated
    })
  }

  // Blur : sauvegarde brouillon Firestore
  const handleBlurSave = useCallback(async () => {
    setSaving(true)
    let updated = workflow
    AGENCES.forEach(code => {
      const agence = updated.agences[code]
      if (!agence) return
      const clients = agence.clients.map(c => {
        const val = localGerants[c.numeroContrat]
        return val !== undefined ? { ...c, gerant: val } : c
      })
      updated = { ...updated, agences: { ...updated.agences, [code]: { ...agence, clients } } }
    })
    await onUpdate(updated)
    setSaving(false)
    setLastSaved(new Date())
  }, [localGerants, onUpdate, workflow])

  // Blocage : sauvegarde mémoire + lock
  async function handleLock(codeAgence: string) {
    await handleBlurSave()
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    const entries = agence.clients
      .filter(c => c.retenu && c.classificationFinale === "entreprise")
      .map(c => ({ nomClient: c.nomClient, gerant: localGerants[c.numeroContrat] ?? "" }))
      .filter(e => e.gerant.trim())
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

  const bothBlocked = AGENCES.every(code => {
    const agence = workflow.agences[code]
    if (!agence) return true
    const entreprises = agence.clients.filter(c => c.retenu && c.classificationFinale === "entreprise")
    return entreprises.length === 0 || agence.etape4Statut === "bloqué"
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
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

          {/* Indicateur brouillon */}
          <div className="flex items-center gap-1.5" style={{ fontSize: 10, fontFamily: "DM Mono, monospace" }}>
            {saving ? (
              <span style={{ color: "rgba(200,196,230,0.4)" }}>Sauvegarde…</span>
            ) : lastSaved ? (
              <>
                <Save style={{ width: 10, height: 10, color: "#2dc596" }} />
                <span style={{ color: "#2dc596" }}>
                  Brouillon sauvegardé à{" "}
                  {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <h3
          className="font-bold"
          style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
        >
          Détermination des gérants
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Renseignez le gérant de chaque entreprise. La saisie est propagée automatiquement aux
          contrats de la même société et sauvegardée à chaque changement de champ.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {AGENCES.map(code => (
          <AgenceGerants
            key={code}
            codeAgence={code}
            workflow={workflow}
            localGerants={localGerants}
            memoGerants={memoGerants}
            onLocalChange={handleLocalChange}
            onBlurSave={handleBlurSave}
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
