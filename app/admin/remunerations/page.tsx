"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, TrendingUp, History, Users, Euro, UserMinus, RotateCcw, Check } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";
import { getCurrentSalaries, getSalaryHistory, getSharedSalaryDraft, saveSharedSalaryDraft, deleteSharedSalaryDraft, validateSalaryIncrease } from "@/lib/firebase/salaries";
import { toast } from "sonner";
import type { User, SalaryHistory, SalaryDraft, SimulatedUser } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { SalaryTable } from "@/components/admin/salary-table";
import { SalaryHistoryView } from "@/components/admin/salary-history-view";
import { AddSimulatedUserDialog } from "@/components/admin/add-simulated-user-dialog";
import { GlobalValidationModal } from "@/components/admin/global-validation-modal";

type DisplayMode = "monthly" | "annual";

interface SalarySimulation {
  type: "percentage" | "amount";
  value: number;
  newSalary: number;
}

export default function RemunerationsPage() {
  const { user, userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<SalaryHistory[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("monthly");
  const [simulations, setSimulations] = useState<Map<string, SalarySimulation>>(new Map());
  const [simulatedUsers, setSimulatedUsers] = useState<Map<string, SimulatedUser>>(new Map());
  const [loading, setLoading] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [addSimulatedDialogOpen, setAddSimulatedDialogOpen] = useState(false);
  const [includedUsers, setIncludedUsers] = useState<Set<string>>(new Set());
  const [neutralizedDepartures, setNeutralizedDepartures] = useState<Set<string>>(new Set());
  const [globalValidationModalOpen, setGlobalValidationModalOpen] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, historyData] = await Promise.all([
        getCurrentSalaries(),
        getSalaryHistory(),
      ]);
      setUsers(usersData);
      setHistory(historyData);

      // Initialiser les toggles d'inclusion : tous inclus par défaut
      const allUserIds = new Set([
        ...usersData.map(u => u.id),
        ...Array.from(simulatedUsers.keys())
      ]);
      // Ne réinitialiser que si c'est le premier chargement
      if (includedUsers.size === 0) {
        setIncludedUsers(allUserIds);
      } else {
        // Ajouter les nouveaux utilisateurs aux inclus
        const newIncludedUsers = new Set(includedUsers);
        usersData.forEach(u => newIncludedUsers.add(u.id));
        setIncludedUsers(newIncludedUsers);
      }

      // Charger le brouillon partagé si existant
      await loadDraft();
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Charger le brouillon partagé sauvegardé
  const loadDraft = async () => {
    try {
      const draft = await getSharedSalaryDraft();
      if (draft) {
        // Convertir le brouillon en simulations
        const newSimulations = new Map<string, SalarySimulation>();
        const newSimulatedUsers = new Map<string, SimulatedUser>();
        
        draft.items.forEach(item => {
          newSimulations.set(item.userId, {
            type: item.type,
            value: item.value,
            newSalary: item.newSalary,
          });
          
          // Si c'est un utilisateur simulé, le recréer
          if (item.isSimulated && item.simulatedUserData) {
            const simulatedUser: SimulatedUser = {
              id: item.userId,
              firstName: item.simulatedUserData.firstName,
              lastName: item.simulatedUserData.lastName,
              email: item.simulatedUserData.email,
              currentMonthlySalary: item.currentSalary,
              contrat: item.simulatedUserData.contrat,
              etp: item.simulatedUserData.etp,
              isSimulated: true,
            };
            newSimulatedUsers.set(item.userId, simulatedUser);
          }
        });
        
        setSimulations(newSimulations);
        setSimulatedUsers(newSimulatedUsers);
        setDraftLoaded(true);
        setHasDraft(true);
        const updatedBy = draft.lastUpdatedBy ? ` (modifié par ${draft.lastUpdatedBy})` : "";
        toast.success(`Brouillon partagé chargé (${draft.items.length} augmentation(s) pour ${draft.year})${updatedBy}`);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du brouillon:", error);
      // Ne pas afficher d'erreur si aucun brouillon n'existe
    }
  };

  // Enregistrer le brouillon partagé
  const handleSaveDraft = async () => {
    if (!user?.uid || (simulations.size === 0 && simulatedUsers.size === 0)) {
      toast.error("Aucune simulation ou recrutement à enregistrer");
      return;
    }

    try {
      setSavingDraft(true);
      
      // Convertir les simulations en items de brouillon
      const items = Array.from(simulations.entries()).map(([userId, sim]) => {
        const userObj = users.find(u => u.id === userId);
        const simulatedUser = simulatedUsers.get(userId);
        
        if (simulatedUser) {
          // Utilisateur simulé
          return {
            userId,
            type: sim.type,
            value: sim.value,
            currentSalary: simulatedUser.currentMonthlySalary,
            newSalary: sim.newSalary,
            isSimulated: true,
            simulatedUserData: {
              firstName: simulatedUser.firstName,
              lastName: simulatedUser.lastName,
              email: simulatedUser.email,
              contrat: simulatedUser.contrat,
              etp: simulatedUser.etp,
            },
          };
        } else {
          // Utilisateur réel
          return {
            userId,
            type: sim.type,
            value: sim.value,
            currentSalary: userObj?.currentMonthlySalary || 0,
            newSalary: sim.newSalary,
          };
        }
      });

      await saveSharedSalaryDraft(items, new Date().getFullYear(), user.uid);
      setHasDraft(true);
      setDraftLoaded(true);
      const simulatedCount = Array.from(simulatedUsers.keys()).filter(id => simulations.has(id)).length;
      toast.success(`Brouillon partagé enregistré (${items.length} augmentation(s)${simulatedCount > 0 ? `, ${simulatedCount} recrutement(s) simulé(s)` : ""})`);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du brouillon:", error);
      toast.error("Erreur lors de l'enregistrement du brouillon");
    } finally {
      setSavingDraft(false);
    }
  };

  // Supprimer le brouillon partagé
  const handleDeleteDraft = async () => {
    try {
      await deleteSharedSalaryDraft();
      setHasDraft(false);
      setDraftLoaded(false);
      setSimulations(new Map());
      setSimulatedUsers(new Map());
      toast.success("Brouillon partagé supprimé");
    } catch (error) {
      console.error("Erreur lors de la suppression du brouillon:", error);
      toast.error("Erreur lors de la suppression du brouillon");
    }
  };

  // Calculer les totaux (uniquement pour les utilisateurs inclus, en excluant les départs neutralisés)
  const totals = useMemo(() => {
    // Masse salariale actuelle : uniquement les utilisateurs inclus (hors départs neutralisés)
    const currentTotal = users
      .filter(user => includedUsers.has(user.id) && !neutralizedDepartures.has(user.id))
      .reduce((sum, user) => {
        return sum + (user.currentMonthlySalary || 0);
      }, 0) + Array.from(simulatedUsers.values())
      .filter(user => includedUsers.has(user.id) && !neutralizedDepartures.has(user.id))
      .reduce((sum, user) => {
        return sum + user.currentMonthlySalary;
      }, 0);

    // Masse salariale simulée : uniquement les utilisateurs inclus (hors départs neutralisés)
    const simulatedTotal = users
      .filter(user => includedUsers.has(user.id) && !neutralizedDepartures.has(user.id))
      .reduce((sum, user) => {
        const simulation = simulations.get(user.id);
        if (simulation) {
          return sum + simulation.newSalary;
        }
        return sum + (user.currentMonthlySalary || 0);
      }, 0) + Array.from(simulatedUsers.values())
      .filter(user => includedUsers.has(user.id) && !neutralizedDepartures.has(user.id))
      .reduce((sum, user) => {
        const simulation = simulations.get(user.id);
        if (simulation) {
          return sum + simulation.newSalary;
        }
        return sum + user.currentMonthlySalary;
      }, 0);

    // Économies réalisées (départs neutralisés + utilisateurs exclus)
    const excludedUsers = users.filter(user => !includedUsers.has(user.id) && !neutralizedDepartures.has(user.id));
    const savingsFromExclusions = excludedUsers.reduce((sum, user) => {
      return sum + (user.currentMonthlySalary || 0);
    }, 0);
    
    const savingsFromDepartures = users
      .filter(user => neutralizedDepartures.has(user.id))
      .reduce((sum, user) => {
        return sum + (user.currentMonthlySalary || 0);
      }, 0) + Array.from(simulatedUsers.values())
      .filter(user => neutralizedDepartures.has(user.id))
      .reduce((sum, user) => {
        return sum + user.currentMonthlySalary;
      }, 0);

    // Coûts supplémentaires (arrivées simulées incluses dans la comparaison)
    const costsFromArrivals = Array.from(simulatedUsers.values())
      .filter(user => includedUsers.has(user.id) && !neutralizedDepartures.has(user.id))
      .reduce((sum, user) => {
        const simulation = simulations.get(user.id);
        return sum + (simulation ? simulation.newSalary : user.currentMonthlySalary);
      }, 0);

    const multiplier = displayMode === "annual" ? 12 : 1;
    const totalSavings = Math.round((savingsFromExclusions + savingsFromDepartures) * multiplier * 100) / 100;
    const totalCosts = Math.round(costsFromArrivals * multiplier * 100) / 100;
    const impactNet = Math.round((totalCosts - totalSavings) * 100) / 100;
    const evolutionPercentage = currentTotal > 0 ? Math.round((impactNet / (currentTotal * multiplier)) * 100 * 100) / 100 : 0;

    return {
      current: Math.round(currentTotal * multiplier * 100) / 100,
      simulated: Math.round(simulatedTotal * multiplier * 100) / 100,
      difference: Math.round((simulatedTotal - currentTotal) * multiplier * 100) / 100,
      savingsFromDepartures: Math.round(savingsFromDepartures * multiplier * 100) / 100,
      savingsFromExclusions: Math.round(savingsFromExclusions * multiplier * 100) / 100,
      totalSavings,
      costsFromArrivals: totalCosts,
      impactNet,
      evolutionPercentage,
    };
  }, [users, simulatedUsers, simulations, displayMode, includedUsers, neutralizedDepartures]);

  // Mettre à jour une simulation
  const updateSimulation = (userId: string, type: "percentage" | "amount", value: number) => {
    const user = users.find(u => u.id === userId);
    const simulatedUser = simulatedUsers.get(userId);
    
    if (!user && !simulatedUser) return;

    const currentSalary = user?.currentMonthlySalary || simulatedUser?.currentMonthlySalary || 0;
    let newSalary = currentSalary;

    if (type === "percentage") {
      newSalary = currentSalary * (1 + value / 100);
    } else {
      newSalary = currentSalary + value;
    }

    // Arrondir à 2 décimales
    newSalary = Math.round(newSalary * 100) / 100;

    const newSimulations = new Map(simulations);
    if (value === 0) {
      newSimulations.delete(userId);
    } else {
      newSimulations.set(userId, { type, value, newSalary });
    }
    setSimulations(newSimulations);
  };

  // Ajouter un utilisateur simulé
  const addSimulatedUser = (userData: Omit<SimulatedUser, "id" | "isSimulated">) => {
    const id = `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const simulatedUser: SimulatedUser = {
      ...userData,
      id,
      isSimulated: true,
    };
    
    const newSimulatedUsers = new Map(simulatedUsers);
    newSimulatedUsers.set(id, simulatedUser);
    setSimulatedUsers(newSimulatedUsers);
    
    // Ajouter automatiquement à la liste des inclus
    const newIncludedUsers = new Set(includedUsers);
    newIncludedUsers.add(id);
    setIncludedUsers(newIncludedUsers);
    
    toast.success(`Recrutement simulé ajouté : ${userData.firstName} ${userData.lastName}`);
  };

  // Supprimer un utilisateur simulé
  const removeSimulatedUser = (userId: string) => {
    const newSimulatedUsers = new Map(simulatedUsers);
    const user = newSimulatedUsers.get(userId);
    
    if (user) {
      newSimulatedUsers.delete(userId);
      setSimulatedUsers(newSimulatedUsers);
      
      // Supprimer aussi la simulation associée si elle existe
      const newSimulations = new Map(simulations);
      newSimulations.delete(userId);
      setSimulations(newSimulations);
      
      toast.success(`Recrutement simulé supprimé : ${user.firstName} ${user.lastName}`);
    }
  };

  // Effacer toutes les simulations
  const clearSimulations = () => {
    setSimulations(new Map());
  };

  // Compter les simulations actives
  const activeSimulationsCount = simulations.size;

  // Sauvegarder directement un salaire (hors brouillon)
  const handleSaveSalary = async (userId: string, monthlySalary: number, year: number) => {
    if (!user?.uid) {
      toast.error("Vous devez être connecté");
      return;
    }

    const userObj = users.find(u => u.id === userId);
    if (!userObj) {
      toast.error("Utilisateur introuvable");
      return;
    }

    const currentSalary = userObj.currentMonthlySalary || 0;
    // Arrondir à 2 décimales
    const roundedMonthlySalary = Math.round(monthlySalary * 100) / 100;
    
    try {
      await validateSalaryIncrease(
        userId,
        currentSalary,
        roundedMonthlySalary,
        year,
        "amount",
        Math.round((roundedMonthlySalary - currentSalary) * 100) / 100,
        user.uid
      );
      
      // Recharger les données
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du salaire:", error);
      throw error;
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <Banknote className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Gestion des Rémunérations
            </h1>
            <p className="text-muted-foreground">
              Visualisez et gérez les rémunérations de vos collaborateurs
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70">
                Collaborateurs
              </CardDescription>
              <CardTitle className="flex items-center gap-3 text-4xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                {users.length + simulatedUsers.size}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">
                Masse salariale actuelle
              </CardDescription>
              <CardTitle className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Euro className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl">{formatCurrency(totals.current)}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-violet-600/70 dark:text-violet-400/70">
                Masse salariale simulée
              </CardDescription>
              <CardTitle className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-br from-violet-600 to-purple-600 bg-clip-text text-transparent">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl">{formatCurrency(totals.simulated)}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
            totals.difference > 0 
              ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20" 
              : "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20"
          }`}>
            <CardHeader className="pb-4">
              <CardDescription className={`text-xs font-medium uppercase tracking-wider ${
                totals.difference > 0 
                  ? "text-amber-600/70 dark:text-amber-400/70" 
                  : "text-gray-600/70 dark:text-gray-400/70"
              }`}>
                Différence
              </CardDescription>
              <CardTitle className={`flex items-center gap-3 text-3xl font-bold ${
                totals.difference > 0 
                  ? "bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent" 
                  : "bg-gradient-to-br from-gray-600 to-slate-600 bg-clip-text text-transparent"
              }`}>
                <div className={`p-3 rounded-xl shadow-lg ${
                  totals.difference > 0 
                    ? "bg-gradient-to-br from-amber-500 to-orange-600" 
                    : "bg-gradient-to-br from-gray-500 to-slate-600"
                }`}>
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl">{totals.difference > 0 ? "+" : ""}{formatCurrency(totals.difference)}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Section de comparaison détaillée */}
      {(simulations.size > 0 || simulatedUsers.size > 0 || neutralizedDepartures.size > 0 || includedUsers.size < users.length + simulatedUsers.size) && (
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent font-bold">
                Comparaison détaillée
              </span>
            </CardTitle>
            <CardDescription>
              Analyse complète de l'impact des mouvements et simulations sur la masse salariale
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche : Situation actuelle */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Situation actuelle
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-sm text-muted-foreground mb-1">Utilisateurs réels (total)</div>
                    <div className="text-2xl font-bold text-emerald-600">{users.length}</div>
                  </div>
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-sm text-muted-foreground mb-1">Utilisateurs inclus</div>
                    <div className="text-2xl font-bold text-emerald-600">{includedUsers.size}</div>
                  </div>
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-sm text-muted-foreground mb-1">Masse salariale ({displayMode === "annual" ? "annuelle" : "mensuelle"})</div>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.current)}</div>
                  </div>
                </div>
              </div>

              {/* Colonne centrale : Différence et évolution */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    totals.impactNet > 0 ? "bg-amber-500" : totals.impactNet < 0 ? "bg-green-500" : "bg-gray-500"
                  }`}></div>
                  Impact net
                </h3>
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg border ${
                    totals.impactNet > 0 
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                      : totals.impactNet < 0
                        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-gray-50/50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800"
                  }`}>
                    <div className="text-sm text-muted-foreground mb-1">Impact net ({displayMode === "annual" ? "annuel" : "mensuel"})</div>
                    <div className={`text-2xl font-bold ${
                      totals.impactNet > 0 ? "text-amber-600" : totals.impactNet < 0 ? "text-green-600" : "text-gray-600"
                    }`}>
                      {totals.impactNet > 0 ? "+" : ""}{formatCurrency(totals.impactNet)}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    totals.evolutionPercentage > 0 
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                      : totals.evolutionPercentage < 0
                        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-gray-50/50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800"
                  }`}>
                    <div className="text-sm text-muted-foreground mb-1">Évolution</div>
                    <div className={`text-2xl font-bold ${
                      totals.evolutionPercentage > 0 ? "text-amber-600" : totals.evolutionPercentage < 0 ? "text-green-600" : "text-gray-600"
                    }`}>
                      {totals.evolutionPercentage > 0 ? "+" : ""}{totals.evolutionPercentage.toFixed(2)}%
                    </div>
                  </div>
                  {Math.abs(totals.savingsFromDepartures) < 100 && Math.abs(totals.costsFromArrivals) < 100 && 
                   Math.abs(totals.savingsFromDepartures - totals.costsFromArrivals) < 50 && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        ℹ️ Remplacement neutre
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite : Situation avec mouvements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  Avec mouvements
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
                    <div className="text-sm text-muted-foreground mb-1">Masse salariale ({displayMode === "annual" ? "annuelle" : "mensuelle"})</div>
                    <div className="text-2xl font-bold text-violet-600">{formatCurrency(totals.simulated)}</div>
                  </div>
                  <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="text-sm text-muted-foreground mb-1">Économies réalisées</div>
                    <div className="text-xl font-bold text-red-600">-{formatCurrency(totals.totalSavings)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {neutralizedDepartures.size} départ(s) + {users.length + simulatedUsers.size - includedUsers.size} exclusion(s)
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-muted-foreground mb-1">Coûts supplémentaires</div>
                    <div className="text-xl font-bold text-blue-600">+{formatCurrency(totals.costsFromArrivals)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {simulatedUsers.size} recrutement(s) simulé(s)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de validation globale */}
            {(simulations.size > 0 || neutralizedDepartures.size > 0 || simulatedUsers.size > 0) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-center">
                <Button
                  size="lg"
                  onClick={() => setGlobalValidationModalOpen(true)}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
                >
                  <Check className="h-5 w-5" />
                  Valider toutes les modifications
                </Button>
              </div>
            )}

            {/* Métriques détaillées */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Métriques détaillées</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Exclus</div>
                  <div className="text-lg font-semibold">{users.length + simulatedUsers.size - includedUsers.size}</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Départs</div>
                  <div className="text-lg font-semibold text-orange-600">{neutralizedDepartures.size}</div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Arrivées</div>
                  <div className="text-lg font-semibold text-blue-600">{simulatedUsers.size}</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Augmentations</div>
                  <div className="text-lg font-semibold text-amber-600">{simulations.size}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Économies exclusions</div>
                  <div className="text-sm font-semibold">{formatCurrency(totals.savingsFromExclusions)}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Économies départs</div>
                  <div className="text-sm font-semibold">{formatCurrency(totals.savingsFromDepartures)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <Banknote className="h-4 w-4" />
            Tableau des rémunérations
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          {/* Section des départs neutralisés */}
          {neutralizedDepartures.size > 0 && (
            <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserMinus className="h-5 w-5 text-orange-600" />
                  Départs neutralisés ({neutralizedDepartures.size})
                </CardTitle>
                <CardDescription>
                  Utilisateurs marqués comme partants (simulation)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(neutralizedDepartures).map((userId) => {
                    const userObj = users.find(u => u.id === userId);
                    const simulatedUser = simulatedUsers.get(userId);
                    const user = userObj || simulatedUser;
                    if (!user) return null;
                    
                    const salary = (userObj?.currentMonthlySalary || simulatedUser?.currentMonthlySalary || 0) * (displayMode === "annual" ? 12 : 1);
                    
                    return (
                      <div
                        key={userId}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Économie : {formatCurrency(salary)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newSet = new Set(neutralizedDepartures);
                            newSet.delete(userId);
                            setNeutralizedDepartures(newSet);
                            // Réactiver le toggle d'inclusion
                            const newIncluded = new Set(includedUsers);
                            newIncluded.add(userId);
                            setIncludedUsers(newIncluded);
                          }}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          <SalaryTable
            users={users}
            simulatedUsers={simulatedUsers}
            simulations={simulations}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onSimulationUpdate={updateSimulation}
            onClearSimulations={clearSimulations}
            onDataRefresh={loadData}
            activeSimulationsCount={activeSimulationsCount}
            currentUserId={user?.uid || ""}
            hasDraft={hasDraft}
            onSaveDraft={handleSaveDraft}
            onDeleteDraft={handleDeleteDraft}
            savingDraft={savingDraft}
            onAddSimulatedUser={() => setAddSimulatedDialogOpen(true)}
            onRemoveSimulatedUser={removeSimulatedUser}
            includedUsers={includedUsers}
            onToggleInclusion={(userId, included) => {
              const newSet = new Set(includedUsers);
              if (included) {
                newSet.add(userId);
              } else {
                newSet.delete(userId);
              }
              setIncludedUsers(newSet);
            }}
            onSaveSalary={handleSaveSalary}
            neutralizedDepartures={neutralizedDepartures}
            onToggleDeparture={(userId, neutralized) => {
              const newSet = new Set(neutralizedDepartures);
              if (neutralized) {
                newSet.add(userId);
                // Décocher automatiquement le toggle d'inclusion quand on neutralise
                const newIncluded = new Set(includedUsers);
                newIncluded.delete(userId);
                setIncludedUsers(newIncluded);
              } else {
                newSet.delete(userId);
                // Recocher automatiquement le toggle d'inclusion quand on réactive
                const newIncluded = new Set(includedUsers);
                newIncluded.add(userId);
                setIncludedUsers(newIncluded);
              }
              setNeutralizedDepartures(newSet);
            }}
          />
          <AddSimulatedUserDialog
            open={addSimulatedDialogOpen}
            onOpenChange={setAddSimulatedDialogOpen}
            onAdd={addSimulatedUser}
          />
        </TabsContent>

        <TabsContent value="history">
          <SalaryHistoryView
            history={history}
            users={users}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de validation globale */}
      <GlobalValidationModal
        open={globalValidationModalOpen}
        onClose={() => setGlobalValidationModalOpen(false)}
        users={users}
        simulatedUsers={simulatedUsers}
        simulations={simulations}
        neutralizedDepartures={neutralizedDepartures}
        displayMode={displayMode}
        currentUserId={user?.uid || ""}
        totals={totals}
        onSuccess={async () => {
          setGlobalValidationModalOpen(false);
          // Réinitialiser les simulations et départs
          setSimulations(new Map());
          setSimulatedUsers(new Map());
          setNeutralizedDepartures(new Set());
          // Recharger les données
          await loadData();
        }}
      />
    </div>
  );
}
