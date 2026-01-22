"use client";

import { DollarSign, Target, Activity, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { KPI } from "@/types";
import { cn } from "@/lib/utils";

interface MonthlyOverviewProps {
  kpi: KPI;
}

export function MonthlyOverview({ kpi }: MonthlyOverviewProps) {
  const progressPercentage = Math.min((kpi.ratio / 100) * 100, 100);
  const caTrend = kpi.caMensuel > 10000 ? "up" : "neutral";
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Carte 1: Chiffre d'affaires */}
      <Card className="overflow-hidden hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 border-l-4 border-l-blue-500 group">
        <CardContent className="p-6 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Chiffre d&apos;affaires</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(kpi.caMensuel)}
              </span>
              {caTrend === "up" && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  ↑ Bon mois
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Auto/Moto</p>
                <p className="text-sm font-semibold">{formatCurrency(kpi.caAuto)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Autres</p>
                <p className="text-sm font-semibold">{formatCurrency(kpi.caAutres)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carte 2: Activité */}
      <Card className="overflow-hidden hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 border-l-4 border-l-purple-500 group">
        <CardContent className="p-6 bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-950 dark:to-purple-950/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Activité</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {kpi.nbContrats}
              </span>
              <span className="text-sm text-muted-foreground">contrats</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Auto/Moto</p>
                <p className="text-sm font-semibold">{kpi.nbContratsAuto} ({Math.round((kpi.nbContratsAuto / kpi.nbContrats) * 100) || 0}%)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Autres</p>
                <p className="text-sm font-semibold">{kpi.nbContratsAutres} ({Math.round((kpi.nbContratsAutres / kpi.nbContrats) * 100) || 0}%)</p>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">Process en cours</p>
              <p className="text-sm font-semibold">{kpi.nbProcess}/15</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carte 3: Performance / Ratio */}
      <Card className="overflow-hidden hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 border-l-4 border-l-green-500 group">
        <CardContent className="p-6 bg-gradient-to-br from-white to-green-50/30 dark:from-slate-950 dark:to-green-950/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Performance</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-3xl font-bold",
                kpi.ratio >= 100 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
              )}>
                {kpi.ratio.toFixed(1)}%
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Objectif : 100%</span>
                {kpi.ratio >= 100 && (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +{(kpi.ratio - 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    kpi.ratio >= 100 ? "bg-green-500" : "bg-orange-500"
                  )}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Contrats autres / Auto
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Carte 4: Commissions */}
      <Card className="overflow-hidden hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 border-l-4 border-l-amber-500 group">
        <CardContent className="p-6 bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-950 dark:to-amber-950/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Commissions</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-3xl font-bold",
                kpi.commissionValidee ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {formatCurrency(kpi.commissionsReelles)}
              </span>
            </div>
            
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Potentielles</span>
                <span className="text-sm font-semibold">{formatCurrency(kpi.commissionsPotentielles)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Validées</span>
                <span className={cn(
                  "text-sm font-semibold",
                  kpi.commissionValidee ? "text-green-600 dark:text-green-400" : ""
                )}>
                  {formatCurrency(kpi.commissionsReelles)}
                </span>
              </div>
            </div>
            
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mt-3",
              kpi.commissionValidee 
                ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
            )}>
              {kpi.commissionValidee ? "✓ Validées" : "En attente"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

