"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Sparkles, Zap, Trophy } from "lucide-react";
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
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30";
      case "REVISION":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30";
      case "ADHESION_SALARIE":
        return "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30";
      case "COURT_TO_AZ":
        return "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30";
      case "AZ_TO_COURTAGE":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const totalCaPondere = sortedActs.reduce((sum, act) => sum + act.caPondere, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 cyber-grid relative">
      {/* Effet de lumière de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Gaming */}
      <header className="border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-50 shadow-md supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80 energy-border">
        <div className="container mx-auto px-6 py-4 relative">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent neon-text flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-green-500" />
                Mes actes
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-semibold">
                Gérez vos actes santé individuelle et suivez votre production
              </p>
            </div>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 gap-2 px-6 font-bold hover:scale-105 neon-border"
            >
              <Plus className="h-5 w-5" />
              <span>Nouvel acte</span>
            </Button>
          </div>
          
          {/* Barre de navigation avec stats gaming */}
          <div className="flex items-center justify-between pt-3 border-t border-green-200/30 dark:border-green-800/30">
            <MonthSelector 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
            
            {/* Stats rapides - Style gaming */}
            {!isLoading && acts.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 dark:border-green-400/50 glass-morphism">
                  <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm">
                    <span className="font-black text-foreground text-lg">{acts.length}</span>
                    <span className="text-muted-foreground ml-1 font-semibold">actes</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 dark:border-blue-400/50 glass-morphism">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm">
                    <span className="font-black text-blue-600 dark:text-blue-400 text-lg">
                      {formatCurrency(totalCaPondere)}
                    </span>
                    <span className="text-muted-foreground ml-1 font-semibold">CA pondéré</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* Dialog Nouvel Acte */}
        <NewHealthActDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSuccess={loadActs}
        />

        {/* Tableau des actes - Style gaming */}
        <Card className="border-0 shadow-2xl glass-morphism overflow-hidden relative cyber-card">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-black">
                  <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full neon-border" />
                  Liste des actes
                </CardTitle>
                <CardDescription className="font-semibold">
                  Tous vos actes santé individuelle du mois sélectionné
                </CardDescription>
              </div>
              {sortedActs.length > 0 && (
                <div className="text-right p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 glass-morphism">
                  <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{sortedActs.length}</div>
                  <div className="text-xs text-muted-foreground font-bold">actes</div>
                </div>
              )}
            </div>

            {/* Filtres gaming */}
            {acts.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-100/50 to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-300/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-muted-foreground">Filtres :</span>
                  
                  <button
                    onClick={() => setActiveFilter(null)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105",
                      !activeFilter
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl shadow-green-500/30 neon-border"
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
                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105",
                        activeFilter === kind
                          ? getKindBadgeColor(kind) + " ring-2 ring-white dark:ring-slate-800"
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
                      className="ml-auto px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all flex items-center gap-1 shadow-lg hover:scale-105"
                    >
                      <X className="h-3 w-3" />
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="h-16 w-16 border-4 border-green-200 dark:border-green-800 rounded-full animate-spin border-t-green-600" />
                  <div className="absolute inset-0 h-16 w-16 border-4 border-transparent rounded-full animate-spin border-t-emerald-400" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                </div>
                <p className="text-center mt-4 text-sm text-muted-foreground font-bold">Chargement...</p>
              </div>
            ) : acts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl mb-4 shadow-lg">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-bold text-lg">
                  Aucun acte pour ce mois
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Créez votre premier acte pour commencer !
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border-2 border-slate-300/50 dark:border-slate-700/50">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
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
                      <th className="text-center p-3 font-black text-sm border-b-2 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActs.map((act, index) => (
                      <tr
                        key={act.id}
                        className="border-b transition-all duration-300 hover:bg-gradient-to-r hover:from-green-50/70 hover:to-emerald-50/70 dark:hover:from-green-950/30 dark:hover:to-emerald-950/30 hover:shadow-lg card-3d"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="p-3 text-sm text-center font-bold">
                          {format(act.dateSaisie as Date, "dd/MM/yyyy")}
                        </td>
                        <td className="p-3 text-center">
                          <span className={cn(
                            "inline-flex px-3 py-1.5 rounded-full text-xs font-black",
                            getKindBadgeColor(act.kind)
                          )}>
                            {getHealthActKindLabel(act.kind)}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-black text-center">{act.clientNom}</td>
                        <td className="p-3 text-xs text-center text-muted-foreground font-mono font-bold">{act.numeroContrat}</td>
                        <td className="p-3 text-sm text-center font-bold">{format(act.dateEffet as Date, "dd/MM/yyyy")}</td>
                        <td className="p-3 text-sm text-center font-bold">{formatCurrency(act.caAnnuel)}</td>
                        <td className="p-3 text-sm text-center font-black text-blue-600 dark:text-blue-400">
                          {(act.coefficient * 100).toFixed(0)}%
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex px-4 py-2 rounded-full text-sm font-black bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl shadow-green-500/30">
                            {formatCurrency(act.caPondere)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              className="p-2 rounded-lg hover:bg-blue-500/20 transition-all duration-300 hover:scale-110 border-2 border-transparent hover:border-blue-500/50"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteActClick(act.id, act.clientNom)}
                              className="p-2 rounded-lg hover:bg-red-500/20 transition-all duration-300 hover:scale-110 border-2 border-transparent hover:border-red-500/50"
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

            {/* Footer avec statistiques gaming */}
            {sortedActs.length > 0 && (
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-500/50 glass-morphism relative overflow-hidden">
                <div className="absolute inset-0 holographic opacity-10" />
                <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground font-bold mb-1">Total actes</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{sortedActs.length}</div>
                    </div>
                    <div className="h-12 w-px bg-gradient-to-b from-transparent via-green-500 to-transparent" />
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground font-bold mb-1">CA Pondéré total</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent neon-text">
                        {formatCurrency(totalCaPondere)}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-xl">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modale de confirmation de suppression - Style gaming */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent className="border-2 border-red-500/50 glass-morphism">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-black text-lg">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              Êtes-vous sûr de vouloir supprimer l&apos;acte pour <span className="font-black text-foreground">{deleteDialog.clientName}</span> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDeleteDialog({ ...deleteDialog, open: false })} className="font-bold">
                Annuler
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                className="font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Supprimer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Composant helper pour les en-têtes triables - Style gaming
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
    <th className="text-center p-3 font-black text-sm border-b-2 cursor-pointer hover:bg-green-500/10 transition-all duration-300">
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center justify-center gap-2 w-full text-sm font-black hover:text-green-600 dark:hover:text-green-400 transition-colors hover:scale-105"
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
