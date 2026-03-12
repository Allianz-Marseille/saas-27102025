"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Filter, Zap, CheckCircle2, Lock, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { calculerStatsConservation } from "@/lib/services/preterme-anomaly";
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

export interface ImportEntry {
  importId: string;
  agence: AgenceCode;
  clients: Pick<PretermeClient, "etp" | "tauxVariation">[];
}

interface AgenceState {
  seuilEtp: number;
  seuilVariation: number;
  locked: boolean;
}

interface ThresholdsStepProps {
  imports: ImportEntry[];
  seuilEtpInitial: number;
  seuilVariationInitial: number;
  idToken: string;
  onClassifySuccess: (result: ClassifyResult) => void;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "emerald" | "amber";
}) {
  const bg = {
    default: "bg-slate-800/60 border-slate-700",
    emerald: "bg-emerald-950/40 border-emerald-800/60",
    amber:   "bg-amber-950/40 border-amber-800/60",
  };
  const text = {
    default: "text-white",
    emerald: "text-emerald-300",
    amber:   "text-amber-300",
  };
  return (
    <div className={cn("rounded-xl border p-4 text-center", bg[color])}>
      <p className={cn("text-2xl font-bold", text[color])}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── AgencePanel ──────────────────────────────────────────────────────────────

function AgencePanel({
  imp, state, onSeuilEtpChange, onSeuilVariationChange, onLock, onUnlock,
}: {
  imp: ImportEntry;
  state: AgenceState;
  onSeuilEtpChange: (val: number) => void;
  onSeuilVariationChange: (val: number) => void;
  onLock: () => void;
  onUnlock: () => void;
}) {
  const stats = useMemo(
    () => calculerStatsConservation(imp.clients, state.seuilEtp, state.seuilVariation),
    [imp.clients, state.seuilEtp, state.seuilVariation]
  );

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total importés" value={stats.total} />
        <StatCard
          label="Conservés"
          value={stats.conserves}
          sub={`${stats.ratioConservation}%`}
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
          <span className="font-medium text-slate-200">{stats.ratioConservation}%</span>
        </div>
        <Progress value={stats.ratioConservation} className="h-2" />
      </div>

      {/* Sliders */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="h-4 w-4" />
            Seuils de conservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* ETP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">Seuil ETP</Label>
              <span className="text-sm font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded">
                ≥ {state.seuilEtp}
              </span>
            </div>
            <Slider
              value={[state.seuilEtp]}
              onValueChange={(vals) => onSeuilEtpChange(vals[0])}
              min={100} max={200} step={5}
              disabled={state.locked}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>100</span><span>150</span><span>200</span>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Majoration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">Majoration (%)</Label>
              <span className="text-sm font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded">
                ≥ {state.seuilVariation}%
              </span>
            </div>
            <Slider
              value={[state.seuilVariation]}
              onValueChange={(vals) => onSeuilVariationChange(vals[0])}
              min={5} max={50} step={1}
              disabled={state.locked}
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
            <code className="text-sky-400">ETP ≥ {state.seuilEtp}</code>{" "}
            <span className="font-medium text-slate-300">OU</span>{" "}
            <code className="text-sky-400">Majo ≥ {state.seuilVariation}%</code>
          </div>
        </CardContent>
      </Card>

      {/* Bouton Je bloque / Modifier */}
      {state.locked ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Validé — ETP ≥ {state.seuilEtp} | Majo ≥ {state.seuilVariation}%</span>
          </div>
          <Button
            variant="outline" size="sm"
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 shrink-0"
            onClick={onUnlock}
          >
            Modifier
          </Button>
        </div>
      ) : (
        <Button
          onClick={onLock}
          disabled={imp.clients.length === 0}
          className="w-full bg-amber-500 hover:bg-amber-400 text-white py-4 font-medium"
          size="lg"
        >
          <Lock className="h-4 w-4 mr-2" />
          Je bloque — {AGENCES[imp.agence].label}
        </Button>
      )}

      <div className="flex items-start gap-2 p-3 bg-sky-950/20 border border-sky-900/40 rounded-lg text-xs text-sky-400/80">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          L&apos;aperçu est calculé localement. La classification Gemini est lancée quand les deux agences sont bloquées.
        </span>
      </div>
    </div>
  );
}

// ─── ThresholdsStep ───────────────────────────────────────────────────────────

export function ThresholdsStep({
  imports,
  seuilEtpInitial,
  seuilVariationInitial,
  idToken,
  onClassifySuccess,
}: ThresholdsStepProps) {
  const [agenceStates, setAgenceStates] = useState<Record<string, AgenceState>>(() => {
    const s: Record<string, AgenceState> = {};
    for (const imp of imports) {
      s[imp.importId] = {
        seuilEtp: seuilEtpInitial,
        seuilVariation: seuilVariationInitial,
        locked: false,
      };
    }
    return s;
  });

  const [activeTab, setActiveTab] = useState<string>(imports[0]?.importId ?? "");
  const [isClassifying, setIsClassifying] = useState(false);

  const allLocked = imports.length > 0 && imports.every((imp) => agenceStates[imp.importId]?.locked);
  const nbLocked = imports.filter((imp) => agenceStates[imp.importId]?.locked).length;

  const updateState = (importId: string, patch: Partial<AgenceState>) =>
    setAgenceStates((prev) => ({ ...prev, [importId]: { ...prev[importId], ...patch } }));

  const handleClassify = async () => {
    if (!allLocked) return;
    setIsClassifying(true);
    try {
      const results = await Promise.all(
        imports.map(async (imp) => {
          const state = agenceStates[imp.importId];
          const res = await fetch("/api/admin/preterme-auto/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({
              importId: imp.importId,
              seuilEtp: state.seuilEtp,
              seuilVariation: state.seuilVariation,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? `Erreur classification ${imp.agence}`);
          return data;
        })
      );

      const merged = results.reduce(
        (acc, r) => ({
          nbTotal:           acc.nbTotal           + (r.nbTotal           ?? 0),
          nbConserves:       acc.nbConserves       + (r.nbConserves       ?? 0),
          nbExclus:          acc.nbExclus          + (r.nbExclus          ?? 0),
          nbSocietesAValider: acc.nbSocietesAValider + (r.nbSocietesAValider ?? 0),
          nbParticuliers:    acc.nbParticuliers    + (r.nbParticuliers    ?? 0),
          ratioConservation: 0,
          geminiKeyConfigured: acc.geminiKeyConfigured && (r.geminiKeyConfigured ?? true),
        }),
        { nbTotal: 0, nbConserves: 0, nbExclus: 0, nbSocietesAValider: 0, nbParticuliers: 0, ratioConservation: 0, geminiKeyConfigured: true }
      );
      merged.ratioConservation = merged.nbTotal > 0
        ? Math.round((merged.nbConserves / merged.nbTotal) * 100)
        : 0;

      if (!merged.geminiKeyConfigured) {
        toast.warning("Clé Gemini non configurée — clients classés en 'à valider'.");
      } else {
        toast.success(`Classification terminée — ${merged.nbConserves} clients conservés sur ${merged.nbTotal}.`);
      }
      onClassifySuccess(merged);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setIsClassifying(false);
    }
  };

  const activeImport = imports.find((imp) => imp.importId === activeTab);

  return (
    <div className="space-y-6">
      {/* Tabs agences */}
      <div className="flex items-center gap-2 flex-wrap">
        {imports.map((imp) => {
          const state = agenceStates[imp.importId];
          const isActive = imp.importId === activeTab;
          const isLocked = state?.locked ?? false;
          return (
            <button
              key={imp.importId}
              type="button"
              onClick={() => setActiveTab(imp.importId)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border",
                isLocked
                  ? isActive
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:bg-emerald-950/70"
                  : isActive
                    ? "bg-amber-500 text-white border-amber-400 shadow-sm"
                    : "bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-950/70"
              )}
            >
              {isLocked
                ? <CheckCircle2 className="h-4 w-4" />
                : <Lock className="h-3.5 w-3.5 opacity-70" />
              }
              <span>{AGENCES[imp.agence].label}</span>
              <Badge className={cn(
                "text-[10px] border-0",
                isLocked ? "bg-emerald-800/60 text-emerald-200" : "bg-amber-800/60 text-amber-200"
              )}>
                {imp.clients.length}
              </Badge>
            </button>
          );
        })}
        <span className="ml-auto text-xs text-slate-500">
          {nbLocked}/{imports.length} agences bloquées
        </span>
      </div>

      {/* Panel agence active */}
      {activeImport && agenceStates[activeImport.importId] && (
        <AgencePanel
          imp={activeImport}
          state={agenceStates[activeImport.importId]}
          onSeuilEtpChange={(val) => updateState(activeImport.importId, { seuilEtp: val })}
          onSeuilVariationChange={(val) => updateState(activeImport.importId, { seuilVariation: val })}
          onLock={() => updateState(activeImport.importId, { locked: true })}
          onUnlock={() => updateState(activeImport.importId, { locked: false })}
        />
      )}

      {/* CTA global */}
      <Button
        onClick={() => { void handleClassify(); }}
        disabled={!allLocked || isClassifying}
        className={cn(
          "w-full py-5 font-medium text-base transition-all",
          allLocked
            ? "bg-sky-600 hover:bg-sky-500"
            : "bg-slate-800 text-slate-500 border border-slate-700"
        )}
        size="lg"
      >
        {isClassifying ? (
          <><Zap className="h-4 w-4 mr-2 animate-pulse" />Classification Gemini en cours…</>
        ) : !allLocked ? (
          <><Lock className="h-4 w-4 mr-2" />Bloquez les {imports.length} agences pour activer l&apos;IA</>
        ) : (
          <><Zap className="h-4 w-4 mr-2" />Lancer l&apos;IA — {imports.reduce((acc, imp) => acc + imp.clients.length, 0)} clients</>
        )}
      </Button>
    </div>
  );
}
