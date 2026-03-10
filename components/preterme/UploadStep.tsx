"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  RefreshCw, X, Info, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AgenceCode } from "@/types/preterme";
import { AGENCES } from "@/types/preterme";

// ─── Types ─────────────────────────────────────────────────────────────────

interface UploadResult {
  importId: string;
  agence: AgenceCode;
  moisKey: string;
  nbLignesTotal: number;
  nbLignesValides: number;
  nbErreursParsing: number;
  erreursParsing: Array<{ ligne: number; message: string }>;
}

interface FileUploadState {
  file: File;
  agenceSelectionnee: AgenceCode | null;
  agenceDetectee: AgenceCode | null;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  result?: UploadResult;
  errorMessage?: string;
}

// ─── DropZone ─────────────────────────────────────────────────────────────

function DropZone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile, disabled]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
        isDragging
          ? "border-sky-500 bg-sky-950/30"
          : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/30",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        disabled={disabled}
      />
      <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-300">
        Glissez un fichier Excel ou cliquez pour sélectionner
      </p>
      <p className="text-xs text-slate-500 mt-1">.xlsx ou .xls — export préterme Allianz</p>
    </div>
  );
}

// ─── FileCard ──────────────────────────────────────────────────────────────

function FileCard({
  state,
  moisKey,
  onAgenceChange,
  onUpload,
  onRemove,
}: {
  state: FileUploadState;
  moisKey: string;
  onAgenceChange: (a: AgenceCode) => void;
  onUpload: () => void;
  onRemove: () => void;
}) {
  const agenceFinal = state.agenceSelectionnee ?? state.agenceDetectee;

  return (
    <div className={cn(
      "border rounded-xl p-4 space-y-3",
      state.status === "success" ? "border-emerald-700/60 bg-emerald-950/20"
        : state.status === "error" ? "border-red-700/60 bg-red-950/20"
        : "border-slate-700 bg-slate-800/30"
    )}>
      {/* Header fichier */}
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="h-5 w-5 text-sky-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{state.file.name}</p>
          <p className="text-xs text-slate-500">
            {(state.file.size / 1024).toFixed(0)} Ko
          </p>
        </div>
        {state.status !== "uploading" && (
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-slate-500 hover:text-red-400 shrink-0"
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Détection agence */}
      {state.agenceDetectee ? (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Agence détectée : <strong>{AGENCES[state.agenceDetectee].label}</strong>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Agence non détectée — sélectionnez manuellement
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Agence cible *</Label>
            <Select
              value={state.agenceSelectionnee ?? ""}
              onValueChange={(v) => onAgenceChange(v as AgenceCode)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-600 max-w-xs">
                <SelectValue placeholder="Choisir l'agence..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(AGENCES) as [AgenceCode, { nom: string; label: string }][]).map(
                  ([code, info]) => (
                    <SelectItem key={code} value={code}>{info.label}</SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {state.status === "uploading" && (
        <div className="space-y-1.5">
          <Progress value={state.progress} className="h-1.5" />
          <p className="text-xs text-slate-400 text-center">Import en cours...</p>
        </div>
      )}

      {/* Résultat succès */}
      {state.status === "success" && state.result && (
        <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-800/40 space-y-1.5">
          <p className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Import réussi
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
            <span className="text-slate-500">Lignes détectées</span>
            <span className="font-medium">{state.result.nbLignesTotal}</span>
            <span className="text-slate-500">Lignes importées</span>
            <span className="font-medium text-emerald-400">{state.result.nbLignesValides}</span>
            {state.result.nbErreursParsing > 0 && (
              <>
                <span className="text-slate-500">Erreurs parsing</span>
                <span className="font-medium text-amber-400">{state.result.nbErreursParsing}</span>
              </>
            )}
          </div>
          {state.result.erreursParsing.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {state.result.erreursParsing.map((e) => (
                <p key={e.ligne} className="text-[10px] text-amber-400">
                  Ligne {e.ligne} : {e.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Erreur */}
      {state.status === "error" && state.errorMessage && (
        <div className="p-3 bg-red-950/30 rounded-lg border border-red-800/40">
          <p className="text-xs text-red-300 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {state.errorMessage}
          </p>
        </div>
      )}

      {/* Actions */}
      {state.status !== "uploading" && state.status !== "success" && (
        <Button
          size="sm"
          onClick={onUpload}
          disabled={!agenceFinal}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Importer pour {moisKey}
        </Button>
      )}

      {/* Réimporter */}
      {state.status === "success" && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUpload}
          className="w-full border-slate-700 text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Réimporter (remplacera l&apos;import existant)
        </Button>
      )}
    </div>
  );
}

// ─── UploadStep (export principal) ────────────────────────────────────────

interface UploadStepProps {
  moisKey: string;
  configValide: boolean;
  idToken: string;
  onImportSuccess?: (importId: string, agence: AgenceCode) => void;
}

export function UploadStep({ moisKey, configValide, idToken, onImportSuccess }: UploadStepProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);

  const detectAgence = (filename: string): AgenceCode | null => {
    if (filename.includes("H91358") || filename.includes("h91358")) return "H91358";
    if (filename.includes("H92083") || filename.includes("h92083")) return "H92083";
    return null;
  };

  const addFile = (file: File) => {
    // Refuser les doublons de nom de fichier
    if (files.some((f) => f.file.name === file.name)) {
      toast.warning("Ce fichier est déjà dans la liste.");
      return;
    }
    setFiles((prev) => [
      ...prev,
      {
        file,
        agenceDetectee: detectAgence(file.name),
        agenceSelectionnee: null,
        status: "idle",
        progress: 0,
      },
    ]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFile = (idx: number, patch: Partial<FileUploadState>) => {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const uploadFile = async (idx: number) => {
    const state = files[idx];
    const agence = state.agenceSelectionnee ?? state.agenceDetectee;
    if (!agence) return;

    updateFile(idx, { status: "uploading", progress: 20, errorMessage: undefined });

    const formData = new FormData();
    formData.append("file", state.file);
    formData.append("moisKey", moisKey);
    formData.append("agence", agence);

    try {
      updateFile(idx, { progress: 50 });

      const res = await fetch("/api/admin/preterme-auto/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        updateFile(idx, { status: "error", errorMessage: data.error ?? "Erreur serveur", progress: 0 });
        toast.error(data.error ?? "Erreur lors de l'import");
        return;
      }

      updateFile(idx, { status: "success", progress: 100, result: data });
      toast.success(`Import réussi — ${data.nbLignesValides} clients chargés`);
      onImportSuccess?.(data.importId, agence);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur réseau";
      updateFile(idx, { status: "error", errorMessage: msg, progress: 0 });
      toast.error(msg);
    }
  };

  // Résumé global
  const successFiles = files.filter((f) => f.status === "success");
  const agencesImportees = new Set(
    successFiles.map((f) => f.agenceDetectee ?? f.agenceSelectionnee)
  );
  const agencesManquantes = (["H91358", "H92083"] as AgenceCode[]).filter(
    (a) => !agencesImportees.has(a)
  );

  return (
    <div className="space-y-5">
      {/* Prérequis */}
      {!configValide && (
        <div className="p-4 bg-amber-950/30 border border-amber-700/50 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Configuration requise</p>
            <p className="text-xs text-amber-400 mt-0.5">
              Validez d&apos;abord la configuration mensuelle avant d&apos;importer les fichiers.
            </p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <DropZone onFile={addFile} disabled={!configValide} />

      {/* Info agences */}
      {files.length === 0 && configValide && (
        <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-lg text-xs text-slate-400 space-y-1">
          <p className="flex items-center gap-1.5 font-medium text-slate-300">
            <Info className="h-3.5 w-3.5" /> Deux fichiers attendus
          </p>
          {(Object.entries(AGENCES) as [AgenceCode, { nom: string; label: string }][]).map(([code, info]) => (
            <p key={code} className="flex items-center gap-1.5 ml-5">
              <Building2 className="h-3 w-3" />
              <strong>{info.label}</strong> — {info.nom}
            </p>
          ))}
          <p className="ml-5">
            L&apos;agence est auto-détectée si le nom de fichier contient{" "}
            <code className="text-sky-400">H91358</code> ou{" "}
            <code className="text-sky-400">H92083</code>.
          </p>
        </div>
      )}

      {/* Liste fichiers */}
      {files.map((state, idx) => (
        <FileCard
          key={state.file.name}
          state={state}
          moisKey={moisKey}
          onAgenceChange={(a) => updateFile(idx, { agenceSelectionnee: a })}
          onUpload={() => uploadFile(idx)}
          onRemove={() => removeFile(idx)}
        />
      ))}

      {/* Résumé global */}
      {successFiles.length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Récapitulatif des imports
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {successFiles.map((f) => (
              <div key={f.file.name} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  {AGENCES[(f.agenceDetectee ?? f.agenceSelectionnee)!]?.label ?? "?"}
                </span>
                <Badge className="bg-emerald-900/60 text-emerald-400 border-emerald-700">
                  {f.result?.nbLignesValides} clients
                </Badge>
              </div>
            ))}
            {agencesManquantes.length > 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Agence(s) non encore importée(s) :{" "}
                {agencesManquantes.map((a) => AGENCES[a].label).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
