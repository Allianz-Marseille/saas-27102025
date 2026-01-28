"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Euro, Check, X, Save, Minus, Plus, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Fonction pour formater un nombre avec séparateurs de milliers et 2 décimales max
const formatNumberWithThousands = (value: number): string => {
  if (value === 0) return "0";
  
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value);
};

// Fonction pour parser une chaîne formatée en nombre (enlever les espaces)
const parseFormattedNumber = (formattedValue: string): number => {
  // Enlever tous les espaces (séparateurs de milliers) et remplacer la virgule par un point
  const cleaned = formattedValue.replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
import { toast } from "sonner";
import type { User } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MultiYearSalaryTableProps {
  users: User[];
  years: number[];
  displayMode: "monthly" | "annual";
  getSalaryForYear: (userId: string, year: number) => number;
  onSaveSalary: (yearSalaries: Map<number, Map<string, number>>) => Promise<void>;
}

export function MultiYearSalaryTable({
  users,
  years,
  displayMode,
  getSalaryForYear,
  onSaveSalary,
}: MultiYearSalaryTableProps) {
  // État pour les modifications en cours
  const [editingSalaries, setEditingSalaries] = useState<Map<string, Map<number, number>>>(new Map()); // userId -> year -> monthlySalary
  const [rawInputValues, setRawInputValues] = useState<Map<string, Map<number, string>>>(new Map()); // userId -> year -> rawValue
  const [saving, setSaving] = useState(false);
  const [variationMode, setVariationMode] = useState<"euro" | "percentage">("euro");

  const multiplier = displayMode === "annual" ? 12 : 1;
  const columnLabel = displayMode === "annual" ? "Salaire annuel" : "Salaire mensuel";

  // Récupérer le salaire édité ou validé pour un utilisateur et une année
  const getEditedSalary = (userId: string, year: number): number => {
    // D'abord vérifier les modifications en cours
    const userEdits = editingSalaries.get(userId);
    if (userEdits && userEdits.has(year)) {
      return userEdits.get(year)!;
    }
    
    // Sinon utiliser la fonction getSalaryForYear (qui prend en compte l'historique)
    return getSalaryForYear(userId, year);
  };

  // Calculer les totaux par année
  const totalsByYear = useMemo(() => {
    const totals = new Map<number, number>();
    years.forEach(year => {
      const total = users.reduce((sum, user) => {
        const salary = getEditedSalary(user.id, year);
        return sum + (salary * multiplier);
      }, 0);
      totals.set(year, total);
    });
    return totals;
  }, [users, years, displayMode, editingSalaries, getSalaryForYear, multiplier, getEditedSalary]);


  // Gérer l'édition d'un salaire
  const handleEditSalary = (userId: string, year: number, value: string) => {
    // Stocker la valeur brute telle quelle pendant la saisie
    const userRawValues = rawInputValues.get(userId) || new Map<number, string>();
    userRawValues.set(year, value);
    setRawInputValues(new Map(rawInputValues).set(userId, userRawValues));
    
    // Convertir et stocker en mensuel si la valeur est valide
    // On parse la valeur même si elle contient des espaces
    const numValue = parseFormattedNumber(value);
    if (numValue > 0 || value === "0" || value === "" || value.trim() === "") {
      const monthlyValue = displayMode === "annual" ? numValue / 12 : numValue;
      
      const userEdits = editingSalaries.get(userId) || new Map<number, number>();
      userEdits.set(year, monthlyValue);
      setEditingSalaries(new Map(editingSalaries).set(userId, userEdits));
    }
  };

  // Obtenir la valeur brute à afficher dans l'input
  const getRawValue = (userId: string, year: number): string => {
    const userRawValues = rawInputValues.get(userId);
    if (userRawValues && userRawValues.has(year)) {
      return userRawValues.get(year)!;
    }
    
    // Valeur initiale : utiliser getEditedSalary qui prend en compte les modifications en cours
    const initialSalary = getEditedSalary(userId, year);
    const displayValue = initialSalary * multiplier;
    
    // Formater avec séparateurs de milliers et 2 décimales max
    return formatNumberWithThousands(displayValue);
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (editingSalaries.size === 0) {
      toast.info("Aucune modification à sauvegarder");
      return;
    }

    try {
      setSaving(true);
      
      // Convertir editingSalaries (Map<userId, Map<year, salary>>) 
      // en format attendu (Map<year, Map<userId, salary>>)
      const yearSalaries = new Map<number, Map<string, number>>();
      
      editingSalaries.forEach((userSalaries, userId) => {
        userSalaries.forEach((salary, year) => {
          if (!yearSalaries.has(year)) {
            yearSalaries.set(year, new Map<string, number>());
          }
          yearSalaries.get(year)!.set(userId, salary);
          console.log(`[MultiYearTable] Préparation sauvegarde: ${userId} année ${year} = ${salary} (mensuel)`);
        });
      });
      
      console.log(`[MultiYearTable] Envoi de ${yearSalaries.size} années à sauvegarder`);
      await onSaveSalary(yearSalaries);
      
      // Nettoyer les états d'édition après sauvegarde
      setEditingSalaries(new Map());
      setRawInputValues(new Map());
      
      toast.success("Modifications sauvegardées");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };


  const hasModifications = editingSalaries.size > 0;

  // Identifier la nouvelle année (dernière année dans la liste) et l'année précédente
  const newYear = years.length > 0 ? years[years.length - 1] : null;
  const previousYear = years.length > 1 ? years[years.length - 2] : null;

  // Calculer la variation pour un utilisateur
  const getVariation = (userId: string): { value: number; displayValue: string; isPositive: boolean } | null => {
    if (!newYear || !previousYear) return null;

    const newYearSalary = getEditedSalary(userId, newYear);
    const previousYearSalary = getEditedSalary(userId, previousYear);

    const newYearDisplay = newYearSalary * multiplier;
    const previousYearDisplay = previousYearSalary * multiplier;

    // Ne pas comparer si l'une des deux années est à 0 (arrivée ou départ)
    if (previousYearDisplay === 0 || newYearDisplay === 0) {
      return null;
    }

    if (variationMode === "percentage") {
      const percentage = ((newYearDisplay - previousYearDisplay) / previousYearDisplay) * 100;
      return {
        value: percentage,
        displayValue: `${percentage >= 0 ? "+" : ""}${formatNumberWithThousands(percentage)}%`,
        isPositive: percentage >= 0,
      };
    } else {
      const difference = newYearDisplay - previousYearDisplay;
      return {
        value: difference,
        displayValue: `${difference >= 0 ? "+" : ""}${formatNumberWithThousands(Math.abs(difference))} €`,
        isPositive: difference >= 0,
      };
    }
  };

  // Calculer la variation totale
  const getTotalVariation = useMemo(() => {
    if (!newYear || !previousYear) return null;

    const totalNewYear = totalsByYear.get(newYear) || 0;
    const totalPreviousYear = totalsByYear.get(previousYear) || 0;

    // Ne pas comparer si l'une des deux années est à 0
    if (totalPreviousYear === 0 || totalNewYear === 0) {
      return null;
    }

    if (variationMode === "percentage") {
      const percentage = ((totalNewYear - totalPreviousYear) / totalPreviousYear) * 100;
      return {
        value: percentage,
        displayValue: `${percentage >= 0 ? "+" : ""}${formatNumberWithThousands(percentage)}%`,
        isPositive: percentage >= 0,
      };
    } else {
      const difference = totalNewYear - totalPreviousYear;
      return {
        value: difference,
        displayValue: `${difference >= 0 ? "+" : ""}${formatNumberWithThousands(Math.abs(difference))} €`,
        isPositive: difference >= 0,
      };
    }
  }, [newYear, previousYear, totalsByYear, variationMode, multiplier]);

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Euro className="h-6 w-6 text-white" />
            </div>
            <span>Pilotage des rémunérations</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasModifications && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <Save className="h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-background">Collaborateur</TableHead>
                {years.map((year) => {
                  const isNewYear = year === newYear;
                  return (
                    <React.Fragment key={year}>
                      {isNewYear && (
                        <TableHead className="text-center min-w-[80px]">
                          <span className="text-xs text-muted-foreground">Ajustement</span>
                        </TableHead>
                      )}
                      <TableHead className="text-center min-w-[150px]">
                        {year}
                      </TableHead>
                      {isNewYear && previousYear && (
                        <TableHead className="text-center min-w-[150px]">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-xs font-semibold">Variation</span>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`variation-mode-${year}`} className="text-xs cursor-pointer flex items-center gap-1">
                                <Euro className="h-3 w-3" />
                              </Label>
                              <Switch
                                id={`variation-mode-${year}`}
                                checked={variationMode === "percentage"}
                                onCheckedChange={(checked) => setVariationMode(checked ? "percentage" : "euro")}
                                className="scale-75"
                              />
                              <Label htmlFor={`variation-mode-${year}`} className="text-xs cursor-pointer flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                              </Label>
                            </div>
                          </div>
                        </TableHead>
                      )}
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
                      years.length + 
                      (newYear ? 1 : 0) + // Colonne Ajustement si nouvelle année
                      (newYear && previousYear ? 1 : 0) // Colonne Variation si nouvelle année et année précédente
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
                    {years.map((year) => {
                      const isNewYear = year === newYear;
                      const salary = getEditedSalary(user.id, year);
                      const displaySalary = salary * multiplier;
                      const rawValue = getRawValue(user.id, year);
                      
                      return (
                        <React.Fragment key={year}>
                          {isNewYear && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* Bouton Moins (-10) */}
                                <button
                                  onClick={() => {
                                    const currentSalary = getEditedSalary(user.id, year);
                                    const displayValue = currentSalary * multiplier;
                                    const newDisplayValue = Math.max(0, displayValue - 10);
                                    const newMonthlyValue = displayMode === "annual" ? newDisplayValue / 12 : newDisplayValue;
                                    
                                    const userEdits = editingSalaries.get(user.id) || new Map<number, number>();
                                    userEdits.set(year, newMonthlyValue);
                                    setEditingSalaries(new Map(editingSalaries).set(user.id, userEdits));
                                    
                                    const formattedValue = formatNumberWithThousands(newDisplayValue);
                                    const userRawValues = rawInputValues.get(user.id) || new Map<number, string>();
                                    userRawValues.set(year, formattedValue);
                                    setRawInputValues(new Map(rawInputValues).set(user.id, userRawValues));
                                  }}
                                  disabled={saving}
                                  title="Diminuer de 10"
                                  className="group relative overflow-hidden px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-0.5"
                                >
                                  {/* Effet de brillance au survol */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  
                                  {/* Ombre interne */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg" />
                                  
                                  {/* Contenu */}
                                  <Minus className="h-3 w-3 text-white relative z-10 drop-shadow-sm" />
                                  <span className="text-xs font-semibold text-white relative z-10 drop-shadow-sm">10</span>
                                  
                                  {/* Effet de ripple au clic */}
                                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                    <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-150 opacity-0 group-active:opacity-100 transition-all duration-500 rounded-full" />
                                  </div>
                                </button>
                                
                                {/* Bouton Moins (-5) */}
                                <button
                                  onClick={() => {
                                    const currentSalary = getEditedSalary(user.id, year);
                                    const displayValue = currentSalary * multiplier;
                                    const newDisplayValue = Math.max(0, displayValue - 5);
                                    const newMonthlyValue = displayMode === "annual" ? newDisplayValue / 12 : newDisplayValue;
                                    
                                    const userEdits = editingSalaries.get(user.id) || new Map<number, number>();
                                    userEdits.set(year, newMonthlyValue);
                                    setEditingSalaries(new Map(editingSalaries).set(user.id, userEdits));
                                    
                                    const formattedValue = formatNumberWithThousands(newDisplayValue);
                                    const userRawValues = rawInputValues.get(user.id) || new Map<number, string>();
                                    userRawValues.set(year, formattedValue);
                                    setRawInputValues(new Map(rawInputValues).set(user.id, userRawValues));
                                  }}
                                  disabled={saving}
                                  title="Diminuer de 5"
                                  className="group relative overflow-hidden px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-0.5"
                                >
                                  {/* Effet de brillance au survol */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  
                                  {/* Ombre interne */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg" />
                                  
                                  {/* Contenu */}
                                  <Minus className="h-3 w-3 text-white relative z-10 drop-shadow-sm" />
                                  <span className="text-xs font-semibold text-white relative z-10 drop-shadow-sm">5</span>
                                  
                                  {/* Effet de ripple au clic */}
                                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                    <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-150 opacity-0 group-active:opacity-100 transition-all duration-500 rounded-full" />
                                  </div>
                                </button>
                                
                                {/* Bouton Plus (+5) */}
                                <button
                                  onClick={() => {
                                    const currentSalary = getEditedSalary(user.id, year);
                                    const displayValue = currentSalary * multiplier;
                                    const newDisplayValue = displayValue + 5;
                                    const newMonthlyValue = displayMode === "annual" ? newDisplayValue / 12 : newDisplayValue;
                                    
                                    const userEdits = editingSalaries.get(user.id) || new Map<number, number>();
                                    userEdits.set(year, newMonthlyValue);
                                    setEditingSalaries(new Map(editingSalaries).set(user.id, userEdits));
                                    
                                    const formattedValue = formatNumberWithThousands(newDisplayValue);
                                    const userRawValues = rawInputValues.get(user.id) || new Map<number, string>();
                                    userRawValues.set(year, formattedValue);
                                    setRawInputValues(new Map(rawInputValues).set(user.id, userRawValues));
                                  }}
                                  disabled={saving}
                                  title="Augmenter de 5"
                                  className="group relative overflow-hidden px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-0.5"
                                >
                                  {/* Effet de brillance au survol */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  
                                  {/* Ombre interne */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg" />
                                  
                                  {/* Contenu */}
                                  <Plus className="h-3 w-3 text-white relative z-10 drop-shadow-sm" />
                                  <span className="text-xs font-semibold text-white relative z-10 drop-shadow-sm">5</span>
                                  
                                  {/* Effet de ripple au clic */}
                                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                    <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-150 opacity-0 group-active:opacity-100 transition-all duration-500 rounded-full" />
                                  </div>
                                </button>
                                
                                {/* Bouton Plus (+10) */}
                                <button
                                  onClick={() => {
                                    const currentSalary = getEditedSalary(user.id, year);
                                    const displayValue = currentSalary * multiplier;
                                    const newDisplayValue = displayValue + 10;
                                    const newMonthlyValue = displayMode === "annual" ? newDisplayValue / 12 : newDisplayValue;
                                    
                                    const userEdits = editingSalaries.get(user.id) || new Map<number, number>();
                                    userEdits.set(year, newMonthlyValue);
                                    setEditingSalaries(new Map(editingSalaries).set(user.id, userEdits));
                                    
                                    const formattedValue = formatNumberWithThousands(newDisplayValue);
                                    const userRawValues = rawInputValues.get(user.id) || new Map<number, string>();
                                    userRawValues.set(year, formattedValue);
                                    setRawInputValues(new Map(rawInputValues).set(user.id, userRawValues));
                                  }}
                                  disabled={saving}
                                  title="Augmenter de 10"
                                  className="group relative overflow-hidden px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-0.5"
                                >
                                  {/* Effet de brillance au survol */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  
                                  {/* Ombre interne */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg" />
                                  
                                  {/* Contenu */}
                                  <Plus className="h-3 w-3 text-white relative z-10 drop-shadow-sm" />
                                  <span className="text-xs font-semibold text-white relative z-10 drop-shadow-sm">10</span>
                                  
                                  {/* Effet de ripple au clic */}
                                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                    <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-150 opacity-0 group-active:opacity-100 transition-all duration-500 rounded-full" />
                                  </div>
                                </button>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            <Input
                            type="text"
                            inputMode="decimal"
                            value={rawValue}
                            onFocus={(e) => {
                              e.target.select();
                            }}
                            onChange={(e) => {
                              let value = e.target.value;
                              // Permettre la saisie libre pendant la frappe
                              // Le formatage sera appliqué au blur
                              handleEditSalary(user.id, year, value);
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value === "" || value === "0" || value === "0,00" || value === "0.00") {
                                // Permettre explicitement 0€ pour gérer les absences
                                const userRawValues = rawInputValues.get(user.id) || new Map();
                                userRawValues.set(year, "0");
                                setRawInputValues(new Map(rawInputValues).set(user.id, userRawValues));
                                
                                const userEdits = editingSalaries.get(user.id) || new Map();
                                userEdits.set(year, 0);
                                setEditingSalaries(new Map(editingSalaries).set(user.id, userEdits));
                                console.log(`[MultiYearTable] Blur: ${user.id} année ${year} = 0 (mensuel)`);
                              } else {
                                const numValue = parseFormattedNumber(value);
                                if (numValue >= 0) {
                                  // Convertir en mensuel si on est en mode annuel
                                  const monthlyValue = displayMode === "annual" ? numValue / 12 : numValue;
                                  const userEdits = editingSalaries.get(user.id) || new Map();
                                  userEdits.set(year, monthlyValue);
                                  setEditingSalaries(new Map(editingSalaries).set(user.id, userEdits));
                                  
                                  // Formater la valeur avec séparateurs de milliers
                                  const formattedValue = formatNumberWithThousands(numValue);
                                  const userRawValues = rawInputValues.get(user.id) || new Map();
                                  userRawValues.set(year, formattedValue);
                                  setRawInputValues(new Map(rawInputValues).set(user.id, userRawValues));
                                  console.log(`[MultiYearTable] Blur: ${user.id} année ${year} = ${numValue} (affiché) -> ${monthlyValue} (mensuel stocké)`);
                                }
                              }
                            }}
                            className="w-[120px] text-center mx-auto"
                            disabled={saving}
                          />
                          </TableCell>
                          {isNewYear && previousYear && (
                            <TableCell className="text-center">
                              {(() => {
                                const variation = getVariation(user.id);
                                if (!variation) {
                                  return <span className="text-muted-foreground text-sm">-</span>;
                                }
                                return (
                                  <span
                                    className={`text-sm font-semibold ${
                                      variation.isPositive
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {variation.displayValue}
                                  </span>
                                );
                              })()}
                            </TableCell>
                          )}
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
                {years.map((year) => {
                  const isNewYear = year === newYear;
                  const total = totalsByYear.get(year) || 0;
                  
                  return (
                    <React.Fragment key={year}>
                      {isNewYear && (
                        <TableCell className="text-center">
                          {/* Cellule vide pour l'alignement avec la colonne Ajustement */}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <span className="text-xl font-bold">
                          {formatCurrency(total)}
                        </span>
                      </TableCell>
                      {isNewYear && previousYear && getTotalVariation && (
                        <TableCell className="text-center">
                          <span
                            className={`text-lg font-bold ${
                              getTotalVariation.isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {getTotalVariation.displayValue}
                          </span>
                        </TableCell>
                      )}
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
