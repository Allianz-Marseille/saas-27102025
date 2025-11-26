"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DollarSign, FileText, ClipboardCheck, Car, Building2, Scale, Coins, AlertCircle, CheckCircle2, Target } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ProgressTracker } from "@/components/dashboard/progress-tracker";
import { AchievementBadges } from "@/components/dashboard/achievement-badges";
import { LeaderboardWidget } from "@/components/dashboard/leaderboard-widget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateKPI } from "@/lib/utils/kpi";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Act } from "@/types";
import { getActsByMonth } from "@/lib/firebase/acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Timestamp } from "firebase/firestore";
import { MonthSelector } from "@/components/dashboard/month-selector";

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [acts, setActs] = useState<Act[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [isNewActDialogOpen, setIsNewActDialogOpen] = useState(false);

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

  const kpi = calculateKPI(acts);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <MonthSelector 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Welcome Banner */}
        <WelcomeBanner kpi={kpi} />

        {/* Quick Actions */}
        <QuickActions 
          onNewAct={() => setIsNewActDialogOpen(true)}
          notificationCount={3}
        />

        {/* Progress Tracker */}
        <ProgressTracker kpi={kpi} />

        {/* Achievement Badges */}
        <AchievementBadges kpi={kpi} />

        {/* Leaderboard */}
        <LeaderboardWidget 
          currentUserEmail={userData?.email}
          kpi={kpi}
        />
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KPICard
            title="CA Mensuel"
            value={formatCurrency(kpi.caMensuel)}
            icon={DollarSign}
            colorScheme="green"
            delay={0}
          />
          <KPICard
            title="CA Auto / Moto"
            value={formatCurrency(kpi.caAuto)}
            icon={DollarSign}
            colorScheme="blue"
            delay={0.05}
          />
          <KPICard
            title="CA Autres"
            value={formatCurrency(kpi.caAutres)}
            icon={DollarSign}
            colorScheme="purple"
            delay={0.1}
          />
          <KPICard
            title="Nombre de contrats"
            value={kpi.nbContrats.toString()}
            icon={ClipboardCheck}
            colorScheme="indigo"
            delay={0.15}
          />
          <KPICard
            title="Contrats Auto / Moto"
            value={kpi.nbContratsAuto.toString()}
            icon={Car}
            colorScheme="teal"
            delay={0.2}
          />
          <KPICard
            title="Contrats Autres"
            value={kpi.nbContratsAutres.toString()}
            icon={Building2}
            colorScheme="orange"
            delay={0.25}
          />
          <KPICard
            title="Ratio"
            value={`${kpi.ratio.toFixed(1)}%`}
            subtitle="Objectif ≥ 100%"
            icon={Scale}
            trend={kpi.ratio >= 100 ? "up" : "down"}
            colorScheme={kpi.ratio >= 100 ? "green" : "red"}
            delay={0.3}
          />
          <KPICard
            title="Nombre de process"
            value={kpi.nbProcess.toString()}
            subtitle="M+3, Pré-terme auto, Pré-terme IRD"
            icon={FileText}
            colorScheme="pink"
            delay={0.35}
          />
          <KPICard
            title="Commissions potentielles"
            value={formatCurrency(kpi.commissionsPotentielles)}
            subtitle={kpi.commissionValidee ? "Validées" : "En attente"}
            icon={Coins}
            trend={kpi.commissionValidee ? "up" : "neutral"}
            colorScheme="green"
            delay={0.4}
          />
          <KPICard
            title="Commissions réelles"
            value={formatCurrency(kpi.commissionsReelles)}
            subtitle={kpi.commissionValidee ? "Actives" : "Non validées"}
            icon={Coins}
            trend={kpi.commissionValidee ? "up" : "neutral"}
            colorScheme="blue"
            delay={0.45}
          />
        </div>

        {/* Section Validation Commissions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Conditions de validation des commissions
                </CardTitle>
                <CardDescription className="mt-2">
                  Vérification des critères pour déclencher les commissions réelles
                </CardDescription>
              </div>
              {kpi.commissionValidee && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Validé
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Condition 1: Commissions potentielles */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                kpi.commissionsPotentielles >= 200
                  ? "border-green-500 bg-green-500/5"
                  : "border-orange-500 bg-orange-500/5"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {kpi.commissionsPotentielles >= 200 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm">Commissions potentielles</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      kpi.commissionsPotentielles >= 200
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {formatCurrency(kpi.commissionsPotentielles)}
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(200)}
                    </span>
                  </div>
                  {kpi.commissionsPotentielles < 200 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Il manque {formatCurrency(200 - kpi.commissionsPotentielles)}
                    </p>
                  )}
                </div>
              </div>

              {/* Condition 2: Nombre de process */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                kpi.nbProcess >= 15
                  ? "border-green-500 bg-green-500/5"
                  : "border-orange-500 bg-orange-500/5"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {kpi.nbProcess >= 15 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm">Nombre de process</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      kpi.nbProcess >= 15
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {kpi.nbProcess}
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-sm font-medium text-muted-foreground">15</span>
                  </div>
                  {kpi.nbProcess < 15 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Il manque {15 - kpi.nbProcess} process
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    M+3, Pré-terme auto, Pré-terme IRD
                  </p>
                </div>
              </div>

              {/* Condition 3: Ratio */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                kpi.ratio >= 100
                  ? "border-green-500 bg-green-500/5"
                  : "border-orange-500 bg-orange-500/5"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {kpi.ratio >= 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm">Ratio</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      kpi.ratio >= 100
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {kpi.ratio.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-sm font-medium text-muted-foreground">100%</span>
                  </div>
                  {kpi.ratio < 100 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Il manque {(100 - kpi.ratio).toFixed(1)}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Contrats autres / Auto
                  </p>
                </div>
              </div>
            </div>

            {kpi.commissionValidee && (
              <div className="mt-4 p-4 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-semibold">
                    Toutes les conditions sont remplies ! Les commissions seront validées.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message pour accéder aux actes */}
        {!isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                Pour consulter et gérer vos actes, rendez-vous dans l&apos;onglet{" "}
                <span className="font-semibold text-foreground">Mes actes</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
