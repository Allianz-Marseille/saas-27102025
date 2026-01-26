"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { History, Euro } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { User, SalaryHistory } from "@/types";

interface SalaryHistoryViewProps {
  history: SalaryHistory[];
  users: User[];
  onRefresh: () => void;
  displayMode?: "monthly" | "annual";
}

export function SalaryHistoryView({ 
  history, 
  users, 
  onRefresh,
  displayMode = "monthly"
}: SalaryHistoryViewProps) {
  const multiplier = displayMode === "annual" ? 12 : 1;

  // Obtenir les années disponibles depuis l'historique (uniquement validées)
  const availableYears = useMemo(() => {
    const years = new Set(history.map(h => h.year).filter((year): year is number => typeof year === 'number'));
    years.add(2025); // Toujours inclure 2025
    return Array.from(years).sort((a, b) => a - b);
  }, [history]);

  // Fonction helper pour récupérer le salaire validé d'un utilisateur pour une année
  const getSalaryForYear = (userId: string, year: number): number => {
    // Chercher une entrée exacte pour cette année
    const exactEntry = history.find(
      h => h.userId === userId && h.year === year
    );
    if (exactEntry) {
      return exactEntry.monthlySalary;
    }

    // Chercher la dernière entrée avant cette année
    const entriesBeforeYear = history
      .filter(h => h.userId === userId && h.year < year)
      .sort((a, b) => {
        const aYear = typeof a.year === 'number' ? a.year : 0;
        const bYear = typeof b.year === 'number' ? b.year : 0;
        return bYear - aYear;
      });
    
    if (entriesBeforeYear.length > 0) {
      return entriesBeforeYear[0].monthlySalary;
    }

    // Sinon, retourner le salaire actuel de l'utilisateur
    const userObj = users.find(u => u.id === userId);
    return userObj?.currentMonthlySalary || 0;
  };

  // Calculer les totaux par année
  const totalsByYear = useMemo(() => {
    const totals = new Map<number, number>();
    availableYears.forEach(year => {
      const total = users.reduce((sum, user) => {
        const salary = getSalaryForYear(user.id, year);
        return sum + (salary * multiplier);
      }, 0);
      totals.set(year, total);
    });
    return totals;
  }, [users, availableYears, displayMode, history, multiplier]);

  // Fonction pour formater un nombre avec séparateurs de milliers et 2 décimales max
  const formatNumberWithThousands = (value: number): string => {
    if (value === 0) return "0";
    
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value);
  };

  // Calculer la variation entre deux années pour un utilisateur
  const getVariation = (userId: string, previousYear: number, currentYear: number): { value: number; displayValue: string; showArrow: boolean } | null => {
    const previousSalary = getSalaryForYear(userId, previousYear);
    const currentSalary = getSalaryForYear(userId, currentYear);

    const previousDisplay = previousSalary * multiplier;
    const currentDisplay = currentSalary * multiplier;

    // Ne pas afficher si l'une des deux années est à 0
    if (previousDisplay === 0 || currentDisplay === 0) {
      return null;
    }

    const difference = currentDisplay - previousDisplay;
    const sign = difference >= 0 ? "+" : "";
    
    return {
      value: difference,
      displayValue: `${sign}${formatNumberWithThousands(Math.abs(difference))} €`,
      showArrow: true,
    };
  };

  // Calculer la variation totale entre deux années
  const getTotalVariation = (previousYear: number, currentYear: number): { value: number; displayValue: string; showArrow: boolean } | null => {
    const totalPrevious = totalsByYear.get(previousYear) || 0;
    const totalCurrent = totalsByYear.get(currentYear) || 0;

    // Ne pas afficher si l'une des deux années est à 0
    if (totalPrevious === 0 || totalCurrent === 0) {
      return null;
    }

    const difference = totalCurrent - totalPrevious;
    const sign = difference >= 0 ? "+" : "";
    
    return {
      value: difference,
      displayValue: `${sign}${formatNumberWithThousands(Math.abs(difference))} €`,
      showArrow: true,
    };
  };


  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg">
            <History className="h-6 w-6 text-white" />
          </div>
          <span>Historique des rémunérations</span>
        </CardTitle>
        <CardDescription>
          Affichage en lecture seule des rémunérations validées par année
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-background">Collaborateur</TableHead>
                {availableYears.map((year, index) => {
                  const isLast = index === availableYears.length - 1;
                  const previousYear = index > 0 ? availableYears[index - 1] : null;
                  
                  return (
                    <React.Fragment key={year}>
                      {previousYear && (
                        <TableHead className="text-center min-w-[120px]">
                          <span className="text-xs text-muted-foreground">Variation</span>
                        </TableHead>
                      )}
                      <TableHead className="text-center min-w-[150px]">
                        {year}
                      </TableHead>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={
                      availableYears.length + 
                      (availableYears.length > 1 ? availableYears.length - 1 : 0) // Colonnes de variation
                    } 
                    className="text-center text-muted-foreground py-8"
                  >
                    Aucun collaborateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="sticky left-0 z-10 bg-background">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {user.firstName} {user.lastName}
                        </span>
                        {user.email && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </TableCell>
                    {availableYears.map((year, index) => {
                      const salary = getSalaryForYear(user.id, year);
                      const displaySalary = salary * multiplier;
                      const previousYear = index > 0 ? availableYears[index - 1] : null;
                      const variation = previousYear ? getVariation(user.id, previousYear, year) : null;
                      
                      return (
                        <React.Fragment key={year}>
                          {previousYear && (
                            <TableCell className="text-center">
                              {variation ? (
                                <div className="flex items-center justify-center gap-0.5 text-xs">
                                  <span className="text-muted-foreground">←</span>
                                  <div className="flex-1 border-t border-dashed border-muted-foreground/50"></div>
                                  <span className={`font-semibold px-1 whitespace-nowrap ${
                                    variation.value >= 0 
                                      ? "text-emerald-600 dark:text-emerald-400" 
                                      : "text-red-600 dark:text-red-400"
                                  }`}>
                                    {variation.displayValue}
                                  </span>
                                  <div className="flex-1 border-t border-dashed border-muted-foreground/50"></div>
                                  <span className="text-muted-foreground">→</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            <span className="font-semibold text-lg">
                              {displaySalary > 0 ? formatCurrency(displaySalary) : (
                                <span className="text-muted-foreground text-sm italic">Non défini</span>
                              )}
                            </span>
                          </TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="border-t-2 font-bold">
                <TableCell className="sticky left-0 z-10 bg-background text-lg">TOTAL</TableCell>
                {availableYears.map((year, index) => {
                  const total = totalsByYear.get(year) || 0;
                  const previousYear = index > 0 ? availableYears[index - 1] : null;
                  const totalVariation = previousYear ? getTotalVariation(previousYear, year) : null;
                  
                  return (
                    <React.Fragment key={year}>
                      {previousYear && (
                        <TableCell className="text-center">
                          {totalVariation ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <span className="text-muted-foreground">←</span>
                              <div className="flex-1 border-t border-dashed border-muted-foreground/50"></div>
                              <span className={`text-base font-bold px-1 whitespace-nowrap ${
                                totalVariation.value >= 0 
                                  ? "text-emerald-600 dark:text-emerald-400" 
                                  : "text-red-600 dark:text-red-400"
                              }`}>
                                {totalVariation.displayValue}
                              </span>
                              <div className="flex-1 border-t border-dashed border-muted-foreground/50"></div>
                              <span className="text-muted-foreground">→</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <span className="text-xl font-bold">
                          {formatCurrency(total)}
                        </span>
                      </TableCell>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
