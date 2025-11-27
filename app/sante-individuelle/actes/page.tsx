"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from "lucide-react";
import { deleteHealthAct, getHealthActKindLabel } from "@/lib/firebase/health-acts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { HealthAct } from "@/types";
import { getHealthActsByMonth } from "@/lib/firebase/health-acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Timestamp } from "firebase/firestore";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { NewHealthActDialog } from "@/components/health-acts/new-health-act-dialog";

export default function HealthActsPage() {
  const { user } = useAuth();
  const [acts, setActs] = useState<HealthAct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; actId: string | null; clientName: string }>({
    open: false,
    actId: null,
    clientName: "",
  });
  const [sortConfig, setSortConfig] = useState<SortState>({
    key: "dateSaisie",
    direction: "desc",
  });
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const loadActs = async () => {
    if (!user) {
      setActs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const actsData = await getHealthActsByMonth(user.uid, selectedMonth);
      
      // Convertir les Timestamp en Date
      const convertedActs: HealthAct[] = actsData.map((act) => {
        const dateEffet = act.dateEffet instanceof Timestamp 
          ? act.dateEffet.toDate() 
          : act.dateEffet;
          
        const dateSaisie = act.dateSaisie instanceof Timestamp 
          ? act.dateSaisie.toDate() 
          : act.dateSaisie;
        
        return {
          ...act,
          dateEffet,
          dateSaisie,
        };
      });
      
      setActs(convertedActs);
    } catch {
      toast.error("Erreur lors du chargement des actes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, user]);

  const handleDeleteActClick = (actId: string, clientName: string) => {
    setDeleteDialog({ open: true, actId, clientName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.actId) return;

    try {
      await deleteHealthAct(deleteDialog.actId);
      toast.success("Acte supprimé avec succès");
      setDeleteDialog({ open: false, actId: null, clientName: "" });
      loadActs();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l'acte");
    }
  };

  const sortedActs = useMemo(() => {
    if (acts.length === 0) {
      return acts;
    }

    // Filtrage
    let filteredActs = [...acts];
    if (activeFilter) {
      filteredActs = filteredActs.filter(act => act.kind === activeFilter);
    }

    // Tri
    filteredActs.sort((actA, actB) => {
      const valueA = getSortableValue(actA, sortConfig.key);
      const valueB = getSortableValue(actB, sortConfig.key);

      if (valueA === null && valueB === null) {
        return 0;
      }
      if (valueA === null) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (valueB === null) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        const comparison = valueA.localeCompare(valueB, "fr", { sensitivity: "base" });
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      return 0;
    });

    return filteredActs;
  }, [acts, sortConfig, activeFilter]);

  const handleSortChange = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        direction: "desc",
      };
    });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
    }

    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />;
    }

    return <ArrowDown className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />;
  };

  const getKindBadgeColor = (kind: string) => {
    switch (kind) {
      case "AFFAIRE_NOUVELLE":
        return "bg-blue-500 text-white";
      case "REVISION":
        return "bg-purple-500 text-white";
      case "ADHESION_SALARIE":
        return "bg-orange-500 text-white";
      case "COURT_TO_AZ":
        return "bg-cyan-500 text-white";
      case "AZ_TO_COURTAGE":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const totalCaPondere = sortedActs.reduce((sum, act) => sum + act.caPondere, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                Mes actes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez vos actes santé individuelle et suivez votre production
              </p>
            </div>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 gap-2 px-6"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Nouvel acte</span>
            </Button>
          </div>
          
          {/* Barre de navigation avec stats */}
          <div className="flex items-center justify-between pt-3 border-t border-green-200/30 dark:border-green-800/30">
            <MonthSelector 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
            
            {/* Stats rapides */}
            {!isLoading && acts.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/50 dark:border-green-800/50">
                  <span className="text-sm">
                    <span className="font-bold text-foreground">{acts.length}</span>
                    <span className="text-muted-foreground ml-1">actes</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200/50 dark:border-blue-800/50">
                  <span className="text-sm">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(totalCaPondere)}
                    </span>
                    <span className="text-muted-foreground ml-1">CA pondéré</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Dialog Nouvel Acte */}
        <NewHealthActDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSuccess={loadActs}
        />

        {/* Tableau des actes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des actes</CardTitle>
                <CardDescription>
                  Tous vos actes santé individuelle du mois sélectionné
                </CardDescription>
              </div>
              {sortedActs.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{sortedActs.length}</div>
                  <div className="text-xs text-muted-foreground">actes</div>
                </div>
              )}
            </div>

            {/* Filtres */}
            {acts.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtres :</span>
                  
                  <button
                    onClick={() => setActiveFilter(null)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      !activeFilter
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
                        : "bg-muted hover:bg-muted/70"
                    )}
                  >
                    Tous
                  </button>
                  
                  {["AFFAIRE_NOUVELLE", "REVISION", "ADHESION_SALARIE", "COURT_TO_AZ", "AZ_TO_COURTAGE"].map((kind) => (
                    <button
                      key={kind}
                      onClick={() => setActiveFilter(kind)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        activeFilter === kind
                          ? getKindBadgeColor(kind) + " shadow-md ring-2 ring-white dark:ring-slate-800"
                          : "bg-muted hover:bg-muted/70"
                      )}
                    >
                      {getHealthActKindLabel(kind)}
                    </button>
                  ))}

                  {/* Bouton reset */}
                  {activeFilter && (
                    <button
                      onClick={() => setActiveFilter(null)}
                      className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-950/70 transition-all flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Chargement...</p>
            ) : acts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucun acte pour ce mois</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <SortableHeader 
                        label="Date de saisie" 
                        sortKey="dateSaisie"
                        sortConfig={sortConfig}
                        onSort={handleSortChange}
                        renderIcon={renderSortIcon}
                      />
                      <SortableHeader 
                        label="Type" 
                        sortKey="kind"
                        sortConfig={sortConfig}
                        onSort={handleSortChange}
                        renderIcon={renderSortIcon}
                      />
                      <SortableHeader 
                        label="Client" 
                        sortKey="clientNom"
                        sortConfig={sortConfig}
                        onSort={handleSortChange}
                        renderIcon={renderSortIcon}
                      />
                      <SortableHeader 
                        label="N° Contrat" 
                        sortKey="numeroContrat"
                        sortConfig={sortConfig}
                        onSort={handleSortChange}
                        renderIcon={renderSortIcon}
                      />
                      <SortableHeader 
                        label="Date d'effet" 
                        sortKey="dateEffet"
                        sortConfig={sortConfig}
                        onSort={handleSortChange}
                        renderIcon={renderSortIcon}
                      />
                      <SortableHeader 
                        label="CA Annuel" 
                        sortKey="caAnnuel"
                        sortConfig={sortConfig}
                        onSort={handleSortChange}
                        renderIcon={renderSortIcon}
                      />
                      <SortableHeader 
                        label="Taux (%)" 
                        sortKey="coefficient"
                        sortConfig={sortConfig}
                        onSort={handleSortChange}
                        renderIcon={renderSortIcon}
                      />
                      <SortableHeader 
                        label="CA Pondéré" 
                        sortKey="caPondere"
                        sortConfig={sortConfig}
                        onSort={handleSortChange}
                        renderIcon={renderSortIcon}
                      />
                      <th className="text-center p-3 font-semibold text-sm border-b w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActs.map((act) => (
                      <tr
                        key={act.id}
                        className="border-b transition-all duration-200 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-950/20 dark:hover:to-emerald-950/20 hover:shadow-sm"
                      >
                        <td className="p-3 text-sm text-center font-medium">
                          {format(act.dateSaisie as Date, "dd/MM/yyyy")}
                        </td>
                        <td className="p-3 text-center">
                          <span className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-xs font-bold",
                            getKindBadgeColor(act.kind)
                          )}>
                            {getHealthActKindLabel(act.kind)}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-semibold text-center">{act.clientNom}</td>
                        <td className="p-3 text-xs text-center text-muted-foreground font-mono">{act.numeroContrat}</td>
                        <td className="p-3 text-sm text-center">{format(act.dateEffet as Date, "dd/MM/yyyy")}</td>
                        <td className="p-3 text-sm text-center font-medium">{formatCurrency(act.caAnnuel)}</td>
                        <td className="p-3 text-sm text-center font-bold text-blue-600 dark:text-blue-400">
                          {(act.coefficient * 100).toFixed(0)}%
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                            {formatCurrency(act.caPondere)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteActClick(act.id, act.clientNom)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer avec statistiques */}
            {sortedActs.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/30">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground">Total actes</div>
                      <div className="text-2xl font-bold text-foreground">{sortedActs.length}</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-muted-foreground">CA Pondéré total</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatCurrency(totalCaPondere)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modale de confirmation de suppression */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;acte pour {deleteDialog.clientName} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>
                Annuler
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Supprimer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Composant helper pour les en-têtes triables
function SortableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
  renderIcon,
}: {
  label: string;
  sortKey: SortKey;
  sortConfig: SortState;
  onSort: (key: SortKey) => void;
  renderIcon: (key: SortKey) => React.ReactNode;
}) {
  return (
    <th className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors">
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-green-600 dark:hover:text-green-400 transition-colors"
      >
        {label}
        {renderIcon(sortKey)}
      </button>
    </th>
  );
}

function getSortableValue(act: HealthAct, key: SortKey): number | string | null {
  switch (key) {
    case "dateSaisie": {
      const date = act.dateSaisie as Date;
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "dateEffet": {
      const date = act.dateEffet as Date;
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "caAnnuel":
      return typeof act.caAnnuel === "number" ? act.caAnnuel : null;
    case "coefficient":
      return typeof act.coefficient === "number" ? act.coefficient : null;
    case "caPondere":
      return typeof act.caPondere === "number" ? act.caPondere : null;
    case "numeroContrat":
      return act.numeroContrat ? act.numeroContrat.toLowerCase() : null;
    case "clientNom":
      return act.clientNom ? act.clientNom.toLowerCase() : null;
    case "kind":
      return act.kind ? act.kind.toLowerCase() : null;
    default:
      return null;
  }
}

type SortKey =
  | "dateSaisie"
  | "dateEffet"
  | "clientNom"
  | "numeroContrat"
  | "caAnnuel"
  | "coefficient"
  | "caPondere"
  | "kind";

type SortDirection = "asc" | "desc";

type SortState = {
  key: SortKey;
  direction: SortDirection;
};

