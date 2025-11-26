"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { ProgressTracker } from "@/components/dashboard/progress-tracker";
import { AchievementBadges } from "@/components/dashboard/achievement-badges";
import { LeaderboardWidget } from "@/components/dashboard/leaderboard-widget";
import { ProcessLeaderboardWidget } from "@/components/dashboard/process-leaderboard-widget";
import { CommissionsSummary } from "@/components/dashboard/commissions-summary";
import { SpecialtyContractsTracker } from "@/components/dashboard/specialty-contracts-tracker";
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
      <header className="border-b bg-gradient-to-r from-white via-blue-50/50 to-purple-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-lg sticky top-0 z-10 shadow-md shadow-blue-500/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Vue d'ensemble de vos performances
              </p>
            </div>
          <MonthSelector 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Welcome Banner */}
        <WelcomeBanner kpi={kpi} />

        {/* Résumé Commissions avec bouton de redirection */}
        <CommissionsSummary kpi={kpi} />

        {/* Progress Tracker */}
        <ProgressTracker kpi={kpi} />

        {/* Achievement Badges */}
        <AchievementBadges kpi={kpi} />

        {/* Specialty Contracts Tracker */}
        <SpecialtyContractsTracker acts={acts} />

        {/* Classements - Grid pour grands écrans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard CA */}
        <LeaderboardWidget 
          currentUserEmail={userData?.email}
          kpi={kpi}
        />

          {/* Leaderboard Process */}
          <ProcessLeaderboardWidget 
            currentUserEmail={userData?.email}
            kpi={kpi}
          />
        </div>
      </div>
    </div>
  );
}
