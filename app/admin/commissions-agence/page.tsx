"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, TrendingUp, TrendingDown, Trophy, AlertTriangle, Shield, Gem, Handshake, Star, DollarSign, Package, CheckCircle, User, Sparkles, LineChart as LineChartIcon, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getAvailableYears, getYearCommissions } from "@/lib/firebase/agency-commissions";
import { AgencyCommission } from "@/types";
import { formatCurrencyInteger, formatThousands, getMonthShortName, extrapolateYear } from "@/lib/utils/commission-calculator";
import { calculateTotalEtp, formatEtp, calculateCommissionsPerEtp } from "@/lib/utils/etp-calculator";
import { MonthDataDialog } from "@/components/admin/commissions/month-data-dialog";
import { CreateYearDialog } from "@/components/admin/commissions/create-year-dialog";
import { cn } from "@/lib/utils";

export default function CommissionsAgencePage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearData, setYearData] = useState<AgencyCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour les modals
  const [monthDialog, setMonthDialog] = useState<{
    open: boolean;
    month: number;
    data: AgencyCommission | null;
  }>({ open: false, month: 1, data: null });
  
  const [createYearDialog, setCreateYearDialog] = useState(false);
  
  // État pour la métrique sélectionnée dans les KPI
  const [selectedMetric, setSelectedMetric] = useState<'resultat' | 'totalCommissions' | 'chargesAgence' | 'commissionsIARD' | 'commissionsVie' | 'commissionsCourtage'>('totalCommissions');
  
  // États pour la comparaison multi-années
  const [selectedYearsForComparison, setSelectedYearsForComparison] = useState<number[]>([]);
  const [comparisonMetric, setComparisonMetric] = useState<'resultat' | 'totalCommissions' | 'chargesAgence' | 'commissionsIARD' | 'commissionsVie' | 'commissionsCourtage'>('totalCommissions');
  const [allYearsData, setAllYearsData] = useState<Record<number, AgencyCommission[]>>({});
  
  // États pour les utilisateurs et ETP
  const [users, setUsers] = useState<Array<{ etp?: string; active: boolean }>>([]);
  const [totalEtp, setTotalEtp] = useState<number>(0);
  
  // États pour le ratio de l'année précédente
  const [previousYearRatio, setPreviousYearRatio] = useState<number | null>(null);
  const [previousYearForDisplay, setPreviousYearForDisplay] = useState<number | null>(null);

  // Charger les années disponibles
  const loadYears = async () => {
    const years = await getAvailableYears();
    setAvailableYears(years);
    
    if (years.length > 0) {
      // Par défaut: année la plus récente
      const latestYear = Math.max(...years);
      setSelectedYear(latestYear);
      
      // Sélectionner par défaut les 2 dernières années pour la comparaison
      const defaultYears = years.slice(0, Math.min(2, years.length));
      setSelectedYearsForComparison(defaultYears);
    }
    
    // Charger toutes les données des années pour la comparaison
    const allData: Record<number, AgencyCommission[]> = {};
    for (const year of years) {
      const data = await getYearCommissions(year);
      allData[year] = data;
    }
    setAllYearsData(allData);
  };

  // Charger les données de l'année sélectionnée
  const loadYearData = async () => {
    setIsLoading(true);
    const data = await getYearCommissions(selectedYear);
    setYearData(data);
    setIsLoading(false);
  };

  // Charger les utilisateurs pour calculer les ETP
  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Erreur chargement utilisateurs");
      const data = await response.json();
      setUsers(data.users || []);
      
      // Calculer le total des ETP
      const etp = calculateTotalEtp(data.users || []);
      setTotalEtp(etp);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Charger les données de l'année précédente si nécessaire
  const loadPreviousYearIfNeeded = async () => {
    // Vérifier si l'année a au moins un mois avec bénéfice
    const hasYearProfit = yearData.some((month) => month.resultat > 0);
    
    if (!hasYearProfit && availableYears.length > 0) {
      // Chercher l'année précédente disponible
      const prevYear = selectedYear - 1;
      
      try {
        const prevData = await getYearCommissions(prevYear);
        
        if (prevData.length > 0) {
          // Calculer le ratio de l'année précédente
          const prevMonthsWithData = prevData.filter((d) => d.totalCommissions > 0 || d.chargesAgence > 0).length;
          const prevIsIncomplete = prevMonthsWithData < 12;
          const prevExtrapolated = extrapolateYear(prevData);
          const prevTotals = prevData.reduce(
            (acc, month) => ({
              totalCommissions: acc.totalCommissions + month.totalCommissions,
            }),
            { totalCommissions: 0 }
          );
          
          const prevCommissions = prevIsIncomplete 
            ? prevExtrapolated.totalCommissions 
            : prevTotals.totalCommissions;
          
          if (totalEtp > 0) {
            const ratio = calculateCommissionsPerEtp(prevCommissions, totalEtp);
            setPreviousYearRatio(ratio);
            setPreviousYearForDisplay(prevYear);
          }
        } else {
          setPreviousYearRatio(null);
          setPreviousYearForDisplay(null);
        }
      } catch (error) {
        console.error("Erreur chargement année précédente:", error);
        setPreviousYearRatio(null);
        setPreviousYearForDisplay(null);
      }
    } else {
      setPreviousYearRatio(null);
      setPreviousYearForDisplay(null);
    }
  };

  useEffect(() => {
    loadYears();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadYearData();
    }
  }, [selectedYear]);
  
  useEffect(() => {
    if (yearData.length > 0 && totalEtp > 0) {
      loadPreviousYearIfNeeded();
    }
  }, [yearData, selectedYear, totalEtp]);

  const handleMonthClick = (month: number) => {
    const existingData = yearData.find((d) => d.month === month) || null;
    setMonthDialog({ open: true, month, data: existingData });
  };

  const handleDialogSuccess = () => {
    loadYearData();
  };

  const handleCreateYearSuccess = () => {
    loadYears();
  };

  // Calculer les KPIs
  const totals = yearData.reduce(
    (acc, month) => ({
      totalCommissions: acc.totalCommissions + month.totalCommissions,
      chargesAgence: acc.chargesAgence + month.chargesAgence,
      resultat: acc.resultat + month.resultat,
      commissionsIARD: acc.commissionsIARD + month.commissionsIARD,
      commissionsVie: acc.commissionsVie + month.commissionsVie,
      commissionsCourtage: acc.commissionsCourtage + month.commissionsCourtage,
      profitsExceptionnels: acc.profitsExceptionnels + month.profitsExceptionnels,
    }),
    {
      totalCommissions: 0,
      chargesAgence: 0,
      resultat: 0,
      commissionsIARD: 0,
      commissionsVie: 0,
      commissionsCourtage: 0,
      profitsExceptionnels: 0,
    }
  );

  const completeMonths = yearData.filter((d) => d.totalCommissions > 0 || d.chargesAgence > 0);
  const completeMonthsCount = completeMonths.length;
  const monthsWithData = completeMonthsCount;

  const extrapolated = extrapolateYear(yearData);
  const isIncomplete = completeMonthsCount < 12;
  
  // Vérifier si l'année a au moins un mois avec bénéfice
  const hasProfit = yearData.some((month) => month.resultat > 0);

  // Fonction pour obtenir la valeur de la métrique sélectionnée
  const getMetricValue = (month: AgencyCommission) => {
    switch (selectedMetric) {
      case 'resultat': return month.resultat;
      case 'totalCommissions': return month.totalCommissions;
      case 'chargesAgence': return month.chargesAgence;
      case 'commissionsIARD': return month.commissionsIARD;
      case 'commissionsVie': return month.commissionsVie;
      case 'commissionsCourtage': return month.commissionsCourtage;
      default: return month.resultat;
    }
  };

  // KPIs calculés selon la métrique sélectionnée (extrapolé = mois complets uniquement)
  const currentMetricTotal = totals[selectedMetric];
  const currentMetricExtrapolated = extrapolated[selectedMetric];
  const averageMonthly = isIncomplete
    ? Math.round(currentMetricExtrapolated / 12)
    : Math.round((currentMetricTotal || 0) / 12);

  // Meilleur et pire mois pour la métrique sélectionnée
  const monthsWithResults = yearData.filter((d) => d.totalCommissions > 0);
  const bestMonth = monthsWithResults.length > 0 
    ? monthsWithResults.reduce((max, m) => getMetricValue(m) > getMetricValue(max) ? m : max)
    : null;
  const worstMonth = monthsWithResults.length > 0
    ? monthsWithResults.reduce((min, m) => getMetricValue(m) < getMetricValue(min) ? m : min)
    : null;

  // Labels et icônes par métrique
  const metricConfig = {
    resultat: { label: 'Résultat', icon: CheckCircle, color: 'text-green-600' },
    totalCommissions: { label: 'Total Commissions', icon: DollarSign, color: 'text-yellow-600' },
    chargesAgence: { label: 'Charges Agence', icon: Package, color: 'text-red-600' },
    commissionsIARD: { label: 'IARD', icon: Shield, color: 'text-blue-600' },
    commissionsVie: { label: 'Vie', icon: Gem, color: 'text-purple-600' },
    commissionsCourtage: { label: 'Courtage', icon: Handshake, color: 'text-cyan-600' },
  };

  const currentConfig = metricConfig[selectedMetric];

  // Composant de tooltip personnalisé pour le graphique
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    // Trier les données par année décroissante (plus récente en haut)
    const sortedPayload = [...payload].sort((a, b) => {
      const yearA = parseInt(a.name);
      const yearB = parseInt(b.name);
      return yearB - yearA;
    });

    return (
      <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="font-black text-sm mb-2 text-gray-900 dark:text-gray-100">{label}</p>
        <div className="space-y-1.5">
          {sortedPayload.map((entry: any, index: number) => {
            const value = entry.value;
            const year = entry.name;
            const color = entry.stroke;

            // Calculer le pourcentage par rapport à l'année précédente
            let percentChange = null;
            if (index < sortedPayload.length - 1) {
              const previousValue = sortedPayload[index + 1].value;
              if (previousValue && previousValue !== 0 && value !== null) {
                percentChange = ((value - previousValue) / previousValue) * 100;
              }
            }

            return (
              <div key={year} className="space-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-xs text-gray-700 dark:text-gray-300">
                      {year}
                    </span>
                  </div>
                  <span className="font-black text-sm" style={{ color }}>
                    {value !== null ? formatCurrencyInteger(value) : '—'}
                  </span>
                </div>
                {percentChange !== null && (
                  <div className="pl-5 text-xs font-semibold flex items-center gap-1">
                    {percentChange > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">
                          +{percentChange.toFixed(1)}%
                        </span>
                      </>
                    ) : percentChange < 0 ? (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">
                          {percentChange.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">0%</span>
                    )}
                    <span className="text-gray-500 text-xs">
                      vs {sortedPayload[index + 1].name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Préparer les données pour le graphique de comparaison
  const comparisonData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const dataPoint: any = {
      month: getMonthShortName(month),
      monthNumber: month,
    };

    selectedYearsForComparison.forEach((year) => {
      const yearData = allYearsData[year] || [];
      const monthData = yearData.find((d) => d.month === month);
      
      if (monthData) {
        dataPoint[`year${year}`] = monthData[comparisonMetric];
      } else {
        dataPoint[`year${year}`] = null;
      }
    });

    return dataPoint;
  });

  // Couleurs pour les courbes (4 couleurs différentes)
  const yearColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']; // blue, purple, green, orange

  const toggleYearSelection = (year: number) => {
    if (selectedYearsForComparison.includes(year)) {
      setSelectedYearsForComparison(selectedYearsForComparison.filter((y) => y !== year));
    } else {
      // Limiter à 4 années maximum pour la lisibilité
      if (selectedYearsForComparison.length < 4) {
        setSelectedYearsForComparison([...selectedYearsForComparison, year].sort((a, b) => b - a));
      }
    }
  };

  const rows = [
    { icon: Shield, label: "🛡️ IARD", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", getValue: (m: AgencyCommission) => m.commissionsIARD },
    { icon: Gem, label: "💎 Vie", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", getValue: (m: AgencyCommission) => m.commissionsVie },
    { icon: Handshake, label: "🤝 Courtage", color: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950/30", getValue: (m: AgencyCommission) => m.commissionsCourtage },
    { icon: Star, label: "⭐ Profits except.", color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", getValue: (m: AgencyCommission) => m.profitsExceptionnels },
    { icon: DollarSign, label: "💰 Total", color: "text-yellow-600", bgColor: "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30", getValue: (m: AgencyCommission) => m.totalCommissions, isTotal: true },
    { icon: Package, label: "📦 Charges", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30", getValue: (m: AgencyCommission) => m.chargesAgence },
    { icon: CheckCircle, label: "✅ Résultat", color: "text-green-600", bgColor: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", getValue: (m: AgencyCommission) => m.resultat, isResult: true },
    { icon: User, label: "👤 Prélèv. Julien", color: "text-blue-600", bgColor: "bg-blue-50/50 dark:bg-blue-950/20", getValue: (m: AgencyCommission) => m.prelevementsJulien, isInfo: true },
    { icon: User, label: "👤 Prélèv. J-M", color: "text-blue-600", bgColor: "bg-blue-50/50 dark:bg-blue-950/20", getValue: (m: AgencyCommission) => m.prelevementsJeanMichel, isInfo: true },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-xl animate-pulse">
            <Coins className="h-8 w-8 text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
              COMMISSIONS AGENCE
            </h1>
            <p className="text-sm text-muted-foreground font-semibold">Suivi mensuel et annuel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sélecteur d'année */}
          {availableYears.length > 0 ? (
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v, 10))}>
              <SelectTrigger className="w-40 font-bold text-lg border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="font-bold">
                    {year}
                    {year === new Date().getFullYear() && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Actuelle
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="px-4 py-2">
              Aucune année
            </Badge>
          )}

          <Button
            onClick={() => setCreateYearDialog(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl gap-2 font-bold"
          >
            <Plus className="h-4 w-4" />
            Créer une année
          </Button>
        </div>
      </div>

      {/* Sélecteur de métrique pour les KPI */}
      {monthsWithData > 0 && (
        <div className="space-y-4">
          <Card className="border-2 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground">Afficher les KPI pour:</span>
                <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
                  <SelectTrigger className="w-64 font-bold border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resultat" className="font-bold">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        ✅ Résultat
                      </div>
                    </SelectItem>
                    <SelectItem value="totalCommissions" className="font-bold">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                        💰 Total Commissions
                      </div>
                    </SelectItem>
                    <SelectItem value="chargesAgence" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-red-600" />
                        📦 Charges Agence
                      </div>
                    </SelectItem>
                    <SelectItem value="commissionsIARD" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        🛡️ Commissions IARD
                      </div>
                    </SelectItem>
                    <SelectItem value="commissionsVie" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Gem className="h-4 w-4 text-purple-600" />
                        💎 Commissions Vie
                      </div>
                    </SelectItem>
                    <SelectItem value="commissionsCourtage" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Handshake className="h-4 w-4 text-cyan-600" />
                        🤝 Commissions Courtage
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-4 border-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 shadow-2xl hover:shadow-[0_20px_50px_rgba(251,191,36,0.5)] transition-all relative overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-amber-950/30 dark:to-orange-950/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full blur-2xl"></div>
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <currentConfig.icon className="h-5 w-5 text-amber-600 drop-shadow-lg" />
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {isIncomplete ? "💰 Total Extrapolé" : "💰 Total Année"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent drop-shadow-sm">
                  {formatCurrencyInteger(isIncomplete ? currentMetricExtrapolated : currentMetricTotal)}
                </div>
                {isIncomplete && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-bold">
                    ⚡ Basé sur {monthsWithData} mois
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-600" />
                  Meilleur Mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bestMonth ? (
                  <>
                    <div className="text-2xl font-black text-green-600">
                      {formatCurrencyInteger(getMetricValue(bestMonth))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold">
                      🏆 {getMonthShortName(bestMonth.month)} {selectedYear}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Aucune donnée</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Pire Mois
          </CardTitle>
        </CardHeader>
              <CardContent>
                {worstMonth ? (
                  <>
                    <div className="text-2xl font-black text-orange-600">
                      {formatCurrencyInteger(getMetricValue(worstMonth))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold">
                      ⚠️ {getMonthShortName(worstMonth.month)} {selectedYear}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Aucune donnée</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Moyenne Mensuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-purple-600">
                  {formatCurrencyInteger(averageMonthly)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-semibold">
                  Sur {monthsWithData} mois
                </p>
              </CardContent>
            </Card>

            <Card className="border-4 border-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 shadow-2xl hover:shadow-[0_20px_50px_rgba(59,130,246,0.5)] transition-all relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/30 dark:via-blue-950/30 dark:to-indigo-950/30">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600 drop-shadow-lg" />
                  <span className="bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                    🚀 Commissions / ETP
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {totalEtp > 0 ? (
                  <>
                    <div className="text-3xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
                      {(() => {
                        // Calculer le ratio pour l'année courante
                        const currentCommissions = isIncomplete 
                          ? extrapolated.totalCommissions 
                          : totals.totalCommissions;
                        
                        const currentRatio = calculateCommissionsPerEtp(currentCommissions, totalEtp);
                        
                        // Utiliser le ratio de l'année précédente si pas de bénéfice
                        const displayRatio = !hasProfit && previousYearRatio !== null 
                          ? previousYearRatio 
                          : currentRatio;
                        
                        return formatCurrencyInteger(displayRatio);
                      })()}
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 font-bold">
                      📊 {formatEtp(totalEtp)} ETP
                      {!hasProfit && previousYearRatio !== null && previousYearForDisplay !== null && (
                        <span className="block mt-1 text-orange-600 font-extrabold animate-pulse">
                          ⚠️ Ratio {previousYearForDisplay} (année précédente)
                        </span>
                      )}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Aucun ETP configuré
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Section de comparaison multi-années */}
      {availableYears.length > 1 && (
        <Card className="border-2 shadow-2xl overflow-hidden bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-cyan-50/50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="border-b-2 bg-gradient-to-r from-purple-100/80 to-blue-100/80 dark:from-purple-950/40 dark:to-blue-950/40">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-black text-xl">
                <LineChartIcon className="h-6 w-6 text-purple-600" />
                Évolution Annuelle
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Sélecteurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sélection des années */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground">
                  Sélectionner les années à comparer (max 4):
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableYears.map((year, index) => {
                    const isSelected = selectedYearsForComparison.includes(year);
                    const colorClass = yearColors[selectedYearsForComparison.indexOf(year)] || yearColors[0];
                    
                    return (
                      <Button
                        key={year}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => toggleYearSelection(year)}
                        disabled={!isSelected && selectedYearsForComparison.length >= 4}
                        className={cn(
                          "font-bold transition-all",
                          isSelected && "shadow-lg scale-105"
                        )}
                        style={isSelected ? { backgroundColor: colorClass, borderColor: colorClass } : undefined}
                      >
                        {year}
                        {year === new Date().getFullYear() && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-white/20">
                            Actuelle
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
                {selectedYearsForComparison.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Sélectionnez au moins une année pour afficher le graphique
                  </p>
                )}
                {selectedYearsForComparison.length >= 4 && (
                  <p className="text-xs text-orange-600 font-semibold">
                    Maximum 4 années atteint
                  </p>
                )}
              </div>

              {/* Sélection de la métrique */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground">
                  Métrique à comparer:
                </label>
                <Select value={comparisonMetric} onValueChange={(v: any) => setComparisonMetric(v)}>
                  <SelectTrigger className="w-full font-bold border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalCommissions" className="font-bold">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                        💰 Total Commissions
                      </div>
                    </SelectItem>
                    <SelectItem value="resultat" className="font-bold">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        ✅ Résultat
                      </div>
                    </SelectItem>
                    <SelectItem value="chargesAgence" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-red-600" />
                        📦 Charges Agence
                      </div>
                    </SelectItem>
                    <SelectItem value="commissionsIARD" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        🛡️ Commissions IARD
                      </div>
                    </SelectItem>
                    <SelectItem value="commissionsVie" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Gem className="h-4 w-4 text-purple-600" />
                        💎 Commissions Vie
                      </div>
                    </SelectItem>
                    <SelectItem value="commissionsCourtage" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Handshake className="h-4 w-4 text-cyan-600" />
                        🤝 Commissions Courtage
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Graphique */}
            {selectedYearsForComparison.length > 0 ? (
              <div className="p-6 bg-white dark:bg-gray-950 rounded-xl border-2 shadow-inner">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 'bold' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontWeight: 'bold', paddingTop: '20px' }}
                    />
                    {selectedYearsForComparison.map((year, index) => (
                      <Line
                        key={year}
                        type="monotone"
                        dataKey={`year${year}`}
                        name={year.toString()}
                        stroke={yearColors[index]}
                        strokeWidth={3}
                        dot={{ r: 5, fill: yearColors[index] }}
                        activeDot={{ r: 7 }}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-gray-950 rounded-xl border-2 border-dashed">
                <LineChartIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-semibold">
                  Sélectionnez au moins une année pour afficher le graphique
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tableau principal */}
      <Card className="border-2 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-b-2">
          <CardTitle className="flex items-center gap-2 font-black">
            <Coins className="h-5 w-5 text-yellow-600" />
            Tableau mensuel {selectedYear}
            {isIncomplete && (
              <Badge variant="secondary" className="ml-2">
                {monthsWithData} / 12 mois
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Chargement...</div>
          ) : yearData.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <p className="text-muted-foreground font-semibold">Aucune donnée pour {selectedYear}</p>
              <Button
                onClick={() => setCreateYearDialog(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2 font-bold"
              >
                <Plus className="h-4 w-4" />
                Créer cette année
            </Button>
          </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-left font-black text-sm">Métrique</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                      <th key={month} className="px-3 py-3 text-center font-black text-sm">
                        {getMonthShortName(month)}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-black text-sm bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 border-l-4 border-yellow-500">
                      {isIncomplete ? "Extrapolé" : "Total"}
                    </th>
                    <th className="px-4 py-3 text-center font-black text-sm bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border-l-2 border-purple-400">
                      Moyenne
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const rowTotal = yearData.reduce((sum, m) => sum + row.getValue(m), 0);
                    const rowTotalComplete = completeMonths.reduce((sum, m) => sum + row.getValue(m), 0);
                    const extrapolatedValue = isIncomplete
                      ? (completeMonthsCount === 0 ? 0 : Math.round((rowTotalComplete / completeMonthsCount) * 12))
                      : rowTotal;
                    const averageValue = Math.round(extrapolatedValue / 12);

                    return (
                      <tr
                        key={idx}
                        className={cn(
                          "border-b hover:bg-muted/30 transition-colors",
                          row.bgColor
                        )}
                      >
                        <td className={cn("px-4 py-3 font-bold text-sm", row.color)}>
                          {row.label}
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                          const monthData = yearData.find((d) => d.month === month);
                          const value = monthData ? row.getValue(monthData) : 0;
                          const hasData = monthData && (
                            monthData.totalCommissions > 0 ||
                            monthData.chargesAgence > 0 ||
                            monthData.prelevementsJulien > 0 ||
                            monthData.prelevementsJeanMichel > 0
                          );

                          return (
                            <td
                              key={month}
                              onClick={() => handleMonthClick(month)}
                              className={cn(
                                "px-3 py-3 text-center font-mono cursor-pointer",
                                "hover:bg-yellow-100 dark:hover:bg-yellow-950/40 hover:scale-105 transition-all",
                                "border-l border-border/50",
                                row.isTotal && "font-black text-yellow-700 dark:text-yellow-400",
                                row.isResult && "font-black text-green-700 dark:text-green-400",
                                !hasData && "text-muted-foreground/50"
                              )}
                            >
                              {hasData ? formatThousands(value) : "—"}
                            </td>
                          );
                        })}
                        <td
                          className={cn(
                            "px-4 py-3 text-center font-mono font-black text-lg border-l-4 border-yellow-500",
                            "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30",
                            row.isTotal && "text-yellow-700 dark:text-yellow-400",
                            row.isResult && extrapolatedValue >= 0 
                              ? "text-green-700 dark:text-green-400" 
                              : row.isResult && "text-red-700 dark:text-red-400"
                          )}
                        >
                          {formatThousands(extrapolatedValue)}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 text-center font-mono font-black text-base border-l-2 border-purple-400",
                            "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
                            row.isTotal && "text-yellow-600 dark:text-yellow-500",
                            row.isResult && averageValue >= 0 
                              ? "text-green-600 dark:text-green-500" 
                              : row.isResult && "text-red-600 dark:text-red-500"
                          )}
                        >
                          {formatThousands(averageValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
          💡 <span className="font-black">Astuce:</span> Cliquez sur n'importe quel mois pour saisir ou modifier les données
        </p>
      </div>

      {/* Dialogs */}
      <MonthDataDialog
        open={monthDialog.open}
        onOpenChange={(open) => setMonthDialog({ ...monthDialog, open })}
        year={selectedYear}
        month={monthDialog.month}
        existingData={monthDialog.data}
        onSuccess={handleDialogSuccess}
      />

      <CreateYearDialog
        open={createYearDialog}
        onOpenChange={setCreateYearDialog}
        onSuccess={handleCreateYearSuccess}
        existingYears={availableYears}
      />
    </div>
  );
}
