"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Loader2, CheckCircle2, Send } from "lucide-react"
import { buildAuthenticatedJsonHeaders } from "@/lib/firebase/api-auth"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { routeClientsTocdcs } from "@/lib/services/preterme-router"
import type { WorkflowState } from "@/types/preterme"
import type { Agency } from "@/lib/trello-config/types"

type Props = {
  workflow: WorkflowState
  onUpdate: (w: WorkflowState) => Promise<void>
}

const AGENCES = ["H91358", "H92083"]
const SLACK_CHANNEL_ID = "CE58HNVF0"

type CdcRow = { prenom: string; letters: string[]; total: number; ok: number; err: number }

function buildCdcRows(workflow: WorkflowState, code: string, agencies: Agency[]): CdcRow[] {
  const agence = workflow.agences[code]
  if (!agence) return []
  const agency = agencies.find(a => a.code === code)
  if (!agency) return []

  const retenus = agence.clients.filter(c => c.retenu)
  const routed = routeClientsTocdcs(
    retenus.map(c => ({
      nomClient: c.nomClient,
      numeroContrat: c.numeroContrat,
      classificationFinale: c.classificationFinale,
      gerant: c.gerant,
    })),
    agency
  )

  const cdcMap = new Map<string, CdcRow>()
  for (const rc of routed) {
    const key = rc.cdcId ?? `__missing_${rc.premiereLettre}__`
    if (!cdcMap.has(key)) {
      cdcMap.set(key, {
        prenom: rc.cdcPrenom ?? `Lettre "${rc.premiereLettre}" non couverte`,
        letters: agency.cdc.find(c => c.id === rc.cdcId)?.letters ?? [],
        total: 0, ok: 0, err: 0,
      })
    }
    const entry = cdcMap.get(key)!
    entry.total++
    const client = retenus.find(c => c.numeroContrat === rc.numeroContrat)
    if (client?.dispatchStatut === "ok") entry.ok++
    else if (client?.dispatchStatut === "erreur") entry.err++
  }

  return [...cdcMap.values()].sort((a, b) => b.total - a.total)
}

export function Step6Slack({ workflow, onUpdate }: Props) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const alreadySent = !!workflow.slackEnvoye

  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(doc(db, "config/trello"), snap => {
      if (snap.exists()) setAgencies((snap.data() as { agencies: Agency[] }).agencies ?? [])
    })
    return () => unsub()
  }, [])

  // Calcul des totaux globaux
  let grandTotalClients = 0
  let grandTotalRetenus = 0
  let grandTotalCartes = 0
  let grandTotalErreurs = 0

  const agenceSummaries = AGENCES.map(code => {
    const agence = workflow.agences[code]
    if (!agence) return null
    const retenus = agence.clients.filter(c => c.retenu)
    const particuliers = retenus.filter(c => c.classificationFinale === "particulier").length
    const entreprises = retenus.filter(c => c.classificationFinale === "entreprise").length
    const cartes = retenus.filter(c => c.dispatchStatut === "ok").length
    const erreurs = retenus.filter(c => c.dispatchStatut === "erreur").length
    grandTotalClients += agence.clientsTotal
    grandTotalRetenus += retenus.length
    grandTotalCartes += cartes
    grandTotalErreurs += erreurs
    const cdcRows = buildCdcRows(workflow, code, agencies)
    return { code, clientsTotal: agence.clientsTotal, retenus: retenus.length, particuliers, entreprises, cartes, erreurs, seuilMajo: agence.seuilMajo, seuilEtp: agence.seuilEtp, cdcRows }
  }).filter(Boolean)

  async function handleSend() {
    setSending(true)
    setError(null)
    try {
      const headers = await buildAuthenticatedJsonHeaders()
      const res = await fetch("/api/admin/preterme-auto/slack", {
        method: "POST",
        headers,
        body: JSON.stringify({ moisKey: workflow.moisKey }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Erreur Slack")
      await onUpdate({ ...workflow, slackEnvoye: true, statut: "terminé" })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "rgba(45,197,150,0.1)", border: "0.5px solid rgba(45,197,150,0.3)" }}>
            <MessageSquare style={{ width: 16, height: 16, color: "#2dc596" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#2dc596", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace" }}>ÉTAPE 6</span>
        </div>
        <h3 className="font-bold" style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>Rapport Slack</h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Envoyez la synthèse du traitement sur Slack. Le message sera publié dans le canal interne.
        </p>
      </div>

      {/* Aperçu */}
      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "#2dc596" }} />
          <span style={{ fontSize: 11, color: "rgba(200,196,230,0.5)", fontFamily: "DM Mono, monospace" }}>Aperçu du message Slack</span>
        </div>

        <div className="flex flex-col gap-0 p-5">

          {/* En-tête */}
          <div className="mb-3">
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
              🚗 Préterme Auto — {workflow.moisLabel}
            </div>
            <div style={{ fontSize: 11, color: "rgba(200,196,230,0.45)", fontFamily: "DM Mono, monospace", marginTop: 2 }}>
              Traitement du {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} · {AGENCES.length} agences
            </div>
          </div>

          {/* Divider + Total */}
          <div className="rounded-lg px-4 py-3 mb-4" style={{ background: "rgba(155,135,245,0.06)", border: "0.5px solid rgba(155,135,245,0.15)" }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
                📊 TOTAL : {grandTotalCartes}/{grandTotalRetenus} cartes créées
              </span>
              {grandTotalErreurs > 0
                ? <span style={{ fontSize: 11, color: "#f87171" }}>⚠️ {grandTotalErreurs} err</span>
                : <CheckCircle2 style={{ width: 14, height: 14, color: "#2dc596" }} />
              }
            </div>
            <div style={{ fontSize: 11, color: "rgba(200,196,230,0.5)", fontFamily: "DM Mono, monospace", marginTop: 4 }}>
              {grandTotalClients} importés → <span style={{ color: "#f0eeff", fontWeight: 600 }}>{grandTotalRetenus} retenus</span>
            </div>
          </div>

          {/* Par agence — compact */}
          <div className="flex flex-col gap-3">
            {agenceSummaries.map(a => a && (
              <div key={a.code} className="rounded-lg px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
                {/* Ligne 1 : agence + cartes */}
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>🏢 {a.code}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: a.erreurs > 0 ? "#f87171" : "#2dc596", fontFamily: "DM Mono, monospace" }}>
                    {a.erreurs > 0 ? `${a.cartes}/${a.retenus} cartes ⚠️` : `${a.cartes} cartes ✅`}
                  </span>
                </div>
                {/* Ligne 2 : volumes */}
                <div style={{ fontSize: 11, color: "rgba(200,196,230,0.5)", fontFamily: "DM Mono, monospace" }}>
                  {a.clientsTotal} importés · <span style={{ color: "#f0eeff" }}>{a.retenus} retenus</span> · {a.particuliers} part. / {a.entreprises} entr.
                </div>
                {/* Ligne 3 : CDC inline */}
                {a.cdcRows.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                    <span style={{ fontSize: 10, color: "rgba(200,196,230,0.35)", fontFamily: "DM Mono, monospace" }}>›</span>
                    {a.cdcRows.map((row, i) => (
                      <span key={i} style={{ fontSize: 11, fontFamily: "DM Mono, monospace" }}>
                        <span style={{ color: "rgba(200,196,230,0.7)" }}>{row.prenom}</span>
                        {" "}
                        <span style={{ fontWeight: 700, color: row.err > 0 ? "#f87171" : "#f0eeff" }}>
                          {row.err > 0 ? `${row.ok}/${row.total}` : `${row.ok}`}
                        </span>
                        {row.err > 0 && <span style={{ color: "#f87171", fontSize: 10 }}> ⚠️</span>}
                        {i < a.cdcRows.length - 1 && <span style={{ color: "rgba(200,196,230,0.2)" }}> ·</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "rgba(200,196,230,0.3)", fontFamily: "DM Mono, monospace", marginTop: 6 }}>
                    {agencies.length === 0 ? "Chargement config Trello…" : "Agence absente de la config Trello"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Canal cible */}
      <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 12, color: "rgba(200,196,230,0.5)" }}>Canal Slack cible</span>
        <span style={{ fontSize: 12, color: "#9b87f5", fontFamily: "DM Mono, monospace" }}>#{SLACK_CHANNEL_ID}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <span style={{ fontSize: 12, color: "#f87171" }}>{error}</span>
        </div>
      )}

      {alreadySent ? (
        <div className="flex items-center gap-3">
          <CheckCircle2 style={{ width: 18, height: 18, color: "#2dc596" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2dc596", fontFamily: "Syne, sans-serif" }}>Rapport envoyé sur Slack</div>
            <div style={{ fontSize: 12, color: "rgba(200,196,230,0.5)", marginTop: 2 }}>Workflow {workflow.moisLabel} terminé.</div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSend}
          disabled={sending}
          className="self-start flex items-center gap-2 rounded-xl font-semibold transition-all"
          style={{
            height: 44, paddingInline: 24,
            background: sending ? "rgba(45,197,150,0.06)" : "rgba(45,197,150,0.12)",
            border: "0.5px solid rgba(45,197,150,0.4)",
            color: "#2dc596", fontSize: 14,
            fontFamily: "Syne, sans-serif",
            boxShadow: sending ? "none" : "0 0 16px rgba(45,197,150,0.15)",
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          {sending ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <Send style={{ width: 16, height: 16 }} />}
          {sending ? "Envoi en cours..." : "Envoyer sur Slack"}
        </button>
      )}
    </div>
  )
}
