"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PretermeClient, AgenceCode } from "@/types/preterme";

interface ThresholdsStepProps {
  importId: string;
  agence: AgenceCode;
  moisKey: string;
  clients: PretermeClient[];
  availableImportIds: string[];
  seuilEtpInitial: number;
  seuilVariationInitial: number;
  idToken: string;
  onClassifySuccess: (result: unknown) => void;
}

interface ClassifyResult {
  nbTotal: number;
  nbConserves: number;
  nbExclus: number;
  nbSocietesAValider: number;
  nbParticuliers: number;
  ratioConservation: number;
}

export function ThresholdsStep({
  importId, agence, moisKey, clients, availableImportIds,
  seuilEtpInitial, seuilVariationInitial, idToken, onClassifySuccess,
}: ThresholdsStepProps) {
  const [seuilEtp, setSeuilEtp] = useState(seuilEtpInitial);
  const [seuilVariation, setSeuilVariation] = useState(seuilVariationInitial);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);

  // Prévisualisation côté client (logique ETP OR variation)
  const preview = useMemo(() => {
    const conserves = clients.filter(
      (c) =>
        (c.etp != null && c.etp >= seuilEtp) ||
        (c.tauxVariation != null && c.tauxVariation >= seuilVariation)
    );
    return {
      total: clients.length,
      conserves: conserves.length,
      ratio: clients.length > 0 ? Math.round((conserves.length / clients.length) * 100) : 0,
    };
  }, [clients, seuilEtp, seuilVariation]);

  const handleClassify = async () => {
    setIsRunning(true);
    try {
      const useMultiple = availableImportIds.length > 1;
      const body = useMultiple
        ? { importIds: availableImportIds, seuilEtp, seuilVariation }
        : { importId, seuilEtp, seuilVariation };

      const res = await fetch("/api/admin/preterme-auto/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur classification");

      setResult(data as ClassifyResult);
      toast.success(`Classification terminée — ${data.nbConserves} clients conservés`);
      onClassifySuccess(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la classification");
    } finally {
      setIsRunning(false);
    }
  };

  void agence;
  void moisKey;

  return (
    <div className="space-y-6">
      {/* Stats import */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total importé" value={clients.length} />
        <StatCard label="Seraient conservés" value={preview.conserves} highlight />
        <StatCard label="Exclus" value={preview.total - preview.conserves} />
      </div>

      {/* Seuils */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Seuils de conservation (logique OU)
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-700 dark:text-slate-300">ETP ≥</Label>
            <Badge variant="outline" className="tabular-nums font-mono">{seuilEtp}</Badge>
          </div>
          <Slider
            value={[seuilEtp]}
            min={50} max={300} step={5}
            onValueChange={([v]) => setSeuilEtp(v)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-700 dark:text-slate-300">Variation ≥</Label>
            <Badge variant="outline" className="tabular-nums font-mono">{seuilVariation}%</Badge>
          </div>
          <Slider
            value={[seuilVariation]}
            min={5} max={100} step={1}
            onValueChange={([v]) => setSeuilVariation(v)}
          />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Prévisualisation :{" "}
          <strong className="text-slate-700 dark:text-slate-200">{preview.conserves}</strong> clients
          sur <strong>{preview.total}</strong> seront traités ({preview.ratio}%)
        </p>
      </div>

      {/* Résultat Gemini */}
      {result && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Classification Gemini terminée
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Particuliers</p>
              <p className="font-bold text-slate-900 dark:text-white text-lg">{result.nbParticuliers}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Entreprises</p>
              <p className="font-bold text-slate-900 dark:text-white text-lg">{result.nbSocietesAValider}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Conservation</p>
              <p className="font-bold text-slate-900 dark:text-white text-lg">{result.ratioConservation}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton lancement */}
      <Button
        className="w-full bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-60"
        onClick={handleClassify}
        disabled={isRunning || preview.conserves === 0}
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Classification en cours…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Lancer la classification Gemini ({preview.conserves} clients)
          </>
        )}
      </Button>

      {availableImportIds.length > 1 && (
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          Les {availableImportIds.length} agences seront classifiées simultanément.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label, value, highlight = false,
}: {
  label: string; value: number; highlight?: boolean;
}) {
  return (
    <div className={cn(
      "p-3 rounded-xl border text-center",
      highlight
        ? "border-sky-200 bg-sky-50 dark:border-sky-800/50 dark:bg-sky-950/30"
        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30"
    )}>
      <p className={cn(
        "text-2xl font-bold",
        highlight ? "text-sky-700 dark:text-sky-300" : "text-slate-900 dark:text-white"
      )}>
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
