"use client"

import { useState } from "react"
import { Calendar, ChevronRight, Loader2 } from "lucide-react"

type Props = {
  onConfirm: (moisKey: string, moisLabel: string) => Promise<void>
}

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function getNextMonth() {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return {
    moisKey: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    moisLabel: `${MOIS_FR[next.getMonth()]} ${next.getFullYear()}`,
    year: next.getFullYear(),
    month: next.getMonth() + 1,
  }
}

export function Step1Mois({ onConfirm }: Props) {
  const suggested = getNextMonth()
  const [year, setYear] = useState(suggested.year)
  const [month, setMonth] = useState(suggested.month)
  const [loading, setLoading] = useState(false)

  const moisKey = `${year}-${String(month).padStart(2, "0")}`
  const moisLabel = `${MOIS_FR[month - 1]} ${year}`

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm(moisKey, moisLabel)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
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
            <Calendar style={{ width: 16, height: 16, color: "#9b87f5" }} />
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
            ÉTAPE 1
          </span>
        </div>

        <h3
          className="font-bold"
          style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
        >
          Mois du préterme
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Confirmez le mois sur lequel porte ce traitement. Les contrats concernés arrivent à
          échéance ce mois-là.
        </p>
      </div>

      {/* Sélection mois */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
        }}
      >
        <p style={{ fontSize: 12, color: "rgba(200,196,230,0.55)", marginBottom: 12, fontFamily: "DM Mono, monospace" }}>
          MOIS DU PRÉTERME
        </p>

        <div className="flex gap-3">
          {/* Mois */}
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="flex-1 rounded-lg outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "#f0eeff",
              padding: "10px 14px",
              fontSize: 14,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {MOIS_FR.map((m, i) => (
              <option key={i} value={i + 1} style={{ background: "#0e0c1a" }}>
                {m}
              </option>
            ))}
          </select>

          {/* Année */}
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg outline-none"
            style={{
              width: 100,
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "#f0eeff",
              padding: "10px 14px",
              fontSize: 14,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {[suggested.year - 1, suggested.year, suggested.year + 1].map(y => (
              <option key={y} value={y} style={{ background: "#0e0c1a" }}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div
          className="mt-4 rounded-lg flex items-center justify-between px-4 py-3"
          style={{
            background: "rgba(155,135,245,0.06)",
            border: "0.5px solid rgba(155,135,245,0.2)",
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(200,196,230,0.7)" }}>
            Mois sélectionné
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#f0eeff",
              fontFamily: "Syne, sans-serif",
            }}
          >
            {moisLabel}
          </span>
        </div>
      </div>

      {/* Info */}
      <p style={{ fontSize: 12, color: "rgba(200,196,230,0.4)" }}>
        Suggestion automatique : <strong style={{ color: "rgba(200,196,230,0.7)" }}>{suggested.moisLabel}</strong> (mois courant + 1).
        Modifiez si nécessaire.
      </p>

      {/* Bouton */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200"
        style={{
          height: 44,
          background: loading ? "rgba(155,135,245,0.1)" : "rgba(155,135,245,0.15)",
          border: "0.5px solid rgba(155,135,245,0.4)",
          color: "#c4b5fd",
          fontSize: 14,
          fontFamily: "Syne, sans-serif",
          boxShadow: loading ? "none" : "0 0 16px rgba(155,135,245,0.2)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? (
          <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
        ) : (
          <>
            Confirmer {moisLabel}
            <ChevronRight style={{ width: 16, height: 16 }} />
          </>
        )}
      </button>
    </div>
  )
}
