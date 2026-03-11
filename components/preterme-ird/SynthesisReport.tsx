"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2, Send, AlertTriangle, MessageSquare, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  idToken: string;
}

// ─── SynthesisReport ──────────────────────────────────────────────────────────

export function SynthesisReport({
  importData,
  agence,
  parCharge,
  nbSocietesEnAttente,
  idToken,
}: SynthesisReportProps) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent]           = useState(false);

  const ratioConservation = importData.pretermesGlobaux > 0
    ? Math.round((importData.pretermesConserves / importData.pretermesGlobaux) * 100)
    : 0;

  const isTermine = importData.statut === "TERMINE";

  // ETP IRD en décimal pour l'affichage
  const seuilEtpDecimal = (importData.seuilEtpApplique / 100).toFixed(2);

  const handleSendSlack = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/admin/preterme-ird/slack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ importId: importData.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur envoi Slack");
        return;
      }
      setSent(true);
      toast.success("Message Slack IARD envoyé avec succès !");
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
          ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700/50 dark:text-emerald-300"
          : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-700/50 dark:text-amber-300"
      )}>
        {isTermine
          ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          : <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        }
        <div>
          <p className="font-medium">
            {isTermine ? "Traitement IARD terminé avec succès" : "Traitement IARD partiellement terminé"}
          </p>
          <p className="text-xs opacity-80 mt-0.5">
            {AGENCES[agence].label} — {importData.moisKey}
          </p>
        </div>
        <Badge className={cn(
          "ml-auto shrink-0 text-[10px]",
          isTermine
            ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700"
            : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/60 dark:text-amber-400 dark:border-amber-700"
        )}>
          {importData.statut}
        </Badge>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{importData.pretermesGlobaux}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Importés</p>
        </div>
        <div className="bg-sky-50 border border-sky-200 dark:bg-sky-950/40 dark:border-sky-800/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{importData.pretermesConserves}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Conservés</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{ratioConservation}%</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Taux conservation</p>
        </div>
      </div>

      {/* Répartition CDC */}
      {Object.keys(parCharge).length > 0 && (
        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Répartition par CDC
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {Object.entries(parCharge)
              .sort(([, a], [, b]) => b - a)
              .map(([prenom, nb]) => (
                <div key={prenom} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{prenom}</span>
                  <Badge className="bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700 text-[10px]">
                    {nb} dossiers
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Sociétés en attente */}
      {nbSocietesEnAttente > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>{nbSocietesEnAttente}</strong> société(s) sans nom de gérant — pas de carte Trello créée.
            Complétez la validation des sociétés pour les traiter.
          </span>
        </div>
      )}

      {/* Seuils appliqués */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400">
        <span className="font-medium text-slate-800 dark:text-slate-300">Seuils IARD appliqués :</span>{" "}
        ETP ≥ <code className="text-sky-400">{seuilEtpDecimal}</code> OU
        Variation ≥ <code className="text-sky-400">{importData.seuilVariationApplique}%</code>
      </div>

      <Separator className="bg-slate-200 dark:bg-slate-800" />

      {/* Envoi Slack */}
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-sky-400" />
            Envoyer la synthèse IARD sur Slack
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Message Slack IARD envoyé avec succès.
            </div>
          ) : (
            <Button
              onClick={handleSendSlack}
              disabled={isSending}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
            >
              {isSending ? (
                <><Send className="h-4 w-4 mr-2 animate-pulse" /> Envoi en cours…</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Envoyer sur Slack (#CE58HNVF0)</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
