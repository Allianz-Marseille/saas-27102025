"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { HealthAct } from "@/types";
import { getHealthActsByMonth } from "@/lib/firebase/health-acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Timestamp } from "firebase/firestore";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { calculateHealthKPI } from "@/lib/utils/health-kpi";
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
  Sparkles
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

// Composant de badge achievement
function AchievementBadge({ icon, label, achieved, color, target }: { icon: React.ReactNode; label: string; achieved: boolean; color: string; target: string }) {
  return (
    <div 
      className={`relative group transition-all duration-300 ${achieved ? 'scale-100' : 'scale-90 opacity-50 grayscale'}`}
      title={`${label} - ${target}${achieved ? ' ✓' : ''}`}
    >
      <div className={`p-3 rounded-xl ${achieved ? `bg-gradient-to-br ${color} achievement-badge` : 'bg-slate-200 dark:bg-slate-800'} transition-all duration-300 hover:scale-110 relative overflow-hidden`}>
        <div className={achieved ? 'text-white' : 'text-slate-400'}>
          {icon}
        </div>
        {/* Tooltip au hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white ${achieved ? `bg-gradient-to-r ${color}` : 'bg-slate-700'} shadow-xl`}>
            <div className="font-black">{label}</div>
            <div className="text-white/80 text-[10px]">{target}</div>
          </div>
        </div>
      </div>
      {achieved && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">
            <Star className="h-3 w-3 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SanteIndividuellePage() {
  const { user, userData } = useAuth();
  const [acts, setActs] = useState<HealthAct[]>([]);
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

  const kpi = calculateHealthKPI(acts);

  // Calcul du niveau et de l'XP
  const calculateLevel = (ca: number) => {
    if (ca >= 22000) return 5;
    if (ca >= 18000) return 4;
    if (ca >= 14000) return 3;
    if (ca >= 10000) return 2;
    return 1;
  };

  const level = calculateLevel(kpi.caPondere);
  const xpProgress = ((kpi.caPondere % 10000) / 10000) * 100;

  // Succès basés sur des objectifs de CA
  const achievements = [
    { icon: <Flame className="h-5 w-5" />, label: "Premier pas", achieved: acts.length >= 1, color: "from-orange-500 to-red-500", target: "1er acte" },
    { icon: <Zap className="h-5 w-5" />, label: "Démarrage", achieved: kpi.caPondere >= 6000, color: "from-yellow-500 to-orange-500", target: "6k€" },
    { icon: <Trophy className="h-5 w-5" />, label: "Seuil 1", achieved: kpi.caPondere >= 10000, color: "from-blue-500 to-cyan-500", target: "10k€" },
    { icon: <Star className="h-5 w-5" />, label: "Seuil 2", achieved: kpi.caPondere >= 14000, color: "from-indigo-500 to-purple-500", target: "14k€" },
    { icon: <Award className="h-5 w-5" />, label: "Seuil 3", achieved: kpi.caPondere >= 18000, color: "from-purple-500 to-pink-500", target: "18k€" },
    { icon: <Crown className="h-5 w-5" />, label: "Champion", achieved: kpi.caPondere >= 22000, color: "from-green-500 to-emerald-500", target: "22k€" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 cyber-grid relative">
      {/* Effet de lumière de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-50 shadow-md supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80 energy-border">
        <div className="container mx-auto px-6 py-4 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent neon-text">
                Tableau de bord Santé Individuelle
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-500" />
                Vue d'ensemble de votre production
              </p>
            </div>
            <MonthSelector 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>
          
          {/* Barre d'info : Bienvenue + Date + Météo + Level */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-green-200/30 dark:border-green-800/30">
            {/* Bienvenue */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg neon-border">
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
          <div className="mt-4 pt-4 border-t border-green-200/30 dark:border-green-800/30">
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
        <Card className="mb-6 border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 glass-morphism overflow-hidden relative group">
          <div className="absolute inset-0 holographic opacity-10 group-hover:opacity-20 transition-opacity" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-500" />
                  Aperçu de votre production
                </h2>
                <p className="text-muted-foreground">
                  Résumé pour le mois sélectionné
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">CA Pondéré</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
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
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 cursor-pointer overflow-hidden relative card-3d">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-300" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 neon-border" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 font-bold">Commissions</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/40 group-hover:rotate-12 transition-all duration-300">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(kpi.commissionsAcquises)}
              </div>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1 font-semibold">
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
              <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full neon-border" />
              <span className="font-black">Progression vers les seuils</span>
              <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-base font-semibold">
              Seuil actuel : <span className="font-black text-green-600 dark:text-green-400 text-lg">{kpi.seuilAtteint} / 5</span>
              <span className="mx-2">•</span>
              Taux de commission : <span className="font-black text-green-600 dark:text-green-400 text-lg">{(kpi.tauxCommission * 100).toFixed(0)}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-6">
              {/* Barre de progression gaming */}
              <div className="relative">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full overflow-hidden shadow-inner border-2 border-slate-300 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 transition-all duration-1000 ease-out relative overflow-hidden stat-bar"
                    style={{
                      width: `${Math.min((kpi.caPondere / 24200) * 100, 100)}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between mt-3 text-xs font-bold text-muted-foreground">
                  <span className="hover:text-green-600 transition-colors cursor-default">0€</span>
                  <span className="hover:text-green-600 transition-colors cursor-default">10k€</span>
                  <span className="hover:text-green-600 transition-colors cursor-default">14k€</span>
                  <span className="hover:text-green-600 transition-colors cursor-default">18k€</span>
                  <span className="hover:text-green-600 transition-colors cursor-default">22k€</span>
                </div>
              </div>

              {/* Cartes des seuils - Style super héro */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { seuil: 1, max: 10000, taux: 0, color: "gray", emoji: "🎯" },
                  { seuil: 2, max: 14000, taux: 2, color: "yellow", emoji: "⚡" },
                  { seuil: 3, max: 18000, taux: 3, color: "blue", emoji: "🔷" },
                  { seuil: 4, max: 22000, taux: 4, color: "indigo", emoji: "💎" },
                  { seuil: 5, max: Infinity, taux: 6, color: "green", emoji: "👑" },
                ].map(({ seuil, max, taux, color, emoji }) => {
                  const isAtteint = kpi.seuilAtteint > seuil || (kpi.seuilAtteint === seuil && kpi.caPondere >= max);
                  const isCurrent = kpi.seuilAtteint === seuil;

                  return (
                    <div
                      key={seuil}
                      className={`group relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden card-3d ${
                        isAtteint
                          ? `border-${color}-500 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950/50 dark:to-${color}-900/50 shadow-xl hover:shadow-2xl`
                          : isCurrent
                          ? `border-${color}-500 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950/30 dark:to-${color}-900/30 shadow-lg hover:shadow-xl neon-border`
                          : "border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                    >
                      {isAtteint && (
                        <div className="absolute inset-0 holographic opacity-10" />
                      )}
                      {isAtteint && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg achievement-badge">
                            <span className="text-white text-sm font-bold">✓</span>
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
                        <p className={`text-3xl font-black mb-1 ${isAtteint || isCurrent ? `bg-gradient-to-r from-${color}-600 to-${color}-700 bg-clip-text text-transparent` : 'text-foreground'}`}>
                          {taux}%
                        </p>
                        <p className="text-xs text-muted-foreground font-bold">
                          {max === Infinity ? "≥ 22k€" : `< ${(max / 1000).toFixed(0)}k€`}
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
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
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
                  <div className="h-16 w-16 border-4 border-green-200 dark:border-green-800 rounded-full animate-spin border-t-green-600" />
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Affaire Nouvelle", count: kpi.nbAffaireNouvelle, icon: "🆕", gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50", darkBg: "from-blue-950/40 to-cyan-950/40" },
                  { label: "Révision", count: kpi.nbRevision, icon: "🔄", gradient: "from-purple-500 to-pink-500", bg: "from-purple-50 to-pink-50", darkBg: "from-purple-950/40 to-pink-950/40" },
                  { label: "Adhésion salarié", count: kpi.nbAdhesionSalarie, icon: "👥", gradient: "from-orange-500 to-amber-500", bg: "from-orange-50 to-amber-50", darkBg: "from-orange-950/40 to-amber-950/40" },
                  { label: "COURT → AZ", count: kpi.nbCourtToAz, icon: "➡️", gradient: "from-cyan-500 to-teal-500", bg: "from-cyan-50 to-teal-50", darkBg: "from-cyan-950/40 to-teal-950/40" },
                  { label: "AZ → courtage", count: kpi.nbAzToCourtage, icon: "⬅️", gradient: "from-green-500 to-emerald-500", bg: "from-green-50 to-emerald-50", darkBg: "from-green-950/40 to-emerald-950/40" },
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
