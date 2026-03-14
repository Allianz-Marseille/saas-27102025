"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Loader2, Lock, Unlock, FileSpreadsheet, X, CheckCircle2, AlertTriangle } from "lucide-react"
import { buildAuthenticatedJsonHeaders } from "@/lib/firebase/api-auth"
import type { WorkflowState } from "@/types/preterme"

type Props = {
  workflow: WorkflowState
  onUpdate: (w: WorkflowState) => Promise<void>
  onRefresh: () => Promise<void>
  onAdvance: () => void
}

const AGENCES = ["H91358", "H92083"]

type AgenceUploadState = {
  loading: boolean
  error: string | null
}

function detectAgenceFromFilename(filename: string): string | null {
  const match = filename.match(/H\d{5}/)
  return match ? match[0] : null
}

function AgenceCard({
  codeAgence,
  workflow,
  onUpload,
  onRecalc,
  onLock,
  onUnlock,
  uploadState,
}: {
  codeAgence: string
  workflow: WorkflowState
  onUpload: (file: File, code: string) => void
  onRecalc: (code: string, majo: number, etp: number) => void
  onLock: (code: string) => void
  onUnlock: (code: string) => void
  uploadState: AgenceUploadState
}) {
  const agence = workflow.agences[codeAgence]
  const isBlocked = agence?.etape2Statut === "bloqué"
  const isImported = agence?.etape2Statut === "importé"
  const [localMajo, setLocalMajo] = useState(agence?.seuilMajo ?? 15)
  const [localEtp, setLocalEtp] = useState(agence?.seuilEtp ?? 1.2)
  const [recalcing, setRecalcing] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onUpload(file, codeAgence)
    },
    [codeAgence, onUpload]
  )

  async function handleRecalc(majo: number, etp: number) {
    setRecalcing(true)
    try {
      onRecalc(codeAgence, majo, etp)
    } finally {
      setRecalcing(false)
    }
  }

  const clientsRetenus = agence?.clientsRetenus ?? 0
  const clientsExclus = (agence?.clientsTotal ?? 0) - clientsRetenus

  return (
    <div
      className="rounded-xl transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: isBlocked
          ? "0.5px solid rgba(45,197,150,0.35)"
          : isImported
          ? "0.5px solid rgba(155,135,245,0.25)"
          : "0.5px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        boxShadow: isBlocked ? "0 0 24px rgba(45,197,150,0.08)" : "none",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 32,
              height: 32,
              background: isBlocked ? "rgba(45,197,150,0.1)" : "rgba(155,135,245,0.1)",
              border: `0.5px solid ${isBlocked ? "rgba(45,197,150,0.3)" : "rgba(155,135,245,0.3)"}`,
            }}
          >
            <FileSpreadsheet style={{ width: 14, height: 14, color: isBlocked ? "#2dc596" : "#9b87f5" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#f0eeff",
                fontFamily: "Syne, sans-serif",
              }}
            >
              Agence {codeAgence}
            </div>
            <div style={{ fontSize: 10, color: "rgba(200,196,230,0.4)", fontFamily: "DM Mono, monospace" }}>
              {agence?.fichierNom ?? "Aucun fichier"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBlocked && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{
                fontSize: 10,
                background: "rgba(45,197,150,0.1)",
                color: "#2dc596",
                border: "0.5px solid rgba(45,197,150,0.3)",
                fontFamily: "DM Mono, monospace",
              }}
            >
              <Lock style={{ width: 9, height: 9 }} />
              BLOQUÉE
            </div>
          )}
          {isBlocked && (
            <button
              onClick={() => onUnlock(codeAgence)}
              className="rounded-lg p-1.5 transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                color: "rgba(200,196,230,0.5)",
              }}
              title="Débloquer"
            >
              <Unlock style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Drop zone */}
        {!isImported && !isBlocked && (
          <div
            ref={dropRef}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all duration-200"
            style={{
              height: 100,
              background: dragging ? "rgba(155,135,245,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px dashed ${dragging ? "rgba(155,135,245,0.5)" : "rgba(255,255,255,0.12)"}`,
            }}
          >
            {uploadState.loading ? (
              <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: "#9b87f5" }} />
            ) : (
              <>
                <Upload style={{ width: 20, height: 20, color: "rgba(200,196,230,0.4)" }} />
                <span style={{ fontSize: 12, color: "rgba(200,196,230,0.4)" }}>
                  Déposez le fichier {codeAgence}...xlsx
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) onUpload(file, codeAgence)
              }}
            />
          </div>
        )}

        {uploadState.error && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 mt-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "0.5px solid rgba(239,68,68,0.3)",
            }}
          >
            <AlertTriangle style={{ width: 12, height: 12, color: "#f87171" }} />
            <span style={{ fontSize: 11, color: "#f87171" }}>{uploadState.error}</span>
          </div>
        )}

        {/* KPIs */}
        {(isImported || isBlocked) && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total", value: agence?.clientsTotal ?? 0, color: "rgba(200,196,230,0.7)" },
                { label: "Retenus", value: clientsRetenus, color: "#9b87f5" },
                { label: "Exclus", value: clientsExclus, color: "rgba(200,196,230,0.4)" },
              ].map(kpi => (
                <div
                  key={kpi.label}
                  className="rounded-lg text-center py-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: kpi.color,
                      fontFamily: "Syne, sans-serif",
                      lineHeight: 1,
                    }}
                  >
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(200,196,230,0.4)", marginTop: 4, fontFamily: "DM Mono, monospace" }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Seuils */}
            <div
              className="rounded-lg p-4 mb-4"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <p style={{ fontSize: 10, color: "rgba(200,196,230,0.4)", marginBottom: 12, fontFamily: "DM Mono, monospace" }}>
                CRITÈRES DE RÉTENTION — logique OU
              </p>

              <div className="flex flex-col gap-4">
                {/* Majo */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontSize: 11, color: "rgba(200,196,230,0.6)" }}>Majoration ≥</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#9b87f5", fontFamily: "DM Mono, monospace" }}>
                      {localMajo}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={localMajo}
                    disabled={isBlocked}
                    onChange={e => {
                      const v = Number(e.target.value)
                      setLocalMajo(v)
                      handleRecalc(v, localEtp)
                    }}
                    className="w-full"
                    style={{ accentColor: "#9b87f5" }}
                  />
                </div>

                {/* ETP */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontSize: 11, color: "rgba(200,196,230,0.6)" }}>ETP ≥</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#9b87f5", fontFamily: "DM Mono, monospace" }}>
                      {localEtp.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={2.0}
                    step={0.05}
                    value={localEtp}
                    disabled={isBlocked}
                    onChange={e => {
                      const v = Number(e.target.value)
                      setLocalEtp(v)
                      handleRecalc(localMajo, v)
                    }}
                    className="w-full"
                    style={{ accentColor: "#9b87f5" }}
                  />
                </div>
              </div>

              {recalcing && (
                <div className="flex items-center gap-2 mt-3">
                  <Loader2 className="animate-spin" style={{ width: 10, height: 10, color: "#9b87f5" }} />
                  <span style={{ fontSize: 10, color: "rgba(200,196,230,0.4)" }}>Recalcul...</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isBlocked && (
              <button
                onClick={() => onLock(codeAgence)}
                className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200"
                style={{
                  height: 40,
                  background: "rgba(45,197,150,0.1)",
                  border: "0.5px solid rgba(45,197,150,0.35)",
                  color: "#2dc596",
                  fontSize: 13,
                  fontFamily: "Syne, sans-serif",
                }}
              >
                <Lock style={{ width: 13, height: 13 }} />
                Bloquer l&apos;agence
              </button>
            )}

            {isBlocked && (
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 style={{ width: 14, height: 14, color: "#2dc596" }} />
                <span style={{ fontSize: 12, color: "#2dc596" }}>Agence bloquée — seuils figés</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function Step2Import({ workflow, onUpdate, onRefresh, onAdvance }: Props) {
  const [uploadStates, setUploadStates] = useState<Record<string, AgenceUploadState>>({
    H91358: { loading: false, error: null },
    H92083: { loading: false, error: null },
  })

  const bothBlocked = AGENCES.every(code => workflow.agences[code]?.etape2Statut === "bloqué")

  async function getAuthHeader() {
    const headers = await buildAuthenticatedJsonHeaders()
    return headers.Authorization
  }

  async function handleUpload(file: File, codeAgence: string) {
    const detected = detectAgenceFromFilename(file.name)
    const code = detected ?? codeAgence

    setUploadStates(prev => ({ ...prev, [code]: { loading: true, error: null } }))

    try {
      const token = (await buildAuthenticatedJsonHeaders()).Authorization
      const fd = new FormData()
      fd.append("file", file)
      fd.append("moisKey", workflow.moisKey)
      fd.append("codeAgence", code)

      const res = await fetch("/api/admin/preterme-auto/upload", {
        method: "POST",
        headers: { Authorization: token },
        body: fd,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur upload")

      // Reload workflow from Firestore via parent
      await onRefresh()
      setUploadStates(prev => ({ ...prev, [code]: { loading: false, error: null } }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur"
      setUploadStates(prev => ({ ...prev, [code]: { loading: false, error: msg } }))
    }
  }

  async function handleRecalc(codeAgence: string, seuilMajo: number, seuilEtp: number) {
    try {
      const token = (await buildAuthenticatedJsonHeaders()).Authorization
      await fetch("/api/admin/preterme-auto/recalc", {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({ moisKey: workflow.moisKey, codeAgence, seuilMajo, seuilEtp }),
      })
      await onRefresh()
    } catch {}
  }

  async function handleLock(codeAgence: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    const updated: WorkflowState = {
      ...workflow,
      agences: {
        ...workflow.agences,
        [codeAgence]: { ...agence, etape2Statut: "bloqué" },
      },
    }
    await onUpdate(updated)
  }

  async function handleUnlock(codeAgence: string) {
    const agence = workflow.agences[codeAgence]
    if (!agence) return
    const updated: WorkflowState = {
      ...workflow,
      agences: {
        ...workflow.agences,
        [codeAgence]: { ...agence, etape2Statut: "importé" },
      },
    }
    await onUpdate(updated)
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
            <Upload style={{ width: 16, height: 16, color: "#9b87f5" }} />
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
            ÉTAPE 2
          </span>
        </div>

        <h3
          className="font-bold"
          style={{ fontSize: 20, color: "#f0eeff", fontFamily: "Syne, sans-serif" }}
        >
          Import &amp; Filtrage par agence
        </h3>
        <p style={{ fontSize: 13, color: "rgba(200,196,230,0.55)", marginTop: 6 }}>
          Importez le fichier Excel de chaque agence, ajustez les seuils de rétention, puis bloquez
          chaque agence pour valider.
        </p>
      </div>

      {/* Agence cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {AGENCES.map(code => (
          <AgenceCard
            key={code}
            codeAgence={code}
            workflow={workflow}
            onUpload={handleUpload}
            onRecalc={handleRecalc}
            onLock={handleLock}
            onUnlock={handleUnlock}
            uploadState={uploadStates[code]}
          />
        ))}
      </div>

      {/* Advance */}
      {bothBlocked && (
        <button
          onClick={onAdvance}
          className="self-start flex items-center gap-2 rounded-xl font-semibold transition-all duration-200"
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
          Passer à la classification IA
        </button>
      )}
    </div>
  )
}
