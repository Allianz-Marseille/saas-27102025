"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Plus, Edit, Trash2, Lock, Unlock, ArrowUpDown, ArrowUp, ArrowDown, Shield, Heart, Stethoscope, PiggyBank, Car, Building2, Filter, X } from "lucide-react";
import { deleteAct } from "@/lib/firebase/acts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Act } from "@/types";
import { NewActDialog } from "@/components/acts/new-act-dialog";
import { EditActDialog } from "@/components/acts/edit-act-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getActsByMonth } from "@/lib/firebase/acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Timestamp } from "firebase/firestore";
import { isActLocked as checkActLocked } from "@/lib/utils/act-lock";
import { toDate } from "@/lib/utils/date-helpers";
import { MonthSelector } from "@/components/dashboard/month-selector";

export default function ActsPage() {
  const { user, userData } = useAuth();
  const [acts, setActs] = useState<Act[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [actToEdit, setActToEdit] = useState<Act | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; actId: string | null; clientName: string }>({
    open: false,
    actId: null,
    clientName: "",
  });
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; note: string; clientName: string }>({
    open: false,
    note: "",
    clientName: "",
  });
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const [sortConfig, setSortConfig] = useState<SortState>({
    key: "dateSaisie",
    direction: "desc",
  });
  const [activeFilter, setActiveFilter] = useState<{
    type: 'kind' | 'contractType' | null;
    value: string | null;
  }>({
    type: null,
    value: null,
  });

  const loadActs = async () => {
    if (!user) {
      setActs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const actsData = await getActsByMonth(user.uid, selectedMonth);
      
      // Convertir les Timestamp en Date
      const convertedActs: Act[] = actsData.map((act) => {
        const dateEffet = (act as unknown as { dateEffet: Timestamp | Date }).dateEffet instanceof Timestamp 
          ? (act as unknown as { dateEffet: Timestamp }).dateEffet.toDate() 
          : (act as unknown as { dateEffet: Date }).dateEffet;
          
        const dateSaisie = (act as unknown as { dateSaisie: Timestamp | Date }).dateSaisie instanceof Timestamp 
          ? (act as unknown as { dateSaisie: Timestamp }).dateSaisie.toDate() 
          : (act as unknown as { dateSaisie: Date }).dateSaisie;
        
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

  const handleActCreated = () => {
    loadActs();
  };

  const handleDeleteActClick = (actId: string, clientName: string) => {
    setDeleteDialog({ open: true, actId, clientName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.actId) return;

    try {
      await deleteAct(deleteDialog.actId);
      toast.success("Acte supprimé avec succès");
      setDeleteDialog({ open: false, actId: null, clientName: "" });
      loadActs();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l'acte");
    }
  };

  const handleEditAct = (act: Act) => {
    if (checkActLocked(act, userData)) {
      toast.error("Cet acte est bloqué et ne peut pas être modifié");
      return;
    }
    setActToEdit(act);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    loadActs();
  };

  const sortedActs = useMemo(() => {
    if (acts.length === 0) {
      return acts;
    }

    // Filtrage (mutuellement exclusif : soit par kind, soit par contractType)
    let filteredActs = [...acts];
    if (activeFilter.type === 'kind' && activeFilter.value) {
      filteredActs = filteredActs.filter(act => act.kind === activeFilter.value);
    } else if (activeFilter.type === 'contractType' && activeFilter.value) {
      filteredActs = filteredActs.filter(act => act.contratType === activeFilter.value);
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
      return <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />;
    }

    return <ArrowDown className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />;
  };

  const getAriaSort = (column: SortKey, sortConfig: SortState): "ascending" | "descending" | "none" => {
    if (sortConfig.key !== column) {
      return "none";
    }

    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };

  const timelineDays = useMemo(() => generateTimeline(selectedMonth, acts), [selectedMonth, acts]);

  // Helper functions for badges
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

  const totalCommissions = sortedActs.reduce((sum, act) => sum + act.commissionPotentielle, 0);

  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return;

    const todayElement = container.querySelector<HTMLDivElement>('[data-timeline-day="today"]');

    if (!todayElement) {
      container.scrollTo({ left: 0, behavior: "auto" });
      return;
    }

    const targetLeft = todayElement.offsetLeft - container.clientWidth / 2 + todayElement.clientWidth / 2;
    const safeTarget = Math.max(targetLeft, 0);

    container.scrollTo({
      left: safeTarget,
      behavior: "smooth",
    });
  }, [timelineDays]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Mes actes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez vos actes commerciaux et suivez vos performances
              </p>
            </div>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 gap-2 px-6"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Nouvel acte</span>
            </Button>
          </div>
          
          {/* Barre de navigation avec stats */}
          <div className="flex items-center justify-between pt-3 border-t border-blue-200/30 dark:border-blue-800/30">
            <MonthSelector 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
            
            {/* Stats rapides */}
            {!isLoading && acts.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm">
                    <span className="font-bold text-foreground">{acts.length}</span>
                    <span className="text-muted-foreground ml-1">actes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/50 dark:border-green-800/50">
                  <span className="text-lg">💰</span>
                  <div className="text-sm">
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(totalCommissions)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Dialog Nouvel Acte */}
        <NewActDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSuccess={handleActCreated}
        />

        {/* Dialog Éditer Acte */}
        <EditActDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          act={actToEdit}
          onSuccess={handleEditSuccess}
        />

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>
              Visualisation des actes sur le mois sélectionné
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={timelineContainerRef} className="overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {timelineDays.map((day, index) => (
                  <div
                    key={index}
                    data-timeline-day={day.isToday ? "today" : undefined}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg min-w-[80px] transition-colors border",
                      {
                        "bg-orange-100 dark:bg-orange-900/20": day.isSaturday && !day.isToday,
                        "bg-red-100 dark:bg-red-900/20": day.isSunday && !day.isToday,
                        "bg-muted": !day.isSaturday && !day.isSunday && !day.isToday,
                        "border-blue-500 bg-blue-500/20 shadow-lg": day.isToday,
                        "border-transparent": !day.isToday,
                      }
                    )}
                  >
                    <span className="text-xs font-medium">
                      {format(day.date, "EEE", { locale: fr }).substring(0, 3)}
                    </span>
                    <span className="text-2xl font-bold">
                      {format(day.date, "d")}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {day.acts.length} acte{day.acts.length > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des actes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
            <CardTitle>Liste des actes</CardTitle>
            <CardDescription>
              Tous vos actes commerciaux du mois sélectionné
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
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtres :</span>
                  
                  {/* Filtre par type d'acte (process) */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveFilter({ type: null, value: null })}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        !activeFilter.type
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                          : "bg-muted hover:bg-muted/70"
                      )}
                    >
                      Tous
                    </button>
                    {["AN", "M+3", "PRETERME_AUTO", "PRETERME_IRD"].map((kind) => (
                      <button
                        key={kind}
                        onClick={() => setActiveFilter({ type: 'kind', value: kind })}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-all",
                          activeFilter.type === 'kind' && activeFilter.value === kind
                            ? getKindBadgeColor(kind) + " shadow-md ring-2 ring-white dark:ring-slate-800"
                            : "bg-muted hover:bg-muted/70"
                        )}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                  
                  {/* Séparateur */}
                  <div className="h-4 w-px bg-border" />
                  
                  {/* Filtre par type de contrat */}
                  <div className="flex gap-2 flex-wrap">
                    {["PJ", "GAV", "SANTE_PREV", "AUTO_MOTO"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setActiveFilter({ type: 'contractType', value: type })}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                          activeFilter.type === 'contractType' && activeFilter.value === type
                            ? getContractBadgeColor(type) + " shadow-md ring-2 ring-white dark:ring-slate-800"
                            : "bg-muted hover:bg-muted/70"
                        )}
                      >
                        {getContractIcon(type)}
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Bouton reset */}
                  {activeFilter.type && (
                    <button
                      onClick={() => setActiveFilter({ type: null, value: null })}
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
                      <th className="text-center p-3 font-semibold text-sm border-b w-12"></th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("dateSaisie", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("dateSaisie")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Date de saisie
                          {renderSortIcon("dateSaisie")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("kind", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("kind")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Type
                          {renderSortIcon("kind")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("clientNom", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("clientNom")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Client
                          {renderSortIcon("clientNom")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("numeroContrat", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("numeroContrat")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          N° Contrat
                          {renderSortIcon("numeroContrat")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("contratType", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("contratType")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Type Contrat
                          {renderSortIcon("contratType")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("compagnie", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("compagnie")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Compagnie
                          {renderSortIcon("compagnie")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("dateEffet", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("dateEffet")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Date d&apos;effet
                          {renderSortIcon("dateEffet")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("primeAnnuelle", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("primeAnnuelle")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Prime annuelle
                          {renderSortIcon("primeAnnuelle")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("commissionPotentielle", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("commissionPotentielle")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Commission
                          {renderSortIcon("commissionPotentielle")}
                        </button>
                      </th>
                      <th className="text-center p-3 font-semibold text-sm border-b w-20">Statut</th>
                      <th className="text-center p-3 font-semibold text-sm border-b w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActs.map((act) => {
                      const isProcess = act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD";
                      const isLocked = checkActLocked(act, userData);
                      
                      return (
                        <tr
                          key={act.id}
                          className={cn(
                            "border-b transition-all duration-200 group",
                            getRowBorderColor(act.kind),
                            isLocked 
                              ? "opacity-60 bg-muted/20" 
                              : "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20 hover:shadow-sm"
                          )}
                        >
                          <td className="p-3 text-center align-middle">
                            {act.note ? (
                              <button 
                                onClick={() => setNoteDialog({ open: true, note: act.note!, clientName: act.clientNom })}
                                className="hover:scale-110 transition-transform" 
                                title="Voir la note"
                              >
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-center align-middle font-medium">{format(toDate(act.dateSaisie), "dd/MM/yyyy")}</td>
                          <td className="p-3 text-center align-middle">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded-full text-xs font-bold",
                              getKindBadgeColor(act.kind)
                            )}>
                              {act.kind}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-semibold text-center align-middle">{act.clientNom}</td>
                          <td className="p-3 text-xs text-center align-middle text-muted-foreground font-mono">{isProcess ? "-" : act.numeroContrat}</td>
                          <td className="p-3 text-center align-middle">
                            {isProcess ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                                getContractBadgeColor(act.contratType)
                              )}>
                                {getContractIcon(act.contratType)}
                                {act.contratType}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-center align-middle">{isProcess ? "-" : act.compagnie}</td>
                          <td className="p-3 text-sm text-center align-middle">{format(toDate(act.dateEffet), "dd/MM/yyyy")}</td>
                          <td className="p-3 text-sm text-center align-middle font-medium">
                            {act.primeAnnuelle ? formatCurrency(act.primeAnnuelle) : "-"}
                          </td>
                          <td className="p-3 text-center align-middle">
                            <span className={cn(
                              "inline-flex px-3 py-1.5 rounded-full text-sm font-bold transition-all",
                              act.commissionPotentielle >= 40
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md group-hover:shadow-lg group-hover:scale-105"
                                : act.commissionPotentielle > 0
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                                  : "bg-muted text-muted-foreground"
                            )}>
                            {formatCurrency(act.commissionPotentielle)}
                            </span>
                          </td>
                          <td className="p-3 text-center align-middle">
                            {isLocked ? (
                              <div className="flex items-center justify-center" title="Bloqué">
                                <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center" title="Débloqué">
                                <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center align-middle">
                            <div className="flex gap-2 justify-center items-center">
                              <button
                                onClick={() => handleEditAct(act)}
                                className={`p-1 rounded transition-colors ${
                                  isLocked 
                                    ? "opacity-30 cursor-not-allowed" 
                                    : "hover:bg-muted"
                                }`}
                                disabled={isLocked}
                                title={isLocked ? "Modification bloquée" : "Modifier"}
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={() => !isLocked && handleDeleteActClick(act.id, act.clientNom)}
                                className={`p-1 rounded transition-colors ${
                                  isLocked 
                                    ? "opacity-30 cursor-not-allowed" 
                                    : "hover:bg-muted"
                                }`}
                                disabled={isLocked}
                                title={isLocked ? "Suppression bloquée" : "Supprimer"}
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer avec statistiques */}
            {sortedActs.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground">Total actes</div>
                      <div className="text-2xl font-bold text-foreground">{sortedActs.length}</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-muted-foreground">Commissions potentielles</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatCurrency(totalCommissions)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Répartition par type */}
                  <div className="flex gap-2 flex-wrap">
                    {["AN", "M+3", "PRETERME_AUTO", "PRETERME_IRD"].map((kind) => {
                      const count = sortedActs.filter(act => act.kind === kind).length;
                      if (count === 0) return null;
                      return (
                        <div 
                          key={kind}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1",
                            getKindBadgeColor(kind)
                          )}
                        >
                          {kind} • {count}
                        </div>
                      );
                    })}
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

      {/* Modale d'affichage de la note */}
      <Dialog open={noteDialog.open} onOpenChange={(open) => setNoteDialog({ ...noteDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Note - {noteDialog.clientName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base whitespace-pre-wrap wrap-break-word">{noteDialog.note}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getSortableValue(act: Act, key: SortKey): number | string | null {
  switch (key) {
    case "dateSaisie": {
      const date = toDate(act.dateSaisie);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "dateEffet": {
      const date = toDate(act.dateEffet);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "commissionPotentielle":
      return typeof act.commissionPotentielle === "number" ? act.commissionPotentielle : null;
    case "primeAnnuelle":
      return typeof act.primeAnnuelle === "number" ? act.primeAnnuelle : null;
    case "numeroContrat":
      return act.numeroContrat ? act.numeroContrat.toLowerCase() : null;
    case "contratType":
      return act.contratType ? act.contratType.toLowerCase() : null;
    case "compagnie":
      return act.compagnie ? act.compagnie.toLowerCase() : null;
    case "clientNom":
      return act.clientNom ? act.clientNom.toLowerCase() : null;
    case "kind":
      return act.kind ? act.kind.toLowerCase() : null;
    default:
      return null;
  }
}

function generateTimeline(monthKey: string, acts: Act[] = []): TimelineDay[] {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const timelineDays: TimelineDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const actsByDay = new Map<string, Act[]>();
  
  acts.forEach((act) => {
    const actDate = toDate(act.dateSaisie);
    const dayKey = `${actDate.getFullYear()}-${actDate.getMonth() + 1}-${actDate.getDate()}`;
    
    if (!actsByDay.has(dayKey)) {
      actsByDay.set(dayKey, []);
    }
    actsByDay.get(dayKey)!.push(act);
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    
    const dayKey = `${year}-${month}-${day}`;
    const dayActs = actsByDay.get(dayKey) || [];

    timelineDays.push({
      date,
      isSaturday,
      isSunday,
      isToday: normalizedDate.getTime() === today.getTime(),
      acts: dayActs,
    });
  }

  return timelineDays;
}

type TimelineDay = {
  date: Date;
  isSaturday: boolean;
  isSunday: boolean;
  isToday: boolean;
  acts: Act[];
};

type SortKey =
  | "dateSaisie"
  | "dateEffet"
  | "clientNom"
  | "numeroContrat"
  | "contratType"
  | "compagnie"
  | "primeAnnuelle"
  | "commissionPotentielle"
  | "kind";

type SortDirection = "asc" | "desc";

type SortState = {
  key: SortKey;
  direction: SortDirection;
};
