"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Euro, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { User } from "@/types";

interface SimpleSalaryTableProps {
  users: User[];
  displayMode: "monthly" | "annual";
  selectedYear: number;
  getSalaryForYear: (userId: string, year: number) => number;
  onSaveSalary?: (userId: string, newSalary: number) => Promise<void>;
}

export function SimpleSalaryTable({
  users,
  displayMode,
  selectedYear,
  getSalaryForYear,
  onSaveSalary,
}: SimpleSalaryTableProps) {
  const [editingSalaries, setEditingSalaries] = useState<Map<string, number>>(new Map());
  const [savingSalaries, setSavingSalaries] = useState<Set<string>>(new Set());
  // Stocker les valeurs brutes saisies (en annuel ou mensuel selon le mode) pendant la saisie
  const [rawInputValues, setRawInputValues] = useState<Map<string, string>>(new Map());

  const multiplier = displayMode === "annual" ? 12 : 1;
  const columnLabel = displayMode === "annual" ? "Salaire annuel" : "Salaire mensuel";

  // Calculer le total
  const total = users.reduce((sum, user) => {
    const monthlySalary = getSalaryForYear(user.id, selectedYear);
    return sum + (monthlySalary * multiplier);
  }, 0);

  // Calculer la variation totale
  const totalVariation = users.reduce((sum, user) => {
    const monthlySalary = getSalaryForYear(user.id, selectedYear);
    const previousYearSalary = getSalaryForYear(user.id, selectedYear - 1);
    return sum + ((monthlySalary - previousYearSalary) * multiplier);
  }, 0);

  const totalPreviousYear = users.reduce((sum, user) => {
    const previousYearSalary = getSalaryForYear(user.id, selectedYear - 1);
    return sum + (previousYearSalary * multiplier);
  }, 0);

  const totalVariationPercentage = totalPreviousYear > 0 
    ? ((total - totalPreviousYear) / totalPreviousYear) * 100 
    : 0;

  const handleEditSalary = (userId: string, value: string) => {
    // Stocker la valeur brute pour l'affichage
    const newRawValues = new Map(rawInputValues);
    newRawValues.set(userId, value);
    setRawInputValues(newRawValues);
    
    // Convertir et stocker en mensuel seulement si la valeur est valide
    if (value !== "" && !isNaN(parseFloat(value))) {
      const numValue = parseFloat(value);
      const monthlyValue = displayMode === "annual" ? numValue / 12 : numValue;
      const newEditing = new Map(editingSalaries);
      newEditing.set(userId, monthlyValue);
      setEditingSalaries(newEditing);
    }
  };

  const handleSaveSalary = async (userId: string) => {
    if (!onSaveSalary) return;

    const editedSalary = editingSalaries.get(userId);
    if (editedSalary === undefined) return;

    try {
      setSavingSalaries(prev => new Set(prev).add(userId));
      await onSaveSalary(userId, editedSalary);
      
      // Retirer de l'édition après sauvegarde
      const newEditing = new Map(editingSalaries);
      newEditing.delete(userId);
      setEditingSalaries(newEditing);
      
      // Retirer aussi la valeur brute
      const newRawValues = new Map(rawInputValues);
      newRawValues.delete(userId);
      setRawInputValues(newRawValues);
      
      toast.success("Salaire validé avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la validation du salaire");
    } finally {
      setSavingSalaries(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleCancelEdit = (userId: string) => {
    const newEditing = new Map(editingSalaries);
    newEditing.delete(userId);
    setEditingSalaries(newEditing);
    
    // Retirer aussi la valeur brute
    const newRawValues = new Map(rawInputValues);
    newRawValues.delete(userId);
    setRawInputValues(newRawValues);
  };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Euro className="h-6 w-6 text-white" />
          </div>
          <span>Pilotage des rémunérations - {selectedYear}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collaborateur</TableHead>
                <TableHead className="text-center">{columnLabel}</TableHead>
                <TableHead className="text-center">Variation {selectedYear} / {selectedYear - 1}</TableHead>
                {onSaveSalary && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onSaveSalary ? 4 : 3} className="text-center text-muted-foreground py-8">
                    Aucun collaborateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const monthlySalary = getSalaryForYear(user.id, selectedYear);
                  const previousYearSalary = getSalaryForYear(user.id, selectedYear - 1);
                  const variationAmount = monthlySalary - previousYearSalary;
                  const variationPercentage = previousYearSalary > 0 
                    ? ((monthlySalary - previousYearSalary) / previousYearSalary) * 100 
                    : 0;
                  
                  const isEditing = editingSalaries.has(user.id);
                  // Si on est en mode édition, utiliser la valeur éditée ou le salaire de l'année précédente (ou 0)
                  const editedMonthlySalary = isEditing 
                    ? (editingSalaries.get(user.id) ?? (previousYearSalary > 0 ? previousYearSalary : 0))
                    : monthlySalary;
                  const displaySalary = monthlySalary * multiplier;
                  const isSaving = savingSalaries.has(user.id);

                  return (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {user.firstName} {user.lastName}
                          </span>
                          {user.email && (
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing && onSaveSalary ? (
                          <div className="flex items-center justify-center gap-2">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={rawInputValues.get(user.id) ?? (() => {
                                // Valeur initiale : salaire de l'année précédente
                                const initialValue = previousYearSalary > 0 ? previousYearSalary : 0;
                                return displayMode === "annual" 
                                  ? (initialValue * 12).toString() 
                                  : initialValue.toString();
                              })()}
                              onFocus={(e) => {
                                e.target.select();
                              }}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Permettre la saisie libre (y compris les valeurs partielles comme "2", "28", "280", etc.)
                                handleEditSalary(user.id, value);
                              }}
                              onBlur={(e) => {
                                // À la perte de focus, convertir et valider la valeur finale
                                const value = e.target.value;
                                if (value === "" || value === "0") {
                                  const newRawValues = new Map(rawInputValues);
                                  newRawValues.set(user.id, "");
                                  setRawInputValues(newRawValues);
                                  const newEditing = new Map(editingSalaries);
                                  newEditing.set(user.id, 0);
                                  setEditingSalaries(newEditing);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue) && numValue >= 0) {
                                    const monthlyValue = displayMode === "annual" ? numValue / 12 : numValue;
                                    const newEditing = new Map(editingSalaries);
                                    newEditing.set(user.id, monthlyValue);
                                    setEditingSalaries(newEditing);
                                    // Mettre à jour la valeur brute avec la valeur formatée
                                    const formattedValue = displayMode === "annual" 
                                      ? String(Math.round(numValue * 100) / 100)
                                      : String(Math.round(monthlyValue * 100) / 100);
                                    const newRawValues = new Map(rawInputValues);
                                    newRawValues.set(user.id, formattedValue);
                                    setRawInputValues(newRawValues);
                                  }
                                }
                              }}
                              className="w-[120px] text-center"
                              disabled={isSaving}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-lg">
                            {displaySalary > 0 ? formatCurrency(displaySalary) : (
                              <span className="text-muted-foreground text-sm italic">Non défini</span>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {previousYearSalary > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            <span className={`font-semibold ${
                              variationAmount > 0 
                                ? "text-emerald-600" 
                                : variationAmount < 0 
                                  ? "text-red-600" 
                                  : "text-gray-600"
                            }`}>
                              {variationAmount > 0 ? "+" : ""}{formatCurrency(variationAmount * multiplier)}
                            </span>
                            <span className={`text-xs ${
                              variationPercentage > 0 
                                ? "text-emerald-600" 
                                : variationPercentage < 0 
                                  ? "text-red-600" 
                                  : "text-gray-600"
                            }`}>
                              {variationPercentage > 0 ? "+" : ""}{variationPercentage.toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">N/A</span>
                        )}
                      </TableCell>
                      {onSaveSalary && (
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveSalary(user.id)}
                                disabled={isSaving}
                                className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                              >
                                <Check className="h-3 w-3" />
                                {isSaving ? "..." : "Valider"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelEdit(user.id)}
                                disabled={isSaving}
                                className="gap-1"
                              >
                                <X className="h-3 w-3" />
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Initialiser avec le salaire de l'année précédente (ou 0 si pas d'antécédent)
                                const salaryToEdit = previousYearSalary > 0 ? previousYearSalary : 0;
                                const newEditing = new Map(editingSalaries);
                                newEditing.set(user.id, salaryToEdit);
                                setEditingSalaries(newEditing);
                                
                                // Initialiser aussi la valeur brute pour l'affichage
                                const displayValue = displayMode === "annual" 
                                  ? (salaryToEdit * 12).toString() 
                                  : salaryToEdit.toString();
                                const newRawValues = new Map(rawInputValues);
                                newRawValues.set(user.id, displayValue);
                                setRawInputValues(newRawValues);
                              }}
                              className="gap-1"
                            >
                              Modifier
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="border-t-2 font-bold">
                <TableCell className="text-lg">TOTAL</TableCell>
                <TableCell className="text-center">
                  <span className="text-xl font-bold">
                    {formatCurrency(total)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {totalPreviousYear > 0 ? (
                    <div className="flex flex-col gap-1 items-center">
                      <span className={`text-xl font-bold ${
                        totalVariation > 0 
                          ? "text-emerald-600" 
                          : totalVariation < 0 
                            ? "text-red-600" 
                            : "text-gray-600"
                      }`}>
                        {totalVariation > 0 ? "+" : ""}{formatCurrency(totalVariation)}
                      </span>
                      <span className={`text-sm ${
                        totalVariationPercentage > 0 
                          ? "text-emerald-600" 
                          : totalVariationPercentage < 0 
                            ? "text-red-600" 
                            : "text-gray-600"
                      }`}>
                        {totalVariationPercentage > 0 ? "+" : ""}{totalVariationPercentage.toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">N/A</span>
                  )}
                </TableCell>
                {onSaveSalary && <TableCell></TableCell>}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
