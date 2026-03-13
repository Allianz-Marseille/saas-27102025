"use client"

import { useState } from "react"
import { MessageSquare, Loader2, CheckCircle2, Send } from "lucide-react"
import { buildAuthenticatedJsonHeaders } from "@/lib/firebase/api-auth"
import type { WorkflowState } from "@/types/preterme"

type Props = {
  workflow: WorkflowState
  onUpdate: (w: WorkflowState) => Promise<void>
}

const AGENCES = ["H91358", "H92083"]

export function Step6Slack({ workflow, onUpdate }: Props) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alreadySent = !!workflow.slackEnvoye

  // Build preview
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
    return { code, total: agence.clientsTotal, retenus: retenus.length, particuliers, entreprises, cartes, erreurs, seuilMajo: agence.seuilMajo, seuilEtp: agence.seuilEtp }
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
      const data = await res.json()
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
              width: 36,
              height: 36,
              background: "rgba(45,197,150,0.1)",
              border: "0.5px solid rgba(45,197,150,0.3)",
            }}
          >
            <MessageSquare style={{ width: 16, height: 16, color: "#2dc596" }} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#2dc596",
              letterSpacing: "0.08em",
              fontFamily: "DM Mono, monospace",
            }}
          >
            ÉTAPE 6
          </span>
        </div>

        <h3
          className="font-bold"
          style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
        >
          Rapport Slack
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Envoyez la synthèse du traitement sur Slack. Le message sera publié dans le canal interne.
        </p>
      </div>

      {/* Preview */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
          fontFamily: "DM Mono, monospace",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#2dc596" }}
          />
          <span style={{ fontSize: 11, color: "rgba(200,196,230,0.5)" }}>
            Aperçu du message Slack
          </span>
        </div>

        <div style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(200,196,230,0.8)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eeff", marginBottom: 12 }}>
            📋 Préterme Auto — {workflow.moisLabel}
          </div>
          <div style={{ marginBottom: 12, color: "rgba(200,196,230,0.6)" }}>
            Traitement terminé. Voici la synthèse :
          </div>

          {agenceSummaries.map(a => a && (
            <div key={a.code} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: "#f0eeff", marginBottom: 4 }}>AGENCE {a.code}</div>
              <div>• Clients total&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {a.total}</div>
              <div>• Clients retenus&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {a.retenus}  <span style={{ color: "rgba(200,196,230,0.4)", fontSize: 11 }}>(majo ≥ {a.seuilMajo}% | ETP ≥ {a.seuilEtp.toFixed(2)})</span></div>
              <div>• Particuliers&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {a.particuliers}</div>
              <div>• Entreprises&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {a.entreprises}</div>
              <div>• Cartes Trello créées : {a.cartes}</div>
              {a.erreurs > 0 && <div style={{ color: "#f87171" }}>• Erreurs dispatch&nbsp;&nbsp;&nbsp;&nbsp; : {a.erreurs}</div>}
            </div>
          ))}

          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)", paddingTop: 12 }}>
            <div style={{ fontWeight: 700, color: "#f0eeff", marginBottom: 4 }}>TOTAL — {AGENCES.length} agences</div>
            <div>• Clients retenus&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {totalRetenus}</div>
            <div>• Cartes créées&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {totalCartes}</div>
            <div>• Erreurs dispatch&nbsp;&nbsp;&nbsp;&nbsp; : {totalErreurs}</div>
          </div>
        </div>
      </div>

      {/* Canal cible */}
      <div
        className="flex items-center justify-between rounded-lg px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ fontSize: 12, color: "rgba(200,196,230,0.5)" }}>Canal cible</span>
        <span style={{ fontSize: 12, color: "#9b87f5", fontFamily: "DM Mono, monospace" }}>
          #CE58HNVF0
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
            height: 44,
            paddingInline: 24,
            background: sending ? "rgba(45,197,150,0.06)" : "rgba(45,197,150,0.12)",
            border: "0.5px solid rgba(45,197,150,0.4)",
            color: "#2dc596",
            fontSize: 14,
            fontFamily: "Syne, sans-serif",
            boxShadow: sending ? "none" : "0 0 16px rgba(45,197,150,0.15)",
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          {sending ? (
            <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
          ) : (
            <Send style={{ width: 16, height: 16 }} />
          )}
          {sending ? "Envoi en cours..." : "Envoyer sur Slack"}
        </button>
      )}
    </div>
  )
}
