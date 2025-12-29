"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, TrendingUp, History, Users, Euro } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";
import { getCurrentSalaries, getSalaryHistory } from "@/lib/firebase/salaries";
import { toast } from "sonner";
import type { User, SalaryHistory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { SalaryTable } from "@/components/admin/salary-table";
import { SalaryHistoryView } from "@/components/admin/salary-history-view";

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
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Calculer les totaux
  const totals = useMemo(() => {
    const currentTotal = users.reduce((sum, user) => {
      return sum + (user.currentMonthlySalary || 0);
    }, 0);

    const simulatedTotal = users.reduce((sum, user) => {
      const simulation = simulations.get(user.id);
      if (simulation) {
        return sum + simulation.newSalary;
      }
      return sum + (user.currentMonthlySalary || 0);
    }, 0);

    const multiplier = displayMode === "annual" ? 12 : 1;

    return {
      current: currentTotal * multiplier,
      simulated: simulatedTotal * multiplier,
      difference: (simulatedTotal - currentTotal) * multiplier,
    };
  }, [users, simulations, displayMode]);

  // Mettre à jour une simulation
  const updateSimulation = (userId: string, type: "percentage" | "amount", value: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentSalary = user.currentMonthlySalary || 0;
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Collaborateurs</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                {users.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Masse salariale actuelle</CardDescription>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Euro className="h-5 w-5" />
                {formatCurrency(totals.current)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Masse salariale simulée</CardDescription>
              <CardTitle className="flex items-center gap-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
                {formatCurrency(totals.simulated)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Différence</CardDescription>
              <CardTitle className={`flex items-center gap-2 ${
                totals.difference > 0 ? "text-orange-600" : "text-gray-600"
              }`}>
                <TrendingUp className="h-5 w-5" />
                {totals.difference > 0 ? "+" : ""}{formatCurrency(totals.difference)}
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
            simulations={simulations}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onSimulationUpdate={updateSimulation}
            onClearSimulations={clearSimulations}
            onDataRefresh={loadData}
            activeSimulationsCount={activeSimulationsCount}
            currentUserId={user?.uid || ""}
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
