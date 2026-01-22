"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X, TrendingUp, RefreshCw, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Save, Trash2, UserPlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { User, SimulatedUser } from "@/types";
import { SalaryValidationModal } from "./salary-validation-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SalaryTableProps {
  users: User[];
  simulatedUsers: Map<string, SimulatedUser>;
  simulations: Map<string, { type: "percentage" | "amount"; value: number; newSalary: number }>;
  displayMode: "monthly" | "annual";
  onDisplayModeChange: (mode: "monthly" | "annual") => void;
  onSimulationUpdate: (userId: string, type: "percentage" | "amount", value: number) => void;
  onClearSimulations: () => void;
  onDataRefresh: () => void;
  activeSimulationsCount: number;
  currentUserId: string;
  hasDraft: boolean;
  onSaveDraft: () => void;
  onDeleteDraft: () => void;
  savingDraft: boolean;
  onAddSimulatedUser: () => void;
  onRemoveSimulatedUser: (userId: string) => void;
}

type SortColumn = "name" | "contract" | "salary" | "newSalary" | "difference" | null;
type SortDirection = "asc" | "desc";

export function SalaryTable({
  users,
  simulatedUsers,
  simulations,
  displayMode,
  onDisplayModeChange,
  onSimulationUpdate,
  onClearSimulations,
  onDataRefresh,
  activeSimulationsCount,
  currentUserId,
  hasDraft,
  onSaveDraft,
  onDeleteDraft,
  savingDraft,
  onAddSimulatedUser,
  onRemoveSimulatedUser,
}: SalaryTableProps) {
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleValidateOne = (userId: string) => {
    // Ne pas permettre la validation des utilisateurs simulés
    if (simulatedUsers.has(userId)) {
      toast.error("Les recrutements simulés ne peuvent pas être validés définitivement");
      return;
    }
    setSelectedUsers([userId]);
    setValidationModalOpen(true);
  };

  const handleValidateAll = () => {
    // Filtrer les utilisateurs simulés (ne peuvent pas être validés)
    const usersWithSimulations = Array.from(simulations.keys()).filter(
      userId => !simulatedUsers.has(userId)
    );
    if (usersWithSimulations.length === 0) {
      toast.error("Aucune simulation à valider (les recrutements simulés ne peuvent pas être validés)");
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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, tri ascendant par défaut
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />;
  };

  const multiplier = displayMode === "annual" ? 12 : 1;

  // Combiner les utilisateurs réels et simulés pour l'affichage
  type CombinedUser = (User & { isSimulated?: false }) | (SimulatedUser & { isSimulated: true });
  const allUsers: CombinedUser[] = [
    ...users.map(u => ({ ...u, isSimulated: false as const })),
    ...Array.from(simulatedUsers.values()).map(u => ({ ...u, isSimulated: true as const })),
  ];

  // Trier les utilisateurs
  const sortedUsers = [...allUsers].sort((a, b) => {
    if (!sortColumn) return 0;

    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortColumn) {
      case "name": {
        const nameA = a.firstName && a.lastName 
          ? `${a.firstName} ${a.lastName}`.toLowerCase()
          : (a.email ? a.email.split("@")[0].toLowerCase() : "");
        const nameB = b.firstName && b.lastName 
          ? `${b.firstName} ${b.lastName}`.toLowerCase()
          : (b.email ? b.email.split("@")[0].toLowerCase() : "");
        return nameA.localeCompare(nameB) * direction;
      }
      case "contract": {
        const contractA = a.contrat || "";
        const contractB = b.contrat || "";
        return contractA.localeCompare(contractB) * direction;
      }
      case "salary": {
        const salaryA = a.currentMonthlySalary || 0;
        const salaryB = b.currentMonthlySalary || 0;
        return (salaryA - salaryB) * direction;
      }
      case "newSalary": {
        const simA = simulations.get(a.id);
        const simB = simulations.get(b.id);
        const newSalaryA = simA ? simA.newSalary : (a.currentMonthlySalary || 0);
        const newSalaryB = simB ? simB.newSalary : (b.currentMonthlySalary || 0);
        return (newSalaryA - newSalaryB) * direction;
      }
      case "difference": {
        const simA = simulations.get(a.id);
        const simB = simulations.get(b.id);
        const diffA = simA ? simA.newSalary - (a.currentMonthlySalary || 0) : 0;
        const diffB = simB ? simB.newSalary - (b.currentMonthlySalary || 0) : 0;
        return (diffA - diffB) * direction;
      }
      default:
        return 0;
    }
  });

  // Calculer les totaux (incluant les utilisateurs simulés)
  const totalCurrentSalary = (
    users.reduce((sum, user) => sum + (user.currentMonthlySalary || 0), 0) +
    Array.from(simulatedUsers.values()).reduce((sum, user) => sum + user.currentMonthlySalary, 0)
  ) * multiplier;
  const totalNewSalary = (
    users.reduce((sum, user) => {
      const simulation = simulations.get(user.id);
      return sum + (simulation ? simulation.newSalary : (user.currentMonthlySalary || 0));
    }, 0) +
    Array.from(simulatedUsers.values()).reduce((sum, user) => {
      const simulation = simulations.get(user.id);
      return sum + (simulation ? simulation.newSalary : user.currentMonthlySalary);
    }, 0)
  ) * multiplier;
  const totalDifference = totalNewSalary - totalCurrentSalary;

  return (
    <>
      <Card className="border-none shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/10 dark:to-purple-950/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-3">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent font-bold">
                  Tableau des rémunérations
                </span>
              </CardTitle>
              {hasDraft && (
                <Badge className="w-fit text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none shadow-md hover:shadow-lg transition-all">
                  📝 Brouillon partagé chargé - Modifiable à tout moment
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Bouton Ajouter recrutement simulé */}
              <Button
                size="sm"
                onClick={onAddSimulatedUser}
                className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-none shadow-md hover:shadow-lg transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Simuler un recrutement
              </Button>

              {/* Toggle Mensuel / Annuel */}
              <Select value={displayMode} onValueChange={(value: "monthly" | "annual") => onDisplayModeChange(value)}>
                <SelectTrigger className="w-[140px] border-2 shadow-sm hover:shadow-md transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="annual">Annuel</SelectItem>
                </SelectContent>
              </Select>

              {/* Bouton Enregistrer brouillon */}
              {activeSimulationsCount > 0 && (
                <Button
                  size="sm"
                  onClick={onSaveDraft}
                  disabled={savingDraft}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-none shadow-md hover:shadow-lg transition-all"
                >
                  <Save className="h-4 w-4" />
                  {savingDraft ? "Enregistrement..." : hasDraft ? "Mettre à jour le brouillon partagé" : "Enregistrer le brouillon partagé"}
                </Button>
              )}

              {/* Bouton Supprimer brouillon */}
              {hasDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteDraft}
                  className="gap-2 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm hover:shadow-md transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer le brouillon partagé
                </Button>
              )}

              {/* Bouton Effacer simulations */}
              {activeSimulationsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSimulations}
                  className="gap-2 border-2 shadow-sm hover:shadow-md transition-all"
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
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none shadow-md hover:shadow-lg transition-all"
                >
                  <Check className="h-4 w-4" />
                  Valider définitivement ({activeSimulationsCount})
                </Button>
              )}

              {/* Bouton Rafraîchir */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDataRefresh}
                className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
                <TableRow className="border-b-2 border-gray-200 dark:border-gray-700 hover:bg-transparent">
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("name")}
                      className="h-8 gap-1 px-2 font-semibold hover:bg-muted/50"
                    >
                      Collaborateur
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("contract")}
                      className="h-8 gap-1 px-2 font-semibold hover:bg-muted/50 mx-auto"
                    >
                      Contrat
                      {getSortIcon("contract")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("salary")}
                      className="h-8 gap-1 px-2 font-semibold hover:bg-muted/50 mx-auto"
                    >
                      Rémunération actuelle
                      {getSortIcon("salary")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Type augmentation</TableHead>
                  <TableHead className="text-center">Augmentation</TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("newSalary")}
                      className="h-8 gap-1 px-2 font-semibold hover:bg-muted/50 mx-auto"
                    >
                      Nouvelle rémunération
                      {getSortIcon("newSalary")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("difference")}
                      className="h-8 gap-1 px-2 font-semibold hover:bg-muted/50 mx-auto"
                    >
                      Différence
                      {getSortIcon("difference")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun collaborateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map((user) => {
                    const simulation = simulations.get(user.id);
                    const currentSalary = (user.currentMonthlySalary || 0) * multiplier;
                    const newSalary = simulation ? simulation.newSalary * multiplier : currentSalary;
                    const difference = newSalary - currentSalary;
                    const hasSimulation = !!simulation;
                    const isSimulated = user.isSimulated === true;

                    return (
                      <TableRow 
                        key={user.id} 
                        className={`
                          transition-all duration-200 border-b ${
                            isSimulated 
                              ? "border-blue-300 dark:border-blue-800 border-dashed" 
                              : "border-gray-100 dark:border-gray-800"
                          }
                          ${
                            isSimulated
                              ? "bg-gradient-to-r from-blue-50/30 to-cyan-50/30 dark:from-blue-950/10 dark:to-cyan-950/10 hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/20 dark:hover:to-cyan-950/20"
                              : hasSimulation 
                                ? "bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 hover:from-amber-50 hover:to-yellow-50 dark:hover:from-amber-950/30 dark:hover:to-yellow-950/30" 
                                : "hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 dark:hover:from-blue-950/10 dark:hover:to-purple-950/10"
                          }
                        `}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : (user.email ? user.email.split("@")[0] : `${user.firstName} ${user.lastName}`)}
                              </span>
                              {isSimulated && (
                                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-none shadow-sm text-xs">
                                  SIMULÉ
                                </Badge>
                              )}
                            </div>
                            {user.email && (
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col gap-2 items-center">
                            {user.contrat && (
                              <Badge className="w-fit bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none shadow-sm">
                                {user.contrat}
                              </Badge>
                            )}
                            {user.etp && (
                              <Badge variant="secondary" className="w-fit text-xs shadow-sm">
                                {user.etp}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {currentSalary > 0 ? (
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(currentSalary)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Non défini</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={simulation?.type || "percentage"}
                            onValueChange={(value: "percentage" | "amount") => {
                              const currentValue = simulation?.value || 0;
                              onSimulationUpdate(user.id, value, currentValue);
                            }}
                          >
                            <SelectTrigger className="w-[100px] mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="amount">€</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            step={simulation?.type === "percentage" ? "0.1" : "1"}
                            placeholder={simulation?.type === "percentage" ? "0" : "0"}
                            value={simulation?.value || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              onSimulationUpdate(user.id, simulation?.type || "percentage", value);
                            }}
                            className="w-[100px] text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {hasSimulation ? (
                            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                              {formatCurrency(newSalary)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasSimulation && difference !== 0 ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className={`p-1 rounded-lg ${difference > 0 ? "bg-green-100 dark:bg-green-950/30" : "bg-red-100 dark:bg-red-950/30"}`}>
                                <TrendingUp className={`h-4 w-4 ${difference > 0 ? "text-green-600" : "text-red-600"}`} />
                              </div>
                              <span className={`font-bold ${difference > 0 ? "text-green-600" : "text-red-600"}`}>
                                {difference > 0 ? "+" : ""}{formatCurrency(difference)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isSimulated ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onRemoveSimulatedUser(user.id)}
                                    className="gap-2 shadow-sm hover:shadow-md transition-all"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Supprimer ce recrutement simulé</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : hasSimulation ? (
                            <Button
                              size="sm"
                              onClick={() => handleValidateOne(user.id)}
                              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none shadow-sm hover:shadow-md transition-all"
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
              <TableFooter className="bg-gradient-to-r from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
                <TableRow className="border-t-2 border-gray-200 dark:border-gray-700 hover:bg-transparent">
                  <TableCell className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    TOTAL
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center">
                    <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-inner">
                      <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {formatCurrency(totalCurrentSalary)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center">
                    {totalNewSalary !== totalCurrentSalary ? (
                      <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 shadow-inner">
                        <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          {formatCurrency(totalNewSalary)}
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {totalDifference !== 0 ? (
                      <div className={`inline-block px-4 py-2 rounded-lg shadow-inner ${
                        totalDifference > 0 
                          ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
                          : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"
                      }`}>
                        <span className={`font-bold text-xl ${
                          totalDifference > 0 
                            ? "bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
                            : "bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent"
                        }`}>
                          {totalDifference > 0 ? "+" : ""}{formatCurrency(totalDifference)}
                        </span>
                      </div>
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
        simulatedUsers={simulatedUsers}
        simulations={simulations}
        displayMode={displayMode}
        currentUserId={currentUserId}
        onSuccess={handleValidationSuccess}
      />
    </>
  );
}
