"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { MonthlyOverview } from "@/components/commissions/monthly-overview";
import { ValidationStatus } from "@/components/commissions/validation-status";
import { CommissionHistory } from "@/components/commissions/commission-history";
import { ActsBreakdown } from "@/components/commissions/acts-breakdown";
import { ExportActions } from "@/components/commissions/export-actions";
import { calculateKPI } from "@/lib/utils/kpi";
import { getActsByMonth } from "@/lib/firebase/acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Act } from "@/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CommissionsPage() {
  const { user, userData } = useAuth();
  const [acts, setActs] = useState<Act[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [historyData, setHistoryData] = useState<Array<{
    month: string;
    commissions: number;
    ratio: number;
    ca: number;
  }>>([]);

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
    } catch (error) {
      console.error("Erreur lors du chargement des actes:", error);
      toast.error("Erreur lors du chargement des actes");
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryData = async () => {
    if (!user) return;

    try {
      // Récupérer les 6 derniers mois
      const months: string[] = [];
      const currentDate = new Date(selectedMonth + "-01");
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        months.push(format(date, "yyyy-MM"));
      }

      // Charger les données pour chaque mois
      const historyPromises = months.map(async (month) => {
        try {
          const monthActs = await getActsByMonth(user.uid, month);
          const convertedActs: Act[] = monthActs.map((act) => {
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
          
          const kpi = calculateKPI(convertedActs);
          const monthDate = new Date(month + "-01");
          
          return {
            month: format(monthDate, "MMM yy", { locale: fr }),
            commissions: kpi.commissionsReelles,
            ratio: kpi.ratio,
            ca: kpi.caMensuel,
          };
        } catch (error) {
          console.error(`Erreur pour le mois ${month}:`, error);
          return {
            month: format(new Date(month + "-01"), "MMM yy", { locale: fr }),
            commissions: 0,
            ratio: 0,
            ca: 0,
          };
        }
      });

      const history = await Promise.all(historyPromises);
      setHistoryData(history);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
    }
  };

  useEffect(() => {
    loadActs();
    loadHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, user]);

  const kpi = calculateKPI(acts);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-950 sticky top-16 lg:top-0 z-10 shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Mes Commissions
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Analyse détaillée de vos performances et rémunérations
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
        {/* Vue mensuelle - 4 cartes KPI */}
        <MonthlyOverview kpi={kpi} />

        {/* Conditions de validation */}
        <ValidationStatus kpi={kpi} />

        {/* Historique des 6 derniers mois */}
        <CommissionHistory data={historyData} />

        {/* Détail des actes contributeurs */}
        <ActsBreakdown acts={acts} />

        {/* Actions d'export */}
        <ExportActions 
          kpi={kpi} 
          selectedMonth={selectedMonth}
          userName={userData?.email || "Commercial"}
        />
      </div>
    </div>
  );
}

