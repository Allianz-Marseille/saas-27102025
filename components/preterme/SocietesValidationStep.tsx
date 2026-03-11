"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Building2, CheckCircle2, AlertTriangle, Save, User, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updatePretermeClient } from "@/lib/firebase/preterme";
import type { PretermeClient } from "@/types/preterme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocieteRow {
  client: PretermeClient;
  nomGerant: string;
  saved: boolean;
}

interface SocietesValidationStepProps {
  societes: PretermeClient[];         // clients typeEntite === "a_valider" ou "societe"
  onAllValidated?: () => void;
}

// ─── SocieteCard ──────────────────────────────────────────────────────────────

function SocieteCard({
  row,
  onChange,
  onSave,
  onCopyName,
  isCopied,
  isSaving,
}: {
  row: SocieteRow;
  onChange: (val: string) => void;
  onSave: () => void;
  onCopyName: () => void;
  isCopied: boolean;
  isSaving: boolean;
}) {
  const { client } = row;

  return (
    <div className={cn(
      "border rounded-xl p-4 space-y-3 transition-all",
      row.saved
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-950/20"
        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/30"
    )}>
      {/* Nom de la société */}
      <div className="flex items-start gap-3">
        <Building2 className={cn(
          "h-4 w-4 mt-0.5 shrink-0",
          row.saved ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {client.nomClient}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCopyName}
              className="h-6 w-6 shrink-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              title="Copier le nom"
              aria-label={`Copier le nom ${client.nomClient}`}
            >
              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-500 dark:text-slate-500">N° {client.numeroContrat}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-4",
                row.saved
                  ? "text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700"
                  : "text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700"
              )}
            >
              {row.saved ? "Validée" : "À valider"}
            </Badge>
          </div>
        </div>
        {row.saved && (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}
      </div>

      {/* Saisie nom gérant */}
      {!row.saved ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <User className="h-3 w-3" />
              Nom de famille du gérant (pour la répartition alphabétique)
            </Label>
            <div className="flex gap-2">
              <Input
                value={row.nomGerant}
                onChange={(e) => onChange(e.target.value)}
                placeholder="ex: MARTIN"
                className="h-8 text-sm bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 uppercase flex-1 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && row.nomGerant.trim()) onSave();
                }}
              />
              <Button
                size="sm"
                className="h-8 bg-sky-600 hover:bg-sky-500 px-3"
                disabled={!row.nomGerant.trim() || isSaving}
                onClick={onSave}
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Valider
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-emerald-700 dark:text-emerald-300/80 flex items-center gap-1.5">
          <User className="h-3 w-3" />
          Gérant : <strong>{row.nomGerant}</strong>
        </p>
      )}
    </div>
  );
}

// ─── SocietesValidationStep ───────────────────────────────────────────────────

export function SocietesValidationStep({
  societes,
  onAllValidated,
}: SocietesValidationStepProps) {
  const [rows, setRows] = useState<SocieteRow[]>(
    societes.map((c) => ({
      client: c,
      nomGerant: c.nomGerant ?? "",
      saved: !!c.nomGerant,
    }))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  const nbValidees = rows.filter((r) => r.saved).length;
  const allValidated = nbValidees === rows.length;

  const updateNom = (id: string, val: string) => {
    setRows((prev) =>
      prev.map((r) => (r.client.id === id ? { ...r, nomGerant: val.toUpperCase() } : r))
    );
  };

  const saveRow = async (id: string) => {
    const row = rows.find((r) => r.client.id === id);
    if (!row || !row.nomGerant.trim()) return;

    setSavingId(id);
    try {
      await updatePretermeClient(id, {
        nomGerant: row.nomGerant.trim(),
        typeEntite: "societe",
      });
      setRows((prev) =>
        prev.map((r) => (r.client.id === id ? { ...r, saved: true } : r))
      );
      toast.success(`Société validée : ${row.client.nomClient}`);

      // Vérifier si toutes sont validées
      const updatedRows = rows.map((r) =>
        r.client.id === id ? { ...r, saved: true } : r
      );
      if (updatedRows.every((r) => r.saved)) {
        onAllValidated?.();
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingId(null);
    }
  };

  const copySocieteName = async (row: SocieteRow) => {
    const societeName = row.client.nomClient.trim();
    if (!societeName) {
      toast.error("Nom de société introuvable.");
      return;
    }

    try {
      await navigator.clipboard.writeText(societeName);
      setCopiedClientId(row.client.id);
      toast.success(`Nom copié : ${societeName}`);
      setTimeout(() => {
        setCopiedClientId((current) => (current === row.client.id ? null : current));
      }, 1500);
    } catch (error) {
      console.error("Erreur de copie du nom de société :", error);
      toast.error("Impossible de copier le nom de la société.");
    }
  };

  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-3 p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Aucune société à valider</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-0.5">
            Tous les clients ont été identifiés comme des particuliers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {rows.length} société{rows.length > 1 ? "s" : ""} détectée{rows.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">
            Saisissez le nom de famille du gérant pour appliquer la bonne répartition alphabétique.
          </p>
        </div>
        <Badge
          className={cn(
            "shrink-0",
            allValidated
              ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700"
              : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/60 dark:text-amber-400 dark:border-amber-700"
          )}
        >
          {nbValidees} / {rows.length} validées
        </Badge>
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
          style={{ width: `${(nbValidees / rows.length) * 100}%` }}
        />
      </div>

      {/* Info brouillon */}
      <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" />
        <span>
          Vous pouvez sauvegarder et reprendre plus tard — les sociétés non validées ne recevront
          pas de carte Trello tant que le nom du gérant n&apos;est pas renseigné.
        </span>
      </div>

      {/* Liste des sociétés */}
      {rows.map((row) => (
        <SocieteCard
          key={row.client.id}
          row={row}
          onChange={(val) => updateNom(row.client.id, val)}
          onSave={() => saveRow(row.client.id)}
          onCopyName={() => copySocieteName(row)}
          isCopied={copiedClientId === row.client.id}
          isSaving={savingId === row.client.id}
        />
      ))}

      {/* Toutes validées */}
      {allValidated && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-700/50 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Toutes les sociétés sont validées</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-0.5">
              Vous pouvez passer à l&apos;étape suivante : dispatch Trello.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
