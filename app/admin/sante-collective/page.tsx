"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FileText as FileTextIcon, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Filter, X, Heart, DollarSign, FileText, ClipboardCheck, Target, TrendingUp, BarChart3, PieChart as PieChartIcon, Users, Building2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/dashboard/kpi-card";
import { formatCurrency, cn } from "@/lib/utils";
import { getHealthCollectiveActsByMonthFiltered } from "@/lib/firebase/health-collective-acts";
import { type UserData } from "@/lib/firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { HealthCollectiveAct } from "@/types";
import { calculateHealthCollectiveKPIsByType } from "@/lib/utils/health-collective-kpi";
import { getHealthCollectiveCommissionRate } from "@/lib/utils/health-kpi";
import { toDate } from "@/lib/utils/date-helpers";
import { EditHealthCollectiveActDialog } from "@/components/health-collective-acts/edit-health-collective-act-dialog";
import { DeleteHealthCollectiveActDialog } from "@/components/health-collective-acts/delete-health-collective-act-dialog";
import { getHealthCollectiveActKindLabel, getHealthCollectiveActOriginLabel } from "@/lib/firebase/health-collective-acts";
import { subMonths } from "date-fns";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ActivityOverviewProps {
  initialMonth?: string;
}

// Helper functions pour les filtres
const getKindBadgeColor = (kind: string) => {
  switch (kind) {
    case "IND_AN_SANTE":
      return "bg-blue-500 text-white";
    case "IND_AN_PREVOYANCE":
      return "bg-indigo-500 text-white";
    case "IND_AN_RETRAITE":
      return "bg-purple-500 text-white";
    case "COLL_AN_SANTE":
      return "bg-cyan-500 text-white";
    case "COLL_AN_PREVOYANCE":
      return "bg-teal-500 text-white";
    case "COLL_AN_RETRAITE":
      return "bg-emerald-500 text-white";
    case "COLL_ADHESION_RENFORT":
      return "bg-green-500 text-white";
    case "REVISION":
      return "bg-yellow-500 text-white";
    case "ADHESION_RENFORT":
      return "bg-orange-500 text-white";
    case "COURTAGE_TO_ALLIANZ":
      return "bg-pink-500 text-white";
    case "ALLIANZ_TO_COURTAGE":
      return "bg-rose-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getOriginBadgeColor = (origine: string) => {
  switch (origine) {
    case "PROACTIF":
      return "bg-emerald-500 text-white";
    case "REACTIF":
      return "bg-amber-500 text-white";
    case "PROSPECTION":
      return "bg-violet-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

type TimelineDay = {
  date: Date;
  isSaturday: boolean;
  isSunday: boolean;
  isToday: boolean;
  acts: HealthCollectiveAct[];
};

type SortKey =
  | "dateSaisie"
  | "dateEffet"
  | "clientNom"
  | "numeroContrat"
  | "compagnie"
  | "prime"
  | "caAnnuel"
  | "caPondere"
  | "kind"
  | "origine";

type SortDirection = "asc" | "desc";

type SortState = {
  key: SortKey;
  direction: SortDirection;
};

interface HistoricalMonthData {
  month: string;
  monthKey: string;
  caPondere: number;
  commissions: number;
}

// Fonction pour générer la timeline
function generateTimeline(monthKey: string, acts: HealthCollectiveAct[] = []): TimelineDay[] {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const timelineDays: TimelineDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Créer un map des actes par jour (basé sur la date de saisie)
  const actsByDay = new Map<string, HealthCollectiveAct[]>();
  
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

function getSortableValue(act: HealthCollectiveAct, key: SortKey): number | string | null {
  switch (key) {
    case "dateSaisie": {
      const date = toDate(act.dateSaisie);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "dateEffet": {
      const date = toDate(act.dateEffet);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "prime":
      return typeof act.prime === "number" ? act.prime : null;
    case "caAnnuel":
      return typeof act.caAnnuel === "number" ? act.caAnnuel : null;
    case "caPondere":
      return typeof act.caPondere === "number" ? act.caPondere : null;
    case "numeroContrat":
      return act.numeroContrat ? act.numeroContrat.toLowerCase() : null;
    case "clientNom":
      return act.clientNom ? act.clientNom.toLowerCase() : null;
    case "compagnie":
      return act.compagnie ? act.compagnie.toLowerCase() : null;
    case "kind":
      return act.kind ? act.kind.toLowerCase() : null;
    case "origine":
      return act.origine ? act.origine.toLowerCase() : null;
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

export default function AdminSanteCollectivePage() {
  const [acts, setActs] = useState<HealthCollectiveAct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [selectedCommercial, setSelectedCommercial] = useState<string>("all");
  const [commerciaux, setCommerciaux] = useState<UserData[]>([]);
  const [editDialog, setEditDialog] = useState<{ open: boolean; act: HealthCollectiveAct | null }>({
    open: false,
    act: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; act: HealthCollectiveAct | null }>({
    open: false,
    act: null,
  });
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const [sortConfig, setSortConfig] = useState<SortState>({
    key: "dateSaisie",
    direction: "desc",
  });
  const [activeFilter, setActiveFilter] = useState<{ type: 'kind' | 'origine' | null; value: string | null }>({
    type: null,
    value: null,
  });
  const [historicalData, setHistoricalData] = useState<HistoricalMonthData[]>([]);

  // Charger les commerciaux
  useEffect(() => {
    const loadCommerciaux = async () => {
      try {
        if (!db) {
          throw new Error("Firebase non initialisé");
        }
        
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("role", "==", "COMMERCIAL_SANTE_COLLECTIVE"),
          where("active", "==", true)
        );
        const usersSnapshot = await getDocs(q);
        
        const healthCommercials: UserData[] = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email,
            role: data.role,
            active: data.active,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as UserData;
        });
        
        setCommerciaux(healthCommercials);
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
      const actsData = await getHealthCollectiveActsByMonthFiltered(userId, selectedMonth);
      
      // Convertir les Timestamp en Date
      const convertedActs = actsData.map((act) => {
        return {
          ...act,
          dateEffet: toDate(act.dateEffet),
          dateSaisie: toDate(act.dateSaisie),
        } as HealthCollectiveAct;
      });
      
      setActs(convertedActs);
    } catch (error) {
      console.error("Erreur chargement actes:", error);
      toast.error("Erreur lors du chargement des actes");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données historiques pour les graphiques (uniquement si commercial sélectionné)
  const loadHistoricalData = async () => {
    if (selectedCommercial === "all") {
      setHistoricalData([]);
      return;
    }

    try {
      const historical: HistoricalMonthData[] = [];
      
      // Charger les 6 mois (mois en cours + 5 précédents)
      for (let i = 5; i >= 0; i--) {
        const histMonthDate = subMonths(new Date(selectedMonth + "-01"), i);
        const histMonthKey = format(histMonthDate, "yyyy-MM");
        
        const actsData = await getHealthCollectiveActsByMonthFiltered(selectedCommercial, histMonthKey);
        const convertedActs = actsData.map((act) => ({
          ...act,
          dateEffet: toDate(act.dateEffet),
          dateSaisie: toDate(act.dateSaisie),
        })) as HealthCollectiveAct[];

        const caPondere = convertedActs.reduce((sum, a) => sum + a.caPondere, 0);
        const commissionInfo = getHealthCollectiveCommissionRate(caPondere);
        const commissions = caPondere * commissionInfo.taux;

        historical.push({
          month: format(histMonthDate, "MMM yy", { locale: fr }),
          monthKey: histMonthKey,
          caPondere,
          commissions,
        });
      }

      setHistoricalData(historical);
    } catch (error) {
      console.error("Erreur chargement données historiques:", error);
    }
  };

  useEffect(() => {
    loadActs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedCommercial]);

  useEffect(() => {
    if (selectedCommercial !== "all") {
      loadHistoricalData();
    } else {
      setHistoricalData([]);
    }
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

  const kpisByType = useMemo(() => calculateHealthCollectiveKPIsByType(acts), [acts]);
  const timelineDays = useMemo(() => generateTimeline(selectedMonth, acts), [selectedMonth, acts]);

  // Calculer les KPIs pour la progression seuils (uniquement si commercial sélectionné)
  const commissionInfo = useMemo(() => {
    if (selectedCommercial === "all") return null;
    return getHealthCollectiveCommissionRate(kpisByType.caPondere);
  }, [selectedCommercial, kpisByType.caPondere]);

  // Scroll automatique vers aujourd'hui
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

  const sortedActs = useMemo(() => {
    if (acts.length === 0) {
      return [];
    }

    // Filtrage
    let filteredActs = [...acts];
    if (activeFilter.type === 'kind' && activeFilter.value) {
      filteredActs = filteredActs.filter(act => act.kind === activeFilter.value);
    }
    if (activeFilter.type === 'origine' && activeFilter.value) {
      filteredActs = filteredActs.filter(act => act.origine === activeFilter.value);
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

  // Données pour le camembert
  const pieChartData = useMemo(() => {
    return [
      { name: 'Ind AN Santé', value: kpisByType.caIndANSante, color: '#3b82f6' },
      { name: 'Ind AN Prévoyance', value: kpisByType.caIndANPrevoyance, color: '#6366f1' },
      { name: 'Ind AN Retraite', value: kpisByType.caIndANRetraite, color: '#8b5cf6' },
      { name: 'Coll AN Santé', value: kpisByType.caCollANSante, color: '#06b6d4' },
      { name: 'Coll AN Prévoyance', value: kpisByType.caCollANPrevoyance, color: '#14b8a6' },
      { name: 'Coll AN Retraite', value: kpisByType.caCollANRetraite, color: '#10b981' },
      { name: 'Coll Adhésion/Renfort', value: kpisByType.caCollAdhesionRenfort, color: '#22c55e' },
      { name: 'Révision', value: kpisByType.caRevision, color: '#eab308' },
      { name: 'Adhésion/Renfort', value: kpisByType.caAdhesionRenfort, color: '#f97316' },
      { name: 'Courtage → Allianz', value: kpisByType.caCourtageToAllianz, color: '#ec4899' },
      { name: 'Allianz → Courtage', value: kpisByType.caAllianzToCourtage, color: '#f43f5e' },
    ].filter(item => item.value > 0);
  }, [kpisByType]);

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
        <CardHeader className="bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-emerald-50/50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-emerald-950/20 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Santé Collective
              </CardTitle>
              <CardDescription className="mt-1">
                Navigation mensuelle affecte les KPIs, Timeline et Tableau ci-dessous
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Navigation mensuelle + Filtre */}
          <div className="bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-emerald-50/50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-emerald-950/20 p-5 rounded-xl border-2 border-emerald-200/50 dark:border-emerald-800/50 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={previousMonth}
                  className="rounded-full border-2 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white hover:border-emerald-600 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
                  <span className="text-lg font-bold text-white min-w-[160px] text-center block">
                    {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={nextMonth}
                  className="rounded-full border-2 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white hover:border-emerald-600 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="commercial-filter" className="font-semibold">Voir :</Label>
                <Select value={selectedCommercial} onValueChange={setSelectedCommercial}>
                  <SelectTrigger id="commercial-filter" className="w-[220px] border-2 focus:border-emerald-500">
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

          {/* KPI Cards - Première ligne */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Indicateurs de performance par type
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <KPICard
                title="Total des actes"
                value={kpisByType.total}
                icon={FileText}
                colorScheme="blue"
              />
              <KPICard
                title="CA Ind AN Santé"
                value={formatCurrency(kpisByType.caIndANSante)}
                icon={Target}
                colorScheme="blue"
              />
              <KPICard
                title="CA Ind AN Prévoyance"
                value={formatCurrency(kpisByType.caIndANPrevoyance)}
                icon={Target}
                colorScheme="indigo"
              />
              <KPICard
                title="CA Ind AN Retraite"
                value={formatCurrency(kpisByType.caIndANRetraite)}
                icon={Target}
                colorScheme="purple"
              />
              <KPICard
                title="CA Coll AN Santé"
                value={formatCurrency(kpisByType.caCollANSante)}
                icon={Target}
                colorScheme="teal"
              />
              <KPICard
                title="CA Coll AN Prévoyance"
                value={formatCurrency(kpisByType.caCollANPrevoyance)}
                icon={Target}
                colorScheme="teal"
              />
            </div>
          </div>

          {/* KPI Cards - Deuxième ligne */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Indicateurs de performance par type (suite)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <KPICard
                title="CA Coll AN Retraite"
                value={formatCurrency(kpisByType.caCollANRetraite)}
                icon={Target}
                colorScheme="green"
              />
              <KPICard
                title="CA Coll Adhésion/Renfort"
                value={formatCurrency(kpisByType.caCollAdhesionRenfort)}
                icon={Users}
                colorScheme="green"
              />
              <KPICard
                title="CA Révision"
                value={formatCurrency(kpisByType.caRevision)}
                icon={TrendingUp}
                colorScheme="orange"
              />
              <KPICard
                title="CA Adhésion/Renfort"
                value={formatCurrency(kpisByType.caAdhesionRenfort)}
                icon={Users}
                colorScheme="orange"
              />
              <KPICard
                title="CA Courtage → Allianz"
                value={formatCurrency(kpisByType.caCourtageToAllianz)}
                icon={ArrowUpDown}
                colorScheme="pink"
              />
              <KPICard
                title="CA Allianz → Courtage"
                value={formatCurrency(kpisByType.caAllianzToCourtage)}
                icon={ArrowUpDown}
                colorScheme="pink"
              />
            </div>
          </div>

          {/* KPI Cards - Troisième ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              title="CA brut"
              value={formatCurrency(kpisByType.caBrut)}
              icon={DollarSign}
              colorScheme="green"
            />
            <KPICard
              title="CA pondéré commission"
              value={formatCurrency(kpisByType.caPondere)}
              icon={Target}
              colorScheme="purple"
            />
            {selectedCommercial !== "all" && commissionInfo && (
              <KPICard
                title="Commissions du mois"
                value={formatCurrency(kpisByType.caPondere * commissionInfo.taux)}
                subtitle={
                  kpisByType.caPondere * commissionInfo.taux === 0
                    ? "Production pondérée < 10 000€"
                    : `Taux : ${(commissionInfo.taux * 100).toFixed(0)}% - ${commissionInfo.label}`
                }
                icon={Coins}
                colorScheme="teal"
              />
            )}
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Timeline
              </h3>
            </div>
            <div ref={timelineContainerRef} className="overflow-x-auto scrollbar-thin">
              <div className="flex gap-3 min-w-max p-2">
                {timelineDays.map((day, index) => (
                  <div
                    key={index}
                    data-timeline-day={day.isToday ? "today" : undefined}
                    className={cn(
                      "flex flex-col items-center rounded-xl min-w-[90px] p-4 transition-all duration-200 border-2 hover:scale-105 cursor-pointer",
                      {
                        "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-300 dark:border-orange-700": day.isSaturday && !day.isToday,
                        "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-300 dark:border-red-700": day.isSunday && !day.isToday,
                        "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 border-slate-200 dark:border-slate-700": !day.isSaturday && !day.isSunday && !day.isToday,
                        "border-emerald-500 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 shadow-xl shadow-emerald-500/30": day.isToday,
                      }
                    )}
                  >
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      day.isToday ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                    )}>
                      {format(day.date, "EEE", { locale: fr }).substring(0, 3)}
                    </span>
                    <span className={cn(
                      "text-3xl font-bold my-1",
                      day.isToday && "bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                    )}>
                      {format(day.date, "d")}
                    </span>
                    {day.acts.length > 0 ? (
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        day.isToday 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
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
          <div className="border-t border-emerald-200 dark:border-emerald-800" />

          {/* Thermomètre des seuils de commissions (conditionnel) */}
          {selectedCommercial !== "all" && commissionInfo && (
            <Card className="overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-emerald-50/50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-emerald-950/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Progression des seuils de commissions
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      CA pondéré actuel : {formatCurrency(kpisByType.caPondere)}
                    </CardDescription>
                  </div>
                </div>

                {/* Thermomètre horizontal */}
                <div className="relative">
                  {/* Barre de fond du thermomètre */}
                  <div className="relative w-full h-16 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-full overflow-hidden">
                    {/* Barre de progression (température qui monte) */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 transition-all duration-1000 ease-out rounded-full shadow-lg"
                      style={{ 
                        width: `${Math.min((kpisByType.caPondere / 18000) * 100, 100)}%` 
                      }}
                    >
                      {/* Indicateur de position actuelle */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                        <div className="w-6 h-6 bg-white dark:bg-slate-900 border-4 border-emerald-600 rounded-full shadow-xl flex items-center justify-center">
                          <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Marqueurs des seuils */}
                    {[
                      { value: 0, label: "Seuil 1", rate: "0%", color: "bg-gray-400" },
                      { value: 6000, label: "Seuil 2", rate: "2%", color: "bg-yellow-400" },
                      { value: 10000, label: "Seuil 3", rate: "3%", color: "bg-blue-400" },
                      { value: 14000, label: "Seuil 4", rate: "4%", color: "bg-indigo-400" },
                      { value: 18000, label: "Seuil 5", rate: "6%", color: "bg-green-400" },
                    ].map((seuil, index) => {
                      const position = (seuil.value / 18000) * 100;
                      const isReached = kpisByType.caPondere >= seuil.value;
                      const isCurrent = kpisByType.caPondere >= seuil.value && 
                                       (index === 4 || kpisByType.caPondere < [
                                         { value: 6000 },
                                         { value: 10000 },
                                         { value: 14000 },
                                         { value: 18000 },
                                         { value: Infinity }
                                       ][index + 1]?.value || Infinity);

                      return (
                        <div
                          key={seuil.value}
                          className="absolute top-0 bottom-0 flex flex-col items-center"
                          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                        >
                          {/* Ligne verticale du seuil */}
                          <div className={cn(
                            "w-0.5 h-full",
                            isReached ? "bg-white dark:bg-slate-900" : "bg-slate-400 dark:bg-slate-600"
                          )} />
                          
                          {/* Point du seuil */}
                          <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-lg transition-all",
                            isReached ? seuil.color : "bg-slate-300 dark:bg-slate-600",
                            isCurrent && "ring-4 ring-emerald-500 ring-opacity-50 scale-125"
                          )} />
                          
                          {/* Label du seuil (au-dessus) */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className={cn(
                              "text-xs font-bold px-2 py-1 rounded",
                              isReached 
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-md" 
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                            )}>
                              {seuil.label}
                            </div>
                            <div className={cn(
                              "text-[10px] font-semibold mt-1 text-center",
                              isReached ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-500"
                            )}>
                              {seuil.rate}
                            </div>
                            <div className={cn(
                              "text-[10px] mt-0.5 text-center",
                              isReached ? "text-slate-600 dark:text-slate-400" : "text-slate-400 dark:text-slate-600"
                            )}>
                              {formatCurrency(seuil.value)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explications de chaque seuil en dessous */}
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      { value: 0, label: "Seuil 1", rate: 0, description: "Début de carrière", color: "gray" },
                      { value: 6000, label: "Seuil 2", rate: 2, description: "Premier palier", color: "yellow" },
                      { value: 10000, label: "Seuil 3", rate: 3, description: "Performance solide", color: "blue" },
                      { value: 14000, label: "Seuil 4", rate: 4, description: "Excellence", color: "indigo" },
                      { value: 18000, label: "Seuil 5", rate: 6, description: "Performance maximale", color: "green" },
                    ].map((seuil, index) => {
                      const isReached = kpisByType.caPondere >= seuil.value;
                      const isCurrent = commissionInfo.seuil === index + 1;
                      const nextSeuilValue = index < 4 ? [
                        { value: 6000 },
                        { value: 10000 },
                        { value: 14000 },
                        { value: 18000 },
                        { value: Infinity }
                      ][index + 1]?.value : Infinity;
                      const isNext = !isReached && kpisByType.caPondere < nextSeuilValue && (index === 0 || kpisByType.caPondere >= [
                        { value: 0 },
                        { value: 6000 },
                        { value: 10000 },
                        { value: 14000 },
                        { value: 18000 }
                      ][index]?.value);

                      const colorClasses = {
                        gray: {
                          bg: "bg-gray-100 dark:bg-gray-900/50",
                          border: "border-gray-300 dark:border-gray-700",
                          text: "text-gray-700 dark:text-gray-300",
                          rate: "text-gray-600 dark:text-gray-400",
                          active: "bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600"
                        },
                        yellow: {
                          bg: "bg-yellow-50 dark:bg-yellow-950/20",
                          border: "border-yellow-300 dark:border-yellow-700",
                          text: "text-yellow-700 dark:text-yellow-300",
                          rate: "text-yellow-600 dark:text-yellow-400",
                          active: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600"
                        },
                        blue: {
                          bg: "bg-blue-50 dark:bg-blue-950/20",
                          border: "border-blue-300 dark:border-blue-700",
                          text: "text-blue-700 dark:text-blue-300",
                          rate: "text-blue-600 dark:text-blue-400",
                          active: "bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600"
                        },
                        indigo: {
                          bg: "bg-indigo-50 dark:bg-indigo-950/20",
                          border: "border-indigo-300 dark:border-indigo-700",
                          text: "text-indigo-700 dark:text-indigo-300",
                          rate: "text-indigo-600 dark:text-indigo-400",
                          active: "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600"
                        },
                        green: {
                          bg: "bg-green-50 dark:bg-green-950/20",
                          border: "border-green-300 dark:border-green-700",
                          text: "text-green-700 dark:text-green-300",
                          rate: "text-green-600 dark:text-green-400",
                          active: "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600"
                        }
                      };

                      const colors = colorClasses[seuil.color as keyof typeof colorClasses];

                      return (
                        <div
                          key={seuil.value}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all",
                            isCurrent 
                              ? colors.active + " shadow-lg scale-105" 
                              : isReached
                              ? colors.bg + " " + colors.border + " shadow-md"
                              : colors.bg + " " + colors.border + " opacity-60"
                          )}
                        >
                          <div className="text-center">
                            {/* Label du seuil */}
                            <div className={cn(
                              "text-xs font-bold uppercase tracking-wide mb-2",
                              isCurrent ? colors.text + " font-extrabold" : colors.text
                            )}>
                              {seuil.label}
                            </div>
                            
                            {/* Pourcentage en relief */}
                            <div className={cn(
                              "text-4xl font-black mb-2",
                              isCurrent 
                                ? colors.rate + " drop-shadow-lg" 
                                : isReached
                                ? colors.rate
                                : "text-slate-400 dark:text-slate-600"
                            )}>
                              {seuil.rate}%
                            </div>
                            
                            {/* Montant */}
                            <div className={cn(
                              "text-sm font-semibold mb-1",
                              isCurrent ? colors.text : isReached ? colors.text : "text-slate-500 dark:text-slate-500"
                            )}>
                              {formatCurrency(seuil.value)}
                            </div>
                            
                            {/* Description */}
                            <div className={cn(
                              "text-xs mt-2",
                              isCurrent ? colors.text + " font-medium" : "text-muted-foreground"
                            )}>
                              {seuil.description}
                            </div>

                            {/* Indicateur de statut */}
                            {isCurrent && (
                              <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                ✓ Actuel
                              </div>
                            )}
                            {isReached && !isCurrent && (
                              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                                ✓ Atteint
                              </div>
                            )}
                            {isNext && (
                              <div className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                → Prochain objectif
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Informations supplémentaires */}
                  {commissionInfo.prochainSeuil > 0 && (
                    <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Objectif restant</div>
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(commissionInfo.objectifRestant)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Progression</div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {((kpisByType.caPondere / commissionInfo.prochainSeuil) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Graphiques détaillés (conditionnel - uniquement si commercial sélectionné) */}
          {selectedCommercial !== "all" && historicalData.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Graphique d'évolution des commissions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Évolution des commissions (6 mois)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="colorCommissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="commissions" stroke="#10b981" fill="url(#colorCommissions)" name="Commissions" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Camembert répartition CA par type */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-emerald-600" />
                    Répartition du CA par type d'acte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

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
                  
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveFilter({ type: null, value: null })}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        !activeFilter.type
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                          : "bg-muted hover:bg-muted/70"
                      )}
                    >
                      Tous
                    </button>
                    {["IND_AN_SANTE", "IND_AN_PREVOYANCE", "IND_AN_RETRAITE", "COLL_AN_SANTE", "COLL_AN_PREVOYANCE", "COLL_AN_RETRAITE", "COLL_ADHESION_RENFORT", "REVISION", "ADHESION_RENFORT", "COURTAGE_TO_ALLIANZ", "ALLIANZ_TO_COURTAGE"].map((kind) => (
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
                        {getHealthCollectiveActKindLabel(kind)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap ml-4">
                    <span className="text-sm font-medium text-muted-foreground">Origine :</span>
                    {["PROACTIF", "REACTIF", "PROSPECTION"].map((origine) => (
                      <button
                        key={origine}
                        onClick={() => setActiveFilter({ type: 'origine', value: origine })}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-all",
                          activeFilter.type === 'origine' && activeFilter.value === origine
                            ? getOriginBadgeColor(origine) + " shadow-md ring-2 ring-white dark:ring-slate-800"
                            : "bg-muted hover:bg-muted/70"
                        )}
                      >
                        {getHealthCollectiveActOriginLabel(origine)}
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
              <div className="overflow-x-auto rounded-xl border-2 border-emerald-200/50 dark:border-emerald-800/50 shadow-2xl">
                <table className="w-full border-collapse">
                  <thead className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-emerald-950/40">
                    <tr className="border-b-2 border-emerald-200/50 dark:border-emerald-800/50">
                      <th
                        className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                        aria-sort={getAriaSort("dateSaisie", sortConfig)}
                      >
                        <button
                          type="button"
                          onClick={() => handleSortChange("dateSaisie")}
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
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
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
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
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
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
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          N° Contrat
                          {renderSortIcon("numeroContrat")}
                        </button>
                      </th>
                      <th
                        className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                        aria-sort={getAriaSort("compagnie", sortConfig)}
                      >
                        <button
                          type="button"
                          onClick={() => handleSortChange("compagnie")}
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
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
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          Date effet
                          {renderSortIcon("dateEffet")}
                        </button>
                      </th>
                      <th
                        className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                        aria-sort={getAriaSort("prime", sortConfig)}
                      >
                        <button
                          type="button"
                          onClick={() => handleSortChange("prime")}
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          Prime
                          {renderSortIcon("prime")}
                        </button>
                      </th>
                      <th
                        className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                        aria-sort={getAriaSort("caAnnuel", sortConfig)}
                      >
                        <button
                          type="button"
                          onClick={() => handleSortChange("caAnnuel")}
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          CA Annuel
                          {renderSortIcon("caAnnuel")}
                        </button>
                      </th>
                      <th
                        className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                        aria-sort={getAriaSort("caPondere", sortConfig)}
                      >
                        <button
                          type="button"
                          onClick={() => handleSortChange("caPondere")}
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-bold uppercase hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          CA Pondéré
                          {renderSortIcon("caPondere")}
                        </button>
                      </th>
                      <th className="text-center p-4 font-bold text-xs uppercase tracking-wider text-foreground/80 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActs.map((act) => {
                      const dateSaisie = toDate(act.dateSaisie);
                      const dateEffet = toDate(act.dateEffet);
                      
                      return (
                        <tr
                          key={act.id}
                          className={cn(
                            "border-b transition-all duration-200 group",
                            "hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/20 hover:shadow-md"
                          )}
                        >
                          <td className="p-4 text-sm text-center align-middle">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{format(dateSaisie, "dd/MM/yyyy")}</span>
                              <span className="text-xs text-muted-foreground">{format(dateSaisie, "HH:mm")}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center align-middle">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded-full text-xs font-bold",
                              getOriginBadgeColor(act.origine)
                            )}>
                              {getHealthCollectiveActOriginLabel(act.origine)}
                            </span>
                          </td>
                          <td className="p-4 text-center align-middle">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded-full text-xs font-bold",
                              getKindBadgeColor(act.kind)
                            )}>
                              {getHealthCollectiveActKindLabel(act.kind)}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-semibold text-center align-middle">{act.clientNom}</td>
                          <td className="p-4 text-sm text-center align-middle">
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{act.numeroContrat || "-"}</span>
                          </td>
                          <td className="p-4 text-sm text-center align-middle">
                            <span className="font-medium">{act.compagnie}</span>
                          </td>
                          <td className="p-4 text-sm text-center align-middle">
                            <span className="font-medium">{format(dateEffet, "dd/MM/yyyy")}</span>
                          </td>
                          <td className="p-4 text-sm text-center align-middle">
                            <span className="font-semibold">{formatCurrency(act.prime)}</span>
                          </td>
                          <td className="p-4 text-sm text-center align-middle">
                            <span className="font-semibold">{formatCurrency(act.caAnnuel)}</span>
                          </td>
                          <td className="p-4 text-center align-middle">
                            <span className={cn(
                              "inline-flex px-3 py-1.5 rounded-full text-sm font-bold transition-all",
                              act.caPondere >= 1000
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md group-hover:shadow-lg group-hover:scale-105"
                                : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                            )}>
                              {formatCurrency(act.caPondere)}
                            </span>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <EditHealthCollectiveActDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, act: open ? editDialog.act : null })}
        act={editDialog.act}
        onSuccess={loadActs}
      />

      {/* Dialog de suppression */}
      <DeleteHealthCollectiveActDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, act: open ? deleteDialog.act : null })}
        act={deleteDialog.act}
        onSuccess={loadActs}
      />
    </div>
  );
}
