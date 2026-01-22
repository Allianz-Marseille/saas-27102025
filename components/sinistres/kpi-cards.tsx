/**
 * Composants de cartes KPI pour le module Sinistres
 * Design premium avec icônes, animations et couleurs sémantiques
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  AlertTriangle,
  UserX,
  DollarSign,
  Route,
  Filter,
  Clock,
  TrendingUp,
  Scale,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { SinistreKPI, SinistreStatus, SinistreRoute } from "@/types/sinistre";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
  trend,
  delay = 0,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-3xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SinistresKPICardsProps {
  kpi: SinistreKPI;
}

export function SinistresKPICards({ kpi }: SinistresKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* 1. Sinistres ouverts */}
      <KPICard
        title="Sinistres ouverts"
        value={kpi.totalOpen}
        icon={FileText}
        color="text-blue-600"
        bgColor="bg-blue-100 dark:bg-blue-900/20"
        delay={0}
      />

      {/* 2. Sinistres en retard/alertes */}
      <KPICard
        title="Sinistres en retard"
        value={kpi.totalAlerts}
        subtitle={kpi.totalAlerts > 0 ? "Nécessitent une attention" : "Aucune alerte"}
        icon={AlertTriangle}
        color="text-orange-600"
        bgColor="bg-orange-100 dark:bg-orange-900/20"
        delay={0.05}
      />

      {/* 3. Sinistres non affectés */}
      <KPICard
        title="Non affectés"
        value={kpi.totalUnassigned}
        subtitle={kpi.totalUnassigned > 0 ? "À affecter" : "Tous affectés"}
        icon={UserX}
        color="text-gray-600"
        bgColor="bg-gray-100 dark:bg-gray-900/20"
        delay={0.1}
      />

      {/* 4. Montant total ouvert */}
      <KPICard
        title="Montant total ouvert"
        value={formatCurrency(kpi.totalAmountOpen)}
        icon={DollarSign}
        color="text-green-600"
        bgColor="bg-green-100 dark:bg-green-900/20"
        delay={0.15}
      />

      {/* 5. Répartition par route */}
      <Card className="border-2 shadow-lg col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Répartition par route
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Route className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(kpi.distributionByRoute).map(([route, count], index) => {
              if (count === 0) return null;
              const routeLabel = route.replace("Route ", "").charAt(0);
              return (
                <div key={route} className="flex items-center justify-between">
                  <span className="text-sm font-medium">Route {routeLabel}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 6. Répartition par statut */}
      <Card className="border-2 shadow-lg col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Répartition par statut
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
              <Filter className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(kpi.distributionByStatus)
              .filter(([_, count]) => count > 0)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{status}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* 7. Sinistres en attente pièces */}
      <KPICard
        title="En attente pièces"
        value={kpi.pendingDocuments}
        subtitle="Depuis plus de 7 jours"
        icon={Clock}
        color="text-yellow-600"
        bgColor="bg-yellow-100 dark:bg-yellow-900/20"
        delay={0.2}
      />

      {/* 8. Délai moyen de traitement */}
      <KPICard
        title="Délai moyen"
        value={`${kpi.averageProcessingTime} jours`}
        subtitle="Depuis ouverture"
        icon={Clock}
        color="text-blue-600"
        bgColor="bg-blue-100 dark:bg-blue-900/20"
        delay={0.25}
      />

      {/* 9. Taux de clôture */}
      <KPICard
        title="Taux de clôture"
        value={`${kpi.closureRate}%`}
        icon={TrendingUp}
        color="text-green-600"
        bgColor="bg-green-100 dark:bg-green-900/20"
        delay={0.3}
      />

      {/* 10. Sinistres avec recours */}
      <KPICard
        title="Avec recours"
        value={kpi.withRecourse.count}
        subtitle={formatCurrency(kpi.withRecourse.amount)}
        icon={Scale}
        color="text-red-600"
        bgColor="bg-red-100 dark:bg-red-900/20"
        delay={0.35}
      />

      {/* 11. Dernier import Excel */}
      {kpi.lastImport && (
        <Card className="border-2 shadow-lg col-span-1 md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dernier import Excel
              </CardTitle>
              <div className="flex items-center gap-2">
                {kpi.lastImport.isRecent ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-600">À jour</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-600">À actualiser</span>
                  </div>
                )}
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date d'import</span>
                <span className="text-sm font-medium">
                  {format(
                    kpi.lastImport.importDate instanceof Timestamp
                      ? kpi.lastImport.importDate.toDate()
                      : kpi.lastImport.importDate,
                    "dd/MM/yyyy 'à' HH:mm"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fichier</span>
                <span className="text-sm font-medium truncate max-w-xs" title={kpi.lastImport.excelVersion}>
                  {kpi.lastImport.excelVersion}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sinistres importés</span>
                <span className="text-sm font-bold">{kpi.lastImport.newSinistres}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

