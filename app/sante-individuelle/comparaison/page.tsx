"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { HealthAct } from "@/types";
import { getHealthActsByMonth } from "@/lib/firebase/health-acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Timestamp } from "firebase/firestore";
import { calculateHealthKPI } from "@/lib/utils/health-kpi";
import { BarChart3, TrendingUp, TrendingDown, Sparkles, Zap, DollarSign, FileText, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

type MetricKey = 'commissionsAcquises' | 'caPondere' | 'caTotal' | 'nbActes' | 'nbAffaireNouvelle' | 'nbRevision' | 'nbAdhesionSalarie' | 'nbCourtToAz' | 'nbAzToCourtage';

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradientClass: string;
  chartColor: string;
  format: (value: number) => string;
  category?: 'global' | 'actes';
}

const METRICS: MetricConfig[] = [
  {
    key: 'commissionsAcquises',
    label: 'Commissions',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    gradientClass: 'bg-linear-yellow-orange',
    chartColor: '#eab308',
    format: formatCurrency,
    category: 'global',
  },
  {
    key: 'caPondere',
    label: 'CA Pondéré',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    gradientClass: 'bg-linear-purple-pink',
    chartColor: '#a855f7',
    format: formatCurrency,
    category: 'global',
  },
  {
    key: 'caTotal',
    label: 'CA Total',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-blue-600 dark:text-blue-400',
    gradientClass: 'bg-linear-blue-cyan',
    chartColor: '#3b82f6',
    format: formatCurrency,
    category: 'global',
  },
  {
    key: 'nbActes',
    label: 'Total actes',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-green-600 dark:text-green-400',
    gradientClass: 'bg-linear-green-emerald',
    chartColor: '#10b981',
    format: (v) => v.toFixed(0),
    category: 'global',
  },
  {
    key: 'nbAffaireNouvelle',
    label: 'Affaire Nouvelle',
    icon: <span className="text-xl">🆕</span>,
    color: 'text-blue-600 dark:text-blue-400',
    gradientClass: 'bg-linear-blue-cyan',
    chartColor: '#3b82f6',
    format: (v) => v.toFixed(0),
    category: 'actes',
  },
  {
    key: 'nbRevision',
    label: 'Révision',
    icon: <span className="text-xl">🔄</span>,
    color: 'text-purple-600 dark:text-purple-400',
    gradientClass: 'bg-linear-purple-pink',
    chartColor: '#a855f7',
    format: (v) => v.toFixed(0),
    category: 'actes',
  },
  {
    key: 'nbAdhesionSalarie',
    label: 'Adhésion salarié',
    icon: <span className="text-xl">👥</span>,
    color: 'text-orange-600 dark:text-orange-400',
    gradientClass: 'bg-linear-orange-amber',
    chartColor: '#f97316',
    format: (v) => v.toFixed(0),
    category: 'actes',
  },
  {
    key: 'nbCourtToAz',
    label: 'COURT → AZ',
    icon: <span className="text-xl">➡️</span>,
    color: 'text-cyan-600 dark:text-cyan-400',
    gradientClass: 'bg-linear-cyan-teal',
    chartColor: '#06b6d4',
    format: (v) => v.toFixed(0),
    category: 'actes',
  },
  {
    key: 'nbAzToCourtage',
    label: 'AZ → courtage',
    icon: <span className="text-xl">⬅️</span>,
    color: 'text-emerald-600 dark:text-emerald-400',
    gradientClass: 'bg-linear-emerald-green',
    chartColor: '#10b981',
    format: (v) => v.toFixed(0),
    category: 'actes',
  },
];

interface MonthData {
  month: string;
  monthKey: string;
  commissionsAcquises: number;
  caPondere: number;
  caTotal: number;
  nbActes: number;
  nbAffaireNouvelle: number;
  nbRevision: number;
  nbAdhesionSalarie: number;
  nbCourtToAz: number;
  nbAzToCourtage: number;
}

export default function ComparaisonPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['commissionsAcquises', 'caPondere']);

  const loadData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data: MonthData[] = [];
      const today = new Date();

      // Charger les 6 derniers mois
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthKey = format(monthDate, "yyyy-MM");
        
        const actsData = await getHealthActsByMonth(user.uid, monthKey);
        
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

        const kpi = calculateHealthKPI(convertedActs);

        data.push({
          month: format(monthDate, "MMMM yyyy", { locale: fr }),
          monthKey,
          commissionsAcquises: kpi.commissionsAcquises,
          caPondere: kpi.caPondere,
          caTotal: kpi.caTotal,
          nbActes: convertedActs.length,
          nbAffaireNouvelle: kpi.nbAffaireNouvelle,
          nbRevision: kpi.nbRevision,
          nbAdhesionSalarie: kpi.nbAdhesionSalarie,
          nbCourtToAz: kpi.nbCourtToAz,
          nbAzToCourtage: kpi.nbAzToCourtage,
        });
      }

      setMonthsData(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Calcul du maximum pour chaque métrique pour la normalisation
  const maxValues = useMemo(() => {
    const max: Record<MetricKey, number> = {
      commissionsAcquises: 0,
      caPondere: 0,
      caTotal: 0,
      nbActes: 0,
      nbAffaireNouvelle: 0,
      nbRevision: 0,
      nbAdhesionSalarie: 0,
      nbCourtToAz: 0,
      nbAzToCourtage: 0,
    };

    monthsData.forEach(month => {
      (Object.keys(max) as MetricKey[]).forEach(key => {
        if (month[key] > max[key]) {
          max[key] = month[key];
        }
      });
    });

    return max;
  }, [monthsData]);

  // Toggle metric selection
  const toggleMetric = (key: MetricKey) => {
    if (selectedMetrics.includes(key)) {
      // Ne pas permettre de tout désélectionner
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter(m => m !== key));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, key]);
    }
  };

  // Calcul des tendances
  const calculateTrend = (metricKey: MetricKey) => {
    if (monthsData.length < 2) return { value: 0, isPositive: true };
    
    const lastMonth = monthsData[monthsData.length - 1][metricKey];
    const previousMonth = monthsData[monthsData.length - 2][metricKey];
    
    if (previousMonth === 0) return { value: 0, isPositive: true };
    
    const percentChange = ((lastMonth - previousMonth) / previousMonth) * 100;
    return { value: Math.abs(percentChange), isPositive: percentChange >= 0 };
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 cyber-grid relative">
      {/* Effet de lumière de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-50 shadow-md supports-backdrop-filter:bg-white/80 supports-backdrop-filter:dark:bg-slate-950/80 energy-border">
        <div className="container mx-auto px-6 py-4 relative">
          <div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent neon-text flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-purple-500" />
              Comparaison sur 6 mois
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-semibold">
              Analysez l'évolution de vos performances
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* KPI Principal - Commissions Moyennes */}
        {!isLoading && monthsData.length > 0 && (
          <div className="mb-8 relative">
            {/* Effet de fond lumineux */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 blur-3xl animate-pulse-slow" />
            
            <Card className="border-0 shadow-2xl glass-morphism overflow-hidden relative">
              <div className="absolute inset-0 holographic opacity-30" />
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 shadow-lg shadow-yellow-500/50 animate-gradient" />
              
              <CardContent className="py-12 relative z-10">
                <div className="text-center space-y-6">
                  {/* Badge "Moyenne 6 mois" */}
                  <div className="flex justify-center">
                    <Badge className="px-6 py-2 text-sm font-black bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0 shadow-xl shadow-yellow-500/30 neon-border">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      MOYENNE SUR 6 MOIS
                    </Badge>
                  </div>

                  {/* Icône centrale */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 blur-2xl opacity-50 animate-pulse" />
                      <div className="relative bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-3xl shadow-2xl shadow-yellow-500/50 neon-border card-3d">
                        <DollarSign className="h-16 w-16 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Montant des commissions */}
                  <div>
                    <div className="text-7xl md:text-8xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent animate-gradient neon-text mb-2">
                      {formatCurrency(monthsData.reduce((sum, month) => sum + month.commissionsAcquises, 0) / monthsData.length)}
                    </div>
                    <p className="text-xl font-bold text-muted-foreground">
                      Commissions moyennes par mois
                    </p>
                  </div>

                  {/* Détails */}
                  <div className="flex justify-center gap-8 pt-6 border-t border-yellow-200/30 dark:border-yellow-800/30">
                    <div className="text-center">
                      <div className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(monthsData.reduce((sum, month) => sum + month.commissionsAcquises, 0))}
                      </div>
                      <p className="text-sm text-muted-foreground font-bold mt-1">Total sur 6 mois</p>
                    </div>
                    <div className="h-16 w-px bg-gradient-to-b from-transparent via-yellow-500 to-transparent" />
                    <div className="text-center">
                      <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
                        {(() => {
                          const trend = calculateTrend('commissionsAcquises');
                          return (
                            <div className="flex items-center justify-center gap-2">
                              {trend.isPositive ? (
                                <TrendingUp className="h-8 w-8 text-green-600" />
                              ) : (
                                <TrendingDown className="h-8 w-8 text-red-600" />
                              )}
                              <span className={cn(trend.isPositive ? "text-green-600" : "text-red-600")}>
                                {trend.value.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-sm text-muted-foreground font-bold mt-1">vs mois dernier</p>
                    </div>
                  </div>

                  {/* Info bulle explicative */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                      💡 <span className="font-black">Comment c'est calculé ?</span> Les commissions sont calculées selon votre CA pondéré mensuel :
                      0-10k€ = 0% | 10-14k€ = 2% | 14-18k€ = 3% | 18-22k€ = 4% | +22k€ = 6%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sélection des métriques */}
        <Card className="mb-6 border-0 shadow-2xl glass-morphism overflow-hidden relative">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 via-pink-500 to-purple-500 shadow-lg shadow-purple-500/50" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 font-black">
              <div className="h-8 w-1 bg-linear-to-b from-purple-500 to-pink-600 rounded-full neon-border" />
              Métriques à afficher
              <Sparkles className="h-5 w-5 text-purple-500" />
            </CardTitle>
            <CardDescription className="font-semibold">
              Sélectionnez les indicateurs à comparer
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            {/* Métriques globales */}
            <div>
              <h3 className="text-sm font-black text-muted-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                MÉTRIQUES GLOBALES
              </h3>
              <div className="flex flex-wrap gap-3">
                {METRICS.filter(m => m.category === 'global').map((metric) => {
                  const isSelected = selectedMetrics.includes(metric.key);
                  const trend = calculateTrend(metric.key);
                  
                  return (
                    <button
                      key={metric.key}
                      onClick={() => toggleMetric(metric.key)}
                      className={cn(
                        "px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 border-2 card-3d relative overflow-hidden group",
                        isSelected
                          ? `${metric.gradientClass} text-white border-transparent shadow-xl`
                          : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-purple-500/50"
                      )}
                    >
                      {isSelected && <div className="absolute inset-0 holographic opacity-20" />}
                      <div className="flex items-center gap-2 relative z-10">
                        {metric.icon}
                        <span>{metric.label}</span>
                        {isSelected && monthsData.length > 0 && (
                          <Badge className={cn(
                            "ml-2 font-black",
                            trend.isPositive 
                              ? "bg-green-500/30 text-white border-green-400/50" 
                              : "bg-red-500/30 text-white border-red-400/50"
                          )}>
                            {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {trend.value.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Métriques par type d'acte */}
            <div>
              <h3 className="text-sm font-black text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PAR TYPE D'ACTE
              </h3>
              <div className="flex flex-wrap gap-3">
                {METRICS.filter(m => m.category === 'actes').map((metric) => {
                  const isSelected = selectedMetrics.includes(metric.key);
                  const trend = calculateTrend(metric.key);
                  
                  return (
                    <button
                      key={metric.key}
                      onClick={() => toggleMetric(metric.key)}
                      className={cn(
                        "px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 border-2 card-3d relative overflow-hidden group",
                        isSelected
                          ? `${metric.gradientClass} text-white border-transparent shadow-xl`
                          : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-purple-500/50"
                      )}
                    >
                      {isSelected && <div className="absolute inset-0 holographic opacity-20" />}
                      <div className="flex items-center gap-2 relative z-10">
                        {metric.icon}
                        <span>{metric.label}</span>
                        {isSelected && monthsData.length > 0 && (
                          <Badge className={cn(
                            "ml-2 font-black",
                            trend.isPositive 
                              ? "bg-green-500/30 text-white border-green-400/50" 
                              : "bg-red-500/30 text-white border-red-400/50"
                          )}>
                            {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {trend.value.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Graphique */}
        <Card className="border-0 shadow-2xl glass-morphism overflow-hidden relative cyber-card">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 font-black">
              <Activity className="h-5 w-5 text-purple-500" />
              Évolution sur 6 mois
            </CardTitle>
            <CardDescription className="font-semibold">
              Comparaison visuelle des indicateurs sélectionnés
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="h-16 w-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-600" />
                  <div className="absolute inset-0 h-16 w-16 border-4 border-transparent rounded-full animate-spin border-t-pink-400" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                </div>
                <p className="text-center mt-4 text-sm text-muted-foreground font-bold">Chargement des données...</p>
              </div>
            ) : monthsData.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-4 bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl mb-4 shadow-lg">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-bold text-lg">
                  Aucune donnée disponible
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Graphique principal en courbes */}
                <div>
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Évolution des métriques
                  </h4>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={monthsData.map(m => ({
                      month: format(new Date(m.monthKey), "MMM yy", { locale: fr }),
                      ...selectedMetrics.reduce((acc, key) => ({
                        ...acc,
                        [key]: m[key]
                      }), {})
                    }))}>
                      <defs>
                        {selectedMetrics.map((metricKey) => {
                          const metric = METRICS.find(m => m.key === metricKey)!;
                          
                          return (
                            <linearGradient key={metricKey} id={`color${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={metric.chartColor} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={metric.chartColor} stopOpacity={0.1}/>
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs font-bold"
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                        stroke="currentColor"
                        strokeOpacity={0.3}
                      />
                      <YAxis 
                        className="text-xs font-bold"
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                        stroke="currentColor"
                        strokeOpacity={0.3}
                        tickFormatter={(value) => {
                          // Format selon la première métrique sélectionnée
                          const firstMetric = METRICS.find(m => m.key === selectedMetrics[0])!;
                          if (selectedMetrics[0].includes('nb')) {
                            return value.toString();
                          }
                          return `${(value / 1000).toFixed(0)}k€`;
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        }}
                        labelStyle={{ 
                          fontWeight: 'bold',
                          marginBottom: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: number, name: string) => {
                          const metric = METRICS.find(m => m.key === name)!;
                          return [metric.format(value), metric.label];
                        }}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: '20px',
                        }}
                        formatter={(value) => {
                          const metric = METRICS.find(m => m.key === value);
                          return metric?.label || value;
                        }}
                      />
                      {selectedMetrics.map((metricKey) => {
                        const metric = METRICS.find(m => m.key === metricKey)!;
                        
                        return (
                          <Area
                            key={metricKey}
                            type="monotone"
                            dataKey={metricKey}
                            stroke={metric.chartColor}
                            strokeWidth={3}
                            fill={`url(#color${metricKey})`}
                            dot={{ fill: metric.chartColor, r: 5, strokeWidth: 2, stroke: 'white' }}
                            activeDot={{ r: 7, strokeWidth: 2 }}
                          />
                        );
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Statistiques globales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-purple-200/30 dark:border-purple-800/30">
                  {selectedMetrics.map((metricKey) => {
                    const metric = METRICS.find(m => m.key === metricKey)!;
                    const total = monthsData.reduce((sum, month) => sum + month[metricKey], 0);
                    const average = total / monthsData.length;
                    const trend = calculateTrend(metricKey);

                    return (
                      <div 
                        key={metricKey}
                        className="p-4 rounded-xl border-2 bg-linear-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-300/50 dark:border-slate-700/50 glass-morphism relative overflow-hidden group card-3d"
                      >
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("p-2 rounded-lg", metric.gradientClass)}>
                              <div className="text-white">
                                {metric.icon}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">{metric.label}</span>
                          </div>
                          <div className={cn("text-2xl font-black mb-1", metric.color)}>
                            {metric.format(average)}
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {trend.isPositive ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span className={cn(
                              "font-bold",
                              trend.isPositive ? "text-green-600" : "text-red-600"
                            )}>
                              {trend.isPositive ? '+' : '-'}{trend.value.toFixed(1)}%
                            </span>
                            <span className="text-muted-foreground ml-1">vs mois dernier</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

