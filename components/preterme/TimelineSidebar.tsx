"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check, Lock, ChevronDown, CheckCircle2, Clock, Plus, BarChart2 } from "lucide-react"
import type { WorkflowState } from "@/types/preterme"

type Step = {
  num: 1 | 2 | 3 | 4 | 5 | 6
  label: string
  sublabel: string
}

const STEPS: Step[] = [
  { num: 1, label: "Mois du préterme", sublabel: "Confirmation de la période" },
  { num: 2, label: "Import & Filtrage", sublabel: "Upload + seuils par agence" },
  { num: 3, label: "Classification IA", sublabel: "Particulier / Entreprise" },
  { num: 4, label: "Gérants", sublabel: "Saisie pour les entreprises" },
  { num: 5, label: "Dispatch Trello", sublabel: "Routing CDC + création cartes" },
  { num: 6, label: "Rapport Slack", sublabel: "Synthèse envoyée sur Slack" },
]

type Props = {
  etapeActive: 1 | 2 | 3 | 4 | 5 | 6
  etapeMax: 1 | 2 | 3 | 4 | 5 | 6
  moisLabel?: string
  statut?: "en_cours" | "terminé"
  allWorkflows?: WorkflowState[]
  showHisto?: boolean
  onStepClick: (step: 1 | 2 | 3 | 4 | 5 | 6) => void
  onSelectMonth?: (moisKey: string) => void
  onToggleHisto?: () => void
}

export function TimelineSidebar({
  etapeActive,
  etapeMax,
  moisLabel,
  statut,
  allWorkflows = [],
  showHisto = false,
  onStepClick,
  onSelectMonth,
  onToggleHisto,
}: Props) {
  const progress = ((etapeMax - 1) / 5) * 100
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 280,
        borderRight: "0.5px solid rgba(255,255,255,0.08)",
        background: "rgba(14,12,26,0.6)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="text-xs font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(45,197,150,0.12)",
              color: "#2dc596",
              border: "0.5px solid rgba(45,197,150,0.3)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            AUTO
          </div>
        </div>
        <h2
          className="font-bold mt-2"
          style={{ fontSize: 15, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
        >
          Préterme Auto
        </h2>

        {/* Sélecteur de mois */}
        <div className="relative mt-2">
          <button
            onClick={() => allWorkflows.length > 0 && setShowMonthPicker(prev => !prev)}
            className="flex items-center justify-between w-full rounded-lg px-3 py-2 transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: showMonthPicker
                ? "0.5px solid rgba(155,135,245,0.4)"
                : "0.5px solid rgba(255,255,255,0.1)",
              cursor: allWorkflows.length > 0 ? "pointer" : "default",
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {statut === "terminé" ? (
                <CheckCircle2 style={{ width: 11, height: 11, color: "#2dc596", flexShrink: 0 }} />
              ) : statut === "en_cours" ? (
                <Clock style={{ width: 11, height: 11, color: "#9b87f5", flexShrink: 0 }} />
              ) : null}
              <span
                className="truncate"
                style={{ fontSize: 12, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
              >
                {moisLabel ?? "Nouveau mois"}
              </span>
            </div>
            {allWorkflows.length > 0 && (
              <ChevronDown
                style={{
                  width: 12,
                  height: 12,
                  color: "rgba(200,196,230,0.4)",
                  flexShrink: 0,
                  transform: showMonthPicker ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            )}
          </button>

          {/* Dropdown liste des mois */}
          {showMonthPicker && (
            <div
              className="absolute left-0 right-0 z-20 rounded-lg overflow-hidden mt-1"
              style={{
                background: "#0e0c1a",
                border: "0.5px solid rgba(155,135,245,0.25)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {allWorkflows.map(w => {
                const isCurrent = w.moisLabel === moisLabel
                return (
                  <button
                    key={w.moisKey}
                    onClick={() => {
                      onSelectMonth?.(w.moisKey)
                      setShowMonthPicker(false)
                    }}
                    className="flex items-center justify-between w-full px-3 py-2.5 transition-colors"
                    style={{
                      background: isCurrent ? "rgba(155,135,245,0.08)" : "transparent",
                    }}
                    onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
                    onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    <span style={{ fontSize: 12, color: isCurrent ? "#f0eeff" : "rgba(200,196,230,0.7)", fontFamily: "Syne, sans-serif" }}>
                      {w.moisLabel}
                    </span>
                    {w.statut === "terminé" ? (
                      <CheckCircle2 style={{ width: 11, height: 11, color: "#2dc596" }} />
                    ) : (
                      <Clock style={{ width: 11, height: 11, color: "#9b87f5" }} />
                    )}
                  </button>
                )
              })}
              {/* Option nouveau mois */}
              <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={() => {
                    onStepClick(1)
                    setShowMonthPicker(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  <Plus style={{ width: 11, height: 11, color: "rgba(200,196,230,0.4)" }} />
                  <span style={{ fontSize: 12, color: "rgba(200,196,230,0.5)" }}>Nouveau mois</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Steps timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="relative">
          {/* Spine */}
          <div
            className="absolute left-[17px] top-5 bottom-5"
            style={{
              width: 1,
              background: "linear-gradient(to bottom, rgba(155,135,245,0), rgba(155,135,245,0.4), rgba(155,135,245,0))",
            }}
          />

          <div className="flex flex-col gap-2">
            {STEPS.map(step => {
              const isDone = step.num < etapeActive
              const isActive = step.num === etapeActive
              const isLocked = step.num > etapeMax
              const isClickable = step.num <= etapeMax

              return (
                <button
                  key={step.num}
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step.num)}
                  className={cn(
                    "relative flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200",
                    isClickable ? "cursor-pointer" : "cursor-default opacity-40",
                    isActive && "ring-1"
                  )}
                  style={{
                    background: isActive ? "rgba(155,135,245,0.06)" : "transparent",
                    border: isActive ? "0.5px solid rgba(155,135,245,0.25)" : "0.5px solid transparent",
                    boxShadow: isActive ? "0 0 30px rgba(155,135,245,0.08)" : "none",
                  }}
                >
                  {/* Dot */}
                  <div
                    className="relative z-10 flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: 18,
                      height: 18,
                      marginTop: 2,
                      background: isDone
                        ? "rgba(45,197,150,0.2)"
                        : isActive
                        ? "rgba(155,135,245,0.2)"
                        : "rgba(255,255,255,0.05)",
                      border: isDone
                        ? "1px solid rgba(45,197,150,0.6)"
                        : isActive
                        ? "1px solid rgba(155,135,245,0.8)"
                        : "1px solid rgba(255,255,255,0.15)",
                      boxShadow: isActive ? "0 0 8px rgba(155,135,245,0.5)" : "none",
                    }}
                  >
                    {isDone ? (
                      <Check style={{ width: 9, height: 9, color: "#2dc596" }} strokeWidth={3} />
                    ) : isLocked ? (
                      <Lock style={{ width: 8, height: 8, color: "rgba(255,255,255,0.3)" }} />
                    ) : (
                      <div
                        className="rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          background: isActive ? "#9b87f5" : "rgba(255,255,255,0.2)",
                          boxShadow: isActive ? "0 0 6px rgba(155,135,245,0.8)" : "none",
                        }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#f0eeff" : isDone ? "rgba(200,196,230,0.7)" : "rgba(200,196,230,0.4)",
                        fontFamily: "Syne, sans-serif",
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(200,196,230,0.35)",
                        marginTop: 1,
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      {step.sublabel}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Progress bar + histo toggle */}
      <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex justify-between items-center mb-2">
          <span style={{ fontSize: 10, color: "rgba(200,196,230,0.4)", fontFamily: "DM Mono, monospace" }}>
            PROGRESSION
          </span>
          <div className="flex items-center gap-2">
            <span
              style={{
                fontSize: 10,
                color: statut === "terminé" ? "#2dc596" : "#9b87f5",
                fontFamily: "DM Mono, monospace",
              }}
            >
              {statut === "terminé" ? "✓ terminé" : `${Math.round(progress)}%`}
            </span>
            {allWorkflows.length > 0 && onToggleHisto && (
              <button
                onClick={onToggleHisto}
                title="Historique"
                className="flex items-center justify-center rounded-md transition-colors"
                style={{
                  width: 22, height: 22,
                  background: showHisto ? "rgba(155,135,245,0.15)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${showHisto ? "rgba(155,135,245,0.4)" : "rgba(255,255,255,0.08)"}`,
                }}
                onMouseEnter={e => { if (!showHisto) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)" }}
                onMouseLeave={e => { if (!showHisto) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
              >
                <BarChart2 style={{ width: 11, height: 11, color: showHisto ? "#9b87f5" : "rgba(200,196,230,0.4)" }} />
              </button>
            )}
          </div>
        </div>
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 2, background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: statut === "terminé"
                ? "linear-gradient(to right, #059669, #2dc596)"
                : "linear-gradient(to right, #7c3aed, #9b87f5)",
            }}
          />
        </div>
      </div>
    </div>
  )
}
