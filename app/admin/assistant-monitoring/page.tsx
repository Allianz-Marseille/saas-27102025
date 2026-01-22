"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, DollarSign, Users, AlertTriangle, Activity } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GlobalStats {
  totalRequests: number;
  totalCost: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  uniqueUsers: number;
  requestsByType: Record<"text" | "image" | "file", number>;
  requestsByModel: Record<string, number>;
  topUsers: Array<{ userId: string; requests: number; cost: number }>;
}

interface DailyStats {
  date: string;
  requests: number;
  cost: number;
  tokensInput: number;
  tokensOutput: number;
}

interface BudgetStatus {
  currentMonthCost: number;
  budget: number;
  percentage: number;
  level: "none" | "warning" | "critical" | "blocked";
  remaining: number;
  daysUntilReset: number;
}

export default function AssistantMonitoringPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [monthlyBudget, setMonthlyBudget] = useState(100);
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [criticalThreshold, setCriticalThreshold] = useState(95);
  const [blockAtLimit, setBlockAtLimit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isUserAdmin = isAdmin(userData);

  useEffect(() => {
    if (!authLoading && (!user || !isUserAdmin)) {
      router.push("/");
      return;
    }

    if (isUserAdmin) {
      loadStats();
    }
  }, [user, userData, authLoading, isUserAdmin, router, days]);

  const loadStats = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/assistant/monitoring?scope=global&days=${days}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des statistiques");
      }

      const data = await response.json();
      if (data.success) {
        setGlobalStats(data.global);
        setDailyStats(data.daily);
        setBudgetStatus(data.budget);
        setMonthlyBudget(data.budget.budget);
        // Stocker les seuils en POURCENTAGES (80%, 95%)
        setWarningThreshold(data.budget.warningThreshold ? data.budget.warningThreshold * 100 : 80);
        setCriticalThreshold(data.budget.criticalThreshold ? data.budget.criticalThreshold * 100 : 95);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBudgetConfig = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/assistant/monitoring", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          monthlyBudget,
          warningThreshold: warningThreshold / 100, // Convertir % en fraction (80 → 0.8)
          criticalThreshold: criticalThreshold / 100, // Convertir % en fraction (95 → 0.95)
          blockAtLimit,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      toast.success("Configuration sauvegardée");
      loadStats();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Monitoring Assistant IA</h1>
            <p className="text-muted-foreground">Statistiques d'utilisation et gestion du budget</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="usage">Utilisation</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requêtes totales</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{globalStats?.totalRequests.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Toutes les requêtes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coût total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${globalStats?.totalCost.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground">Coût cumulé</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs uniques</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{globalStats?.uniqueUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget utilisé</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {budgetStatus ? `${budgetStatus.percentage.toFixed(1)}%` : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgetStatus ? `$${budgetStatus.currentMonthCost.toFixed(2)} / $${budgetStatus.budget.toFixed(2)}` : "$0.00 / $0.00"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget status */}
          {budgetStatus && budgetStatus.level !== "none" && (
            <Card className={budgetStatus.level === "critical" || budgetStatus.level === "blocked" ? "border-destructive" : "border-amber-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${budgetStatus.level === "critical" || budgetStatus.level === "blocked" ? "text-destructive" : "text-amber-500"}`} />
                  Alerte budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {budgetStatus.level === "blocked" && "Budget mensuel dépassé. Les requêtes sont bloquées."}
                  {budgetStatus.level === "critical" && "Budget mensuel proche de la limite critique."}
                  {budgetStatus.level === "warning" && "Budget mensuel proche du seuil d'avertissement."}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {budgetStatus.remaining.toFixed(2)} $ restants • Réinitialisation dans {budgetStatus.daysUntilReset} jours
                </p>
              </CardContent>
            </Card>
          )}

          {/* Top utilisateurs */}
          {globalStats && globalStats.topUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs les plus actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {globalStats.topUsers.slice(0, 10).map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm text-muted-foreground font-mono">{user.userId.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{user.requests} requêtes</span>
                        <span className="text-sm font-medium">${user.cost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Utilisation */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Texte</span>
                    <span className="text-sm font-medium">{globalStats?.requestsByType.text || 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${globalStats ? (globalStats.requestsByType.text / globalStats.totalRequests) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Images</span>
                    <span className="text-sm font-medium">{globalStats?.requestsByType.image || 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{
                        width: `${globalStats ? (globalStats.requestsByType.image / globalStats.totalRequests) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Fichiers</span>
                    <span className="text-sm font-medium">{globalStats?.requestsByType.file || 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${globalStats ? (globalStats.requestsByType.file / globalStats.totalRequests) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques quotidiennes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyStats.slice(-10).reverse().map((stat) => (
                  <div key={stat.date} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{new Date(stat.date).toLocaleDateString("fr-FR")}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">{stat.requests} requêtes</span>
                      <span className="text-sm font-medium">${stat.cost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget */}
        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="monthlyBudget">Budget mensuel ($)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="warningThreshold">Seuil d'avertissement (%)</Label>
                <Input
                  id="warningThreshold"
                  type="number"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
              <div>
                <Label htmlFor="criticalThreshold">Seuil critique (%)</Label>
                <Input
                  id="criticalThreshold"
                  type="number"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="blockAtLimit"
                  checked={blockAtLimit}
                  onChange={(e) => setBlockAtLimit(e.target.checked)}
                />
                <Label htmlFor="blockAtLimit">Bloquer les requêtes à 100% du budget</Label>
              </div>
              <Button onClick={handleSaveBudgetConfig} disabled={isSaving}>
                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

