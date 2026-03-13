"use client"

import { useState, useEffect } from "react"
import { Send, Loader2, CheckCircle2, AlertTriangle, User, Building2 } from "lucide-react"
import { buildAuthenticatedJsonHeaders } from "@/lib/firebase/api-auth"
import { extractFirstLetter } from "@/lib/services/preterme-router"
import type { WorkflowState } from "@/types/preterme"
import type { Agency } from "@/lib/trello-config/types"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

type Props = {
  workflow: WorkflowState
  onUpdate: (w: WorkflowState) => Promise<void>
  onAdvance: () => void
}

const AGENCES = ["H91358", "H92083"]
const CDC_COLORS = ["#9b87f5", "#2dc596", "#ef9f27", "#60a5fa", "#f87171", "#34d399"]

type RoutingPreview = {
  cdcId: string
  cdcPrenom: string
  total: number
  particuliers: number
  entreprises: number
  hasError: boolean
}

function buildRoutingPreview(workflow: WorkflowState, codeAgence: string, agencies: Agency[]): RoutingPreview[] {
  const agence = workflow.agences[codeAgence]
  if (!agence) return []

  const agency = agencies.find(a => a.code === codeAgence)
  if (!agency) return []

  const retenus = agence.clients.filter(c => c.retenu)
  const cdcMap = new Map<string, RoutingPreview>()

  for (const client of retenus) {
    const letter = extractFirstLetter(client.nomClient)
    const cdc = agency.cdc.find(c => c.letters.includes(letter))
    const key = cdc?.id ?? "__error__"
    const existing = cdcMap.get(key)
    const isParticulier = client.classificationFinale === "particulier"

    if (existing) {
      existing.total++
      if (isParticulier) existing.particuliers++
      else existing.entreprises++
    } else {
      cdcMap.set(key, {
        cdcId: key,
        cdcPrenom: cdc?.firstName ?? `?? (lettre "${letter}")`,
        total: 1,
        particuliers: isParticulier ? 1 : 0,
        entreprises: isParticulier ? 0 : 1,
        hasError: !cdc || !cdc.boardId || !cdc.lists?.pretermeAuto,
      })
    }
  }

  return Array.from(cdcMap.values()).sort((a, b) => b.total - a.total)
}

function AgenceDispatch({
  codeAgence,
  workflow,
  agencies,
  dispatching,
  onDispatch,
}: {
  codeAgence: string
  workflow: WorkflowState
  agencies: Agency[]
  dispatching: boolean
  onDispatch: (code: string) => void
}) {
  const agence = workflow.agences[codeAgence]
  if (!agence) return null

  const isDone = agence.dispatchStatut === "ok"
  const hasError = agence.dispatchStatut === "erreur"
  const preview = buildRoutingPreview(workflow, codeAgence, agencies)
  const retenus = agence.clients.filter(c => c.retenu)
  const cartesOk = retenus.filter(c => c.dispatchStatut === "ok").length
  const cartesErr = retenus.filter(c => c.dispatchStatut === "erreur").length

  return (
    <div
      className="rounded-xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: isDone
          ? "0.5px solid rgba(45,197,150,0.35)"
          : hasError
          ? "0.5px solid rgba(239,68,68,0.3)"
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
          <div style={{ fontSize: 11, color: "rgba(200,196,230,0.4)", marginTop: 2 }}>
            {retenus.length} clients retenus → {preview.length} CDC
          </div>
        </div>

        {isDone ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 style={{ width: 14, height: 14, color: "#2dc596" }} />
            <span style={{ fontSize: 12, color: "#2dc596" }}>{cartesOk} cartes créées</span>
            {cartesErr > 0 && (
              <span style={{ fontSize: 12, color: "#f87171", marginLeft: 8 }}>{cartesErr} erreurs</span>
            )}
          </div>
        ) : (
          <button
            onClick={() => onDispatch(codeAgence)}
            disabled={dispatching}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition-all"
            style={{
              fontSize: 12,
              background: dispatching ? "rgba(155,135,245,0.06)" : "rgba(155,135,245,0.12)",
              border: "0.5px solid rgba(155,135,245,0.35)",
              color: "#c4b5fd",
              fontFamily: "Syne, sans-serif",
              cursor: dispatching ? "not-allowed" : "pointer",
            }}
          >
            {dispatching ? (
              <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} />
            ) : (
              <Send style={{ width: 12, height: 12 }} />
            )}
            {dispatching ? "Dispatch en cours..." : "Dispatcher sur Trello"}
          </button>
        )}
      </div>

      {/* Routing preview */}
      <div className="p-5">
        <p style={{ fontSize: 10, color: "rgba(200,196,230,0.4)", marginBottom: 10, fontFamily: "DM Mono, monospace" }}>
          RÉPARTITION PAR CDC
        </p>
        <div className="flex flex-col gap-2">
          {preview.map((cdc, i) => (
            <div
              key={cdc.cdcId}
              className="flex items-center justify-between rounded-lg px-3 py-2.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: cdc.hasError
                  ? "0.5px solid rgba(239,68,68,0.2)"
                  : "0.5px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    background: `${CDC_COLORS[i % CDC_COLORS.length]}20`,
                    border: `0.5px solid ${CDC_COLORS[i % CDC_COLORS.length]}40`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: CDC_COLORS[i % CDC_COLORS.length],
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  {cdc.cdcPrenom[0]}
                </div>
                <div>
                  <span style={{ fontSize: 12, color: cdc.hasError ? "#f87171" : "#f0eeff" }}>
                    {cdc.cdcPrenom}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span style={{ fontSize: 10, color: "rgba(200,196,230,0.4)" }}>
                      <User style={{ display: "inline", width: 9, height: 9, marginRight: 2 }} />
                      {cdc.particuliers}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(200,196,230,0.4)" }}>
                      <Building2 style={{ display: "inline", width: 9, height: 9, marginRight: 2 }} />
                      {cdc.entreprises}
                    </span>
                    {cdc.hasError && (
                      <AlertTriangle style={{ width: 10, height: 10, color: "#f87171" }} />
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: CDC_COLORS[i % CDC_COLORS.length],
                  fontFamily: "Syne, sans-serif",
                }}
              >
                {cdc.total}
              </div>
            </div>
          ))}

          {preview.length === 0 && (
            <span style={{ fontSize: 12, color: "rgba(200,196,230,0.4)" }}>Aucun client retenu.</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function Step5Dispatch({ workflow, onUpdate, onAdvance }: Props) {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [dispatchingMap, setDispatchingMap] = useState<Record<string, boolean>>({})

  const bothDispatched = AGENCES.every(code => workflow.agences[code]?.dispatchStatut === "ok")

  // Load agencies from Firestore (real-time)
  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(doc(db, "config/trello"), snap => {
      if (snap.exists()) {
        const data = snap.data() as { agencies: Agency[] }
        setAgencies(data.agencies ?? [])
      }
    })
    return () => unsub()
  }, [])

  async function handleDispatch(codeAgence: string) {
    setDispatchingMap(prev => ({ ...prev, [codeAgence]: true }))
    try {
      const headers = await buildAuthenticatedJsonHeaders()
      const res = await fetch("/api/admin/preterme-auto/dispatch", {
        method: "POST",
        headers,
        body: JSON.stringify({ moisKey: workflow.moisKey, codeAgence }),
      })
      if (!res.ok) {
        const data = await res.json()
        console.error("Dispatch error:", data.error)
      }
      await onUpdate({ ...workflow })
    } catch (e) {
      console.error("Dispatch failed:", e)
    } finally {
      setDispatchingMap(prev => ({ ...prev, [codeAgence]: false }))
    }
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
              background: "rgba(155,135,245,0.1)",
              border: "0.5px solid rgba(155,135,245,0.3)",
            }}
          >
            <Send style={{ width: 16, height: 16, color: "#9b87f5" }} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9b87f5",
              letterSpacing: "0.08em",
              fontFamily: "DM Mono, monospace",
            }}
          >
            ÉTAPE 5
          </span>
        </div>

        <h3
          className="font-bold"
          style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
        >
          Routing &amp; Dispatch Trello
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Visualisez la répartition des clients par CDC, puis lancez la création des cartes Trello
          pour chaque agence.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {AGENCES.map(code => (
          <AgenceDispatch
            key={code}
            codeAgence={code}
            workflow={workflow}
            agencies={agencies}
            dispatching={!!dispatchingMap[code]}
            onDispatch={handleDispatch}
          />
        ))}
      </div>

      {bothDispatched && (
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
          Envoyer le rapport Slack
        </button>
      )}
    </div>
  )
}
