"use client";

import { useMemo, useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3, Building2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPretermeClientsByMoisKey } from "@/lib/firebase/preterme";
import type { PretermeImport, PretermeClient } from "@/types/preterme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiDashboardProps {
  imports: PretermeImport[];
  currentMoisKey?: string;
}

interface MoisData {
  moisKey: string;
  label: string;
  globaux: number;
  conserves: number;
  ratio: number;
}

interface AgenceStat {
  agence: string;
  globaux: number;
  conserves: number;
  ratio: number;
}

interface ChargeStat {
  charge: string;
  conserves: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoisLabel(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function formatMoisFull(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function getDelta(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta > 0) return (
    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700 h-4">
      <TrendingUp className="h-2.5 w-2.5 mr-0.5" />+{delta}%
    </Badge>
  );
  if (delta < 0) return (
    <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300 dark:bg-red-900/60 dark:text-red-400 dark:border-red-700 h-4">
      <TrendingDown className="h-2.5 w-2.5 mr-0.5" />{delta}%
    </Badge>
  );
  return (
    <Badge className="text-[10px] bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 h-4">
      <Minus className="h-2.5 w-2.5 mr-0.5" />0%
    </Badge>
  );
}

const AGENCE_COLORS: Record<string, string> = {
  H91358: "#0284c7",
  H92083: "#7c3aed",
};

const CHARGE_COLORS = ["#0284c7", "#7c3aed", "#059669", "#d97706", "#dc2626", "#64748b"];

// ─── KpiDashboard ─────────────────────────────────────────────────────────────

export function KpiDashboard({ imports, currentMoisKey }: KpiDashboardProps) {
  const [clients, setClients] = useState<PretermeClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const syncTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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
      .slice(-12)
      .map(([moisKey, d]) => ({
        moisKey,
        label: formatMoisLabel(moisKey),
        globaux: d.globaux,
        conserves: d.conserves,
        ratio: d.globaux > 0 ? Math.round((d.conserves / d.globaux) * 100) : 0,
      }));
  }, [imports]);

  // Mois cible pour les stats détaillées
  const targetMoisKey = currentMoisKey ?? moisData[moisData.length - 1]?.moisKey;

  // Fetch clients du mois cible
  useEffect(() => {
    if (!targetMoisKey) return;
    setLoadingClients(true);
    getPretermeClientsByMoisKey(targetMoisKey)
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoadingClients(false));
  }, [targetMoisKey]);

  // Stats par agence (sur tout l'historique chargé)
  const agenceStats: AgenceStat[] = useMemo(() => {
    const byAgence = new Map<string, { globaux: number; conserves: number }>();
    for (const imp of imports) {
      const existing = byAgence.get(imp.agence);
      byAgence.set(imp.agence, {
        globaux:   (existing?.globaux ?? 0)   + (imp.pretermesGlobaux ?? 0),
        conserves: (existing?.conserves ?? 0) + (imp.pretermesConserves ?? 0),
      });
    }
    return Array.from(byAgence.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([agence, d]) => ({
        agence,
        globaux: d.globaux,
        conserves: d.conserves,
        ratio: d.globaux > 0 ? Math.round((d.conserves / d.globaux) * 100) : 0,
      }));
  }, [imports]);

  // Stats par collaborateur (mois cible, clients conservés uniquement)
  const chargeStats: ChargeStat[] = useMemo(() => {
    const byCharge = new Map<string, number>();
    for (const c of clients) {
      if (!c.conserve) continue;
      const charge = c.chargeAttribue ?? "Non attribué";
      byCharge.set(charge, (byCharge.get(charge) ?? 0) + 1);
    }
    return Array.from(byCharge.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([charge, conserves]) => ({ charge, conserves }));
  }, [clients]);

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

  const chartTheme = isDarkTheme
    ? {
        grid: "#1e293b",
        tick: "#64748b",
        tickStrong: "#94a3b8",
        tooltipBg: "#0f172a",
        tooltipBorder: "#334155",
        tooltipLabel: "#94a3b8",
        tooltipItem: "#e2e8f0",
        barMuted: "#334155",
      }
    : {
        grid: "#e2e8f0",
        tick: "#64748b",
        tickStrong: "#475569",
        tooltipBg: "#ffffff",
        tooltipBorder: "#cbd5e1",
        tooltipLabel: "#334155",
        tooltipItem: "#0f172a",
        barMuted: "#94a3b8",
      };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Mois courant — conservés */}
        <div className="bg-sky-50 border border-sky-200 dark:bg-sky-950/40 dark:border-sky-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 dark:text-slate-400">Conservés (M)</p>
            <DeltaBadge delta={deltaConserves} />
          </div>
          <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">{current.conserves}</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-0.5">{current.moisKey}</p>
        </div>

        {/* Mois courant — globaux */}
        <div className="bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 dark:text-slate-400">Importés (M)</p>
            <DeltaBadge delta={deltaGlobaux} />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{current.globaux}</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-0.5">{current.moisKey}</p>
        </div>

        {/* Ratio mois courant */}
        <div className={cn(
          "border rounded-xl p-4",
          current.ratio >= 50
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/50"
        )}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 dark:text-slate-400">Ratio (M)</p>
            {deltaRatio !== null && (
              <Badge className={cn(
                "text-[10px] h-4",
                deltaRatio > 0
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700"
                  : deltaRatio < 0
                  ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/60 dark:text-red-400 dark:border-red-700"
                  : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              )}>
                {deltaRatio > 0 ? "+" : ""}{deltaRatio}pts
              </Badge>
            )}
          </div>
          <p className={cn("text-2xl font-bold",
            current.ratio >= 50 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
          )}>
            {current.ratio}%
          </p>
          <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-0.5">conservation</p>
        </div>

        {/* Cumul annuel */}
        <div className="bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Cumul annuel</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{annuel.conserves}</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-0.5">
            / {annuel.globaux} — {ratioAnnuel}%
          </p>
        </div>
      </div>

      {/* Graphique évolution conservés + globaux */}
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-700 dark:text-slate-400">
            Évolution des volumes (12 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moisData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="label" tick={{ fill: chartTheme.tick, fontSize: 11 }} />
              <YAxis tick={{ fill: chartTheme.tick, fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: chartTheme.tooltipLabel }}
                itemStyle={{ color: chartTheme.tooltipItem }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: chartTheme.tick }} />
              <Bar dataKey="globaux"   name="Importés"  fill={chartTheme.barMuted} radius={[3, 3, 0, 0]} />
              <Bar dataKey="conserves" name="Conservés" fill="#0284c7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique ratio de conservation */}
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-700 dark:text-slate-400">
            Taux de conservation par mois (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moisData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="label" tick={{ fill: chartTheme.tick, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: chartTheme.tick, fontSize: 11 }}
                tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: chartTheme.tooltipLabel }}
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

      {/* ── Par agence ───────────────────────────────────────────────── */}
      {agenceStats.length > 0 && (
        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Répartition par agence (cumul)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {agenceStats.map((a) => (
                <div
                  key={a.agence}
                  className="bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: AGENCE_COLORS[a.agence] ?? "#94a3b8" }}
                    >
                      {a.agence}
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px] h-5",
                        a.ratio >= 50
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700"
                          : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/60 dark:text-amber-400 dark:border-amber-700"
                      )}
                    >
                      {a.ratio}%
                    </Badge>
                  </div>
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{a.conserves}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-500">conservés</p>
                    </div>
                    <div className="text-slate-600 text-lg pb-0.5">/</div>
                    <div>
                      <p className="text-xl font-bold text-slate-600 dark:text-slate-400">{a.globaux}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-500">importés</p>
                    </div>
                  </div>
                  {/* Barre de progression */}
                  <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${a.ratio}%`,
                        backgroundColor: AGENCE_COLORS[a.agence] ?? "#94a3b8",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart agences */}
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={agenceStats}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: chartTheme.tick, fontSize: 11 }} />
                <YAxis dataKey="agence" type="category" tick={{ fill: chartTheme.tickStrong, fontSize: 11 }} width={70} />
                <Tooltip
                  contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 8 }}
                  labelStyle={{ color: chartTheme.tooltipLabel }}
                  itemStyle={{ color: chartTheme.tooltipItem }}
                />
                <Bar dataKey="globaux" name="Importés" fill={chartTheme.barMuted} radius={[0, 3, 3, 0]}>
                  {agenceStats.map((a) => (
                    <Cell key={a.agence} fill={chartTheme.barMuted} />
                  ))}
                </Bar>
                <Bar dataKey="conserves" name="Conservés" radius={[0, 3, 3, 0]}>
                  {agenceStats.map((a) => (
                    <Cell key={a.agence} fill={AGENCE_COLORS[a.agence] ?? "#0284c7"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Par collaborateur ─────────────────────────────────────────── */}
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-700 dark:text-slate-400 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Conservés par collaborateur
            {targetMoisKey && (
              <span className="text-slate-500 dark:text-slate-600 font-normal">
                — {formatMoisFull(targetMoisKey)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClients ? (
            <div className="flex items-center gap-2 py-6 justify-center text-slate-600 dark:text-slate-500 text-sm">
              <span className="animate-pulse">Chargement…</span>
            </div>
          ) : chargeStats.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-500 py-4 text-center">
              Aucun client conservé avec attribution pour ce mois.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Cards collaborateurs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {chargeStats.map((c, i) => (
                  <div
                    key={c.charge}
                    className="bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 rounded-xl p-3"
                  >
                    <p
                      className="text-xs font-medium mb-1 truncate"
                      style={{ color: CHARGE_COLORS[i % CHARGE_COLORS.length] }}
                    >
                      {c.charge}
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{c.conserves}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-500">clients</p>
                  </div>
                ))}
              </div>

              {/* Bar chart collaborateurs */}
              <ResponsiveContainer width="100%" height={Math.max(120, chargeStats.length * 44)}>
                <BarChart
                  data={chargeStats}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill: chartTheme.tick, fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="charge" type="category" tick={{ fill: chartTheme.tickStrong, fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 8 }}
                    labelStyle={{ color: chartTheme.tooltipLabel }}
                    formatter={(v: number) => [v, "Conservés"]}
                  />
                  <Bar dataKey="conserves" name="Conservés" radius={[0, 3, 3, 0]}>
                    {chargeStats.map((c, i) => (
                      <Cell
                        key={c.charge}
                        fill={CHARGE_COLORS[i % CHARGE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
