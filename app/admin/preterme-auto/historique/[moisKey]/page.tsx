"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, CheckCircle2, Clock, Car,
  Users, TrendingUp, BarChart3, UserX, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getPretermeConfig,
  getAllPretermeConfigs,
  getPretermeImportsByMois,
  getPretermeClientsByMoisKey,
  getAllPretermeImports,
} from "@/lib/firebase/preterme";
import type {
  PretermeConfig,
  PretermeImport,
  PretermeClient,
  AgenceCode,
} from "@/types/preterme";
import { AGENCES } from "@/types/preterme";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoisLabel(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object" && "toDate" in (v as object)) return (v as { toDate(): Date }).toDate();
  return null;
}

const REQUIRED_AUTO_AGENCES: AgenceCode[] = ["H91358", "H92083"];

// ─── Composants locaux ────────────────────────────────────────────────────────

function StatBlock({ label, value, sub, accent = false }: {
  label: string; value: number | string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 rounded-xl border text-center",
      accent
        ? "border-sky-200 bg-sky-50 dark:border-sky-800/50 dark:bg-sky-950/30"
        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    )}>
      <p className={cn(
        "text-2xl font-bold",
        accent ? "text-sky-700 dark:text-sky-300" : "text-slate-900 dark:text-white"
      )}>
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoriqueDetailPage() {
  const params  = useParams();
  const moisKey = typeof params.moisKey === "string" ? params.moisKey : "";

  const [config,     setConfig]     = useState<PretermeConfig | null>(null);
  const [imports,    setImports]    = useState<PretermeImport[]>([]);
  const [clients,    setClients]    = useState<PretermeClient[]>([]);
  const [allConfigs, setAllConfigs] = useState<PretermeConfig[]>([]);
  const [allImports, setAllImports] = useState<PretermeImport[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!moisKey) return;
    setLoading(true);
    Promise.all([
      getPretermeConfig(moisKey, "AUTO"),
      getPretermeImportsByMois(moisKey, "AUTO"),
      getPretermeClientsByMoisKey(moisKey),
      getAllPretermeConfigs("AUTO"),
      getAllPretermeImports(),
    ])
      .then(([cfg, imps, cls, allCfg, allImp]) => {
        setConfig(cfg);
        setImports(imps);
        setClients(cls);
        setAllConfigs(allCfg);
        setAllImports(allImp);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [moisKey]);

  // ─── Métriques globales ─────────────────────────────────────────────────────

  const totalImportes  = useMemo(() => imports.reduce((a, i) => a + i.pretermesGlobaux, 0), [imports]);
  const totalConserves = useMemo(() => imports.reduce((a, i) => a + i.pretermesConserves, 0), [imports]);
  const ratioGlobal    = totalImportes > 0 ? Math.round((totalConserves / totalImportes) * 100) : 0;

  // ─── Par CDC ────────────────────────────────────────────────────────────────

  const parCharge = useMemo(() => {
    const map: Record<string, number> = {};
    clients
      .filter((c) => c.conserve && c.chargeAttribue)
      .forEach((c) => {
        map[c.chargeAttribue!] = (map[c.chargeAttribue!] ?? 0) + 1;
      });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [clients]);

  // ─── Historique 12 mois pour graphique ──────────────────────────────────────

  const historiqueChart = useMemo(() => {
    // Grouper les imports par moisKey
    const byMois: Record<string, { globaux: number; conserves: number }> = {};
    allImports.forEach((imp) => {
      if (!byMois[imp.moisKey]) byMois[imp.moisKey] = { globaux: 0, conserves: 0 };
      byMois[imp.moisKey].globaux   += imp.pretermesGlobaux;
      byMois[imp.moisKey].conserves += imp.pretermesConserves;
    });

    // Utiliser la liste des configs pour avoir tous les mois même sans imports
    const moisKeys = Array.from(
      new Set([...allConfigs.map((c) => c.moisKey), ...allImports.map((i) => i.moisKey)])
    )
      .sort()
      .slice(-12);

    return moisKeys.map((mk) => ({
      moisKey: mk,
      label: formatMoisLabel(mk).replace(/^(\w)/, (c) => c.toUpperCase()).slice(0, 8),
      globaux:   byMois[mk]?.globaux   ?? 0,
      conserves: byMois[mk]?.conserves ?? 0,
    }));
  }, [allConfigs, allImports]);

  // ─── Absences ───────────────────────────────────────────────────────────────

  const absences = useMemo(() => {
    if (!config) return [];
    return config.agences.flatMap((a) =>
      a.charges
        .filter((c) => c.absence)
        .map((c) => ({ prenom: c.prenom, agence: a.code as AgenceCode, absence: c.absence! }))
    );
  }, [config]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500 dark:text-slate-400">
        Chargement…
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 space-y-4">
        <Link href="/admin/preterme-auto">
          <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
          </Button>
        </Link>
        <p className="text-slate-500 dark:text-slate-400">Aucune configuration trouvée pour {moisKey}.</p>
      </div>
    );
  }

  const isCycleComplet = REQUIRED_AUTO_AGENCES.every((agenceCode) =>
    imports.some((imp) => imp.agence === agenceCode && imp.statut === "TERMINE")
  );

  if (!isCycleComplet) {
    return (
      <div className="p-8 space-y-4">
        <Link href="/admin/preterme-auto">
          <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
          </Button>
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300">
          Historique indisponible : ce cycle n&apos;est pas complet.
          La consultation est autorisée uniquement quand les deux agences Auto sont en statut TERMINE.
        </div>
      </div>
    );
  }

  const createdAt = toDate(config.createdAt);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/preterme-auto">
          <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
          </Button>
        </Link>
        <div className="p-2 bg-sky-950/60 rounded-lg">
          <Car className="h-5 w-5 text-sky-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            {formatMoisLabel(moisKey)}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Prétermes Auto — fiche synthèse</p>
        </div>
        <Badge className={cn(
          config.valide
            ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700"
            : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700"
        )}>
          {config.valide ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
          {config.valide ? "Cycle terminé" : "En cours"}
        </Badge>
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-3 gap-3">
        <StatBlock label="Importés" value={totalImportes} />
        <StatBlock label="Conservés" value={totalConserves} accent />
        <StatBlock label="Taux conservation" value={`${ratioGlobal}%`} />
      </div>

      {/* Seuils appliqués */}
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <BarChart3 className="h-4 w-4 text-sky-400" /> Seuils de conservation appliqués
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
              ETP ≥ <code className="text-sky-600 dark:text-sky-400 font-mono">{config.seuilEtp}</code>
            </span>
            <span className="text-slate-400">OU</span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
              Variation ≥ <code className="text-violet-600 dark:text-violet-400 font-mono">{config.seuilVariation}%</code>
            </span>
          </div>
          {createdAt && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Créé le {createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Par agence */}
      {imports.length > 0 && (
        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Building2 className="h-4 w-4 text-sky-400" /> Volumes par agence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {imports.map((imp) => {
              const ratio = imp.pretermesGlobaux > 0
                ? Math.round((imp.pretermesConserves / imp.pretermesGlobaux) * 100)
                : 0;
              const agenceInfo = AGENCES[imp.agence];
              return (
                <div key={imp.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {agenceInfo.label}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{imp.pretermesConserves} / {imp.pretermesGlobaux}</span>
                      <Badge className={cn(
                        "text-[10px]",
                        imp.statut === "TERMINE"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700"
                          : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      )}>
                        {imp.statut}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500">{ratio}% conservés</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* CDC */}
      {parCharge.length > 0 && (
        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Users className="h-4 w-4 text-sky-400" /> Répartition par CDC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {parCharge.map(([prenom, nb]) => {
              const maxNb = parCharge[0][1];
              const pct = maxNb > 0 ? Math.round((nb / maxNb) * 100) : 0;
              return (
                <div key={prenom} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{prenom}</span>
                    <Badge className="bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700 text-[10px]">
                      {nb} dossier{nb > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Absences ce mois */}
      {absences.length > 0 && (
        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <UserX className="h-4 w-4" /> Absences enregistrées ce mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {absences.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <UserX className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="font-medium">{a.prenom}</span>
                <span className="text-xs text-slate-500 dark:text-slate-500">({AGENCES[a.agence].label})</span>
                {a.absence.dateDebut && (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {a.absence.dateDebut}
                    {a.absence.dateFin && ` → ${a.absence.dateFin}`}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CDC configurés par agence (snapshot) */}
      {config.agences.map((agence) => (
        <Card key={agence.code} className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Building2 className="h-4 w-4 text-sky-400" />
              {AGENCES[agence.code].label} — CDC configurés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agence.charges.map((cdc) => (
              <div key={cdc.id} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                <span className="font-medium text-slate-800 dark:text-slate-200 w-24 shrink-0">{cdc.prenom}</span>
                <Badge variant="outline" className="text-[10px] font-mono text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700">
                  {cdc.lettresDebut} → {cdc.lettresFin}
                </Badge>
                {cdc.trello?.trelloListName && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 truncate">
                    Colonne : {cdc.trello.trelloListName}
                  </span>
                )}
                {cdc.absence && (
                  <Badge variant="outline" className="ml-auto text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                    <UserX className="h-3 w-3 mr-0.5" /> Absent
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Separator className="bg-slate-200 dark:bg-slate-800" />

      {/* Graphique historique 12 mois */}
      {historiqueChart.length > 1 && (
        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <BarChart3 className="h-4 w-4 text-sky-400" /> Historique des cycles (12 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historiqueChart} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#cbd5e1" }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === "conserves" ? "Conservés" : "Importés",
                    ]}
                  />
                  <Bar dataKey="globaux" radius={[2, 2, 0, 0]}>
                    {historiqueChart.map((entry, index) => (
                      <Cell
                        key={`cell-g-${index}`}
                        fill={entry.moisKey === moisKey ? "#0369a1" : "#334155"}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="conserves" radius={[2, 2, 0, 0]}>
                    {historiqueChart.map((entry, index) => (
                      <Cell
                        key={`cell-c-${index}`}
                        fill={entry.moisKey === moisKey ? "#0ea5e9" : "#34d399"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 dark:text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-500 inline-block" /> Importés</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400 inline-block" /> Conservés</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-sky-500 inline-block" /> Mois actuel</span>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
