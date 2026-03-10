"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Filter, Zap, CheckCircle2, AlertTriangle,
  Users, TrendingUp, BarChart3, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { calculerStatsConservation, type FilterStats } from "@/lib/services/preterme-anomaly";
import type { PretermeClient, AgenceCode } from "@/types/preterme";
import { AGENCES } from "@/types/preterme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassifyResult {
  nbTotal: number;
  nbConserves: number;
  nbExclus: number;
  nbSocietesAValider: number;
  nbParticuliers: number;
  ratioConservation: number;
  geminiKeyConfigured: boolean;
}

interface ThresholdsStepProps {
  importId: string;
  agence: AgenceCode;
  moisKey: string;
  clients: Pick<PretermeClient, "etp" | "tauxVariation">[];
  seuilEtpInitial: number;
  seuilVariationInitial: number;
  idToken: string;
  onClassifySuccess: (result: ClassifyResult) => void;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "emerald" | "amber" | "red";
}) {
  const colors = {
    default: "bg-slate-800/60 border-slate-700",
    emerald: "bg-emerald-950/40 border-emerald-800/60",
    amber: "bg-amber-950/40 border-amber-800/60",
    red: "bg-red-950/40 border-red-800/60",
  };
  const textColors = {
    default: "text-white",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    red: "text-red-300",
  };

  return (
    <div className={cn("rounded-xl border p-4 text-center", colors[color])}>
      <p className={cn("text-2xl font-bold", textColors[color])}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── ThresholdsStep ───────────────────────────────────────────────────────────

export function ThresholdsStep({
  importId,
  agence,
  moisKey,
  clients,
  seuilEtpInitial,
  seuilVariationInitial,
  idToken,
  onClassifySuccess,
}: ThresholdsStepProps) {
  const [seuilEtp, setSeuilEtp] = useState(seuilEtpInitial);
  const [seuilVariation, setSeuilVariation] = useState(seuilVariationInitial);
  const [isClassifying, setIsClassifying] = useState(false);
  const [lastResult, setLastResult] = useState<ClassifyResult | null>(null);

  // Preview dynamique (calcul local, sans appel API)
  const stats: FilterStats = useMemo(
    () => calculerStatsConservation(clients, seuilEtp, seuilVariation),
    [clients, seuilEtp, seuilVariation]
  );

  const handleClassify = async () => {
    setIsClassifying(true);
    try {
      const res = await fetch("/api/admin/preterme-auto/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ importId, seuilEtp, seuilVariation }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de la classification");
        return;
      }

      setLastResult(data);
      onClassifySuccess(data);

      if (!data.geminiKeyConfigured) {
        toast.warning(
          "Clé Gemini non configurée — tous les clients sont classés en 'à valider'."
        );
      } else {
        toast.success(
          `Classification terminée — ${data.nbConserves} clients conservés, ${data.nbSocietesAValider} sociétés à valider.`
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info agence */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <BarChart3 className="h-4 w-4 text-sky-400" />
        <span>
          Agence <strong className="text-slate-200">{AGENCES[agence].label}</strong> —{" "}
          <strong className="text-slate-200">{clients.length}</strong> clients importés
        </span>
        <Badge className="ml-auto bg-sky-900/50 text-sky-300 border-sky-700 text-[10px]">
          {moisKey}
        </Badge>
      </div>

      {/* Sliders */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-sky-400" />
            Réglage des seuils de conservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ETP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">Seuil ETP</Label>
              <span className="text-sm font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded">
                ≥ {seuilEtp}
              </span>
            </div>
            <Slider
              value={[seuilEtp]}
              onValueChange={(vals: number[]) => setSeuilEtp(vals[0])}
              min={100}
              max={200}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>100</span><span>150</span><span>200</span>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Taux de variation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">Seuil Taux de variation</Label>
              <span className="text-sm font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded">
                ≥ {seuilVariation}%
              </span>
            </div>
            <Slider
              value={[seuilVariation]}
              onValueChange={(vals: number[]) => setSeuilVariation(vals[0])}
              min={5}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>5%</span><span>27%</span><span>50%</span>
            </div>
          </div>

          {/* Règle appliquée */}
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Règle :</span>{" "}
            conserver si{" "}
            <code className="text-sky-400">ETP ≥ {seuilEtp}</code>{" "}
            <span className="font-medium text-slate-300">OU</span>{" "}
            <code className="text-sky-400">Taux variation ≥ {seuilVariation}%</code>
          </div>
        </CardContent>
      </Card>

      {/* Preview dynamique */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp className="h-4 w-4" />
            Aperçu en temps réel
            <Badge className="ml-auto bg-slate-800 text-slate-400 border-slate-700 text-[10px]">
              estimation locale
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Total importés"
              value={stats.total}
            />
            <StatCard
              label="Conservés"
              value={stats.conserves}
              sub={`sur ${stats.total}`}
              color="emerald"
            />
            <StatCard
              label="Exclus"
              value={stats.exclus}
              color={stats.exclus > stats.total * 0.5 ? "amber" : "default"}
            />
          </div>

          {/* Barre de conservation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Taux de conservation</span>
              <span className="font-medium text-slate-200">
                {stats.ratioConservation}%
              </span>
            </div>
            <Progress
              value={stats.ratioConservation}
              className="h-2"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-sky-950/20 border border-sky-900/40 rounded-lg text-xs text-sky-400/80">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              L&apos;aperçu est calculé localement. La classification Gemini (particulier / société)
              est lancée après validation des seuils.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Résultat classification précédente */}
      {lastResult && (
        <Card className="bg-emerald-950/20 border-emerald-800/40">
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Classification Gemini terminée
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Conservés (validés)"
                value={lastResult.nbConserves}
                color="emerald"
              />
              <StatCard
                label="Sociétés à valider"
                value={lastResult.nbSocietesAValider}
                color={lastResult.nbSocietesAValider > 0 ? "amber" : "default"}
              />
            </div>
            {!lastResult.geminiKeyConfigured && (
              <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-700/40 rounded-lg text-xs text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Clé Gemini absente — configurez{" "}
                <code className="mx-1">GEMINI_API_KEY</code> dans vos variables d&apos;environnement.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bouton lancement */}
      <Button
        onClick={handleClassify}
        disabled={isClassifying || clients.length === 0}
        className="w-full bg-sky-600 hover:bg-sky-500 py-5 font-medium disabled:opacity-50"
        size="lg"
      >
        {isClassifying ? (
          <>
            <Zap className="h-4 w-4 mr-2 animate-pulse" />
            Classification Gemini en cours…
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Lancer le filtrage + classification Gemini ({stats.conserves} clients)
          </>
        )}
      </Button>
    </div>
  );
}
