"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2, Send, AlertTriangle, MessageSquare,
  Users, BarChart3, Lock, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PretermeImport, AgenceCode } from "@/types/preterme";
import { AGENCES } from "@/types/preterme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SynthesisReportProps {
  importData: PretermeImport;
  agence: AgenceCode;
  parCharge: Record<string, number>;
  nbSocietesEnAttente: number;
  slackChannelConfigured: boolean;
  idToken: string;
}

// ─── SynthesisReport ──────────────────────────────────────────────────────────

export function SynthesisReport({
  importData,
  agence,
  parCharge,
  nbSocietesEnAttente,
  slackChannelConfigured,
  idToken,
}: SynthesisReportProps) {
  const [slackToken, setSlackToken] = useState("");
  const [showToken, setShowToken]   = useState(false);
  const [isSending, setIsSending]   = useState(false);
  const [sent, setSent]             = useState(false);

  const ratioConservation = importData.pretermesGlobaux > 0
    ? Math.round((importData.pretermesConserves / importData.pretermesGlobaux) * 100)
    : 0;

  const isTermine = importData.statut === "TERMINE";

  const handleSendSlack = async () => {
    if (!slackToken.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/admin/preterme-auto/slack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          importId: importData.id,
          slackBotToken: slackToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur envoi Slack");
        return;
      }
      setSent(true);
      toast.success("Message Slack envoyé avec succès !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Statut global */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl border text-sm",
        isTermine
          ? "bg-emerald-950/30 border-emerald-700/50 text-emerald-300"
          : "bg-amber-950/30 border-amber-700/50 text-amber-300"
      )}>
        {isTermine
          ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          : <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        }
        <div>
          <p className="font-medium">
            {isTermine ? "Traitement terminé avec succès" : "Traitement partiellement terminé"}
          </p>
          <p className="text-xs opacity-80 mt-0.5">
            {AGENCES[agence].label} — {importData.moisKey}
          </p>
        </div>
        <Badge className={cn(
          "ml-auto shrink-0 text-[10px]",
          isTermine
            ? "bg-emerald-900/60 text-emerald-400 border-emerald-700"
            : "bg-amber-900/60 text-amber-400 border-amber-700"
        )}>
          {importData.statut}
        </Badge>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white">{importData.pretermesGlobaux}</p>
          <p className="text-xs text-slate-400 mt-0.5">Importés</p>
        </div>
        <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-sky-300">{importData.pretermesConserves}</p>
          <p className="text-xs text-slate-400 mt-0.5">Conservés</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{ratioConservation}%</p>
          <p className="text-xs text-slate-400 mt-0.5">Taux conservation</p>
        </div>
      </div>

      {/* Répartition CDC */}
      {Object.keys(parCharge).length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Répartition par CDC
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {Object.entries(parCharge)
              .sort(([, a], [, b]) => b - a)
              .map(([prenom, nb]) => (
                <div key={prenom} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{prenom}</span>
                  <Badge className="bg-sky-900/50 text-sky-300 border-sky-700 text-[10px]">
                    {nb} dossiers
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Sociétés en attente */}
      {nbSocietesEnAttente > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-700/40 rounded-lg text-xs text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>{nbSocietesEnAttente}</strong> société(s) sans nom de gérant — pas de carte Trello créée.
            Complétez la validation des sociétés pour les traiter.
          </span>
        </div>
      )}

      {/* Seuils appliqués */}
      <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-lg text-xs text-slate-400">
        <span className="font-medium text-slate-300">Seuils appliqués :</span>{" "}
        ETP ≥ <code className="text-sky-400">{importData.seuilEtpApplique}</code> OU
        Variation ≥ <code className="text-sky-400">{importData.seuilVariationApplique}%</code>
      </div>

      <Separator className="bg-slate-800" />

      {/* Envoi Slack */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-sky-400" />
            Envoyer la synthèse sur Slack
            {!slackChannelConfigured && (
              <Badge className="ml-2 text-[10px] bg-amber-900/60 text-amber-400 border-amber-700">
                Canal non configuré
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!slackChannelConfigured ? (
            <p className="text-xs text-slate-500">
              Configurez un canal Slack dans la configuration mensuelle (étape Configuration)
              puis relancez.
            </p>
          ) : sent ? (
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Message Slack envoyé avec succès.
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> Bot Token Slack *
                  </Label>
                  <button
                    onClick={() => setShowToken((v) => !v)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    {showToken ? "Masquer" : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                <Input
                  type={showToken ? "text" : "password"}
                  value={slackToken}
                  onChange={(e) => setSlackToken(e.target.value)}
                  placeholder="xoxb-..."
                  className="bg-slate-800 border-slate-600 text-sm"
                />
                <p className="text-[10px] text-slate-500">
                  Token Bot Slack (xoxb-...). Non stocké côté serveur.
                </p>
              </div>

              <Button
                onClick={handleSendSlack}
                disabled={!slackToken.trim() || isSending}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Send className="h-4 w-4 mr-2 animate-pulse" /> Envoi en cours…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Envoyer sur Slack
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
