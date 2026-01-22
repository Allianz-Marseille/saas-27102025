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
import { UserPlus } from "lucide-react";
import type { SimulatedUser } from "@/types";

interface AddSimulatedUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: Omit<SimulatedUser, "id" | "isSimulated">) => void;
}

export function AddSimulatedUserDialog({
  open,
  onOpenChange,
  onAdd,
}: AddSimulatedUserDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState<string>("");
  const [contrat, setContrat] = useState("");
  const [etp, setEtp] = useState("");

  const handleSubmit = (continueAdding: boolean = false) => {
    if (!firstName.trim() || !lastName.trim() || !salary) {
      return;
    }

    const salaryValue = parseFloat(salary);
    if (isNaN(salaryValue) || salaryValue <= 0) {
      return;
    }

    onAdd({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      currentMonthlySalary: salaryValue,
      contrat: contrat.trim() || undefined,
      etp: etp.trim() || undefined,
    });

    // Réinitialiser le formulaire
    setFirstName("");
    setLastName("");
    setEmail("");
    setSalary("");
    setContrat("");
    setEtp("");

    // Fermer le dialog si on ne continue pas
    if (!continueAdding) {
      onOpenChange(false);
    }
  };

  const isValid = firstName.trim() && lastName.trim() && salary && parseFloat(salary) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            Simuler un recrutement
          </DialogTitle>
          <DialogDescription>
            Ajoutez un collaborateur simulé pour quantifier l'impact sur la masse salariale.
            Ces recrutements ne peuvent pas être validés définitivement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              Prénom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jean"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">
              Salaire mensuel (€) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="salary"
              type="number"
              step="1"
              min="0"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="3000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optionnel)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean.dupont@allianz-nogaro.fr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contrat">Type de contrat (optionnel)</Label>
            <Input
              id="contrat"
              value={contrat}
              onChange={(e) => setContrat(e.target.value)}
              placeholder="CDI, Alternant, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="etp">ETP (optionnel)</Label>
            <Input
              id="etp"
              value={etp}
              onChange={(e) => setEtp(e.target.value)}
              placeholder="100%, 60%, 50%, etc."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={!isValid}
            className="w-full sm:w-auto"
          >
            Ajouter et continuer
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!isValid}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
