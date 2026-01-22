"use client";

import { useState, useEffect, useMemo } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { getMessageStatistics } from "@/lib/firebase/message-statistics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquare,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type PeriodFilter = "day" | "week" | "month" | "year" | "all";

/**
 * Dashboard de statistiques des messages (ADMIN uniquement)
 */
export default function MessageStatisticsPage() {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");

  useEffect(() => {
    loadStatistics();
  }, [periodFilter]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined = new Date();

      switch (periodFilter) {
        case "day":
          startDate = startOfDay(subDays(new Date(), 1));
          endDate = endOfDay(new Date());
          break;
        case "week":
          startDate = subWeeks(new Date(), 1);
          break;
        case "month":
          startDate = subMonths(new Date(), 1);
          break;
        case "year":
          startDate = subMonths(new Date(), 12);
          break;
        case "all":
          startDate = undefined;
          endDate = undefined;
          break;
      }

      const stats = await getMessageStatistics(startDate, endDate);
      setStatistics(stats);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour les graphiques
  const chartData = useMemo(() => {
    if (!statistics) return [];

    return statistics.messagesByPeriod.map((item: { period: string; count: number }) => ({
      date: format(new Date(item.period), "dd/MM", { locale: fr }),
      messages: item.count,
    }));
  }, [statistics]);

  const readRateData = useMemo(() => {
    if (!statistics) return [];

    return statistics.readRateByMessage.slice(0, 10).map((item: any) => ({
      title: item.title.length > 30 ? item.title.substring(0, 30) + "..." : item.title,
      readRate: Math.round(item.readRate * 100),
    }));
  }, [statistics]);

  const priorityData = useMemo(() => {
    if (!statistics) return [];

    return Object.entries(statistics.messagesByPriority || {}).map(([priority, count]) => ({
      priority: priority === "urgent" ? "Urgente" : priority === "high" ? "Haute" : priority === "normal" ? "Normale" : "Basse",
      count: count as number,
    }));
  }, [statistics]);

  if (loading) {
    return (
      <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Statistiques des messages</h1>
            <p className="text-muted-foreground mt-1">
              Analysez les performances de vos messages
            </p>
          </div>
          <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="year">12 derniers mois</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!statistics ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée disponible
          </div>
        ) : (
          <>
            {/* Métriques globales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages envoyés</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalMessages}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Destinataires</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalRecipients}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de lecture</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(statistics.averageReadRate * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.totalRead} / {statistics.totalRecipients} lus
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(statistics.averageReadTime)}s
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">de lecture</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique temporel : Messages envoyés par jour */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Messages envoyés par jour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="messages"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Messages"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Graphique en barres : Taux de lecture par message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top 10 - Taux de lecture par message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={readRateData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis type="number" domain={[0, 100]} className="text-xs" />
                      <YAxis dataKey="title" type="category" width={150} className="text-xs" />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Bar dataKey="readRate" fill="#3b82f6" name="Taux de lecture (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Messages par priorité */}
            {priorityData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par priorité</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis dataKey="priority" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" name="Nombre de messages" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </RouteGuard>
  );
}
