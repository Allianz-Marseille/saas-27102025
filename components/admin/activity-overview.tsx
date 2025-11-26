"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FileText as FileTextIcon, Lock, Unlock, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Filter, X, Shield, Heart, Stethoscope, PiggyBank, Car, DollarSign, FileText, ClipboardCheck, Building2, Scale, Target, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/dashboard/kpi-card";
import { calculateKPI } from "@/lib/utils/kpi";
import { formatCurrency, cn } from "@/lib/utils";
import { getActsByMonth, type Act } from "@/lib/firebase/acts";
import { getAllCommercials, type UserData } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { CommercialsRanking } from "./commercials-ranking";
import { ContractTypeRanking } from "./contract-type-ranking";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clsx } from "clsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditActDialog } from "@/components/acts/edit-act-dialog";
import { DeleteActDialog } from "@/components/acts/delete-act-dialog";
import { useAuth } from "@/lib/firebase/use-auth";
import { isActLocked as checkActLocked } from "@/lib/utils/act-lock";
import { toDate } from "@/lib/utils/date-helpers";

interface ActivityOverviewProps {
  initialMonth?: string;
}

// Helper functions pour les filtres
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
    case "IRD_PART":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300";
    case "IRD_PRO":
      return "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300";
    case "NOP_50_EUR":
      return "bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-950/50 dark:text-gray-300";
  }
};

const getContractLabel = (contractType: string) => {
  switch (contractType) {
    case "AUTO_MOTO":
      return "Auto/Moto";
    case "IRD_PART":
      return "IRD Part.";
    case "IRD_PRO":
      return "IRD Pro";
    case "PJ":
      return "PJ";
    case "GAV":
      return "GAV";
    case "NOP_50_EUR":
      return "NOP";
    case "SANTE_PREV":
      return "Santé";
    case "VIE_PP":
      return "Vie PP";
    case "VIE_PU":
      return "Vie PU";
    default:
      return contractType;
  }
};

export function ActivityOverview({ initialMonth }: ActivityOverviewProps) {
  const { userData } = useAuth();
  const [acts, setActs] = useState<Act[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth || format(new Date(), "yyyy-MM")
  );
  const [selectedCommercial, setSelectedCommercial] = useState<string>("all");
  const [commerciaux, setCommerciaux] = useState<UserData[]>([]);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; note: string; clientName: string }>({
    open: false,
    note: "",
    clientName: "",
  });
  const [editDialog, setEditDialog] = useState<{ open: boolean; act: Act | null }>({
    open: false,
    act: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; act: Act | null }>({
    open: false,
    act: null,
  });
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const [sortConfig, setSortConfig] = useState<SortState>({
    key: "dateSaisie",
    direction: "desc",
  });
  const [activeFilter, setActiveFilter] = useState<{ type: 'kind' | 'contractType' | null; value: string | null }>({
    type: null,
    value: null,
  });

  // Charger les commerciaux
  useEffect(() => {
    const loadCommerciaux = async () => {
      try {
        const commercials = await getAllCommercials();
        setCommerciaux(commercials);
      } catch (error) {
        console.error("Erreur chargement commerciaux:", error);
        toast.error("Erreur lors du chargement des commerciaux");
      }
    };
    loadCommerciaux();
  }, []);

  // Charger les actes
  const loadActs = async () => {
    setIsLoading(true);
    try {
      const userId = selectedCommercial === "all" ? null : selectedCommercial;
      const actsData = await getActsByMonth(userId, selectedMonth);
      
      // Convertir les Timestamp en Date
      const convertedActs = actsData.map((act) => {
        return {
          ...act,
          dateEffet: toDate((act as unknown as { dateEffet: Timestamp | Date }).dateEffet),
          dateSaisie: toDate((act as unknown as { dateSaisie: Timestamp | Date }).dateSaisie),
        } as unknown as Act;
      });
      
      setActs(convertedActs);
    } catch (error) {
      console.error("Erreur chargement actes:", error);
      toast.error("Erreur lors du chargement des actes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedCommercial]);

  const previousMonth = () => {
    const date = new Date(selectedMonth + "-01");
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(format(date, "yyyy-MM"));
  };

  const nextMonth = () => {
    const date = new Date(selectedMonth + "-01");
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(format(date, "yyyy-MM"));
  };

  // Convertir les Timestamp en Date pour calculateKPI
  const actsForKPI = acts.map(act => ({
    ...act,
    dateSaisie: toDate(act.dateSaisie),
    dateEffet: toDate(act.dateEffet),
  }));
  
  const kpi = calculateKPI(actsForKPI as any);
  const timelineDays = useMemo(() => generateTimeline(selectedMonth, acts), [selectedMonth, acts]);

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

  const commercialEmailById = useMemo(() => {
    const map = new Map<string, string>();
    commerciaux.forEach((com) => {
      map.set(com.id, com.email);
    });
    return map;
  }, [commerciaux]);

  const sortedActs = useMemo(() => {
    if (acts.length === 0) {
      return [];
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

      if (valueA === valueB) {
        return 0;
      }

      if (valueA === null) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (valueB === null) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      return sortConfig.direction === "asc" ? 1 : -1;
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
        direction: key === "dateSaisie" ? "desc" : "asc",
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1 : Activité Mensuelle */}
      <Card className="relative shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-blue-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-blue-950/20 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Activité Mensuelle
              </CardTitle>
              <CardDescription className="mt-1">
                Navigation mensuelle affecte les KPIs, Timeline et Tableau ci-dessous
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Navigation mensuelle + Filtre */}
          <div className="bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-blue-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-blue-950/20 p-5 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={previousMonth}
                  className="rounded-full border-2 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-blue-600 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                  <span className="text-lg font-bold text-white min-w-[160px] text-center block">
                    {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={nextMonth}
                  className="rounded-full border-2 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-blue-600 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="commercial-filter" className="font-semibold">Voir :</Label>
                <Select value={selectedCommercial} onValueChange={setSelectedCommercial}>
                  <SelectTrigger id="commercial-filter" className="w-[220px] border-2 focus:border-blue-500">
                    <SelectValue placeholder="Sélectionner un commercial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les commerciaux</SelectItem>
                    {commerciaux.map((com) => (
                      <SelectItem key={com.id} value={com.id}>
                        {com.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Indicateurs de performance
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KPICard
          title="CA Mensuel"
          value={formatCurrency(kpi.caMensuel)}
          icon={DollarSign}
          colorScheme="green"
        />
        <KPICard
          title="CA Auto / Moto"
          value={formatCurrency(kpi.caAuto)}
          icon={Car}
          colorScheme="blue"
        />
        <KPICard
          title="CA Autres"
          value={formatCurrency(kpi.caAutres)}
          icon={Building2}
          colorScheme="purple"
        />
        <KPICard
          title="Nombre de contrats"
          value={kpi.nbContrats.toString()}
          icon={ClipboardCheck}
          colorScheme="indigo"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Contrats Auto / Moto"
          value={kpi.nbContratsAuto.toString()}
          icon={Car}
          colorScheme="teal"
        />
        <KPICard
          title="Contrats Autres"
          value={kpi.nbContratsAutres.toString()}
          icon={Building2}
          colorScheme="orange"
        />
        <KPICard
          title="Ratio"
          value={`${kpi.ratio.toFixed(1)}%`}
          subtitle="Objectif ≥ 100%"
          icon={Scale}
          trend={kpi.ratio >= 100 ? "up" : "down"}
          colorScheme={kpi.ratio >= 100 ? "green" : "red"}
        />
        <KPICard
          title="Nombre de process"
          value={kpi.nbProcess.toString()}
          icon={Target}
          colorScheme="pink"
        />
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Timeline
              </h3>
            </div>
            <div ref={timelineContainerRef} className="overflow-x-auto scrollbar-thin">
              <div className="flex gap-3 min-w-max p-2">
                {timelineDays.map((day, index) => (
                  <div
                    key={index}
                    data-timeline-day={day.isToday ? "today" : undefined}
                    className={clsx(
                      "flex flex-col items-center rounded-xl min-w-[90px] p-4 transition-all duration-200 border-2 hover:scale-105 cursor-pointer",
                      {
                        "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-300 dark:border-orange-700": day.isSaturday && !day.isToday,
                        "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-300 dark:border-red-700": day.isSunday && !day.isToday,
                        "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 border-slate-200 dark:border-slate-700": !day.isSaturday && !day.isSunday && !day.isToday,
                        "border-blue-500 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 shadow-xl shadow-blue-500/30": day.isToday,
                      }
                    )}
                  >
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      day.isToday ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                    )}>
                      {format(day.date, "EEE", { locale: fr }).substring(0, 3)}
                    </span>
                    <span className={cn(
                      "text-3xl font-bold my-1",
                      day.isToday && "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                    )}>
                      {format(day.date, "d")}
                    </span>
                    {day.acts.length > 0 ? (
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        day.isToday 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                          : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                      )}>
                        {day.acts.length} acte{day.acts.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">0 acte</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t border-blue-200 dark:border-blue-800" />

          {/* Tableau des actes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                  <ClipboardCheck className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Tableau récapitulatif des actes (avec actions admin)
                </h3>
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
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-indigo-50/50 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/50">
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
                    {["AUTO_MOTO", "IRD_PART", "IRD_PRO", "PJ", "GAV", "NOP_50_EUR", "SANTE_PREV", "VIE_PP", "VIE_PU"].map((type) => (
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
                        {getContractLabel(type)}
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

            {acts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucun acte pour ce mois</p>
            ) : (
              <TooltipProvider delayDuration={2000}>
                <div className="overflow-x-auto rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-2xl">
                  <table className="w-full border-collapse">
                    <thead className="bg-gradient-to-r from-blue-50 via-purple-50/50 to-indigo-50 dark:from-blue-950/40 dark:via-purple-950/20 dark:to-indigo-950/40">
                      <tr className="border-b-2 border-blue-200/50 dark:border-blue-800/50">
                        <th className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 w-12">
                          <FileTextIcon className="h-4 w-4 mx-auto" />
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("dateSaisie", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("dateSaisie")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Date de saisie
                            {renderSortIcon("dateSaisie")}
                          </button>
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("kind", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("kind")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Type
                            {renderSortIcon("kind")}
                          </button>
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("clientNom", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("clientNom")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Client
                            {renderSortIcon("clientNom")}
                          </button>
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("numeroContrat", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("numeroContrat")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            N° Contrat
                            {renderSortIcon("numeroContrat")}
                          </button>
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("contratType", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("contratType")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Type Contrat
                            {renderSortIcon("contratType")}
                          </button>
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("compagnie", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("compagnie")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Compagnie
                            {renderSortIcon("compagnie")}
                          </button>
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("dateEffet", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("dateEffet")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Date effet
                            {renderSortIcon("dateEffet")}
                          </button>
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("primeAnnuelle", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("primeAnnuelle")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Prime
                            {renderSortIcon("primeAnnuelle")}
                          </button>
                        </th>
                        <th
                          className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                          aria-sort={getAriaSort("commissionPotentielle", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("commissionPotentielle")}
                            className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Commission
                            {renderSortIcon("commissionPotentielle")}
                          </button>
                        </th>
                        <th className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 w-20">Statut</th>
                        <th className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedActs.map((act) => {
                        const isProcess = act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD";
                        const isLocked = checkActLocked(act, userData);
                        const commercialEmail = commercialEmailById.get(act.userId) ?? "Commercial inconnu";
                        
                        // Convertir Timestamp en Date si nécessaire
                        const dateSaisie = toDate(act.dateSaisie);
                        const dateEffet = toDate(act.dateEffet);
                        
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
                          <Tooltip key={act.id}>
                            <TooltipTrigger asChild>
                              <tr
                                className={cn(
                                  "border-b transition-all duration-200 group",
                                  getRowBorderColor(act.kind),
                                  "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20 hover:shadow-md",
                                  isLocked && "opacity-60"
                                )}
                              >
                                <td className="p-4 text-center align-middle">
                                  {act.note ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setNoteDialog({
                                          open: true,
                                          note: act.note ?? "",
                                          clientName: act.clientNom,
                                        })
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 transition-all hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                      aria-label={`Voir la note pour ${act.clientNom}`}
                                    >
                                      <FileTextIcon className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </td>
                                <td className="p-4 text-sm text-center align-middle">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{format(dateSaisie, "dd/MM/yyyy")}</span>
                                    <span className="text-xs text-muted-foreground">{format(dateSaisie, "HH:mm")}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-center align-middle">
                                  <span className={cn(
                                    "inline-flex px-2.5 py-1 rounded-full text-xs font-bold",
                                    getKindBadgeColor(act.kind)
                                  )}>
                                    {act.kind}
                                  </span>
                                </td>
                                <td className="p-4 text-sm font-semibold text-center align-middle">{act.clientNom}</td>
                                <td className="p-4 text-sm text-center align-middle">
                                  {isProcess ? (
                                    <span className="text-muted-foreground">-</span>
                                  ) : (
                                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{act.numeroContrat}</span>
                                  )}
                                </td>
                                <td className="p-4 text-center align-middle">
                                  {isProcess ? (
                                    <span className="text-muted-foreground">-</span>
                                  ) : (
                                    <span className={cn(
                                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                                      getContractBadgeColor(act.contratType)
                                    )}>
                                      {getContractIcon(act.contratType)}
                                      {getContractLabel(act.contratType)}
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-sm text-center align-middle">
                                  {isProcess ? (
                                    <span className="text-muted-foreground">-</span>
                                  ) : (
                                    <span className="font-medium">{act.compagnie}</span>
                                  )}
                                </td>
                                <td className="p-4 text-sm text-center align-middle">
                                  <span className="font-medium">{format(dateEffet, "dd/MM/yyyy")}</span>
                                </td>
                                <td className="p-4 text-sm text-center align-middle">
                                  {act.primeAnnuelle ? (
                                    <span className="font-semibold">{formatCurrency(act.primeAnnuelle)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-4 text-center align-middle">
                                  <span className={cn(
                                    "inline-flex px-3 py-1.5 rounded-full text-sm font-bold transition-all",
                                    act.commissionPotentielle >= 40
                                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md group-hover:shadow-lg group-hover:scale-105"
                                      : act.commissionPotentielle > 0
                                      ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                                      : "bg-gray-100 text-gray-600 dark:bg-gray-950/50 dark:text-gray-400"
                                  )}>
                                    {formatCurrency(act.commissionPotentielle)}
                                  </span>
                                </td>
                                <td className="p-4 text-center align-middle">
                                  {isLocked ? (
                                    <div className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-700" title="Bloqué">
                                      <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-full bg-green-100 dark:bg-green-950/50 border border-green-300 dark:border-green-700" title="Débloqué">
                                      <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center align-middle">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditDialog({ open: true, act })}
                                      className="h-9 w-9 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all hover:scale-110 hover:shadow-md"
                                      title="Modifier l'acte"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeleteDialog({ open: true, act })}
                                      className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 transition-all hover:scale-110 hover:shadow-md"
                                      title="Supprimer l'acte"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm font-medium">{commercialEmail}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2 : Classement des commerciaux */}
      <CommercialsRanking monthKey={selectedMonth} />
      
      {/* Section 3 : Classement par type de contrat */}
      <ContractTypeRanking monthKey={selectedMonth} />

      <Dialog
        open={noteDialog.open}
        onOpenChange={(open) => setNoteDialog((current) => ({ ...current, open }))}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Note — {noteDialog.clientName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base whitespace-pre-wrap wrap-break-word">{noteDialog.note}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <EditActDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, act: open ? editDialog.act : null })}
        act={editDialog.act}
        onSuccess={loadActs}
      />

      {/* Dialog de suppression */}
      <DeleteActDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, act: open ? deleteDialog.act : null })}
        act={deleteDialog.act}
        onSuccess={loadActs}
      />
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
    case "clientNom":
      return act.clientNom ? act.clientNom.toLowerCase() : null;
    case "compagnie":
      return act.compagnie ? act.compagnie.toLowerCase() : null;
    case "kind":
      return act.kind ? act.kind.toLowerCase() : null;
    default:
      return null;
  }
}

function getAriaSort(column: SortKey, sortConfig: SortState): "ascending" | "descending" | "none" {
  if (sortConfig.key !== column) {
    return "none";
  }

  return sortConfig.direction === "asc" ? "ascending" : "descending";
}

// Fonction pour générer la timeline
function generateTimeline(monthKey: string, acts: Act[] = []) {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const timelineDays: TimelineDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Créer un map des actes par jour (basé sur la date de saisie)
  const actsByDay = new Map<string, Act[]>();
  
  acts.forEach((act) => {
    // Convertir Timestamp en Date si nécessaire
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

