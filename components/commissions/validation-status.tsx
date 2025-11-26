"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { KPI } from "@/types";
import { cn } from "@/lib/utils";

interface ValidationStatusProps {
  kpi: KPI;
}

export function ValidationStatus({ kpi }: ValidationStatusProps) {
  const conditions = [
    {
      label: "Commissions potentielles",
      value: formatCurrency(kpi.commissionsPotentielles),
      threshold: formatCurrency(200),
      isMet: kpi.commissionsPotentielles >= 200,
      missing: kpi.commissionsPotentielles < 200 ? formatCurrency(200 - kpi.commissionsPotentielles) : null,
    },
    {
      label: "Nombre de process",
      value: `${kpi.nbProcess}`,
      threshold: "15",
      isMet: kpi.nbProcess >= 15,
      missing: kpi.nbProcess < 15 ? `${15 - kpi.nbProcess} process` : null,
      subtitle: "M+3, Pré-terme auto, Pré-terme IRD",
    },
    {
      label: "Ratio",
      value: `${kpi.ratio.toFixed(1)}%`,
      threshold: "100%",
      isMet: kpi.ratio >= 100,
      missing: kpi.ratio < 100 ? `${(100 - kpi.ratio).toFixed(1)}%` : null,
      subtitle: "Contrats autres / Auto",
    },
  ];

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              Conditions de validation
            </CardTitle>
            <CardDescription className="mt-2">
              Vérification des critères pour déclencher les commissions réelles
            </CardDescription>
          </div>
          {kpi.commissionValidee && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg shadow-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <span className="text-sm font-bold text-white">
                ✓ Validé
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {conditions.map((condition, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-lg border-2 p-5 transition-all duration-300 group",
                  condition.isMet
                    ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-lg hover:shadow-green-500/20"
                    : "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 hover:shadow-lg hover:shadow-orange-500/20"
                )}
              >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {condition.isMet ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                  )}
                  <h3 className="font-semibold text-sm">{condition.label}</h3>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      condition.isMet
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    )}
                  >
                    {condition.value}
                  </span>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {condition.threshold}
                  </span>
                </div>
                
                {condition.missing && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Il manque {condition.missing}
                  </p>
                )}
                
                {condition.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                    {condition.subtitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {kpi.commissionValidee && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/30">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-full bg-white/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  🎉 Félicitations !
                </p>
                <p className="text-sm text-white/90">
                  Toutes les conditions sont remplies ! Les commissions seront validées.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

