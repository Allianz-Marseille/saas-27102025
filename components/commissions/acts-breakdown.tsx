"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle2, XCircle, Shield, Heart, Stethoscope, PiggyBank, Car, Building2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Act } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

interface ActsBreakdownProps {
  acts: Act[];
}

type SortColumn = "kind" | "clientNom" | "contratType" | "dateEffet" | "montant" | "commission" | "dateSaisie";
type SortDirection = "asc" | "desc";

// Helper pour convertir Date | Timestamp en millisecondes
const getTime = (date: Date | { toDate?: () => Date } | { seconds?: number }): number => {
  if (!date) return 0;
  if (date instanceof Date) return date.getTime();
  if ('toDate' in date && typeof date.toDate === 'function') return date.toDate().getTime();
  if ('seconds' in date && typeof date.seconds === 'number') return date.seconds * 1000;
  return 0;
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  AUTO_MOTO: "Auto / Moto",
  IRD_PART: "IRD Particulier",
  IRD_PRO: "IRD Professionnel",
  PJ: "Protection Juridique",
  GAV: "Garantie Accidents de la Vie",
  NOP_50_EUR: "NOP (≤ 50€)",
  SANTE_PREV: "Santé / Prévoyance",
  VIE_PP: "Vie PP",
  VIE_PU: "Vie PU",
};

const KIND_LABELS: Record<string, string> = {
  AN: "Apport Nouveau",
  "M+3": "M+3",
  PRETERME_AUTO: "Pré-terme Auto",
  PRETERME_IRD: "Pré-terme IRD",
};

export function ActsBreakdown({ acts }: ActsBreakdownProps) {
  // État pour le tri (par défaut : date de saisie décroissante)
  const [sortColumn, setSortColumn] = useState<SortColumn>("dateSaisie");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Fonction pour gérer le clic sur un en-tête de colonne
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne : tri croissant par défaut (sauf pour date de saisie et commission)
      setSortColumn(column);
      setSortDirection((column === "dateSaisie" || column === "commission") ? "desc" : "asc");
    }
  };

  // Trier les actes selon la colonne et direction actives
  const sortedActs = useMemo(() => {
    return [...acts].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortColumn) {
        case "kind":
          compareValue = a.kind.localeCompare(b.kind);
          break;
        case "clientNom":
          compareValue = a.clientNom.localeCompare(b.clientNom);
          break;
        case "contratType":
          compareValue = a.contratType.localeCompare(b.contratType);
          break;
        case "dateEffet":
          compareValue = getTime(a.dateEffet) - getTime(b.dateEffet);
          break;
        case "montant":
          const montantA = (a.primeAnnuelle || 0) + (a.montantVersement || 0);
          const montantB = (b.primeAnnuelle || 0) + (b.montantVersement || 0);
          compareValue = montantA - montantB;
          break;
        case "commission":
          compareValue = a.commissionPotentielle - b.commissionPotentielle;
          break;
        case "dateSaisie":
          compareValue = getTime(a.dateSaisie) - getTime(b.dateSaisie);
          break;
        default:
          compareValue = 0;
      }
      
      return sortDirection === "asc" ? compareValue : -compareValue;
    });
  }, [acts, sortColumn, sortDirection]);
  
  // Séparer les actes avec commission et les process
  const actsWithCommission = sortedActs.filter(act => act.commissionPotentielle > 0);
  const processActs = sortedActs.filter(act => 
    act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD"
  );

  // Composant pour afficher l'icône de tri
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  // Helper functions for styling
  const getKindBadgeColor = (kind: string) => {
    switch (kind) {
      case "AN":
        return "bg-blue-500 text-white";
      case "M+3":
        return "bg-green-500 text-white";
      case "PRETERME_AUTO":
        return "bg-orange-500 text-white";
      case "PRETERME_IRD":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getContractIcon = (contractType: string) => {
    switch (contractType) {
      case "PJ":
        return <Shield className="h-3.5 w-3.5" />;
      case "GAV":
        return <Heart className="h-3.5 w-3.5" />;
      case "SANTE_PREV":
        return <Stethoscope className="h-3.5 w-3.5" />;
      case "VIE_PP":
      case "VIE_PU":
        return <PiggyBank className="h-3.5 w-3.5" />;
      case "AUTO_MOTO":
        return <Car className="h-3.5 w-3.5" />;
      case "IRD_PART":
      case "IRD_PRO":
        return <Building2 className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const getContractBadgeColor = (contractType: string) => {
    switch (contractType) {
      case "PJ":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
      case "GAV":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
      case "SANTE_PREV":
        return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300";
      case "VIE_PP":
      case "VIE_PU":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
      case "AUTO_MOTO":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-950/50 dark:text-gray-300";
    }
  };

  const getRowBorderColor = (kind: string) => {
    switch (kind) {
      case "AN":
        return "border-l-4 border-l-blue-500";
      case "M+3":
        return "border-l-4 border-l-green-500";
      case "PRETERME_AUTO":
        return "border-l-4 border-l-orange-500";
      case "PRETERME_IRD":
        return "border-l-4 border-l-purple-500";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Détail des actes contributeurs
            </CardTitle>
            <CardDescription className="mt-2">
              Liste complète des actes ayant généré des commissions ce mois-ci
            </CardDescription>
          </div>
          {actsWithCommission.length > 0 && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total commissions</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(actsWithCommission.reduce((sum, act) => sum + act.commissionPotentielle, 0))}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Actes avec commission */}
        {actsWithCommission.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/50">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                Actes rémunérés
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                  {actsWithCommission.length} actes
                </span>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                  <tr className="border-b">
                    <th className="text-center text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("kind")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Type
                        <SortIcon column="kind" />
                      </button>
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("clientNom")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Client
                        <SortIcon column="clientNom" />
                      </button>
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("contratType")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Contrat
                        <SortIcon column="contratType" />
                      </button>
                    </th>
                    <th className="text-center text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("dateSaisie")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Date de saisie
                        <SortIcon column="dateSaisie" />
                      </button>
                    </th>
                    <th className="text-center text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("dateEffet")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Date effet
                        <SortIcon column="dateEffet" />
                      </button>
                    </th>
                    <th className="text-right text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("montant")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Montant
                        <SortIcon column="montant" />
                      </button>
                    </th>
                    <th className="text-center text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("commission")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Commission
                        <SortIcon column="commission" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {actsWithCommission.map((act, index) => (
                    <tr key={act.id} className={cn(
                      "border-b transition-all duration-200 group",
                      getRowBorderColor(act.kind),
                      "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20 hover:shadow-sm"
                    )}>
                      <td className="py-3 px-3 text-center align-middle">
                        <span className={cn(
                          "inline-flex px-2.5 py-1 rounded-full text-xs font-bold",
                          getKindBadgeColor(act.kind)
                        )}>
                          {act.kind}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <p className="text-sm font-semibold">{act.clientNom}</p>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit",
                            getContractBadgeColor(act.contratType)
                          )}>
                            {getContractIcon(act.contratType)}
                            {CONTRACT_TYPE_LABELS[act.contratType] || act.contratType}
                          </span>
                          <p className="text-xs font-mono text-muted-foreground">
                            {act.numeroContrat}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-medium">
                            {format(act.dateSaisie instanceof Date ? act.dateSaisie : (act.dateSaisie as any).toDate(), "dd MMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(act.dateSaisie instanceof Date ? act.dateSaisie : (act.dateSaisie as any).toDate(), "HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center align-middle">
                        <p className="text-sm font-medium">
                          {format(act.dateEffet instanceof Date ? act.dateEffet : (act.dateEffet as any).toDate(), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right align-middle">
                        <p className="text-sm font-semibold">
                          {formatCurrency((act.primeAnnuelle || 0) + (act.montantVersement || 0))}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center align-middle">
                        <span className={cn(
                          "inline-flex px-3 py-1.5 rounded-full text-sm font-bold transition-all",
                          act.commissionPotentielle >= 40
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md group-hover:shadow-lg group-hover:scale-105"
                            : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                        )}>
                          {formatCurrency(act.commissionPotentielle)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Stats footer pour actes rémunérés */}
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground">Total actes</div>
                    <div className="text-2xl font-bold text-foreground">{actsWithCommission.length}</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <div className="text-xs text-muted-foreground">Commission moyenne</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(actsWithCommission.reduce((sum, act) => sum + act.commissionPotentielle, 0) / actsWithCommission.length)}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground text-right">Total commissions</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatCurrency(actsWithCommission.reduce((sum, act) => sum + act.commissionPotentielle, 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Process (sans commission) */}
        {processActs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/50">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                Process (contribuent au ratio)
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold">
                  {processActs.length} process
                </span>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                  <tr className="border-b">
                    <th className="text-center text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("kind")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Type
                        <SortIcon column="kind" />
                      </button>
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("clientNom")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Client
                        <SortIcon column="clientNom" />
                      </button>
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("contratType")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Contrat
                        <SortIcon column="contratType" />
                      </button>
                    </th>
                    <th className="text-center text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("dateSaisie")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Date de saisie
                        <SortIcon column="dateSaisie" />
                      </button>
                    </th>
                    <th className="text-center text-xs font-semibold text-foreground py-3 px-3">
                      <button
                        onClick={() => handleSort("dateEffet")}
                        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Date effet
                        <SortIcon column="dateEffet" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processActs.map((act) => (
                    <tr key={act.id} className={cn(
                      "border-b transition-all duration-200 group",
                      getRowBorderColor(act.kind),
                      "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20 hover:shadow-sm"
                    )}>
                      <td className="py-3 px-3 text-center align-middle">
                        <span className={cn(
                          "inline-flex px-2.5 py-1 rounded-full text-xs font-bold",
                          getKindBadgeColor(act.kind)
                        )}>
                          {act.kind}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <p className="text-sm font-semibold">{act.clientNom}</p>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit",
                            getContractBadgeColor(act.contratType)
                          )}>
                            {getContractIcon(act.contratType)}
                            {CONTRACT_TYPE_LABELS[act.contratType] || act.contratType}
                          </span>
                          <p className="text-xs font-mono text-muted-foreground">
                            {act.numeroContrat}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-medium">
                            {format(act.dateSaisie instanceof Date ? act.dateSaisie : (act.dateSaisie as any).toDate(), "dd MMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(act.dateSaisie instanceof Date ? act.dateSaisie : (act.dateSaisie as any).toDate(), "HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center align-middle">
                        <p className="text-sm font-medium">
                          {format(act.dateEffet instanceof Date ? act.dateEffet : (act.dateEffet as any).toDate(), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Info footer pour process */}
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-full bg-blue-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-muted-foreground">
                  Ces process contribuent à atteindre l'objectif de <strong className="text-foreground">15 process minimum</strong> pour valider vos commissions
                </p>
              </div>
            </div>
          </div>
        )}

        {acts.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Aucun acte enregistré ce mois-ci</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

