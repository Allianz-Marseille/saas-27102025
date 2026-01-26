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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Check, Loader2, TrendingUp, UserMinus, UserPlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { validateAllSalaryIncreases, validateSalaryIncrease } from "@/lib/firebase/salaries";
import { toast } from "sonner";
import type { User, SimulatedUser } from "@/types";
import { doc, updateDoc, setDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface GlobalValidationModalProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  simulatedUsers: Map<string, SimulatedUser>;
  simulations: Map<string, { type: "percentage" | "amount"; value: number; newSalary: number }>;
  neutralizedDepartures: Set<string>;
  displayMode: "monthly" | "annual";
  currentUserId: string;
  totals: {
    current: number;
    simulated: number;
    difference: number;
    impactNet: number;
    evolutionPercentage: number;
  };
  onSuccess: () => void;
}

export function GlobalValidationModal({
  open,
  onClose,
  users,
  simulatedUsers,
  simulations,
  neutralizedDepartures,
  displayMode,
  currentUserId,
  totals,
  onSuccess,
}: GlobalValidationModalProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Filtrer les utilisateurs simulés des simulations (ne peuvent pas être validés comme augmentations)
  const realUsersWithSimulations = Array.from(simulations.keys()).filter(
    userId => !simulatedUsers.has(userId)
  );

  // Départs à valider
  const departuresToValidate = Array.from(neutralizedDepartures).map(userId => {
    const user = users.find(u => u.id === userId);
    return user ? {
      id: userId,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      monthlySalary: user.currentMonthlySalary || 0,
    } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  // Arrivées à valider (recrutements simulés)
  const arrivalsToValidate = Array.from(simulatedUsers.values()).map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    monthlySalary: user.currentMonthlySalary,
    contrat: user.contrat,
    etp: user.etp,
    role: user.role,
  }));

  const multiplier = displayMode === "annual" ? 12 : 1;

  const handleValidateAll = async () => {
    if (confirmText !== "VALIDER") {
      toast.error('Veuillez taper "VALIDER" pour confirmer');
      return;
    }

    try {
      setLoading(true);

      // 1. Valider les augmentations
      if (realUsersWithSimulations.length > 0) {
        const increases = realUsersWithSimulations
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

        if (increases.length > 0) {
          await validateAllSalaryIncreases(increases, year, currentUserId);
          toast.success(`${increases.length} augmentation(s) validée(s)`);
        }
      }

      // 2. Valider les départs (désactiver les utilisateurs)
      if (departuresToValidate.length > 0) {
        await Promise.all(
          departuresToValidate.map(async (departure) => {
            const userRef = doc(db, "users", departure.id);
            await updateDoc(userRef, {
              active: false,
            });
          })
        );
        toast.success(`${departuresToValidate.length} départ(s) validé(s)`);
      }

      // 3. Valider les arrivées (créer les utilisateurs)
      if (arrivalsToValidate.length > 0) {
        // Note: La création d'utilisateurs nécessite Firebase Auth
        // Pour l'instant, on crée juste les documents Firestore
        // L'admin devra créer les comptes Auth séparément ou via l'API
        await Promise.all(
          arrivalsToValidate.map(async (arrival) => {
            // Générer un ID temporaire (sera remplacé par l'UID réel lors de la création Auth)
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const userRef = doc(db, "users", tempId);
            
            await setDoc(userRef, {
              id: tempId,
              email: arrival.email || `${arrival.firstName.toLowerCase()}.${arrival.lastName.toLowerCase()}@allianz-nogaro.fr`,
              firstName: arrival.firstName,
              lastName: arrival.lastName,
              role: arrival.role || "CDC_COMMERCIAL",
              active: true,
              contrat: arrival.contrat,
              etp: arrival.etp,
              currentMonthlySalary: arrival.monthlySalary,
              createdAt: Timestamp.now(),
            });

            // Créer l'entrée de salaire dans l'historique
            await addDoc(collection(db, "salary_history"), {
              userId: tempId,
              year,
              monthlySalary: arrival.monthlySalary,
              changeType: "initial",
              validatedAt: Timestamp.now(),
              validatedBy: currentUserId,
              createdAt: Timestamp.now(),
            });
          })
        );
        toast.success(`${arrivalsToValidate.length} recrutement(s) validé(s) (création des utilisateurs)`);
        toast.warning("⚠️ Les comptes Auth doivent être créés séparément via l'interface de gestion des utilisateurs");
      }

      onSuccess();
      toast.success("✅ Validation globale terminée avec succès");
    } catch (error) {
      console.error("Erreur lors de la validation globale:", error);
      toast.error("Erreur lors de la validation globale");
    } finally {
      setLoading(false);
    }
  };

  const totalItems = realUsersWithSimulations.length + departuresToValidate.length + arrivalsToValidate.length;

  if (totalItems === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            Validation globale
          </DialogTitle>
          <DialogDescription>
            Valider toutes les modifications en une seule opération : {realUsersWithSimulations.length} augmentation(s), {departuresToValidate.length} départ(s), {arrivalsToValidate.length} arrivée(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Récapitulatif global */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Masse actuelle</div>
              <div className="text-xl font-bold text-emerald-600">{formatCurrency(totals.current)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Masse avec mouvements</div>
              <div className="text-xl font-bold text-violet-600">{formatCurrency(totals.simulated)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Impact net</div>
              <div className={`text-xl font-bold ${totals.impactNet > 0 ? "text-amber-600" : totals.impactNet < 0 ? "text-green-600" : "text-gray-600"}`}>
                {totals.impactNet > 0 ? "+" : ""}{formatCurrency(totals.impactNet)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ({totals.evolutionPercentage > 0 ? "+" : ""}{totals.evolutionPercentage.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Liste détaillée dans un accordéon */}
          <Accordion type="single" collapsible className="w-full">
            {/* Augmentations */}
            {realUsersWithSimulations.length > 0 && (
              <AccordionItem value="increases">
                <AccordionTrigger className="font-semibold">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Augmentations ({realUsersWithSimulations.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
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
                        {realUsersWithSimulations.map((userId) => {
                          const user = users.find(u => u.id === userId);
                          const simulation = simulations.get(userId);
                          if (!user || !simulation) return null;

                          const currentSalary = (user.currentMonthlySalary || 0) * multiplier;
                          const newSalary = simulation.newSalary * multiplier;
                          const difference = newSalary - currentSalary;

                          return (
                            <TableRow key={userId}>
                              <TableCell>
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email.split("@")[0]}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(currentSalary)}</TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                {formatCurrency(newSalary)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-semibold text-green-600">
                                  +{formatCurrency(difference)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Départs */}
            {departuresToValidate.length > 0 && (
              <AccordionItem value="departures">
                <AccordionTrigger className="font-semibold">
                  <div className="flex items-center gap-2">
                    <UserMinus className="h-4 w-4 text-red-600" />
                    Départs ({departuresToValidate.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collaborateur</TableHead>
                          <TableHead className="text-right">Économie ({displayMode === "annual" ? "annuelle" : "mensuelle"})</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departuresToValidate.map((departure) => (
                          <TableRow key={departure.id}>
                            <TableCell>{departure.name}</TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              -{formatCurrency(departure.monthlySalary * multiplier)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Arrivées */}
            {arrivalsToValidate.length > 0 && (
              <AccordionItem value="arrivals">
                <AccordionTrigger className="font-semibold">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    Arrivées ({arrivalsToValidate.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collaborateur</TableHead>
                          <TableHead>Contrat</TableHead>
                          <TableHead className="text-right">Coût ({displayMode === "annual" ? "annuel" : "mensuel"})</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {arrivalsToValidate.map((arrival) => (
                          <TableRow key={arrival.id}>
                            <TableCell>
                              {arrival.firstName} {arrival.lastName}
                            </TableCell>
                            <TableCell>{arrival.contrat || "-"}</TableCell>
                            <TableCell className="text-right font-semibold text-blue-600">
                              +{formatCurrency(arrival.monthlySalary * multiplier)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Avertissements */}
          <div className="space-y-2">
            <div className="flex gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-sm text-orange-900 dark:text-orange-100">
                <p className="font-semibold mb-1">Attention</p>
                <p>
                  Cette action va modifier définitivement les rémunérations, désactiver des utilisateurs et créer de nouveaux utilisateurs pour l'année {year}.
                  Cette opération ne peut pas être annulée.
                </p>
              </div>
            </div>
            {arrivalsToValidate.length > 0 && (
              <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Information</p>
                  <p>
                    Les recrutements seront créés dans Firestore. Les comptes Auth devront être créés séparément via l'interface de gestion des utilisateurs.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Confirmation requise */}
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmation : Tapez "VALIDER" pour confirmer</Label>
            <Input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="VALIDER"
              className="font-mono"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleValidateAll}
            disabled={loading || confirmText !== "VALIDER"}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Valider toutes les modifications
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
