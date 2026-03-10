"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  RefreshCw, X, Info, Building2, PlusCircle, Loader2,
  ShieldCheck, CircleDashed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { AgenceCode } from "@/types/preterme";
import { AGENCES } from "@/types/preterme";
import { detectAgenceFromFilename } from "@/lib/utils/preterme-parser";

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
  result?: UploadResult;
  errorMessage?: string;
}

// ─── DropZone ─────────────────────────────────────────────────────────────

function DropZone({
  onFiles,
  disabled,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.name.endsWith(".xlsx") || f.name.endsWith(".xls")
      );
      if (dropped.length) onFiles(dropped);
    },
    [onFiles, disabled]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 group",
        compact ? "p-5" : "p-10",
        isDragging
          ? "border-sky-500 bg-sky-950/40 scale-[1.01]"
          : "border-slate-700 hover:border-sky-700/70 hover:bg-slate-800/40",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? []);
          if (selected.length) onFiles(selected);
          e.target.value = "";
        }}
        disabled={disabled}
      />

      <div className={cn(
        "flex flex-col items-center gap-2 transition-transform duration-200",
        isDragging && "scale-105"
      )}>
        <div className={cn(
          "rounded-full p-3 transition-colors duration-200",
          isDragging ? "bg-sky-900/60" : "bg-slate-800 group-hover:bg-slate-700/80"
        )}>
          <Upload className={cn(
            "transition-colors duration-200",
            compact ? "h-5 w-5" : "h-7 w-7",
            isDragging ? "text-sky-400" : "text-slate-400 group-hover:text-sky-400"
          )} />
        </div>

        {!compact ? (
          <>
            <p className="text-sm font-medium text-slate-300 group-hover:text-slate-200 transition-colors">
              Glissez un ou plusieurs fichiers Excel, ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-slate-500">.xlsx ou .xls · sélection multiple possible</p>
          </>
        ) : (
          <p className="text-xs font-medium text-slate-400 group-hover:text-sky-400 transition-colors">
            Ajouter un fichier
          </p>
        )}
      </div>
    </div>
  );
}

// ─── FileCard ──────────────────────────────────────────────────────────────

function FileCard({
  state,
  onAgenceChange,
  onUpload,
  onRemove,
}: {
  state: FileUploadState;
  onAgenceChange: (a: AgenceCode) => void;
  onUpload: () => void;
  onRemove: () => void;
}) {
  const agenceFinal = state.agenceSelectionnee ?? state.agenceDetectee;
  const isUploading = state.status === "uploading";

  return (
    <div className={cn(
      "border rounded-xl p-4 space-y-3 transition-all duration-300",
      state.status === "success" ? "border-emerald-700/50 bg-emerald-950/20"
        : state.status === "error" ? "border-red-700/50 bg-red-950/20"
        : isUploading ? "border-sky-700/50 bg-sky-950/10"
        : "border-slate-700 bg-slate-800/30"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "mt-0.5 shrink-0 transition-colors",
          isUploading ? "text-sky-400 animate-pulse" : "text-slate-400"
        )}>
          <FileSpreadsheet className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate transition-colors",
            isUploading ? "text-sky-300" : "text-slate-200"
          )}>
            {state.file.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {(state.file.size / 1024).toFixed(0)} Ko
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isUploading && (
            <Loader2 className="h-4 w-4 text-sky-400 animate-spin" />
          )}
          {state.status === "success" && (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          )}
          {!isUploading && (
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 text-slate-600 hover:text-red-400"
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Détection agence */}
      {state.agenceDetectee ? (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Agence détectée : <strong>{AGENCES[state.agenceDetectee].label}</strong>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Agence non détectée — sélectionnez manuellement
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Agence cible *</Label>
            <Select
              value={state.agenceSelectionnee ?? ""}
              onValueChange={(v) => onAgenceChange(v as AgenceCode)}
              disabled={isUploading}
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

      {/* État upload */}
      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-sky-400 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          Import en cours...
        </div>
      )}

      {/* Résultat succès */}
      {state.status === "success" && state.result && (
        <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-800/40 space-y-1.5">
          <p className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Import réussi
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-slate-500">Lignes détectées</span>
            <span className="font-medium text-slate-300">{state.result.nbLignesTotal}</span>
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
            <div className="mt-1.5 space-y-0.5 border-t border-emerald-900/50 pt-1.5">
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
      {!isUploading && state.status !== "success" && (
        <Button
          size="sm"
          onClick={onUpload}
          disabled={!agenceFinal}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Importer
        </Button>
      )}

      {state.status === "success" && (
        <Button
          variant="outline" size="sm"
          onClick={onUpload}
          className="w-full border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Réimporter (remplacera les données existantes)
        </Button>
      )}
    </div>
  );
}

// ─── GlobalStatusBanner ────────────────────────────────────────────────────

function GlobalStatusBanner({
  agencesImportees,
  agencesManquantes,
  total,
}: {
  agencesImportees: Set<AgenceCode | null>;
  agencesManquantes: AgenceCode[];
  total: number;
}) {
  if (total === 0) return null;

  const done = agencesImportees.size;
  const allDone = agencesManquantes.length === 0;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all",
      allDone
        ? "border-emerald-700/50 bg-emerald-950/25 text-emerald-300"
        : "border-slate-700 bg-slate-800/40 text-slate-300"
    )}>
      {allDone ? (
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
      ) : (
        <CircleDashed className="h-4 w-4 text-slate-500 shrink-0" />
      )}

      <div className="flex-1">
        {allDone ? (
          <span className="font-medium">Les 2 agences sont importées — vous pouvez continuer</span>
        ) : (
          <span>
            <span className="font-medium">{done}/2 agence{done > 1 ? "s" : ""} importée{done > 1 ? "s" : ""}</span>
            {agencesManquantes.length > 0 && (
              <span className="text-slate-400 ml-1">
                · manquante{agencesManquantes.length > 1 ? "s" : ""} :{" "}
                {agencesManquantes.map((a) => AGENCES[a].label).join(", ")}
              </span>
            )}
          </span>
        )}
      </div>

      <Badge className={cn(
        "text-xs",
        allDone
          ? "bg-emerald-900/60 text-emerald-400 border-emerald-700"
          : "bg-slate-700 text-slate-400 border-slate-600"
      )}>
        {done}/2
      </Badge>
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

  // Dialog confirmation remplacement agence déjà importée
  const [replaceConfirm, setReplaceConfirm] = useState<{
    idx: number;
    agence: AgenceCode;
  } | null>(null);

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.file.name));
      const duplicates: string[] = [];
      const toAdd: FileUploadState[] = [];

      for (const file of incoming) {
        if (existingNames.has(file.name)) {
          duplicates.push(file.name);
        } else {
          toAdd.push({
            file,
            agenceDetectee: detectAgenceFromFilename(file.name),
            agenceSelectionnee: null,
            status: "idle",
          });
        }
      }

      if (duplicates.length) {
        toast.warning(`Fichier(s) déjà présent(s) : ${duplicates.join(", ")}`);
      }

      return [...prev, ...toAdd];
    });
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFile = (idx: number, patch: Partial<FileUploadState>) => {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const doUpload = async (idx: number) => {
    const state = files[idx];
    const agence = state.agenceSelectionnee ?? state.agenceDetectee;
    if (!agence) return;

    updateFile(idx, { status: "uploading", errorMessage: undefined });

    const formData = new FormData();
    formData.append("file", state.file);
    formData.append("moisKey", moisKey);
    formData.append("agence", agence);

    try {
      const res = await fetch("/api/admin/preterme-auto/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        updateFile(idx, { status: "error", errorMessage: data.error ?? "Erreur serveur" });
        toast.error(data.error ?? "Erreur lors de l'import");
        return;
      }

      updateFile(idx, { status: "success", result: data });
      toast.success(`Import réussi — ${data.nbLignesValides} clients chargés`);
      onImportSuccess?.(data.importId, agence);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur réseau";
      updateFile(idx, { status: "error", errorMessage: msg });
      toast.error(msg);
    }
  };

  const uploadFile = (idx: number) => {
    const state = files[idx];
    const agence = state.agenceSelectionnee ?? state.agenceDetectee;
    if (!agence) return;

    // Vérifier si cette agence a déjà un import réussi (hors le fichier courant)
    const alreadyImported = files.some(
      (f, i) => i !== idx && f.status === "success" &&
        (f.agenceDetectee ?? f.agenceSelectionnee) === agence
    );

    if (alreadyImported) {
      setReplaceConfirm({ idx, agence });
      return;
    }

    void doUpload(idx);
  };

  const importAllReadyFiles = () => {
    const readyIndexes = files
      .map((f, idx) => ({ f, idx }))
      .filter(({ f }) => {
        const agence = f.agenceSelectionnee ?? f.agenceDetectee;
        return f.status !== "uploading" && f.status !== "success" && !!agence;
      })
      .map(({ idx }) => idx);

    if (readyIndexes.length === 0) {
      toast.warning("Aucun fichier prêt à importer.");
      return;
    }

    // Imports en parallèle
    void Promise.all(readyIndexes.map((idx) => doUpload(idx)));
  };

  // Résumé global
  const successFiles = files.filter((f) => f.status === "success");
  const agencesImportees = new Set(
    successFiles.map((f) => f.agenceDetectee ?? f.agenceSelectionnee)
  );
  const agencesManquantes = (["H91358", "H92083"] as AgenceCode[]).filter(
    (a) => !agencesImportees.has(a)
  );

  const hasReadyToUpload = files.some((f) => {
    const agence = f.agenceSelectionnee ?? f.agenceDetectee;
    return f.status !== "uploading" && f.status !== "success" && !!agence;
  });

  const isAnyUploading = files.some((f) => f.status === "uploading");
  const showDropzone = agencesManquantes.length > 0 || files.length === 0;

  return (
    <div className="space-y-4">
      {/* Prérequis config */}
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

      {/* Bandeau statut global */}
      <GlobalStatusBanner
        agencesImportees={agencesImportees}
        agencesManquantes={agencesManquantes}
        total={files.length}
      />

      {/* Info agences (état vide uniquement) */}
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

      {/* Drop zone */}
      {showDropzone && (
        <DropZone
          onFiles={addFiles}
          disabled={!configValide}
          compact={files.length > 0}
        />
      )}

      {/* Liste fichiers */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((state, idx) => (
            <FileCard
              key={state.file.name}
              state={state}
              onAgenceChange={(a) => updateFile(idx, { agenceSelectionnee: a })}
              onUpload={() => uploadFile(idx)}
              onRemove={() => removeFile(idx)}
            />
          ))}
        </div>
      )}

      {/* Action globale */}
      {files.length > 1 && hasReadyToUpload && (
        <Button
          size="sm"
          onClick={importAllReadyFiles}
          className="w-full bg-sky-700 hover:bg-sky-600"
          disabled={isAnyUploading}
        >
          {isAnyUploading ? (
            <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Import en cours...</>
          ) : (
            <><Upload className="h-3.5 w-3.5 mr-1.5" /> Importer tous les fichiers prêts</>
          )}
        </Button>
      )}

      {/* Récapitulatif */}
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
          </CardContent>
        </Card>
      )}

      {/* Dialog : Confirmation remplacement agence déjà importée */}
      <AlertDialog open={!!replaceConfirm} onOpenChange={(open) => { if (!open) setReplaceConfirm(null); }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              Agence déjà importée
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Un import existe déjà pour{" "}
              <strong className="text-slate-200">
                {replaceConfirm ? AGENCES[replaceConfirm.agence].label : ""}
              </strong>{" "}
              ce mois-ci. Réimporter remplacera toutes les données existantes pour cette agence.
              <br /><br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setReplaceConfirm(null)}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-600"
              onClick={() => {
                if (replaceConfirm) {
                  const idx = replaceConfirm.idx;
                  setReplaceConfirm(null);
                  void doUpload(idx);
                }
              }}
            >
              Oui, remplacer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
