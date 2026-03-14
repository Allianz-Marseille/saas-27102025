"use client"

import { useState, useMemo } from "react"
import { X, TrendingUp } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { WorkflowState } from "@/types/preterme"

const AGENCES = ["H91358", "H92083"] as const
const COLORS: Record<string, string> = {
  H91358: "#9b87f5",
  H92083: "#2dc596",
}

type Tab = "importes" | "retenus"

type Props = {
  allWorkflows: WorkflowState[]
  onClose: () => void
}

// Tooltip custom dark mode
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: "#0e0c1a",
        border: "0.5px solid rgba(155,135,245,0.3)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        fontFamily: "DM Mono, monospace",
      }}
    >
      <p style={{ fontSize: 11, color: "rgba(200,196,230,0.5)", marginBottom: 6 }}>{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 6, height: 6, background: entry.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "rgba(200,196,230,0.7)" }}>{entry.name}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f0eeff", marginLeft: "auto", paddingLeft: 12 }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function HistoPanel({ allWorkflows, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("importes")

  // Données triées chronologiquement (ASC)
  const chartData = useMemo(() => {
    return [...allWorkflows]
      .sort((a, b) => a.moisKey.localeCompare(b.moisKey))
      .map(w => {
        const entry: Record<string, string | number> = {
          mois: w.moisLabel.length > 9 ? w.moisLabel.slice(0, 9) : w.moisLabel,
        }
        for (const code of AGENCES) {
          const agence = w.agences?.[code]
          if (!agence) { entry[code] = 0; continue }
          if (tab === "importes") {
            entry[code] = agence.clientsTotal ?? 0
          } else {
            entry[code] = agence.clients?.filter(c => c.retenu).length ?? 0
          }
        }
        return entry
      })
  }, [allWorkflows, tab])

  // Totaux toutes agences / tous mois
  const totals = useMemo(() => {
    return AGENCES.map(code => ({
      code,
      total: chartData.reduce((acc, d) => acc + ((d[code] as number) ?? 0), 0),
    }))
  }, [chartData])

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 420,
        borderLeft: "0.5px solid rgba(255,255,255,0.07)",
        background: "rgba(14,12,26,0.95)",
        backdropFilter: "blur(16px)",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 28, height: 28, background: "rgba(155,135,245,0.1)", border: "0.5px solid rgba(155,135,245,0.25)" }}
          >
            <TrendingUp style={{ width: 13, height: 13, color: "#9b87f5" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}>
            Historique
          </span>
          <span style={{ fontSize: 10, color: "rgba(200,196,230,0.35)", fontFamily: "DM Mono, monospace" }}>
            {allWorkflows.length} mois
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 26, height: 26,
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
        >
          <X style={{ width: 12, height: 12, color: "rgba(200,196,230,0.5)" }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pt-4 pb-2">
        {(["importes", "retenus"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-lg px-3 py-1.5 transition-colors"
            style={{
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              background: tab === t ? "rgba(155,135,245,0.12)" : "rgba(255,255,255,0.03)",
              border: `0.5px solid ${tab === t ? "rgba(155,135,245,0.4)" : "rgba(255,255,255,0.07)"}`,
              color: tab === t ? "#c4b5fd" : "rgba(200,196,230,0.45)",
            }}
          >
            {t === "importes" ? "Importés" : "Retenus"}
          </button>
        ))}
      </div>

      {/* KPI pills */}
      <div className="flex gap-2 px-5 pb-4">
        {totals.map(({ code, total }) => (
          <div
            key={code}
            className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)" }}
          >
            <div className="rounded-full" style={{ width: 7, height: 7, background: COLORS[code], flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: "rgba(200,196,230,0.4)", fontFamily: "DM Mono, monospace" }}>{code}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f0eeff", fontFamily: "Syne, sans-serif", lineHeight: 1.2 }}>
                {total.toLocaleString("fr-FR")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 px-3 pb-5">
        {allWorkflows.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span style={{ fontSize: 12, color: "rgba(200,196,230,0.3)", fontFamily: "DM Mono, monospace" }}>
              Aucun workflow disponible
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              barCategoryGap="30%"
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 10, fill: "rgba(200,196,230,0.4)", fontFamily: "DM Mono, monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(200,196,230,0.3)", fontFamily: "DM Mono, monospace" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{
                  fontSize: 10,
                  fontFamily: "DM Mono, monospace",
                  color: "rgba(200,196,230,0.5)",
                  paddingTop: 8,
                }}
              />
              {AGENCES.map(code => (
                <Bar
                  key={code}
                  dataKey={code}
                  fill={COLORS[code]}
                  radius={[3, 3, 0, 0]}
                  opacity={0.85}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
