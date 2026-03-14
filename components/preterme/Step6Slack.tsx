"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Loader2, CheckCircle2, Send, Hash, RefreshCw, Search, ChevronDown, RotateCcw } from "lucide-react"
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
const DEFAULT_CHANNEL_ID = "CE58HNVF0"

type CdcRow = { prenom: string; letters: string[]; total: number; ok: number; err: number }
type SlackChannel = { id: string; name: string; is_private: boolean; num_members: number }

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

  // Channel selection
  const [selectedChannel, setSelectedChannel] = useState<{ id: string; name: string }>({
    id: DEFAULT_CHANNEL_ID,
    name: DEFAULT_CHANNEL_ID,
  })
  const [showPicker, setShowPicker] = useState(false)
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [channelSearch, setChannelSearch] = useState("")

  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(doc(db, "config/trello"), snap => {
      if (snap.exists()) setAgencies((snap.data() as { agencies: Agency[] }).agencies ?? [])
    })
    return () => unsub()
  }, [])

  async function fetchChannels() {
    setLoadingChannels(true)
    try {
      const res = await fetch("/api/admin/slack/channels")
      const data = await res.json() as { channels?: SlackChannel[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      setChannels(data.channels ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement chaînes")
    } finally {
      setLoadingChannels(false)
    }
  }

  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
    ch.id.toLowerCase().includes(channelSearch.toLowerCase())
  )

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
        body: JSON.stringify({ moisKey: workflow.moisKey, channelId: selectedChannel.id }),
      })
      let data: { error?: string } = {}
      try { data = await res.json() } catch { /* body vide */ }
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
          Envoyez la synthèse du traitement sur Slack. Sélectionnez la chaîne cible avant d'envoyer.
        </p>
      </div>

      {/* Aperçu du message */}
      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "#2dc596" }} />
          <span style={{ fontSize: 11, color: "rgba(200,196,230,0.5)", fontFamily: "DM Mono, monospace" }}>Aperçu du message Slack</span>
        </div>

        <div className="flex flex-col gap-0 p-5" style={{ fontFamily: "DM Mono, monospace" }}>
          {/* En-tête */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
            🚗 Préterme Auto — {workflow.moisLabel}
          </div>
          <div style={{ fontSize: 11, color: "rgba(200,196,230,0.45)", marginTop: 2, marginBottom: 16 }}>
            Traitement du {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} · {AGENCES.length} agences
          </div>

          {/* KPI globaux */}
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, color: "rgba(200,196,230,0.5)" }}>📊 Nbre de contrats dans le préterme :</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f0eeff" }}>{grandTotalClients}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, color: "rgba(200,196,230,0.5)" }}>✅ Nbre retenu :</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f0eeff" }}>{grandTotalRetenus}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, color: "rgba(200,196,230,0.5)" }}>🃏 Nbre de cartes Trello :</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: grandTotalErreurs > 0 ? "#f87171" : "#2dc596" }}>
                {grandTotalCartes}/{grandTotalRetenus} {grandTotalErreurs > 0 ? "⚠️" : "✅"}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ fontSize: 11, color: "rgba(200,196,230,0.2)", letterSpacing: 1, marginBottom: 16 }}>
            ━━━━━━━━━━━━━━━━━━━
          </div>

          {/* Par agence */}
          <div className="flex flex-col gap-4">
            {agenceSummaries.map(a => {
              if (!a) return null
              const pct = grandTotalClients > 0 ? Math.round(a.retenus / grandTotalClients * 100) : 0
              return (
                <div key={a.code}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
                      🏢 {a.code}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(200,196,230,0.6)" }}>—</span>
                    <span style={{ fontSize: 12, color: a.erreurs > 0 ? "#f87171" : "rgba(200,196,230,0.8)" }}>
                      {a.retenus} retenus ({pct}% / {grandTotalClients})
                      {a.erreurs > 0 && " ⚠️"}
                    </span>
                  </div>
                  {a.cdcRows.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5" style={{ paddingLeft: 4 }}>
                      {a.cdcRows.map((row, i) => (
                        <span key={i} style={{ fontSize: 11, color: "rgba(200,196,230,0.7)" }}>
                          <span style={{ color: "#c4b5fd" }}>{row.prenom}</span>
                          {": "}
                          <span style={{ fontWeight: 700, color: row.err > 0 ? "#f87171" : "#f0eeff" }}>
                            {row.total}
                          </span>
                          {row.err > 0 && <span style={{ color: "#f87171", fontSize: 10 }}> ⚠️</span>}
                          {i < a.cdcRows.length - 1 && (
                            <span style={{ color: "rgba(200,196,230,0.3)" }}> — </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "rgba(200,196,230,0.3)", paddingLeft: 4 }}>
                      {agencies.length === 0 ? "Chargement config Trello…" : "Agence absente de la config Trello"}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <span style={{ fontSize: 12, color: "#f87171" }}>{error}</span>
        </div>
      )}

      {/* Badge "déjà envoyé" — informatif uniquement, ne bloque rien */}
      {alreadySent && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(45,197,150,0.06)", border: "0.5px solid rgba(45,197,150,0.2)" }}>
          <CheckCircle2 style={{ width: 13, height: 13, color: "#2dc596", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#2dc596" }}>Rapport déjà envoyé — vous pouvez sélectionner une autre chaîne et renvoyer.</span>
        </div>
      )}

      {/* Bloc envoi — toujours visible */}
      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
        {/* Sélecteur de chaîne intégré */}
        <div className="px-4 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 11, color: "rgba(200,196,230,0.45)", fontFamily: "DM Mono, monospace" }}>CHAÎNE CIBLE</span>
            <button
              onClick={() => {
                setShowPicker(prev => !prev)
                if (!showPicker && channels.length === 0) fetchChannels()
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1 transition-colors"
              style={{
                fontSize: 11,
                background: showPicker ? "rgba(155,135,245,0.1)" : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${showPicker ? "rgba(155,135,245,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: showPicker ? "#9b87f5" : "rgba(200,196,230,0.5)",
                fontFamily: "DM Mono, monospace",
              }}
            >
              <ChevronDown style={{ width: 10, height: 10, transform: showPicker ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              {showPicker ? "Fermer" : "Changer"}
            </button>
          </div>

          {/* Chaîne sélectionnée */}
          <div className="flex items-center gap-2">
            <Hash style={{ width: 13, height: 13, color: "#9b87f5" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f0eeff", fontFamily: "DM Mono, monospace" }}>
              {selectedChannel.name !== selectedChannel.id ? selectedChannel.name : selectedChannel.id}
            </span>
            <span style={{ fontSize: 10, color: "rgba(200,196,230,0.3)", fontFamily: "DM Mono, monospace" }}>
              {selectedChannel.name !== selectedChannel.id ? `· ${selectedChannel.id}` : ""}
            </span>
          </div>
        </div>

        {/* Picker dépliable */}
        {showPicker && (
          <div className="flex flex-col" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
              <Search style={{ width: 12, height: 12, color: "rgba(200,196,230,0.3)", flexShrink: 0 }} />
              <input
                value={channelSearch}
                onChange={e => setChannelSearch(e.target.value)}
                placeholder="Rechercher par nom ou ID…"
                className="flex-1 bg-transparent focus:outline-none"
                style={{ fontSize: 12, color: "#f0eeff", fontFamily: "DM Mono, monospace" }}
              />
              <button
                onClick={fetchChannels}
                disabled={loadingChannels}
                className="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors"
                style={{
                  fontSize: 10, fontFamily: "DM Mono, monospace",
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  color: "rgba(200,196,230,0.5)",
                }}
              >
                {loadingChannels ? <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> : <RefreshCw style={{ width: 10, height: 10 }} />}
                {loadingChannels ? "…" : "Actualiser"}
              </button>
            </div>

            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {loadingChannels && channels.length === 0 ? (
                <div className="flex items-center justify-center py-5 gap-2">
                  <Loader2 style={{ width: 13, height: 13, color: "#9b87f5" }} className="animate-spin" />
                  <span style={{ fontSize: 12, color: "rgba(200,196,230,0.4)" }}>Chargement…</span>
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="py-5 text-center" style={{ fontSize: 12, color: "rgba(200,196,230,0.3)" }}>
                  {channels.length === 0 ? "Cliquez sur Actualiser pour charger les chaînes" : "Aucune chaîne trouvée"}
                </div>
              ) : (
                filteredChannels.map(ch => {
                  const isSelected = ch.id === selectedChannel.id
                  return (
                    <button
                      key={ch.id}
                      onClick={() => { setSelectedChannel({ id: ch.id, name: ch.name }); setShowPicker(false); setChannelSearch("") }}
                      className="flex items-center justify-between w-full px-4 py-2.5"
                      style={{ background: isSelected ? "rgba(155,135,245,0.08)" : "transparent", borderBottom: "0.5px solid rgba(255,255,255,0.03)" }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)" }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = isSelected ? "rgba(155,135,245,0.08)" : "transparent" }}
                    >
                      <div className="flex items-center gap-2">
                        <Hash style={{ width: 11, height: 11, color: isSelected ? "#9b87f5" : "rgba(200,196,230,0.3)" }} />
                        <span style={{ fontSize: 12, color: isSelected ? "#f0eeff" : "rgba(200,196,230,0.7)", fontWeight: isSelected ? 600 : 400 }}>
                          {ch.name}
                        </span>
                        <span style={{ fontSize: 10, color: "rgba(200,196,230,0.2)", fontFamily: "DM Mono, monospace" }}>{ch.num_members} mbr</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 10, color: "rgba(200,196,230,0.25)", fontFamily: "DM Mono, monospace" }}>{ch.id}</span>
                        {isSelected && <CheckCircle2 style={{ width: 11, height: 11, color: "#2dc596" }} />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Bouton d'envoi */}
        <div className="px-4 py-3">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 rounded-xl font-semibold transition-all w-full justify-center"
            style={{
              height: 44,
              background: sending
                ? "rgba(45,197,150,0.04)"
                : alreadySent
                ? "rgba(155,135,245,0.1)"
                : "rgba(45,197,150,0.12)",
              border: sending
                ? "0.5px solid rgba(255,255,255,0.06)"
                : alreadySent
                ? "0.5px solid rgba(155,135,245,0.3)"
                : "0.5px solid rgba(45,197,150,0.4)",
              color: sending ? "rgba(200,196,230,0.3)" : alreadySent ? "#c4b5fd" : "#2dc596",
              fontSize: 14,
              fontFamily: "Syne, sans-serif",
              boxShadow: (!sending && !alreadySent) ? "0 0 16px rgba(45,197,150,0.12)" : "none",
              cursor: sending ? "not-allowed" : "pointer",
            }}
          >
            {sending
              ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
              : alreadySent
              ? <RotateCcw style={{ width: 15, height: 15 }} />
              : <Send style={{ width: 15, height: 15 }} />
            }
            {sending
              ? "Envoi en cours…"
              : alreadySent
              ? `Renvoyer vers #${selectedChannel.name !== selectedChannel.id ? selectedChannel.name : selectedChannel.id}`
              : `Envoyer vers #${selectedChannel.name !== selectedChannel.id ? selectedChannel.name : selectedChannel.id}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}
