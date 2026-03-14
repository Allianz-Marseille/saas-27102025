"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Loader2, CheckCircle2, Send, User, Building2 } from "lucide-react"
import { buildAuthenticatedJsonHeaders } from "@/lib/firebase/api-auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { WorkflowState, SnapshotCdc } from "@/types/preterme"

type Props = {
  workflow: WorkflowState
  onUpdate: (w: WorkflowState) => Promise<void>
}

const AGENCES = ["H91358", "H92083"]

export function Step6Slack({ workflow, onUpdate }: Props) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<SnapshotCdc[]>([])
  const alreadySent = !!workflow.slackEnvoye

  useEffect(() => {
    if (!db) return
    const load = async () => {
      const q = query(
        collection(db!, "preterme_snapshots"),
        where("moisKey", "==", workflow.moisKey)
      )
      const snap = await getDocs(q)
      setSnapshots(snap.docs.map(d => d.data() as SnapshotCdc))
    }
    load()
  }, [workflow.moisKey])

  // Totaux globaux
  let totalRetenus = 0
  let totalCartes = 0
  let totalErreurs = 0

  const agenceSummaries = AGENCES.map(code => {
    const agence = workflow.agences[code]
    if (!agence) return null
    const retenus = agence.clients.filter(c => c.retenu)
    const particuliers = retenus.filter(c => c.classificationFinale === "particulier").length
    const entreprises = retenus.filter(c => c.classificationFinale === "entreprise").length
    const cartes = retenus.filter(c => c.dispatchStatut === "ok").length
    const erreurs = retenus.filter(c => c.dispatchStatut === "erreur").length
    totalRetenus += retenus.length
    totalCartes += cartes
    totalErreurs += erreurs
    const cdcs = snapshots
      .filter(s => s.codeAgence === code)
      .sort((a, b) => b.clientsTotal - a.clientsTotal)
    return { code, total: agence.clientsTotal, retenus: retenus.length, particuliers, entreprises, cartes, erreurs, cdcs }
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
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 36, height: 36,
              background: "rgba(45,197,150,0.1)",
              border: "0.5px solid rgba(45,197,150,0.3)",
            }}
          >
            <MessageSquare style={{ width: 16, height: 16, color: "#2dc596" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#2dc596", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace" }}>
            ÉTAPE 6
          </span>
        </div>
        <h3 className="font-bold" style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
          Rapport Slack
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Envoyez la synthèse du traitement sur Slack. Le message sera publié dans le canal interne.
        </p>
      </div>

      {/* Aperçu */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Barre titre aperçu */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: "#2dc596" }} />
          <span style={{ fontSize: 11, color: "rgba(200,196,230,0.5)", fontFamily: "DM Mono, monospace" }}>
            Aperçu du message Slack
          </span>
        </div>

        <div className="flex flex-col gap-4 p-5" style={{ fontFamily: "DM Mono, monospace" }}>
          {/* Titre */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eeff" }}>
              📋 Préterme Auto — {workflow.moisLabel}
            </div>
            <div style={{ fontSize: 11, color: "rgba(200,196,230,0.4)", marginTop: 2 }}>
              Traitement terminé
            </div>
          </div>

          {/* Par agence */}
          {agenceSummaries.map(a => a && (
            <div
              key={a.code}
              className="rounded-xl overflow-hidden"
              style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}
            >
              {/* Header agence */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.04)", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f0eeff" }}>
                  🏢 AGENCE {a.code}
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 11, color: "rgba(200,196,230,0.5)" }}>
                    {a.retenus} retenus
                  </span>
                  <span style={{ fontSize: 11, color: a.erreurs > 0 ? "#f87171" : "#2dc596", fontWeight: 600 }}>
                    {a.cartes} cartes {a.erreurs > 0 ? `⚠️ ${a.erreurs} err` : "✅"}
                  </span>
                </div>
              </div>

              {/* Stats rapides */}
              <div
                className="flex items-center gap-4 px-4 py-2"
                style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}
              >
                <span style={{ fontSize: 11, color: "rgba(200,196,230,0.5)" }}>
                  <User style={{ display: "inline", width: 9, height: 9, marginRight: 3 }} />
                  {a.particuliers} particuliers
                </span>
                <span style={{ fontSize: 11, color: "rgba(200,196,230,0.5)" }}>
                  <Building2 style={{ display: "inline", width: 9, height: 9, marginRight: 3 }} />
                  {a.entreprises} entreprises
                </span>
              </div>

              {/* Lignes CDC */}
              {a.cdcs.length > 0 ? (
                <div className="flex flex-col">
                  {a.cdcs.map((s, i) => {
                    const errCount = s.clientsTotal - s.cartesCreees
                    const letters = s.lettresAttribuees.slice(0, 13).join(" ")
                    const lettersStr = s.lettresAttribuees.length > 13 ? `${letters} …` : letters
                    return (
                      <div
                        key={s.cdcId}
                        className="flex items-center justify-between px-4 py-2"
                        style={{
                          borderBottom: i < a.cdcs.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none",
                        }}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#f0eeff" }}>
                            {s.cdcPrenom}
                          </span>
                          <span style={{ fontSize: 9, color: "rgba(200,196,230,0.3)", fontFamily: "DM Mono, monospace" }}>
                            [{lettersStr}]
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span style={{ fontSize: 11, color: "rgba(200,196,230,0.6)", fontFamily: "DM Mono, monospace" }}>
                            {s.cartesCreees}/{s.clientsTotal}
                          </span>
                          {errCount > 0 ? (
                            <span style={{ fontSize: 10, color: "#f87171" }}>⚠️ {errCount} err</span>
                          ) : (
                            <CheckCircle2 style={{ width: 12, height: 12, color: "#2dc596" }} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-2" style={{ fontSize: 11, color: "rgba(200,196,230,0.3)" }}>
                  Aucun snapshot CDC disponible
                </div>
              )}
            </div>
          ))}

          {/* Total */}
          <div
            className="flex items-center justify-between rounded-lg px-4 py-2.5"
            style={{ background: "rgba(155,135,245,0.06)", border: "0.5px solid rgba(155,135,245,0.15)" }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#f0eeff" }}>📊 TOTAL — {AGENCES.length} agences</span>
            <div className="flex items-center gap-4">
              <span style={{ fontSize: 11, color: "rgba(200,196,230,0.6)" }}>{totalRetenus} retenus</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: totalErreurs > 0 ? "#f87171" : "#2dc596" }}>
                {totalCartes} cartes {totalErreurs > 0 ? `⚠️ ${totalErreurs} err` : "✅"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Canal cible */}
      <div
        className="flex items-center justify-between rounded-lg px-4 py-3"
        style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
      >
        <span style={{ fontSize: 12, color: "rgba(200,196,230,0.5)" }}>Canal Slack cible</span>
        <span style={{ fontSize: 12, color: "#9b87f5", fontFamily: "DM Mono, monospace" }}>
          #{SLACK_CHANNEL_ID}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}
        >
          <span style={{ fontSize: 12, color: "#f87171" }}>{error}</span>
        </div>
      )}

      {/* Actions */}
      {alreadySent ? (
        <div className="flex items-center gap-3">
          <CheckCircle2 style={{ width: 18, height: 18, color: "#2dc596" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2dc596", fontFamily: "Syne, sans-serif" }}>
              Rapport envoyé sur Slack
            </div>
            <div style={{ fontSize: 12, color: "rgba(200,196,230,0.5)", marginTop: 2 }}>
              Workflow {workflow.moisLabel} terminé.
            </div>
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
          {sending
            ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
            : <Send style={{ width: 16, height: 16 }} />
          }
          {sending ? "Envoi en cours..." : "Envoyer sur Slack"}
        </button>
      )}
    </div>
  )
}

const SLACK_CHANNEL_ID = "CE58HNVF0"
