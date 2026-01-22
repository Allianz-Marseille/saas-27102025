"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { HealthCollectiveAct } from "@/types";
import { getHealthCollectiveActsByMonth } from "@/lib/firebase/health-collective-acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Timestamp } from "firebase/firestore";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { calculateHealthCollectiveKPI } from "@/lib/utils/health-collective-kpi";
import { getHealthCollectiveCommissionRate } from "@/lib/utils/health-kpi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { WeatherCard } from "@/components/admin/weather-card";
import { 
  TrendingUp, 
  Target, 
  DollarSign,
  FileText,
  Activity,
  Calendar,
  Trophy,
  Zap,
  Star,
  Award,
  Crown,
  Flame,
  Sparkles,
  HelpCircle
} from "lucide-react";

// Composant de compteur animé
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <>{prefix}{displayValue.toLocaleString()}{suffix}</>;
}

// Composant de badge achievement avec tooltip amélioré
function AchievementBadge({ icon, label, achieved, color, target, description }: { icon: React.ReactNode; label: string; achieved: boolean; color: string; target: string; description: string }) {
  return (
    <div 
      className={`relative group ${achieved ? 'opacity-100' : 'opacity-50 grayscale'}`}
    >
      <div className={`p-4 rounded-xl ${achieved ? `bg-linear-to-br ${color} achievement-badge` : 'bg-slate-200 dark:bg-slate-800'} transition-all duration-200 hover:scale-105 relative overflow-visible cursor-help`}>
        <div className="relative">
          <div className={achieved ? 'text-white' : 'text-slate-400'}>
            {icon}
          </div>
          {/* Indicateur point d'interrogation */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/90 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-600 shadow-sm">
            <HelpCircle className="h-3 w-3 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
        {/* Tooltip amélioré au hover - format large, positionné pour éviter la sidebar */}
        <div className="absolute bottom-full left-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none z-[60] whitespace-nowrap">
          <div className={`px-4 py-2.5 rounded-lg text-xs font-bold text-white ${achieved ? `bg-linear-to-r ${color}` : 'bg-slate-800'} shadow-2xl border-2 ${achieved ? 'border-white/30' : 'border-slate-600'} backdrop-blur-sm`}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="font-black text-sm">{label}</div>
              </div>
              <div className="h-4 w-px bg-white/30"></div>
              <div className="flex-1 min-w-0">
                <div className="text-white/90 text-[11px] font-semibold">{description}</div>
                <div className="text-white/80 text-[10px] font-medium mt-0.5">
                  Objectif : {target}
                </div>
              </div>
              <div className="flex-shrink-0">
                {achieved ? (
                  <div className="text-white/90 text-[10px] flex items-center gap-1">
                    <span>✓</span> <span>Débloqué</span>
                  </div>
                ) : (
                  <div className="text-white/70 text-[10px] flex items-center gap-1">
                    <span>🔒</span> <span>Verrouillé</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Flèche du tooltip - positionnée à gauche */}
          <div className={`absolute top-full left-4 -mt-[1px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${achieved ? 'border-t-white/30' : 'border-t-slate-600'}`} />
        </div>
      </div>
      {achieved && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg animate-pulse">
            <Star className="h-3.5 w-3.5 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SanteCollectivePage() {
  const { user, userData } = useAuth();
  const [acts, setActs] = useState<HealthCollectiveAct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );

  // Extraire le prénom depuis l'email
  const rawFirstName = userData?.email.split('@')[0]?.split('.')[0] || 'Utilisateur';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

  // Obtenir le message de bienvenue selon l'heure
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const loadActs = async () => {
    if (!user) {
      setActs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const actsData = await getHealthCollectiveActsByMonth(user.uid, selectedMonth);
      
      // Convertir les Timestamp en Date
      const convertedActs: HealthCollectiveAct[] = actsData.map((act) => {
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

  const kpi = calculateHealthCollectiveKPI(acts);
  const commissionInfo = useMemo(() => getHealthCollectiveCommissionRate(kpi.caPondere), [kpi.caPondere]);

  // Calcul du niveau et de l'XP
  const calculateLevel = (ca: number) => {
    if (ca >= 18000) return 5;
    if (ca >= 14000) return 4;
    if (ca >= 10000) return 3;
    if (ca >= 6000) return 2;
    return 1;
  };

  const level = calculateLevel(kpi.caPondere);
  // Calcul de la progression XP selon les seuils santé collective
  const getXPProgress = (ca: number) => {
    if (ca < 6000) return (ca / 6000) * 100;
    if (ca < 10000) return ((ca - 6000) / 4000) * 100;
    if (ca < 14000) return ((ca - 10000) / 4000) * 100;
    if (ca < 18000) return ((ca - 14000) / 4000) * 100;
    return 100;
  };
  const xpProgress = getXPProgress(kpi.caPondere);

  // Succès basés sur des objectifs de CA
  const achievements = [
    { 
      icon: <Flame className="h-5 w-5" />, 
      label: "Premier pas", 
      description: "Créez votre premier acte santé collective",
      achieved: acts.length >= 1, 
      color: "from-orange-500 to-red-500", 
      target: "1er acte" 
    },
    { 
      icon: <Zap className="h-5 w-5" />, 
      label: "Démarrage", 
      description: "Atteignez 6 000 € de CA pondéré",
      achieved: kpi.caPondere >= 6000, 
      color: "from-yellow-500 to-orange-500", 
      target: "6 000 € de CA pondéré" 
    },
    { 
      icon: <Trophy className="h-5 w-5" />, 
      label: "Seuil 1", 
      description: "Atteignez le premier seuil de commission (2%)",
      achieved: kpi.caPondere >= 6000, 
      color: "from-blue-500 to-cyan-500", 
      target: "6 000 € de CA pondéré" 
    },
    { 
      icon: <Star className="h-5 w-5" />, 
      label: "Seuil 2", 
      description: "Atteignez le deuxième seuil de commission (3%)",
      achieved: kpi.caPondere >= 10000, 
      color: "from-indigo-500 to-purple-500", 
      target: "10 000 € de CA pondéré" 
    },
    { 
      icon: <Award className="h-5 w-5" />, 
      label: "Seuil 3", 
      description: "Atteignez le troisième seuil de commission (4%)",
      achieved: kpi.caPondere >= 14000, 
      color: "from-purple-500 to-pink-500", 
      target: "14 000 € de CA pondéré" 
    },
    { 
      icon: <Crown className="h-5 w-5" />, 
      label: "Champion", 
      description: "Atteignez le niveau maximum (6% de commission)",
      achieved: kpi.caPondere >= 18000, 
      color: "from-green-500 to-emerald-500", 
      target: "18 000 € de CA pondéré" 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 cyber-grid relative">
      {/* Effet de lumière de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-16 lg:top-0 z-50 shadow-md supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80 energy-border">
        <div className="container mx-auto px-6 py-4 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent neon-text">
                Tableau de bord Santé Collective
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Vue d'ensemble de votre production
              </p>
            </div>
            <MonthSelector 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>
          
          {/* Barre d'info : Bienvenue + Date + Météo + Level */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-emerald-200/30 dark:border-emerald-800/30">
            {/* Bienvenue */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg neon-border">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bienvenue</p>
                <p className="font-semibold text-foreground">{greeting}, {firstName} !</p>
              </div>
            </div>

            {/* Date du jour */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="font-semibold text-foreground capitalize">
                  {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>

            {/* Niveau */}
            <div className="flex items-center gap-2">
              <div className="relative p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Crown className="h-5 w-5 text-white" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">
                  {level}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Niveau Commercial</p>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full xp-bar-fill"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Météo */}
            <div className="flex items-center gap-2">
              <WeatherCard />
            </div>
          </div>

          {/* Succès */}
          <div className="mt-4 pt-4 border-t border-emerald-200/30 dark:border-emerald-800/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Succès
              </p>
              <p className="text-xs text-muted-foreground">
                {achievements.filter(a => a.achieved).length} / {achievements.length}
              </p>
            </div>
            <div className="flex gap-2">
              {achievements.map((achievement, index) => (
                <AchievementBadge key={index} {...achievement} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* Résumé du mois avec effet holographique */}
        <Card className="mb-6 border-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 glass-morphism overflow-hidden relative group">
          <div className="absolute inset-0 holographic opacity-10 group-hover:opacity-20 transition-opacity" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Aperçu de votre production
                </h2>
                <p className="text-muted-foreground">
                  Résumé pour le mois sélectionné
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">CA Pondéré</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {formatCurrency(kpi.caPondere)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Grid avec effets 3D */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Nombre d'actes */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 cursor-pointer overflow-hidden relative card-3d">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 font-bold">Total actes</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/40 group-hover:rotate-12 transition-all duration-300">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                <AnimatedCounter value={acts.length} />
              </div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1 font-semibold">
                ce mois-ci
              </p>
            </CardContent>
          </Card>

          {/* CA Pondéré */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 cursor-pointer overflow-hidden relative card-3d">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-300" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 font-bold">CA Pondéré</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/40 group-hover:scale-125 transition-all duration-300">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {formatCurrency(kpi.caPondere)}
              </div>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1 font-semibold">
                Pour calcul commissions
              </p>
            </CardContent>
          </Card>

          {/* Commissions acquises */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 cursor-pointer overflow-hidden relative card-3d">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all duration-300" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 neon-border" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 font-bold">Commissions</CardTitle>
              <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/40 group-hover:rotate-12 transition-all duration-300">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {formatCurrency(kpi.commissionsAcquises)}
              </div>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-semibold">
                Taux actuel : {(kpi.tauxCommission * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          {/* Objectif restant */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 cursor-pointer overflow-hidden relative card-3d">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/20 group-hover:to-amber-500/20 transition-all duration-300" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 font-bold">Objectif restant</CardTitle>
              <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/40 group-hover:scale-125 transition-all duration-300">
                <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {kpi.objectifRestant > 0 ? formatCurrency(kpi.objectifRestant) : (
                  <span className="text-5xl">🏆</span>
                )}
              </div>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1 font-semibold">
                {kpi.objectifRestant > 0 
                  ? `Pour atteindre le Seuil ${kpi.seuilAtteint + 1}` 
                  : "Niveau maximum atteint !"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progression vers les seuils - Style gaming */}
        <Card className="mb-6 border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-hidden relative cyber-card">
          <div className="absolute inset-0 cyber-grid opacity-20" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full neon-border" />
              <span className="font-black">Progression vers les seuils</span>
              <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-base font-semibold">
              Seuil actuel : <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{kpi.seuilAtteint} / 5</span>
              <span className="mx-2">•</span>
              Taux de commission : <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{(kpi.tauxCommission * 100).toFixed(0)}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-6">
              {/* Barre de progression gaming */}
              <div className="relative">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full overflow-hidden shadow-inner border-2 border-slate-300 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-1000 ease-out relative overflow-hidden stat-bar"
                    style={{
                      width: `${Math.min((kpi.caPondere / 18000) * 100, 100)}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                {/* Étiquettes positionnées selon les vraies proportions */}
                <div className="relative mt-3">
                  <div className="absolute left-0 text-xs font-bold text-muted-foreground hover:text-emerald-600 transition-colors cursor-default">
                    0€
                  </div>
                  <div className="absolute text-xs font-bold text-muted-foreground hover:text-emerald-600 transition-colors cursor-default" style={{ left: '33.33%', transform: 'translateX(-50%)' }}>
                    6k€
                  </div>
                  <div className="absolute text-xs font-bold text-muted-foreground hover:text-emerald-600 transition-colors cursor-default" style={{ left: '55.56%', transform: 'translateX(-50%)' }}>
                    10k€
                  </div>
                  <div className="absolute text-xs font-bold text-muted-foreground hover:text-emerald-600 transition-colors cursor-default" style={{ left: '77.78%', transform: 'translateX(-50%)' }}>
                    14k€
                  </div>
                  <div className="absolute right-0 text-xs font-bold text-muted-foreground hover:text-green-600 transition-colors cursor-default">
                    18k€
                  </div>
                </div>
              </div>

              {/* Cartes des seuils - Style super héro avec tooltips */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { seuil: 1, max: 6000, taux: 0, color: "gray", emoji: "🎯", label: "Démarrage", description: "0 - 5 999€" },
                  { seuil: 2, max: 10000, taux: 2, color: "yellow", emoji: "⚡", label: "Progression", description: "6 000€ - 9 999€" },
                  { seuil: 3, max: 14000, taux: 3, color: "blue", emoji: "🚀", label: "Performance", description: "10 000€ - 13 999€" },
                  { seuil: 4, max: 18000, taux: 4, color: "indigo", emoji: "💎", label: "Excellence", description: "14 000€ - 17 999€" },
                  { seuil: 5, max: Infinity, taux: 6, color: "green", emoji: "👑", label: "Champion", description: "≥ 18 000€" },
                ].map(({ seuil, max, taux, color, emoji, label, description }) => {
                  const isAtteint = kpi.seuilAtteint > seuil || (kpi.seuilAtteint === seuil && kpi.caPondere >= max);
                  const isCurrent = kpi.seuilAtteint === seuil;

                  return (
                    <div
                      key={seuil}
                      className={`group relative p-6 rounded-xl border-2 transition-all duration-300 cursor-help overflow-hidden card-3d ${
                        isAtteint
                          ? `border-${color}-500 bg-linear-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950/50 dark:to-${color}-900/50 shadow-xl hover:shadow-2xl`
                          : isCurrent
                          ? `border-${color}-500 bg-linear-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950/30 dark:to-${color}-900/30 shadow-lg hover:shadow-xl neon-border`
                          : "border-gray-200 dark:border-gray-800 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                    >
                      {/* Tooltip amélioré */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[60] scale-90 group-hover:scale-100">
                        <div className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white ${
                          isAtteint || isCurrent 
                            ? `bg-linear-to-r from-${color}-600 to-${color}-700` 
                            : 'bg-slate-800'
                        } shadow-2xl border-2 ${isAtteint || isCurrent ? 'border-white/30' : 'border-slate-600'} backdrop-blur-sm`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{emoji}</span>
                            <span className="font-black text-sm">{label}</span>
                          </div>
                          <div className="text-white/90 text-[11px] font-semibold mb-1">
                            CA pondéré : {description}
                          </div>
                          <div className="text-white/90 text-[11px] font-semibold">
                            Commission : <span className="font-black">{taux}%</span>
                          </div>
                          {isAtteint && <div className="text-white/90 text-[10px] mt-1 flex items-center gap-1"><span>✓</span> Seuil atteint</div>}
                          {isCurrent && !isAtteint && <div className="text-white/90 text-[10px] mt-1 flex items-center gap-1"><span>🎯</span> Seuil en cours</div>}
                          {!isCurrent && !isAtteint && <div className="text-white/70 text-[10px] mt-1 flex items-center gap-1"><span>🔒</span> Non atteint</div>}
                        </div>
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${isAtteint || isCurrent ? 'border-t-white/30' : 'border-t-slate-600'}`} />
                      </div>

                      {isAtteint && (
                        <div className="absolute inset-0 holographic opacity-10" />
                      )}
                      {isAtteint && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="w-7 h-7 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg achievement-badge animate-pulse">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        </div>
                      )}
                      {isCurrent && !isAtteint && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="w-7 h-7 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg animate-pulse">
                            <span className="text-white text-sm font-bold">🎯</span>
                          </div>
                        </div>
                      )}
                      <div className="text-center relative z-10">
                        <div className="text-4xl mb-2 group-hover:scale-125 transition-transform duration-300">
                          {emoji}
                        </div>
                        <p className={`text-xs font-bold mb-2 ${isAtteint || isCurrent ? `text-${color}-600 dark:text-${color}-400` : 'text-muted-foreground'}`}>
                          Seuil {seuil}
                        </p>
                        <p className={`text-3xl font-black mb-1 ${isAtteint || isCurrent ? `bg-linear-to-r from-${color}-600 to-${color}-700 bg-clip-text text-transparent` : 'text-foreground'}`}>
                          {taux}%
                        </p>
                        <p className="text-xs text-muted-foreground font-bold">
                          {max === Infinity ? "≥ 18k€" : `< ${(max / 1000).toFixed(0)}k€`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des actes - Style RPG */}
        <Card className="border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-black">Répartition des actes</span>
            </CardTitle>
            <CardDescription className="text-base font-semibold">
              Détail par type d'acte pour le mois sélectionné
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <div className="h-16 w-16 border-4 border-emerald-200 dark:border-emerald-800 rounded-full animate-spin border-t-emerald-600" />
                  <p className="text-center mt-4 text-sm text-muted-foreground font-semibold">Chargement...</p>
                </div>
              </div>
            ) : acts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-semibold">
                  Aucun acte pour ce mois
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Ind AN Santé", count: acts.filter(a => a.kind === "IND_AN_SANTE").length, icon: "🆕", gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50", darkBg: "from-blue-950/40 to-cyan-950/40" },
                  { label: "Ind AN Prévoyance", count: acts.filter(a => a.kind === "IND_AN_PREVOYANCE").length, icon: "🛡️", gradient: "from-indigo-500 to-purple-500", bg: "from-indigo-50 to-purple-50", darkBg: "from-indigo-950/40 to-purple-950/40" },
                  { label: "Ind AN Retraite", count: acts.filter(a => a.kind === "IND_AN_RETRAITE").length, icon: "💰", gradient: "from-purple-500 to-pink-500", bg: "from-purple-50 to-pink-50", darkBg: "from-purple-950/40 to-pink-950/40" },
                  { label: "Coll AN Santé", count: acts.filter(a => a.kind === "COLL_AN_SANTE").length, icon: "🏥", gradient: "from-cyan-500 to-teal-500", bg: "from-cyan-50 to-teal-50", darkBg: "from-cyan-950/40 to-teal-950/40" },
                  { label: "Coll AN Prévoyance", count: acts.filter(a => a.kind === "COLL_AN_PREVOYANCE").length, icon: "🛡️", gradient: "from-teal-500 to-emerald-500", bg: "from-teal-50 to-emerald-50", darkBg: "from-teal-950/40 to-emerald-950/40" },
                  { label: "Coll AN Retraite", count: acts.filter(a => a.kind === "COLL_AN_RETRAITE").length, icon: "💰", gradient: "from-emerald-500 to-green-500", bg: "from-emerald-50 to-green-50", darkBg: "from-emerald-950/40 to-green-950/40" },
                  { label: "Coll Adhésion/Renfort", count: acts.filter(a => a.kind === "COLL_ADHESION_RENFORT").length, icon: "👥", gradient: "from-green-500 to-lime-500", bg: "from-green-50 to-lime-50", darkBg: "from-green-950/40 to-lime-950/40" },
                  { label: "Révision", count: acts.filter(a => a.kind === "REVISION").length, icon: "🔄", gradient: "from-yellow-500 to-amber-500", bg: "from-yellow-50 to-amber-50", darkBg: "from-yellow-950/40 to-amber-950/40" },
                  { label: "Adhésion/Renfort", count: acts.filter(a => a.kind === "ADHESION_RENFORT").length, icon: "👤", gradient: "from-orange-500 to-red-500", bg: "from-orange-50 to-red-50", darkBg: "from-orange-950/40 to-red-950/40" },
                  { label: "Courtage → Allianz", count: acts.filter(a => a.kind === "COURTAGE_TO_ALLIANZ").length, icon: "➡️", gradient: "from-pink-500 to-rose-500", bg: "from-pink-50 to-rose-50", darkBg: "from-pink-950/40 to-rose-950/40" },
                  { label: "Allianz → Courtage", count: acts.filter(a => a.kind === "ALLIANZ_TO_COURTAGE").length, icon: "⬅️", gradient: "from-rose-500 to-pink-500", bg: "from-rose-50 to-pink-50", darkBg: "from-rose-950/40 to-pink-950/40" },
                ].map(({ label, count, icon, gradient, bg, darkBg }) => (
                  <div
                    key={label}
                    className={`group relative p-6 rounded-xl border-2 border-transparent hover:border-opacity-50 bg-gradient-to-br ${bg} dark:${darkBg} hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden card-3d`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{icon}</span>
                        <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${gradient} text-white text-lg font-black shadow-xl neon-border`}>
                          <AnimatedCounter value={count} />
                        </div>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
