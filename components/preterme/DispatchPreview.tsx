"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Send, CheckCircle2, AlertTriangle, Eye, Lock,
  User, Zap, BarChart3, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  const [trelloApiKey, setTrelloApiKey] = useState("");
  const [trelloToken, setTrelloToken] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [result, setResult] = useState<DispatchResult | null>(null);

  // Restaure les credentials saisis précédemment sur ce navigateur.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedApiKey = window.localStorage.getItem(STORAGE_API_KEY);
    const savedToken = window.localStorage.getItem(STORAGE_TOKEN);
    if (savedApiKey) setTrelloApiKey(savedApiKey);
    if (savedToken) setTrelloToken(savedToken);
  }, []);

  // Sauvegarde les credentials pour éviter la ressaisie entre imports/agences.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (trelloApiKey.trim()) {
      window.localStorage.setItem(STORAGE_API_KEY, trelloApiKey.trim());
    }
  }, [trelloApiKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (trelloToken.trim()) {
      window.localStorage.setItem(STORAGE_TOKEN, trelloToken.trim());
    }
  }, [trelloToken]);

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

  const canDispatch =
    trelloApiKey.trim() && trelloToken.trim() && trelloMappingOk && !isDispatching;

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch("/api/admin/preterme-auto/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ importId, trelloApiKey, trelloToken }),
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
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-sky-400" />
            Aperçu de la répartition
            <Badge className="ml-auto bg-slate-800 text-slate-400 border-slate-700 text-[10px]">
              {AGENCES[agence].label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats globales */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{statsRoutage.total}</p>
              <p className="text-xs text-slate-400 mt-0.5">Clients conservés</p>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-300">{statsRoutage.routes}</p>
              <p className="text-xs text-slate-400 mt-0.5">Routés</p>
            </div>
            <div className={cn(
              "border rounded-xl p-3 text-center",
              statsRoutage.nonRoutes > 0
                ? "bg-amber-950/40 border-amber-800/50"
                : "bg-slate-800/60 border-slate-700"
            )}>
              <p className={cn("text-xl font-bold", statsRoutage.nonRoutes > 0 ? "text-amber-300" : "text-slate-400")}>
                {statsRoutage.nonRoutes}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Non routés</p>
            </div>
          </div>

          {/* Répartition par CDC */}
          {Object.keys(statsRoutage.parCharge).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">Répartition par CDC</p>
              {Object.entries(statsRoutage.parCharge)
                .sort(([, a], [, b]) => b - a)
                .map(([prenom, nb]) => {
                  const pct = statsRoutage.routes > 0
                    ? Math.round((nb / statsRoutage.routes) * 100)
                    : 0;
                  return (
                    <div key={prenom} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <User className="h-3 w-3 text-slate-500" />
                          {prenom}
                        </span>
                        <span className="text-slate-400">
                          <strong className="text-slate-200">{nb}</strong> clients ({pct}%)
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
            <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-700/40 rounded-lg text-xs text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {statsRoutage.nonRoutes} client(s) non routable(s) — sociétés sans nom de gérant
                ou CDC sans mapping Trello. Ces clients ne recevront pas de carte.
              </span>
            </div>
          )}

          {/* Alerte Trello mapping incomplet */}
          {!trelloMappingOk && (
            <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-700/40 rounded-lg text-xs text-red-400">
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
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-sky-400" />
            Credentials Trello
            <button
              onClick={() => setShowKeys((v) => !v)}
              className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showKeys ? "Masquer" : "Afficher"}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">API Key Trello *</Label>
            <Input
              type={showKeys ? "text" : "password"}
              value={trelloApiKey}
              onChange={(e) => setTrelloApiKey(e.target.value)}
              placeholder="Votre clé API Trello"
              className="bg-slate-800 border-slate-600 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Token Trello *</Label>
            <Input
              type={showKeys ? "text" : "password"}
              value={trelloToken}
              onChange={(e) => setTrelloToken(e.target.value)}
              placeholder="Votre token d'accès Trello"
              className="bg-slate-800 border-slate-600 text-sm"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Obtenez vos credentials sur{" "}
            <span className="text-sky-500">trello.com/app-key</span>.
            Les clés ne sont jamais stockées côté serveur.
          </p>
          <p className="text-[10px] text-slate-500">
            Cette saisie est mémorisée localement sur ce navigateur.
          </p>
        </CardContent>
      </Card>

      {/* Résultat dispatch */}
      {result && (
        <Card className={cn(
          "border",
          result.trello.errors === 0
            ? "bg-emerald-950/20 border-emerald-800/40"
            : "bg-amber-950/20 border-amber-800/40"
        )}>
          <CardContent className="pt-4 space-y-3">
            <p className={cn("text-sm font-medium flex items-center gap-2",
              result.trello.errors === 0 ? "text-emerald-300" : "text-amber-300")}>
              {result.trello.errors === 0
                ? <><CheckCircle2 className="h-4 w-4" /> Dispatch Trello terminé</>
                : <><AlertTriangle className="h-4 w-4" /> Dispatch partiel</>
              }
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{result.trello.total}</p>
                <p className="text-slate-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{result.trello.success}</p>
                <p className="text-slate-400">Créées</p>
              </div>
              <div className="text-center">
                <p className={cn("text-lg font-bold", result.trello.errors > 0 ? "text-red-400" : "text-slate-500")}>
                  {result.trello.errors}
                </p>
                <p className="text-slate-400">Erreurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="bg-slate-800" />

      {/* Bouton dispatch */}
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
