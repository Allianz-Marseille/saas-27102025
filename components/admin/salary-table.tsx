"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X, TrendingUp, RefreshCw, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { User } from "@/types";
import { SalaryValidationModal } from "./salary-validation-modal";

interface SalaryTableProps {
  users: User[];
  simulations: Map<string, { type: "percentage" | "amount"; value: number; newSalary: number }>;
  displayMode: "monthly" | "annual";
  onDisplayModeChange: (mode: "monthly" | "annual") => void;
  onSimulationUpdate: (userId: string, type: "percentage" | "amount", value: number) => void;
  onClearSimulations: () => void;
  onDataRefresh: () => void;
  activeSimulationsCount: number;
  currentUserId: string;
}

export function SalaryTable({
  users,
  simulations,
  displayMode,
  onDisplayModeChange,
  onSimulationUpdate,
  onClearSimulations,
  onDataRefresh,
  activeSimulationsCount,
  currentUserId,
}: SalaryTableProps) {
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleValidateOne = (userId: string) => {
    setSelectedUsers([userId]);
    setValidationModalOpen(true);
  };

  const handleValidateAll = () => {
    const usersWithSimulations = Array.from(simulations.keys());
    if (usersWithSimulations.length === 0) {
      toast.error("Aucune simulation à valider");
      return;
    }
    setSelectedUsers(usersWithSimulations);
    setValidationModalOpen(true);
  };

  const handleValidationSuccess = () => {
    setValidationModalOpen(false);
    setSelectedUsers([]);
    onClearSimulations();
    onDataRefresh();
  };

  const multiplier = displayMode === "annual" ? 12 : 1;

  // Calculer les totaux
  const totalCurrentSalary = users.reduce((sum, user) => sum + (user.currentMonthlySalary || 0), 0) * multiplier;
  const totalNewSalary = users.reduce((sum, user) => {
    const simulation = simulations.get(user.id);
    return sum + (simulation ? simulation.newSalary : (user.currentMonthlySalary || 0));
  }, 0) * multiplier;
  const totalDifference = totalNewSalary - totalCurrentSalary;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Tableau des rémunérations
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Mensuel / Annuel */}
              <Select value={displayMode} onValueChange={(value: "monthly" | "annual") => onDisplayModeChange(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="annual">Annuel</SelectItem>
                </SelectContent>
              </Select>

              {/* Bouton Effacer simulations */}
              {activeSimulationsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSimulations}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Effacer ({activeSimulationsCount})
                </Button>
              )}

              {/* Bouton Valider toutes */}
              {activeSimulationsCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleValidateAll}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Valider toutes ({activeSimulationsCount})
                </Button>
              )}

              {/* Bouton Rafraîchir */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDataRefresh}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Contrat</TableHead>
                  <TableHead className="text-right">Rémunération actuelle</TableHead>
                  <TableHead className="text-center">Type augmentation</TableHead>
                  <TableHead className="text-right">Augmentation</TableHead>
                  <TableHead className="text-right">Nouvelle rémunération</TableHead>
                  <TableHead className="text-right">Différence</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun collaborateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const simulation = simulations.get(user.id);
                    const currentSalary = (user.currentMonthlySalary || 0) * multiplier;
                    const newSalary = simulation ? simulation.newSalary * multiplier : currentSalary;
                    const difference = newSalary - currentSalary;
                    const hasSimulation = !!simulation;

                    return (
                      <TableRow key={user.id} className={hasSimulation ? "bg-yellow-50 dark:bg-yellow-950/10" : ""}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email.split("@")[0]}
                            </span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.contrat && (
                              <Badge variant="outline" className="w-fit">
                                {user.contrat}
                              </Badge>
                            )}
                            {user.etp && (
                              <Badge variant="secondary" className="w-fit text-xs">
                                {user.etp}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {currentSalary > 0 ? formatCurrency(currentSalary) : (
                            <span className="text-muted-foreground text-sm">Non défini</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={simulation?.type || "percentage"}
                            onValueChange={(value: "percentage" | "amount") => {
                              const currentValue = simulation?.value || 0;
                              onSimulationUpdate(user.id, value, currentValue);
                            }}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="amount">€</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step={simulation?.type === "percentage" ? "0.1" : "1"}
                            placeholder={simulation?.type === "percentage" ? "0" : "0"}
                            value={simulation?.value || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              onSimulationUpdate(user.id, simulation?.type || "percentage", value);
                            }}
                            className="w-[100px] text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {hasSimulation ? (
                            <span className="font-semibold text-green-600">
                              {formatCurrency(newSalary)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {hasSimulation && difference !== 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className={`h-4 w-4 ${difference > 0 ? "text-green-600" : "text-red-600"}`} />
                              <span className={`font-semibold ${difference > 0 ? "text-green-600" : "text-red-600"}`}>
                                {difference > 0 ? "+" : ""}{formatCurrency(difference)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasSimulation ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidateOne(user.id)}
                              className="gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Valider
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(totalCurrentSalary)}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-bold text-lg text-green-600">
                    {totalNewSalary !== totalCurrentSalary ? formatCurrency(totalNewSalary) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {totalDifference !== 0 ? (
                      <span className={totalDifference > 0 ? "text-green-600" : "text-red-600"}>
                        {totalDifference > 0 ? "+" : ""}{formatCurrency(totalDifference)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de validation */}
      <SalaryValidationModal
        open={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        selectedUsers={selectedUsers}
        users={users}
        simulations={simulations}
        displayMode={displayMode}
        currentUserId={currentUserId}
        onSuccess={handleValidationSuccess}
      />
    </>
  );
}
