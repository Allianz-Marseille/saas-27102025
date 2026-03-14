"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, AlertTriangle, RotateCcw } from "lucide-react"
import { TimelineSidebar } from "@/components/preterme/TimelineSidebar"
import { Step1Mois } from "@/components/preterme/Step1Mois"
import { Step2Import } from "@/components/preterme/Step2Import"
import { Step3Classification } from "@/components/preterme/Step3Classification"
import { Step4Gerants } from "@/components/preterme/Step4Gerants"
import { Step5Dispatch } from "@/components/preterme/Step5Dispatch"
import { Step6Slack } from "@/components/preterme/Step6Slack"
import {
  getAllWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
} from "@/lib/firebase/preterme"
import type { WorkflowState } from "@/types/preterme"
import { toast } from "sonner"

const AGENCES = ["H91358", "H92083"]

function buildEmptyAgence() {
  return {
    fichierNom: "",
    clientsTotal: 0,
    seuilMajo: 15,
    seuilEtp: 1.2,
    clientsRetenus: 0,
    etape2Statut: "en_attente" as const,
    etape3Statut: "en_attente" as const,
    etape4Statut: "en_attente" as const,
    dispatchStatut: "en_attente" as const,
    clients: [],
  }
}

export default function PretermeAutoPage() {
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null)
  const [allWorkflows, setAllWorkflows] = useState<WorkflowState[]>([])
  // etapeMax = progression max atteinte — ne régresse pas quand on navigue en arrière
  const [etapeMax, setEtapeMax] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewWarning, setShowNewWarning] = useState(false)
  const [pendingNew, setPendingNew] = useState<{ moisKey: string; moisLabel: string } | null>(null)

  useEffect(() => {
    loadAllWorkflows()
  }, [])

  async function loadAllWorkflows() {
    setLoading(true)
    setError(null)
    try {
      const all = await getAllWorkflows()
      setAllWorkflows(all)
      if (all.length === 0) {
        setWorkflow(null)
        setEtapeMax(1)
      } else {
        // Priorité : workflow en_cours ; sinon le plus récent (trié desc par moisKey)
        const active = all.find(w => w.statut === "en_cours") ?? all[0]
        applyWorkflow(active)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement workflow")
    } finally {
      setLoading(false)
    }
  }

  function applyWorkflow(w: WorkflowState) {
    setWorkflow(w)
    setEtapeMax(w.statut === "terminé" ? 6 : w.etapeActive)
  }

  function handleSelectMonth(moisKey: string) {
    const w = allWorkflows.find(x => x.moisKey === moisKey)
    if (w) applyWorkflow(w)
  }

  const handleUpdate = useCallback(async (updated: WorkflowState) => {
    setWorkflow(updated)
    setAllWorkflows(prev => prev.map(w => w.moisKey === updated.moisKey ? updated : w))
    try {
      await updateWorkflow(updated.moisKey, updated)
    } catch (e) {
      toast.error("Erreur sauvegarde : " + (e instanceof Error ? e.message : ""))
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    if (!workflow) return
    try {
      const fresh = await getWorkflow(workflow.moisKey)
      if (fresh) {
        setWorkflow(fresh)
        setAllWorkflows(prev => prev.map(w => w.moisKey === fresh.moisKey ? fresh : w))
      }
    } catch {}
  }, [workflow])

  async function handleConfirmMois(moisKey: string, moisLabel: string) {
    const existingInCours = allWorkflows.find(w => w.statut === "en_cours")
    if (existingInCours && existingInCours.moisKey !== moisKey) {
      setPendingNew({ moisKey, moisLabel })
      setShowNewWarning(true)
      return
    }
    // Si ce mois existe déjà (ex : terminé), l'afficher sans recréer
    const existing = allWorkflows.find(w => w.moisKey === moisKey)
    if (existing) {
      applyWorkflow(existing)
      return
    }
    await createAndStartWorkflow(moisKey, moisLabel)
  }

  async function createAndStartWorkflow(moisKey: string, moisLabel: string) {
    const newWorkflow: WorkflowState = {
      moisKey,
      moisLabel,
      confirmeAt: new Date().toISOString(),
      etapeActive: 2,
      statut: "en_cours",
      agences: Object.fromEntries(AGENCES.map(code => [code, buildEmptyAgence()])),
    }
    await createWorkflow(newWorkflow)
    setAllWorkflows(prev => [newWorkflow, ...prev])
    applyWorkflow(newWorkflow)
    setPendingNew(null)
    setShowNewWarning(false)
    toast.success(`Workflow ${moisLabel} démarré`)
  }

  async function handleArchiveAndNew() {
    if (!workflow || !pendingNew) return
    await updateWorkflow(workflow.moisKey, { statut: "terminé" })
    setAllWorkflows(prev =>
      prev.map(w => w.moisKey === workflow.moisKey ? { ...w, statut: "terminé" as const } : w)
    )
    await createAndStartWorkflow(pendingNew.moisKey, pendingNew.moisLabel)
  }

  async function handleAdvance() {
    if (!workflow) return
    const next = Math.min(6, workflow.etapeActive + 1) as WorkflowState["etapeActive"]
    const updated = { ...workflow, etapeActive: next }
    setEtapeMax(prev => Math.max(prev, next) as WorkflowState["etapeActive"])
    await handleUpdate(updated)
  }

  function handleStepClick(step: 1 | 2 | 3 | 4 | 5 | 6) {
    if (!workflow) return
    // Change uniquement la vue — etapeMax n'est pas affecté
    setWorkflow(prev => prev ? { ...prev, etapeActive: step } : prev)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" style={{ width: 28, height: 28, color: "#9b87f5" }} />
          <span style={{ fontSize: 13, color: "rgba(200,196,230,0.5)" }}>Chargement du workflow...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "60vh" }}>
        <AlertTriangle style={{ width: 28, height: 28, color: "#f87171" }} />
        <p style={{ fontSize: 13, color: "#f87171" }}>{error}</p>
        <button
          onClick={loadAllWorkflows}
          className="flex items-center gap-2 rounded-xl px-4 py-2"
          style={{
            fontSize: 12,
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            color: "rgba(200,196,230,0.6)",
          }}
        >
          <RotateCcw style={{ width: 12, height: 12 }} />
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex rounded-2xl overflow-hidden"
      style={{
        minHeight: "calc(100vh - 7rem)",
        background: "rgba(14,12,26,0.4)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Archive warning modal */}
      {showNewWarning && pendingNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{ background: "#0e0c1a", border: "0.5px solid rgba(155,135,245,0.3)" }}
          >
            <h4
              style={{ fontSize: 16, fontWeight: 700, color: "#f0eeff", marginBottom: 8, fontFamily: "Syne, sans-serif" }}
            >
              Workflow en cours détecté
            </h4>
            <p style={{ fontSize: 13, color: "rgba(200,196,230,0.6)", marginBottom: 20 }}>
              Un workflow <strong style={{ color: "#f0eeff" }}>{workflow?.moisLabel}</strong> est déjà
              en cours. Voulez-vous l&apos;archiver et démarrer{" "}
              <strong style={{ color: "#9b87f5" }}>{pendingNew.moisLabel}</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNewWarning(false); setPendingNew(null) }}
                className="flex-1 rounded-xl py-2.5"
                style={{ fontSize: 13, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(200,196,230,0.6)" }}
              >
                Annuler
              </button>
              <button
                onClick={handleArchiveAndNew}
                className="flex-1 rounded-xl py-2.5 font-semibold"
                style={{ fontSize: 13, background: "rgba(155,135,245,0.15)", border: "0.5px solid rgba(155,135,245,0.4)", color: "#c4b5fd", fontFamily: "Syne, sans-serif" }}
              >
                Archiver et démarrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left sidebar */}
      <TimelineSidebar
        etapeActive={workflow?.etapeActive ?? 1}
        etapeMax={etapeMax}
        moisLabel={workflow?.moisLabel}
        statut={workflow?.statut}
        allWorkflows={allWorkflows}
        onStepClick={handleStepClick}
        onSelectMonth={handleSelectMonth}
      />

      {/* Right content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "2rem", minWidth: 0 }}>
        {!workflow && <Step1Mois onConfirm={handleConfirmMois} />}

        {workflow?.etapeActive === 1 && <Step1Mois onConfirm={handleConfirmMois} />}

        {workflow?.etapeActive === 2 && (
          <Step2Import workflow={workflow} onUpdate={handleUpdate} onRefresh={handleRefresh} onAdvance={handleAdvance} />
        )}

        {workflow?.etapeActive === 3 && (
          <Step3Classification workflow={workflow} onUpdate={handleUpdate} onRefresh={handleRefresh} onAdvance={handleAdvance} />
        )}

        {workflow?.etapeActive === 4 && (
          <Step4Gerants workflow={workflow} onUpdate={handleUpdate} onAdvance={handleAdvance} />
        )}

        {workflow?.etapeActive === 5 && (
          <Step5Dispatch workflow={workflow} onRefresh={handleRefresh} onAdvance={handleAdvance} />
        )}

        {workflow?.etapeActive === 6 && (
          <Step6Slack workflow={workflow} onUpdate={handleUpdate} />
        )}
      </div>
    </div>
  )
}
