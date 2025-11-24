"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FileText as FileTextIcon, Lock, Unlock, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/dashboard/kpi-card";
import { DollarSign, FileText, ClipboardCheck, Car, Building2, Scale, Target, Coins } from "lucide-react";
import { calculateKPI } from "@/lib/utils/kpi";
import { formatCurrency } from "@/lib/utils";
import { getActsByMonth, type Act } from "@/lib/firebase/acts";
import { getAllCommercials, type UserData } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { CommercialsRanking } from "./commercials-ranking";
import { ContractTypeRanking } from "./contract-type-ranking";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clsx } from "clsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityOverviewProps {
  initialMonth?: string;
}

export function ActivityOverview({ initialMonth }: ActivityOverviewProps) {
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
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const [sortConfig, setSortConfig] = useState<SortState>({
    key: "dateSaisie",
    direction: "desc",
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
    dateSaisie: act.dateSaisie instanceof Timestamp ? act.dateSaisie.toDate() : act.dateSaisie,
    dateEffet: act.dateEffet instanceof Timestamp ? act.dateEffet.toDate() : act.dateEffet,
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

    const actsClone = [...acts];
    actsClone.sort((actA, actB) => {
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

    return actsClone;
  }, [acts, sortConfig]);

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
      <Card className="border-l-4 border-l-blue-500 relative">
        <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-t-lg z-10" />
        <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <ClipboardCheck className="h-5 w-5" />
            Activité Mensuelle
          </CardTitle>
          <CardDescription>
            Navigation mensuelle affecte les KPIs, Timeline et Tableau ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Navigation mensuelle + Filtre */}
          <div className="bg-blue-50/30 dark:bg-blue-950/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[140px] text-center">
                  {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: fr })}
                </span>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="commercial-filter">Voir :</Label>
                <Select value={selectedCommercial} onValueChange={setSelectedCommercial}>
                  <SelectTrigger id="commercial-filter" className="w-[200px]">
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
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Indicateurs de performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Timeline
            </h3>
            <div ref={timelineContainerRef} className="overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {timelineDays.map((day, index) => (
                  <div
                    key={index}
                    data-timeline-day={day.isToday ? "today" : undefined}
                    className={clsx(
                      "flex flex-col items-center rounded-lg min-w-[80px] p-3 transition-colors border",
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
          </div>

          {/* Séparateur */}
          <div className="border-t border-blue-200 dark:border-blue-800" />

          {/* Tableau des actes */}
          <div>
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Tableau récapitulatif des actes
            </h3>
            {acts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucun acte pour ce mois</p>
            ) : (
              <TooltipProvider delayDuration={2000}>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-center p-3 font-semibold text-sm border-b w-12"></th>
                        <th
                          className="text-center p-3 font-semibold text-sm border-b"
                          aria-sort={getAriaSort("dateSaisie", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("dateSaisie")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
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
                            type="button"
                            onClick={() => handleSortChange("kind")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
                          >
                            Type
                            {renderSortIcon("kind")}
                          </button>
                        </th>
                        <th
                          className="text-center p-3 font-semibold text-sm border-b"
                          aria-sort={getAriaSort("clientNom", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("clientNom")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
                          >
                            Client
                            {renderSortIcon("clientNom")}
                          </button>
                        </th>
                        <th
                          className="text-center p-3 font-semibold text-sm border-b"
                          aria-sort={getAriaSort("numeroContrat", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("numeroContrat")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
                          >
                            N° Contrat
                            {renderSortIcon("numeroContrat")}
                          </button>
                        </th>
                        <th
                          className="text-center p-3 font-semibold text-sm border-b"
                          aria-sort={getAriaSort("contratType", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("contratType")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
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
                            type="button"
                            onClick={() => handleSortChange("compagnie")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
                          >
                            Compagnie
                            {renderSortIcon("compagnie")}
                          </button>
                        </th>
                        <th
                          className="text-center p-3 font-semibold text-sm border-b"
                          aria-sort={getAriaSort("dateEffet", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("dateEffet")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
                          >
                            Date d&apos;effet
                            {renderSortIcon("dateEffet")}
                          </button>
                        </th>
                        <th
                          className="text-center p-3 font-semibold text-sm border-b"
                          aria-sort={getAriaSort("primeAnnuelle", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("primeAnnuelle")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
                          >
                            Prime annuelle
                            {renderSortIcon("primeAnnuelle")}
                          </button>
                        </th>
                        <th
                          className="text-center p-3 font-semibold text-sm border-b"
                          aria-sort={getAriaSort("commissionPotentielle", sortConfig)}
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange("commissionPotentielle")}
                            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
                          >
                            Commission
                            {renderSortIcon("commissionPotentielle")}
                          </button>
                        </th>
                        <th className="text-center p-3 font-semibold text-sm border-b w-20">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedActs.map((act) => {
                        const isProcess = act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD";
                        const isLocked = isActLocked(act);
                        const commercialEmail = commercialEmailById.get(act.userId) ?? "Commercial inconnu";
                        
                        // Convertir Timestamp en Date si nécessaire
                        const dateSaisie = act.dateSaisie instanceof Timestamp ? act.dateSaisie.toDate() : act.dateSaisie;
                        const dateEffet = act.dateEffet instanceof Timestamp ? act.dateEffet.toDate() : act.dateEffet;
                        
                        return (
                          <Tooltip key={act.id}>
                            <TooltipTrigger asChild>
                              <tr
                                className={`border-b hover:bg-muted/30 transition-colors ${
                                  isLocked ? "opacity-60 bg-muted/20" : ""
                                }`}
                              >
                                <td className="p-3 text-center align-middle">
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
                                      className="inline-flex h-8 w-8 items-center justify-center rounded bg-blue-500/10 text-blue-600 transition hover:bg-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                      aria-label={`Voir la note pour ${act.clientNom}`}
                                    >
                                      <FileTextIcon className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm text-center align-middle">{format(dateSaisie, "dd/MM/yyyy")}</td>
                                <td className="p-3 text-sm text-center align-middle">{act.kind}</td>
                                <td className="p-3 text-sm font-medium text-center align-middle">{act.clientNom}</td>
                                <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.numeroContrat}</td>
                                <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.contratType}</td>
                                <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.compagnie}</td>
                                <td className="p-3 text-sm text-center align-middle">{format(dateEffet, "dd/MM/yyyy")}</td>
                                <td className="p-3 text-sm text-center align-middle">
                                  {act.primeAnnuelle ? formatCurrency(act.primeAnnuelle) : "-"}
                                </td>
                                <td className="p-3 text-sm text-center font-semibold align-middle">
                                  {formatCurrency(act.commissionPotentielle)}
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
    </div>
  );
}

function getSortableValue(act: Act, key: SortKey): number | string | null {
  switch (key) {
    case "dateSaisie": {
      const date = act.dateSaisie instanceof Date ? act.dateSaisie : new Date(act.dateSaisie);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "dateEffet": {
      const date = act.dateEffet instanceof Date ? act.dateEffet : new Date(act.dateEffet);
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
    const dateSaisie = act.dateSaisie instanceof Timestamp ? act.dateSaisie.toDate() : act.dateSaisie;
    const actDate = new Date(dateSaisie);
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

// Fonction pour vérifier si un acte est bloqué
function isActLocked(act: Act): boolean {
  const now = new Date();
  const today = now.getDate();
  
  // Convertir Timestamp en Date si nécessaire
  const dateSaisie = act.dateSaisie instanceof Timestamp ? act.dateSaisie.toDate() : act.dateSaisie;
  const actDate = new Date(dateSaisie);
  
  if (today >= 15) {
    const actYear = actDate.getFullYear();
    const actMonth = actDate.getMonth();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    
    if (actYear === nowYear && actMonth < nowMonth) {
      return true;
    }
    if (actYear < nowYear) {
      return true;
    }
  }
  
  return false;
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

