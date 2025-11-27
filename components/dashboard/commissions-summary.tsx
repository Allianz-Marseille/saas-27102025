"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { KPI } from "@/types";
import { cn } from "@/lib/utils";

interface CommissionsSummaryProps {
  kpi: KPI;
}

export function CommissionsSummary({ kpi }: CommissionsSummaryProps) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Commissions du mois</h3>
                <p className="text-sm text-muted-foreground">
                  État de vos rémunérations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Commissions potentielles */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Potentielles</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(kpi.commissionsPotentielles)}
                </p>
              </div>

              {/* Commissions réelles */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Validées</p>
                <p className={cn(
                  "text-2xl font-bold",
                  kpi.commissionValidee 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-muted-foreground"
                )}>
                  {formatCurrency(kpi.commissionsReelles)}
                </p>
              </div>

              {/* Statut */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Statut</p>
                <div className="flex items-center gap-2">
                  {kpi.commissionValidee ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Objectifs atteints
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        En progression
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mini indicateurs de validation */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                kpi.commissionsPotentielles >= 200
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}>
                {kpi.commissionsPotentielles >= 200 ? "✓" : "○"} Seuil 200€
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                kpi.nbProcess >= 15
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}>
                {kpi.nbProcess >= 15 ? "✓" : "○"} 15 process ({kpi.nbProcess}/15)
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                kpi.ratio >= 100
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}>
                {kpi.ratio >= 100 ? "✓" : "○"} Ratio {kpi.ratio.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Bouton d'action */}
          <div className="ml-4">
            <Button
              onClick={() => router.push("/dashboard/commissions")}
              size="lg"
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Voir le détail
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

