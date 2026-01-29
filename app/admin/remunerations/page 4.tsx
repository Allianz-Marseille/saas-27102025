"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, TrendingUp, History, Users, Euro } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";
import { getCurrentSalaries, getSalaryHistory, getSharedSalaryDraft, saveSharedSalaryDraft, deleteSharedSalaryDraft } from "@/lib/firebase/salaries";
import { toast } from "sonner";
import type { User, SalaryHistory, SalaryDraft, SimulatedUser } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { SalaryTable } from "@/components/admin/salary-table";
import { SalaryHistoryView } from "@/components/admin/salary-history-view";
import { AddSimulatedUserDialog } from "@/components/admin/add-simulated-user-dialog";

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

  // Calculer les totaux
  const totals = useMemo(() => {
    // Masse salariale actuelle : vrais utilisateurs + utilisateurs simulés
    const currentTotal = users.reduce((sum, user) => {
      return sum + (user.currentMonthlySalary || 0);
    }, 0) + Array.from(simulatedUsers.values()).reduce((sum, user) => {
      return sum + user.currentMonthlySalary;
    }, 0);

    // Masse salariale simulée : vrais utilisateurs avec simulations + utilisateurs simulés avec simulations
    const simulatedTotal = users.reduce((sum, user) => {
      const simulation = simulations.get(user.id);
      if (simulation) {
        return sum + simulation.newSalary;
      }
      return sum + (user.currentMonthlySalary || 0);
    }, 0) + Array.from(simulatedUsers.values()).reduce((sum, user) => {
      const simulation = simulations.get(user.id);
      if (simulation) {
        return sum + simulation.newSalary;
      }
      return sum + user.currentMonthlySalary;
    }, 0);

    const multiplier = displayMode === "annual" ? 12 : 1;

    return {
      current: currentTotal * multiplier,
      simulated: simulatedTotal * multiplier,
      difference: (simulatedTotal - currentTotal) * multiplier,
    };
  }, [users, simulatedUsers, simulations, displayMode]);

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
    </div>
  );
}
