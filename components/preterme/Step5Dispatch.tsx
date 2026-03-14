"use client"

import { useState, useEffect } from "react"
import { Send, Loader2, CheckCircle2, AlertTriangle, User, Building2, RotateCcw } from "lucide-react"
import { buildAuthenticatedJsonHeaders } from "@/lib/firebase/api-auth"
import { extractFirstLetter, findCdcForLetter, getRoutingName } from "@/lib/services/preterme-router"
import type { WorkflowState, ClientImporte, DispatchStatut } from "@/types/preterme"
import type { Agency } from "@/lib/trello-config/types"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

type Props = {
  workflow: WorkflowState
  onUpdate: (w: WorkflowState) => Promise<void>
  onRefresh: () => Promise<void>
  onAdvance: () => void
}

const AGENCES = ["H91358", "H92083"]
const CDC_COLORS = ["#9b87f5", "#2dc596", "#ef9f27", "#60a5fa", "#f87171", "#34d399"]

type ClientRow = {
  numeroContrat: string
  nomClient: string
  classificationFinale: "particulier" | "entreprise" | null
  gerant: string | null
  routingLetter: string
  routingName: string
  dispatchStatut: DispatchStatut
  trelloCardId: string | null
  dispatchErreur?: string
}

type CdcGroup = {
  cdcId: string
  cdcPrenom: string
  letters: string[]
  hasConfigError: boolean
  errorMsg: string | null
  clients: ClientRow[]
}

function buildCdcGroups(workflow: WorkflowState, codeAgence: string, agencies: Agency[]): CdcGroup[] {
  const agence = workflow.agences[codeAgence]
  if (!agence) return []
  const agency = agencies.find(a => a.code === codeAgence)
  if (!agency) return []

  const retenus = agence.clients.filter(c => c.retenu)
  const cdcMap = new Map<string, CdcGroup>()

  for (const client of retenus) {
    const routingName = getRoutingName(client)
    const letter = extractFirstLetter(routingName)
    const cdc = findCdcForLetter(letter, agency.cdc)
    const key = cdc?.id ?? `__missing_${letter}__`

    if (!cdcMap.has(key)) {
      cdcMap.set(key, {
        cdcId: key,
        cdcPrenom: cdc?.firstName ?? `Lettre "${letter}" non couverte`,
        letters: cdc?.letters ?? [],
        hasConfigError: !cdc || !cdc.boardId || !cdc.lists?.pretermeAuto,
        errorMsg: !cdc
          ? `Lettre "${letter}" non attribuée`
          : !cdc.boardId || !cdc.lists?.pretermeAuto
          ? `Trello non configuré pour ${cdc.firstName}`
          : null,
        clients: [],
      })
    }

    cdcMap.get(key)!.clients.push({
      numeroContrat: client.numeroContrat,
      nomClient: client.nomClient,
      classificationFinale: client.classificationFinale,
      gerant: client.gerant,
      routingLetter: letter,
      routingName,
      dispatchStatut: client.dispatchStatut,
      trelloCardId: client.trelloCardId ?? null,
      dispatchErreur: client.dispatchErreur,
    })
  }

  return Array.from(cdcMap.values()).sort((a, b) => b.clients.length - a.clients.length)
}

// ─── Carte CDC ────────────────────────────────────────────────────────────────

function CdcCard({
  group,
  colorIndex,
  dispatching,
  onDispatch,
}: {
  group: CdcGroup
  colorIndex: number
  dispatching: boolean
  onDispatch: (cdcId: string) => void
}) {
  const [confirmReSend, setConfirmReSend] = useState(false)
  const color = CDC_COLORS[colorIndex % CDC_COLORS.length]
  const doneCount = group.clients.filter(c => c.dispatchStatut === "ok").length
  const errorCount = group.clients.filter(c => c.dispatchStatut === "erreur").length
  const pendingCount = group.clients.filter(c => c.dispatchStatut === "en_attente").length
  const isDone = pendingCount === 0 && group.clients.length > 0
  const particuliers = group.clients.filter(c => c.classificationFinale === "particulier").length
  const entreprises = group.clients.filter(c => c.classificationFinale === "entreprise").length

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: isDone
          ? "0.5px solid rgba(45,197,150,0.3)"
          : group.hasConfigError
          ? "0.5px solid rgba(239,68,68,0.25)"
          : `0.5px solid ${color}30`,
      }}
    >
      {/* CDC header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
            style={{
              width: 32, height: 32,
              background: `${color}18`,
              border: `0.5px solid ${color}40`,
              fontSize: 13, color,
              fontFamily: "Syne, sans-serif",
            }}
          >
            {group.cdcPrenom[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
              {group.cdcPrenom}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span style={{ fontSize: 10, color: "rgba(200,196,230,0.45)" }}>
                <User style={{ display: "inline", width: 9, height: 9, marginRight: 2 }} />
                {particuliers}
              </span>
              <span style={{ fontSize: 10, color: "rgba(200,196,230,0.45)" }}>
                <Building2 style={{ display: "inline", width: 9, height: 9, marginRight: 2 }} />
                {entreprises}
              </span>
              {group.letters.length > 0 && (
                <span style={{ fontSize: 9, color: "rgba(200,196,230,0.28)", fontFamily: "DM Mono, monospace" }}>
                  [{group.letters.slice(0, 10).join(" ")}{group.letters.length > 10 ? " …" : ""}]
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Total */}
          <div
            className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
            style={{
              width: 28, height: 28,
              background: `${color}15`,
              border: `0.5px solid ${color}30`,
              fontSize: 13, color,
              fontFamily: "Syne, sans-serif",
            }}
          >
            {group.clients.length}
          </div>

          {/* Bouton dispatch */}
          {!isDone && !group.hasConfigError && (
            <button
              onClick={() => onDispatch(group.cdcId)}
              disabled={dispatching}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all"
              style={{
                fontSize: 11,
                background: dispatching ? "rgba(155,135,245,0.06)" : "rgba(155,135,245,0.12)",
                border: "0.5px solid rgba(155,135,245,0.35)",
                color: "#c4b5fd",
                fontFamily: "Syne, sans-serif",
                cursor: dispatching ? "not-allowed" : "pointer",
              }}
            >
              {dispatching
                ? <Loader2 className="animate-spin" style={{ width: 11, height: 11 }} />
                : <Send style={{ width: 11, height: 11 }} />
              }
              {dispatching ? "Envoi…" : `${pendingCount} carte${pendingCount > 1 ? "s" : ""}`}
            </button>
          )}

          {isDone && (
            <div className="flex items-center gap-2">
              {/* Voyant "déjà envoyé" */}
              <div className="flex items-center gap-1.5">
                <CheckCircle2 style={{ width: 13, height: 13, color: "#2dc596" }} />
                <span style={{ fontSize: 11, color: "#2dc596", fontFamily: "DM Mono, monospace" }}>
                  {doneCount} envoyée{doneCount > 1 ? "s" : ""}{errorCount > 0 ? ` · ${errorCount} err` : ""}
                </span>
              </div>

              {/* Bouton / confirmation renvoyer */}
              {!confirmReSend ? (
                <button
                  onClick={() => setConfirmReSend(true)}
                  disabled={dispatching}
                  className="flex items-center gap-1 rounded-lg px-2 py-1"
                  style={{
                    fontSize: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "0.5px solid rgba(255,255,255,0.12)",
                    color: "rgba(200,196,230,0.45)",
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw style={{ width: 9, height: 9 }} />
                  Renvoyer
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 10, color: "rgba(200,196,230,0.5)" }}>Renvoyer ?</span>
                  <button
                    onClick={() => { setConfirmReSend(false); onDispatch(group.cdcId) }}
                    className="rounded-lg px-2 py-0.5 font-semibold"
                    style={{
                      fontSize: 10,
                      background: "rgba(239,159,39,0.15)",
                      border: "0.5px solid rgba(239,159,39,0.4)",
                      color: "#ef9f27",
                      cursor: "pointer",
                    }}
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => setConfirmReSend(false)}
                    className="rounded-lg px-2 py-0.5"
                    style={{
                      fontSize: 10,
                      background: "rgba(255,255,255,0.04)",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(200,196,230,0.5)",
                      cursor: "pointer",
                    }}
                  >
                    Non
                  </button>
                </div>
              )}
            </div>
          )}

          {group.hasConfigError && (
            <div className="flex items-center gap-1" style={{ fontSize: 10, color: "#f87171" }}>
              <AlertTriangle style={{ width: 11, height: 11 }} />
              Config Trello manquante
            </div>
          )}
        </div>
      </div>

      {/* Liste clients */}
      <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
        {group.clients.map((client, i) => (
          <div
            key={client.numeroContrat}
            className="flex items-center justify-between px-4 py-2"
            style={{
              borderBottom: i < group.clients.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none",
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {client.classificationFinale === "entreprise"
                ? <Building2 style={{ width: 11, height: 11, color: "#ef9f27", flexShrink: 0 }} />
                : <User style={{ width: 11, height: 11, color: "#9b87f5", flexShrink: 0 }} />
              }
              <div className="min-w-0">
                <div
                  className="truncate"
                  style={{ fontSize: 11, color: "#f0eeff", lineHeight: 1.3 }}
                >
                  {client.nomClient}
                </div>
                {client.classificationFinale === "entreprise" && client.gerant && (
                  <div style={{ fontSize: 9, color: "rgba(239,159,39,0.55)", fontFamily: "DM Mono, monospace" }}>
                    {client.gerant}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {/* Lettre de routing */}
              <div
                className="flex items-center justify-center rounded-full font-bold"
                style={{
                  width: 18, height: 18,
                  background: `${color}15`,
                  border: `0.5px solid ${color}30`,
                  fontSize: 9, color,
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {client.routingLetter}
              </div>

              {/* N° contrat */}
              <span style={{ fontSize: 9, color: "rgba(200,196,230,0.28)", fontFamily: "DM Mono, monospace" }}>
                {client.numeroContrat}
              </span>

              {/* Statut */}
              {client.dispatchStatut === "ok" && (
                <CheckCircle2 style={{ width: 11, height: 11, color: "#2dc596" }} />
              )}
              {client.dispatchStatut === "erreur" && (
                <span title={client.dispatchErreur}>
                  <AlertTriangle style={{ width: 11, height: 11, color: "#f87171" }} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section agence ───────────────────────────────────────────────────────────

function AgenceSection({
  codeAgence,
  workflow,
  agencies,
  dispatchingMap,
  onDispatch,
}: {
  codeAgence: string
  workflow: WorkflowState
  agencies: Agency[]
  dispatchingMap: Record<string, boolean>
  onDispatch: (code: string, cdcId: string) => void
}) {
  const agence = workflow.agences[codeAgence]
  if (!agence) return null

  const groups = buildCdcGroups(workflow, codeAgence, agencies)
  const retenus = agence.clients.filter(c => c.retenu)
  const allDone = retenus.length > 0 && retenus.every(c => c.dispatchStatut !== "en_attente")
  const doneCount = retenus.filter(c => c.dispatchStatut === "ok").length

  return (
    <div
      className="rounded-xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: allDone
          ? "0.5px solid rgba(45,197,150,0.35)"
          : "0.5px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header agence */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
            Agence {codeAgence}
          </span>
          <div style={{ fontSize: 11, color: "rgba(200,196,230,0.4)", marginTop: 2 }}>
            {retenus.length} retenus → {groups.length} CDC
          </div>
        </div>
        {allDone && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 style={{ width: 14, height: 14, color: "#2dc596" }} />
            <span style={{ fontSize: 12, color: "#2dc596" }}>{doneCount} cartes créées</span>
          </div>
        )}
      </div>

      {/* Cartes CDC */}
      <div className="flex flex-col gap-3 p-4">
        {groups.map((group, i) => (
          <CdcCard
            key={group.cdcId}
            group={group}
            colorIndex={i}
            dispatching={!!dispatchingMap[group.cdcId]}
            onDispatch={cdcId => onDispatch(codeAgence, cdcId)}
          />
        ))}
        {groups.length === 0 && retenus.length === 0 && (
          <span style={{ fontSize: 12, color: "rgba(200,196,230,0.4)" }}>Aucun client retenu.</span>
        )}
        {groups.length === 0 && retenus.length > 0 && (() => {
          const found = agencies.find(a => a.code === codeAgence)
          if (!found) {
            const availableCodes = agencies.map(a => a.code).join(", ") || "aucun"
            return (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(248,113,113,0.06)", border: "0.5px solid rgba(248,113,113,0.25)" }}
              >
                <AlertTriangle style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171", fontFamily: "Syne, sans-serif" }}>
                    Agence « {codeAgence} » absente de la config Trello
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(248,113,113,0.7)", marginTop: 4 }}>
                    Codes disponibles dans Paramètres Trello : <strong>{availableCodes}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(200,196,230,0.45)", marginTop: 6 }}>
                    Modifiez le code de l&apos;agence dans <em>Paramètres Trello</em> pour qu&apos;il corresponde exactement à <strong style={{ color: "#f0eeff" }}>{codeAgence}</strong>.
                  </div>
                </div>
              </div>
            )
          }
          return (
            <span style={{ fontSize: 12, color: "rgba(200,196,230,0.4)" }}>Aucun CDC configuré pour cette agence.</span>
          )
        })()}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function Step5Dispatch({ workflow, onRefresh, onAdvance }: Omit<Props, "onUpdate">) {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [dispatchingMap, setDispatchingMap] = useState<Record<string, boolean>>({})

  const bothDispatched = AGENCES.every(code => {
    const agence = workflow.agences[code]
    if (!agence) return true
    const retenus = agence.clients.filter(c => c.retenu)
    return retenus.length === 0 || retenus.every(c => c.dispatchStatut !== "en_attente")
  })

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

  async function handleDispatch(codeAgence: string, cdcId: string) {
    setDispatchingMap(prev => ({ ...prev, [cdcId]: true }))
    try {
      const headers = await buildAuthenticatedJsonHeaders()
      const res = await fetch("/api/admin/preterme-auto/dispatch", {
        method: "POST",
        headers,
        body: JSON.stringify({ moisKey: workflow.moisKey, codeAgence, cdcId }),
      })
      if (!res.ok) {
        const data = await res.json()
        console.error("Dispatch error:", data.error)
      }
      await onRefresh()
    } catch (e) {
      console.error("Dispatch failed:", e)
    } finally {
      setDispatchingMap(prev => ({ ...prev, [cdcId]: false }))
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
              width: 36, height: 36,
              background: "rgba(155,135,245,0.1)",
              border: "0.5px solid rgba(155,135,245,0.3)",
            }}
          >
            <Send style={{ width: 16, height: 16, color: "#9b87f5" }} />
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#9b87f5",
            letterSpacing: "0.08em", fontFamily: "DM Mono, monospace",
          }}>
            ÉTAPE 5
          </span>
        </div>

        <h3 className="font-bold" style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
          Routing &amp; Dispatch Trello
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Particuliers → 1ʳᵉ lettre du nom · Entreprises → 1ʳᵉ lettre du gérant.
          Lancez la création des cartes Trello CDC par CDC.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {AGENCES.map(code => (
          <AgenceSection
            key={code}
            codeAgence={code}
            workflow={workflow}
            agencies={agencies}
            dispatchingMap={dispatchingMap}
            onDispatch={handleDispatch}
          />
        ))}
      </div>

      {bothDispatched && (
        <button
          onClick={onAdvance}
          className="self-start flex items-center gap-2 rounded-xl font-semibold"
          style={{
            height: 44, paddingInline: 24,
            background: "rgba(155,135,245,0.15)",
            border: "0.5px solid rgba(155,135,245,0.4)",
            color: "#c4b5fd", fontSize: 14,
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
