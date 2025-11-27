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
  Calendar
} from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                Tableau de bord Santé Individuelle
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Vue d'ensemble de votre production
              </p>
            </div>
            <MonthSelector 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>
          
          {/* Barre d'info : Bienvenue + Date + Météo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-green-200/30 dark:border-green-800/30">
            {/* Bienvenue */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
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

            {/* Météo Marseille */}
            <div className="flex items-center gap-2">
              <WeatherCard />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Résumé du mois */}
        <Card className="mb-6 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
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

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Nombre d'actes */}
          <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total actes</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {acts.length}
              </div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                ce mois-ci
              </p>
            </CardContent>
          </Card>

          {/* CA Total */}
          <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">CA Total</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {formatCurrency(kpi.caTotal)}
              </div>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                Chiffre d'affaires brut
              </p>
            </CardContent>
          </Card>

          {/* Commissions acquises */}
          <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Commissions</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors group-hover:rotate-12 transition-transform">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(kpi.commissionsAcquises)}
              </div>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                Taux actuel : {(kpi.tauxCommission * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          {/* Objectif restant */}
          <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Objectif restant</CardTitle>
              <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors group-hover:scale-110 transition-transform">
                <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {kpi.objectifRestant > 0 ? formatCurrency(kpi.objectifRestant) : "✓"}
              </div>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                {kpi.objectifRestant > 0 
                  ? `Pour atteindre le Seuil ${kpi.seuilAtteint + 1}` 
                  : "Seuil maximum atteint"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progression vers les seuils */}
        <Card className="mb-6 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full" />
              Progression vers les seuils
            </CardTitle>
            <CardDescription className="text-base">
              Seuil actuel : <span className="font-bold text-green-600 dark:text-green-400">{kpi.seuilAtteint} / 5</span> - 
              Taux de commission : <span className="font-bold text-green-600 dark:text-green-400">{(kpi.tauxCommission * 100).toFixed(0)}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Barre de progression */}
              <div className="relative">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{
                      width: `${Math.min((kpi.caPondere / 24200) * 100, 100)}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between mt-3 text-xs font-medium text-muted-foreground">
                  <span className="hover:text-foreground transition-colors cursor-default">0€</span>
                  <span className="hover:text-foreground transition-colors cursor-default">10k€</span>
                  <span className="hover:text-foreground transition-colors cursor-default">14k€</span>
                  <span className="hover:text-foreground transition-colors cursor-default">18k€</span>
                  <span className="hover:text-foreground transition-colors cursor-default">22k€</span>
                </div>
              </div>

              {/* Cartes des seuils */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { seuil: 1, max: 10000, taux: 0, color: "gray" },
                  { seuil: 2, max: 14000, taux: 2, color: "yellow" },
                  { seuil: 3, max: 18000, taux: 3, color: "blue" },
                  { seuil: 4, max: 22000, taux: 4, color: "indigo" },
                  { seuil: 5, max: Infinity, taux: 6, color: "green" },
                ].map(({ seuil, max, taux, color }) => {
                  const isAtteint = kpi.seuilAtteint > seuil || (kpi.seuilAtteint === seuil && kpi.caPondere >= max);
                  const isCurrent = kpi.seuilAtteint === seuil;

                  return (
                    <div
                      key={seuil}
                      className={`group relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                        isAtteint
                          ? `border-${color}-500 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950/30 dark:to-${color}-900/30 shadow-lg hover:shadow-xl hover:scale-105`
                          : isCurrent
                          ? `border-${color}-500 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950/30 dark:to-${color}-900/30 shadow-md hover:shadow-lg hover:scale-105 animate-pulse-slow`
                          : "border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 hover:border-gray-300 dark:hover:border-gray-700 hover:scale-102"
                      }`}
                    >
                      {isAtteint && (
                        <div className="absolute top-2 right-2">
                          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        </div>
                      )}
                      <div className="text-center relative z-10">
                        <p className={`text-xs font-semibold mb-2 ${isAtteint || isCurrent ? `text-${color}-600 dark:text-${color}-400` : 'text-muted-foreground'}`}>
                          Seuil {seuil}
                        </p>
                        <p className={`text-2xl font-bold mb-1 ${isAtteint || isCurrent ? `bg-gradient-to-r from-${color}-600 to-${color}-700 bg-clip-text text-transparent` : 'text-foreground'}`}>
                          {taux}%
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
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

        {/* Répartition des actes */}
        <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Répartition des actes
            </CardTitle>
            <CardDescription className="text-base">
              Détail par type d'acte pour le mois sélectionné
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <div className="h-16 w-16 border-4 border-green-200 dark:border-green-800 rounded-full animate-spin border-t-green-600" />
                  <p className="text-center mt-4 text-sm text-muted-foreground">Chargement...</p>
                </div>
              </div>
            ) : acts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  Aucun acte pour ce mois
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Affaire Nouvelle", count: kpi.nbAffaireNouvelle, icon: "🆕", gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50", darkBg: "from-blue-950/30 to-cyan-950/30" },
                  { label: "Révision", count: kpi.nbRevision, icon: "🔄", gradient: "from-purple-500 to-pink-500", bg: "from-purple-50 to-pink-50", darkBg: "from-purple-950/30 to-pink-950/30" },
                  { label: "Adhésion salarié", count: kpi.nbAdhesionSalarie, icon: "👥", gradient: "from-orange-500 to-amber-500", bg: "from-orange-50 to-amber-50", darkBg: "from-orange-950/30 to-amber-950/30" },
                  { label: "COURT → AZ", count: kpi.nbCourtToAz, icon: "➡️", gradient: "from-cyan-500 to-teal-500", bg: "from-cyan-50 to-teal-50", darkBg: "from-cyan-950/30 to-teal-950/30" },
                  { label: "AZ → courtage", count: kpi.nbAzToCourtage, icon: "⬅️", gradient: "from-green-500 to-emerald-500", bg: "from-green-50 to-emerald-50", darkBg: "from-green-950/30 to-emerald-950/30" },
                ].map(({ label, count, icon, gradient, bg, darkBg }) => (
                  <div
                    key={label}
                    className={`group relative p-5 rounded-xl border-2 border-transparent hover:border-opacity-50 bg-gradient-to-br ${bg} dark:${darkBg} hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{icon}</span>
                        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-xs font-bold shadow-lg`}>
                          {count}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
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

