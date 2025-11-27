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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total actes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acts.length}</div>
              <p className="text-xs text-muted-foreground">
                ce mois-ci
              </p>
            </CardContent>
          </Card>

          {/* CA Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpi.caTotal)}</div>
              <p className="text-xs text-muted-foreground">
                Chiffre d'affaires brut
              </p>
            </CardContent>
          </Card>

          {/* Commissions acquises */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(kpi.commissionsAcquises)}
              </div>
              <p className="text-xs text-muted-foreground">
                Taux actuel : {(kpi.tauxCommission * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          {/* Objectif restant */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objectif restant</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpi.objectifRestant > 0 ? formatCurrency(kpi.objectifRestant) : "✓"}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpi.objectifRestant > 0 
                  ? `Pour atteindre le Seuil ${kpi.seuilAtteint + 1}` 
                  : "Seuil maximum atteint"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progression vers les seuils */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progression vers les seuils</CardTitle>
            <CardDescription>
              Seuil actuel : {kpi.seuilAtteint} / 5 - Taux de commission : {(kpi.tauxCommission * 100).toFixed(0)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Barre de progression */}
              <div className="relative">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                    style={{
                      width: `${Math.min((kpi.caPondere / 24200) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0€</span>
                  <span>10 000€</span>
                  <span>14 000€</span>
                  <span>18 000€</span>
                  <span>22 000€</span>
                </div>
              </div>

              {/* Cartes des seuils */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { seuil: 1, max: 10000, taux: 0 },
                  { seuil: 2, max: 14000, taux: 2 },
                  { seuil: 3, max: 18000, taux: 3 },
                  { seuil: 4, max: 22000, taux: 4 },
                  { seuil: 5, max: Infinity, taux: 6 },
                ].map(({ seuil, max, taux }) => {
                  const isAtteint = kpi.seuilAtteint > seuil || (kpi.seuilAtteint === seuil && kpi.caPondere >= max);
                  const isCurrent = kpi.seuilAtteint === seuil;

                  return (
                    <div
                      key={seuil}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isAtteint
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : isCurrent
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20"
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Seuil {seuil}</p>
                        <p className="text-lg font-bold text-foreground">{taux}%</p>
                        <p className="text-xs text-muted-foreground">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Répartition des actes
            </CardTitle>
            <CardDescription>
              Détail par type d'acte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Chargement...</p>
            ) : acts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Aucun acte pour ce mois
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Affaire Nouvelle", count: kpi.nbAffaireNouvelle, color: "blue" },
                  { label: "Révision", count: kpi.nbRevision, color: "purple" },
                  { label: "Adhésion salarié", count: kpi.nbAdhesionSalarie, color: "orange" },
                  { label: "COURT → AZ", count: kpi.nbCourtToAz, color: "cyan" },
                  { label: "AZ → courtage", count: kpi.nbAzToCourtage, color: "green" },
                ].map(({ label, count, color }) => (
                  <div
                    key={label}
                    className={`p-4 rounded-lg border bg-${color}-50 dark:bg-${color}-950/20 border-${color}-200 dark:border-${color}-800`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
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

