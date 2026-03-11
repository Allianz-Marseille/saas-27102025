"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Send, CheckCircle2, AlertTriangle, Eye,
  User, Zap, BarChart3, KeyRound, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { routerClients, calculerStatsRoutage } from "@/lib/services/preterme-router";
import type { PretermeClient, AgenceConfig, AgenceCode } from "@/types/preterme";
import { AGENCES } from "@/types/preterme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DispatchResult {
  routage: { total: number; routes: number; nonRoutes: number };
  trello:  { total: number; success: number; errors: number };
  statut: string;
}

interface DispatchPreviewProps {
  importId: string;
  agence: AgenceCode;
  agenceConfig: AgenceConfig;
  moisKey: string;
  clients: PretermeClient[];
  idToken: string;
  onDispatchSuccess?: (result: DispatchResult) => void;
}

// ─── DispatchPreview ──────────────────────────────────────────────────────────

export function DispatchPreview({
  importId,
  agence,
  agenceConfig,
  moisKey,
  clients,
  idToken,
  onDispatchSuccess,
}: DispatchPreviewProps) {
  const STORAGE_API_KEY = "preterme.trello.apiKey";
  const STORAGE_TOKEN = "preterme.trello.token";
  const [isDispatching, setIsDispatching] = useState(false);
  const [result, setResult] = useState<DispatchResult | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const [credsSaved, setCredsSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_API_KEY) ?? "";
    const storedToken = localStorage.getItem(STORAGE_TOKEN) ?? "";
    setApiKey(storedKey);
    setToken(storedToken);
    setCredsSaved(!!(storedKey && storedToken));
  }, []);

  const handleSaveCreds = () => {
    if (!apiKey.trim() || !token.trim()) {
      toast.error("API Key et Token Trello requis");
      return;
    }
    localStorage.setItem(STORAGE_API_KEY, apiKey.trim());
    localStorage.setItem(STORAGE_TOKEN, token.trim());
    setCredsSaved(true);
    toast.success("Credentials Trello sauvegardés");
  };

  // Aperçu routage local (sans appel API)
  const statsRoutage = useMemo(
    () => calculerStatsRoutage(clients, agenceConfig),
    [clients, agenceConfig]
  );

  const previewRoutes = useMemo(
    () => routerClients(clients, agenceConfig),
    [clients, agenceConfig]
  );

  const trelloMappingOk = agenceConfig.charges.every(
    (c) => c.trello?.trelloBoardId && c.trello?.trelloListId
  );

  const canDispatch = trelloMappingOk && !isDispatching && credsSaved;

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch("/api/admin/preterme-auto/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          importId,
          trelloApiKey: typeof window !== "undefined"
            ? (window.localStorage.getItem(STORAGE_API_KEY) ?? undefined)
            : undefined,
          trelloToken: typeof window !== "undefined"
            ? (window.localStorage.getItem(STORAGE_TOKEN) ?? undefined)
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors du dispatch Trello");
        return;
      }

      setResult(data);
      onDispatchSuccess?.(data);

      if (data.trello.errors === 0) {
        toast.success(
          `✅ ${data.trello.success} cartes Trello créées avec succès !`
        );
      } else {
        toast.warning(
          `${data.trello.success} cartes créées, ${data.trello.errors} erreur(s).`
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Aperçu répartition */}
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-sky-400" />
            Aperçu de la répartition
            <Badge className="ml-auto bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[10px]">
              {AGENCES[agence].label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats globales */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{statsRoutage.total}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Clients conservés</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{statsRoutage.routes}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Routés</p>
            </div>
            <div className={cn(
              "border rounded-xl p-3 text-center",
              statsRoutage.nonRoutes > 0
                ? "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/50"
                : "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700"
            )}>
              <p className={cn("text-xl font-bold", statsRoutage.nonRoutes > 0 ? "text-amber-700 dark:text-amber-300" : "text-slate-600 dark:text-slate-400")}>
                {statsRoutage.nonRoutes}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Non routés</p>
            </div>
          </div>

          {/* Répartition par CDC */}
          {Object.keys(statsRoutage.parCharge).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Répartition par CDC</p>
              {Object.entries(statsRoutage.parCharge)
                .sort(([, a], [, b]) => b - a)
                .map(([prenom, nb]) => {
                  const pct = statsRoutage.routes > 0
                    ? Math.round((nb / statsRoutage.routes) * 100)
                    : 0;
                  return (
                    <div key={prenom} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <User className="h-3 w-3 text-slate-500" />
                          {prenom}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-slate-200">{nb}</strong> clients ({pct}%)
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
            </div>
          )}

          {/* Avertissement non routés */}
          {statsRoutage.nonRoutes > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {statsRoutage.nonRoutes} client(s) non routable(s) — sociétés sans nom de gérant
                ou CDC sans mapping Trello. Ces clients ne recevront pas de carte.
              </span>
            </div>
          )}

          {/* Alerte Trello mapping incomplet */}
          {!trelloMappingOk && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700/40 rounded-lg text-xs text-red-700 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Mapping Trello incomplet pour certains CDC.
                Retournez en Configuration pour renseigner les Board ID et List ID manquants.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials Trello */}
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <KeyRound className="h-4 w-4 text-sky-400" />
            Credentials Trello
            {credsSaved && (
              <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60 text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Sauvegardés
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setCredsSaved(false); }}
                placeholder="Trello API Key"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Token</Label>
              <Input
                type="password"
                value={token}
                onChange={(e) => { setToken(e.target.value); setCredsSaved(false); }}
                placeholder="Trello Token"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveCreds}
            className="w-full text-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Sauvegarder les credentials
          </Button>
          <p className="text-[10px] text-slate-500 dark:text-slate-500">
            Stockés localement dans votre navigateur, jamais envoyés ailleurs que vers l&apos;API Trello.
          </p>
        </CardContent>
      </Card>

      {/* Résultat dispatch */}
      {result && (
        <Card className={cn(
          "border",
          result.trello.errors === 0
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"
        )}>
          <CardContent className="pt-4 space-y-3">
            <p className={cn("text-sm font-medium flex items-center gap-2",
              result.trello.errors === 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>
              {result.trello.errors === 0
                ? <><CheckCircle2 className="h-4 w-4" /> Dispatch Trello terminé</>
                : <><AlertTriangle className="h-4 w-4" /> Dispatch partiel</>
              }
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{result.trello.total}</p>
                <p className="text-slate-600 dark:text-slate-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{result.trello.success}</p>
                <p className="text-slate-600 dark:text-slate-400">Créées</p>
              </div>
              <div className="text-center">
                <p className={cn("text-lg font-bold", result.trello.errors > 0 ? "text-red-700 dark:text-red-400" : "text-slate-500")}>
                  {result.trello.errors}
                </p>
                <p className="text-slate-600 dark:text-slate-400">Erreurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="bg-slate-200 dark:bg-slate-800" />

      {/* Bouton dispatch */}
      {!credsSaved && (
        <p className="text-xs text-center text-amber-600 dark:text-amber-400">
          Renseignez et sauvegardez vos credentials Trello avant de dispatcher.
        </p>
      )}

      <Button
        onClick={handleDispatch}
        disabled={!canDispatch}
        className="w-full bg-sky-600 hover:bg-sky-500 py-5 font-medium disabled:opacity-50"
        size="lg"
      >
        {isDispatching ? (
          <>
            <Zap className="h-4 w-4 mr-2 animate-pulse" />
            Création des cartes Trello en cours…
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Envoyer {statsRoutage.routes} cartes vers Trello
          </>
        )}
      </Button>
    </div>
  );
}
