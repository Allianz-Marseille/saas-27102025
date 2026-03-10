"use client";

import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PretermeImport } from "@/types/preterme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiDashboardProps {
  imports: PretermeImport[];
}

interface MoisData {
  moisKey: string;
  label: string;
  globaux: number;
  conserves: number;
  ratio: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoisLabel(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function getDelta(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta > 0) return (
    <Badge className="text-[10px] bg-emerald-900/60 text-emerald-400 border-emerald-700 h-4">
      <TrendingUp className="h-2.5 w-2.5 mr-0.5" />+{delta}%
    </Badge>
  );
  if (delta < 0) return (
    <Badge className="text-[10px] bg-red-900/60 text-red-400 border-red-700 h-4">
      <TrendingDown className="h-2.5 w-2.5 mr-0.5" />{delta}%
    </Badge>
  );
  return (
    <Badge className="text-[10px] bg-slate-800 text-slate-400 border-slate-700 h-4">
      <Minus className="h-2.5 w-2.5 mr-0.5" />0%
    </Badge>
  );
}

// ─── KpiDashboard ─────────────────────────────────────────────────────────────

export function KpiDashboard({ imports }: KpiDashboardProps) {
  // Agréger par mois (dédupliqué, trié chronologiquement)
  const moisData: MoisData[] = useMemo(() => {
    const byMois = new Map<string, { globaux: number; conserves: number }>();

    for (const imp of imports) {
      const existing = byMois.get(imp.moisKey);
      byMois.set(imp.moisKey, {
        globaux:   (existing?.globaux ?? 0)   + (imp.pretermesGlobaux ?? 0),
        conserves: (existing?.conserves ?? 0) + (imp.pretermesConserves ?? 0),
      });
    }

    return Array.from(byMois.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // 12 derniers mois max
      .map(([moisKey, d]) => ({
        moisKey,
        label: formatMoisLabel(moisKey),
        globaux: d.globaux,
        conserves: d.conserves,
        ratio: d.globaux > 0 ? Math.round((d.conserves / d.globaux) * 100) : 0,
      }));
  }, [imports]);

  if (moisData.length === 0) {
    return (
      <div className="flex items-center gap-3 p-8 text-slate-500 justify-center">
        <BarChart3 className="h-5 w-5" />
        <span className="text-sm">Aucun historique d&apos;import disponible.</span>
      </div>
    );
  }

  const current  = moisData[moisData.length - 1];
  const previous = moisData[moisData.length - 2];

  const deltaGlobaux   = getDelta(current.globaux,   previous?.globaux);
  const deltaConserves = getDelta(current.conserves, previous?.conserves);
  const deltaRatio     = previous ? current.ratio - previous.ratio : null;

  // Cumul annuel (12 derniers mois)
  const annuel = {
    globaux:   moisData.reduce((s, m) => s + m.globaux, 0),
    conserves: moisData.reduce((s, m) => s + m.conserves, 0),
  };
  const ratioAnnuel = annuel.globaux > 0
    ? Math.round((annuel.conserves / annuel.globaux) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Mois courant — conservés */}
        <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-400">Conservés (M)</p>
            <DeltaBadge delta={deltaConserves} />
          </div>
          <p className="text-2xl font-bold text-sky-300">{current.conserves}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{current.moisKey}</p>
        </div>

        {/* Mois courant — globaux */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-400">Importés (M)</p>
            <DeltaBadge delta={deltaGlobaux} />
          </div>
          <p className="text-2xl font-bold text-white">{current.globaux}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{current.moisKey}</p>
        </div>

        {/* Ratio mois courant */}
        <div className={cn(
          "border rounded-xl p-4",
          current.ratio >= 50
            ? "bg-emerald-950/40 border-emerald-800/50"
            : "bg-amber-950/40 border-amber-800/50"
        )}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-400">Ratio (M)</p>
            {deltaRatio !== null && (
              <Badge className={cn(
                "text-[10px] h-4",
                deltaRatio > 0
                  ? "bg-emerald-900/60 text-emerald-400 border-emerald-700"
                  : deltaRatio < 0
                  ? "bg-red-900/60 text-red-400 border-red-700"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              )}>
                {deltaRatio > 0 ? "+" : ""}{deltaRatio}pts
              </Badge>
            )}
          </div>
          <p className={cn("text-2xl font-bold",
            current.ratio >= 50 ? "text-emerald-300" : "text-amber-300"
          )}>
            {current.ratio}%
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">conservation</p>
        </div>

        {/* Cumul annuel */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Cumul annuel</p>
          <p className="text-2xl font-bold text-white">{annuel.conserves}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            / {annuel.globaux} — {ratioAnnuel}%
          </p>
        </div>
      </div>

      {/* Graphique évolution conservés + globaux */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400">
            Évolution des volumes (12 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moisData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#64748b" }}
              />
              <Bar dataKey="globaux"   name="Importés"  fill="#334155" radius={[3, 3, 0, 0]} />
              <Bar dataKey="conserves" name="Conservés" fill="#0284c7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique ratio de conservation */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400">
            Taux de conservation par mois (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moisData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(v: number) => [`${v}%`, "Ratio"]}
              />
              <Line
                type="monotone" dataKey="ratio" name="Ratio"
                stroke="#38bdf8" strokeWidth={2}
                dot={{ fill: "#38bdf8", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
