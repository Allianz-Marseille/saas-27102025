"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { validateSalaryIncrease, validateAllSalaryIncreases } from "@/lib/firebase/salaries";
import { toast } from "sonner";
import type { User, SimulatedUser } from "@/types";

interface SalaryValidationModalProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
  users: User[];
  simulatedUsers: Map<string, SimulatedUser>;
  simulations: Map<string, { type: "percentage" | "amount"; value: number; newSalary: number }>;
  displayMode: "monthly" | "annual";
  currentUserId: string;
  onSuccess: () => void;
}

export function SalaryValidationModal({
  open,
  onClose,
  selectedUsers,
  users,
  simulatedUsers,
  simulations,
  displayMode,
  currentUserId,
  onSuccess,
}: SalaryValidationModalProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // Filtrer les utilisateurs simulés (ne peuvent pas être validés)
  const realUsersToValidate = selectedUsers.filter(userId => !simulatedUsers.has(userId));
  const simulatedCount = selectedUsers.length - realUsersToValidate.length;

  const handleValidate = async () => {
    try {
      setLoading(true);

      if (realUsersToValidate.length === 0) {
        toast.error("Aucun utilisateur réel à valider (les recrutements simulés ne peuvent pas être validés)");
        return;
      }

      if (realUsersToValidate.length === 1) {
        // Validation d'un seul utilisateur
        const userId = realUsersToValidate[0];
        const user = users.find(u => u.id === userId);
        const simulation = simulations.get(userId);

        if (!user || !simulation) {
          toast.error("Erreur: données manquantes");
          return;
        }

        await validateSalaryIncrease(
          userId,
          user.currentMonthlySalary || 0,
          simulation.newSalary,
          year,
          simulation.type,
          simulation.value,
          currentUserId
        );

        toast.success("Rémunération validée avec succès");
      } else {
        // Validation multiple
        const increases = realUsersToValidate
          .map(userId => {
            const user = users.find(u => u.id === userId);
            const simulation = simulations.get(userId);
            
            if (!user || !simulation) return null;

            return {
              userId,
              currentSalary: user.currentMonthlySalary || 0,
              newSalary: simulation.newSalary,
              changeType: simulation.type,
              changeValue: simulation.value,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        await validateAllSalaryIncreases(increases, year, currentUserId);

        toast.success(`${increases.length} rémunération(s) validée(s) avec succès`);
      }

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      toast.error("Erreur lors de la validation des rémunérations");
    } finally {
      setLoading(false);
    }
  };

  const multiplier = displayMode === "annual" ? 12 : 1;

  const usersToValidate = realUsersToValidate
    .map(userId => {
      const user = users.find(u => u.id === userId);
      const simulation = simulations.get(userId);
      
      if (!user || !simulation) return null;

      return {
        user,
        simulation,
        currentSalary: (user.currentMonthlySalary || 0) * multiplier,
        newSalary: simulation.newSalary * multiplier,
        difference: (simulation.newSalary - (user.currentMonthlySalary || 0)) * multiplier,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const totalIncrease = usersToValidate.reduce((sum, item) => sum + item.difference, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Valider les augmentations
          </DialogTitle>
          <DialogDescription>
            Confirmez les modifications de rémunération pour {realUsersToValidate.length} collaborateur(s)
            {simulatedCount > 0 && ` (${simulatedCount} recrutement(s) simulé(s) exclu(s))`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Année d'application */}
          <div className="space-y-2">
            <Label htmlFor="year">Année d'application</Label>
            <Input
              id="year"
              type="number"
              min={new Date().getFullYear() - 1}
              max={new Date().getFullYear() + 2}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-[150px]"
            />
          </div>

          {/* Tableau récapitulatif */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead className="text-right">Actuelle</TableHead>
                  <TableHead className="text-right">Nouvelle</TableHead>
                  <TableHead className="text-right">Augmentation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersToValidate.map(({ user, simulation, currentSalary, newSalary, difference }) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email.split("@")[0]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {simulation.type === "percentage"
                            ? `+${simulation.value}%`
                            : `+${formatCurrency(simulation.value)}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(currentSalary)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(newSalary)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(difference)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="font-semibold">Augmentation totale ({displayMode === "monthly" ? "mensuelle" : "annuelle"})</span>
            <span className="text-xl font-bold text-green-600">
              +{formatCurrency(totalIncrease)}
            </span>
          </div>

          {/* Avertissement */}
          <div className="space-y-2">
            {simulatedCount > 0 && (
              <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Information</p>
                  <p>
                    {simulatedCount} recrutement(s) simulé(s) {simulatedCount === 1 ? "a été" : "ont été"} exclu(s) de cette validation.
                    Les recrutements simulés ne peuvent pas être validés définitivement.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-sm text-orange-900 dark:text-orange-100">
                <p className="font-semibold mb-1">Attention</p>
                <p>
                  Cette action va modifier définitivement les rémunérations et créer un historique pour l'année {year}.
                  Cette opération ne peut pas être annulée.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleValidate}
            disabled={loading}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirmer les augmentations
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
