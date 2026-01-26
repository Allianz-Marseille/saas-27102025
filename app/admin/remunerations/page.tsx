"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarRange, Plus, History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { 
  getCurrentSalaries, 
  getSalaryHistory,
  validateSalaryIncrease,
  deleteYearFromHistory
} from "@/lib/firebase/salaries";
import { useAuth } from "@/lib/firebase/use-auth";
import type { User, SalaryHistory } from "@/types";
import { MultiYearSalaryTable } from "@/components/admin/multi-year-salary-table";
import { SalaryHistoryView } from "@/components/admin/salary-history-view";

type DisplayMode = "monthly" | "annual";

export default function RemunerationsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<SalaryHistory[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("monthly");
  const [loading, setLoading] = useState(true);
  const [creatingYear, setCreatingYear] = useState(false);
  const [deletingYear, setDeletingYear] = useState(false);

  // Récupérer les années disponibles depuis l'historique
  // Toujours inclure 2025 comme année de départ
  const availableYears = useMemo(() => {
    const yearsFromHistory = new Set(
      history.map(h => h.year).filter((year): year is number => typeof year === 'number')
    );
    yearsFromHistory.add(2025); // Toujours inclure 2025
    return Array.from(yearsFromHistory).sort((a, b) => a - b);
  }, [history]);

  // Fonction helper pour récupérer le salaire d'un utilisateur pour une année donnée
  // Prend en compte les brouillons et l'historique validé
  const getSalaryForYear = (userId: string, year: number): number => {
    // D'abord vérifier dans le brouillon
    // Vérifier dans l'historique
    const exactEntry = history.find(
      h => h.userId === userId && h.year === year
    );
    if (exactEntry) {
      return exactEntry.monthlySalary;
    }

    // Chercher la dernière entrée avant cette année
    const entriesBeforeYear = history
      .filter(h => h.userId === userId && h.year < year)
      .sort((a, b) => {
        const aYear = typeof a.year === 'number' ? a.year : 0;
        const bYear = typeof b.year === 'number' ? b.year : 0;
        return bYear - aYear;
      });
    
    if (entriesBeforeYear.length > 0) {
      return entriesBeforeYear[0].monthlySalary;
    }

    // Sinon, retourner le salaire actuel de l'utilisateur
    const userObj = users.find(u => u.id === userId);
    return userObj?.currentMonthlySalary || 0;
  };

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  // Supprimer 2028 si elle existe après le chargement
  useEffect(() => {
    const remove2028 = async () => {
      const has2028 = history.some(h => h.year === 2028);
      if (has2028) {
        try {
          const { deleteYearFromHistory } = await import("@/lib/firebase/salaries");
          await deleteYearFromHistory(2028);
          await loadData();
          toast.success("Année 2028 supprimée");
        } catch (error) {
          console.error("Erreur lors de la suppression de 2028:", error);
        }
      }
    };
    if (history.length > 0) {
      remove2028();
    }
  }, [history]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, historyData] = await Promise.all([
        getCurrentSalaries(),
        getSalaryHistory(),
      ]);
      setUsers(usersData);
      setHistory(historyData);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewYear = async () => {
    if (!user?.uid) {
      toast.error("Utilisateur non authentifié");
      return;
    }

    const lastYear = availableYears[availableYears.length - 1];
    const newYear = lastYear + 1;
    
    // Vérifier si l'année existe déjà
    const yearAlreadyExists = availableYears.includes(newYear);
    if (yearAlreadyExists) {
      toast.error(`L'année ${newYear} existe déjà`);
      return;
    }

    try {
      setCreatingYear(true);
      
      // Créer la nouvelle année en copiant les salaires de l'année précédente
      // Sauvegarder directement dans l'historique (validé)
      const promises = users.map(async (userItem) => {
        const currentSalary = getSalaryForYear(userItem.id, lastYear);
        
        if (currentSalary > 0) {
          // Créer une entrée pour la nouvelle année avec le même salaire
          await validateSalaryIncrease(
            userItem.id,
            currentSalary, // Ancien salaire (identique)
            currentSalary, // Nouveau salaire (identique, donc pas de changement)
            newYear,
            "amount",
            0, // Pas de changement
            user.uid
          );
        }
      });

      await Promise.all(promises);

      // Recharger les données
      await loadData();
      
      toast.success(`Année ${newYear} créée avec succès`);
    } catch (error) {
      console.error("Erreur lors de la création de l'année:", error);
      toast.error("Erreur lors de la création de l'année");
    } finally {
      setCreatingYear(false);
    }
  };

  const handleSaveSalary = async (yearSalaries: Map<number, Map<string, number>>) => {
    if (!user?.uid) {
      toast.error("Utilisateur non authentifié");
      return;
    }

    try {
      // Sauvegarder directement dans l'historique (validé)
      const promises: Promise<void>[] = [];

      yearSalaries.forEach((userSalaries, year) => {
        userSalaries.forEach((newSalary, userId) => {
          // Vérifier que userId est bien une string
          if (typeof userId !== 'string') {
            console.error("userId doit être une string, reçu:", userId, typeof userId);
            return;
          }
          
          // Pour obtenir le currentSalary, chercher UNIQUEMENT une entrée exacte pour cette année dans l'historique
          // Si pas trouvé, c'est une nouvelle entrée donc currentSalary = 0
          // On ne cherche pas dans les années précédentes car chaque année est indépendante
          const exactEntry = history.find(
            h => h.userId === userId && h.year === year
          );
          
          const currentSalary = exactEntry ? exactEntry.monthlySalary : 0;
          
          // Ne sauvegarder que si la valeur a réellement changé
          if (newSalary === currentSalary) {
            console.log(`Pas de changement pour ${userId} en ${year}: ${newSalary}`);
            return; // Skip cette sauvegarde
          }
          
          const changeAmount = newSalary - currentSalary;
          
          console.log(`Sauvegarde ${userId} année ${year}: ${currentSalary} -> ${newSalary}`);
          
          promises.push(
            validateSalaryIncrease(
              userId,
              currentSalary,
              newSalary,
              year,
              "amount",
              changeAmount,
              user.uid
            )
          );
        });
      });

      await Promise.all(promises);
      
      // Recharger les données
      await loadData();
      
      toast.success("Modifications sauvegardées");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDeleteLastYear = async () => {
    if (!user?.uid) {
      toast.error("Utilisateur non authentifié");
      return;
    }

    if (availableYears.length <= 1) {
      toast.error("Impossible de supprimer la dernière année (2025)");
      return;
    }

    const lastYear = availableYears[availableYears.length - 1];
    
    try {
      setDeletingYear(true);
      
      // Supprimer toutes les entrées de la dernière année
      await deleteYearFromHistory(lastYear);
      
      // Recharger les données
      await loadData();
      
      toast.success(`Année ${lastYear} supprimée avec succès`);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'année:", error);
      toast.error("Erreur lors de la suppression de l'année");
    } finally {
      setDeletingYear(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-muted-foreground">Chargement des rémunérations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec toggle global */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Rémunérations</h1>
            <p className="text-muted-foreground">Pilotage des salaires par année</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle mensuel/annuel global */}
          <Card className="border-none shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  displayMode === "annual"
                    ? "bg-gradient-to-br from-violet-500 to-purple-600"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600"
                }`}>
                  {displayMode === "annual" ? (
                    <CalendarRange className="h-5 w-5 text-white" />
                  ) : (
                    <Calendar className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Affichage
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      displayMode === "monthly" ? "text-emerald-600 font-semibold" : "text-muted-foreground"
                    }`}>
                      Mensuel
                    </span>
                    <Switch
                      checked={displayMode === "annual"}
                      onCheckedChange={(checked) => setDisplayMode(checked ? "annual" : "monthly")}
                    />
                    <span className={`text-xs font-medium ${
                      displayMode === "annual" ? "text-violet-600 font-semibold" : "text-muted-foreground"
                    }`}>
                      Annuel
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bouton créer nouvelle année */}
          <Button
            onClick={handleCreateNewYear}
            disabled={creatingYear}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {creatingYear ? "Création..." : "Créer une nouvelle année"}
          </Button>

          {/* Bouton supprimer dernière année */}
          {availableYears.length > 1 && (
            <Button
              onClick={handleDeleteLastYear}
              disabled={deletingYear || creatingYear}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deletingYear ? "Suppression..." : `Supprimer ${availableYears[availableYears.length - 1]}`}
            </Button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="pilotage" className="w-full">
        <TabsList>
          <TabsTrigger value="pilotage" className="gap-2">
            <Calendar className="h-4 w-4" />
            Pilotage
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pilotage" className="mt-6">
          <MultiYearSalaryTable
            users={users}
            years={availableYears}
            displayMode={displayMode}
            getSalaryForYear={getSalaryForYear}
            onSaveSalary={handleSaveSalary}
          />
        </TabsContent>

        <TabsContent value="historique" className="mt-6">
          <SalaryHistoryView
            history={history}
            users={users}
            onRefresh={loadData}
            displayMode={displayMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
