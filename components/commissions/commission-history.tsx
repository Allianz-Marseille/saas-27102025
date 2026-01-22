"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";

interface CommissionHistoryProps {
  data: Array<{
    month: string;
    commissions: number;
    ratio: number;
    ca: number;
  }>;
}

export function CommissionHistory({ data }: CommissionHistoryProps) {
  // Calculer la tendance
  const lastMonthCommissions = data[data.length - 1]?.commissions || 0;
  const previousMonthCommissions = data[data.length - 2]?.commissions || 0;
  const trend = lastMonthCommissions > previousMonthCommissions ? "up" : "down";
  const trendPercentage = previousMonthCommissions > 0
    ? Math.abs(((lastMonthCommissions - previousMonthCommissions) / previousMonthCommissions) * 100).toFixed(1)
    : 0;

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Historique des 6 derniers mois
            </CardTitle>
            <CardDescription className="mt-2">
              Évolution de vos commissions et performances
            </CardDescription>
          </div>
          {data.length >= 2 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tendance</p>
              <p className={`text-lg font-bold ${trend === "up" ? "text-green-600" : "text-orange-600"}`}>
                {trend === "up" ? "↑" : "↓"} {trendPercentage}%
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-6">
            {/* Graphique des commissions */}
            <div>
              <h4 className="text-sm font-medium mb-4">Commissions mensuelles</h4>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCommissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    label={{ value: '€', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} €`, 'Commissions']}
                  />
                  <Area
                    type="monotone"
                    dataKey="commissions"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorCommissions)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique du ratio */}
            <div>
              <h4 className="text-sm font-medium mb-4">Évolution du ratio</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    label={{ value: '%', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Ratio']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ratio"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Ratio"
                  />
                  {/* Ligne de référence à 100% */}
                  <Line
                    type="monotone"
                    dataKey={() => 100}
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Objectif (100%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Résumé statistique */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Moyenne commissions</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(data.reduce((sum, d) => sum + d.commissions, 0) / data.length).toFixed(2)} €
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200/50 dark:border-purple-800/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Ratio moyen</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {(data.reduce((sum, d) => sum + d.ratio, 0) / data.length).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">CA moyen</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {(data.reduce((sum, d) => sum + d.ca, 0) / data.length).toFixed(0)} €
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Aucune donnée historique disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

