"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createNewYear } from "@/lib/firebase/agency-commissions";
import { createYearSchema } from "@/lib/validations/commission-schema";
import { Plus, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";

interface CreateYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  existingYears: number[];
}

export function CreateYearDialog({
  open,
  onOpenChange,
  onSuccess,
  existingYears,
}: CreateYearDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [year, setYear] = useState<string>("");

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    const yearNumber = parseInt(year, 10);

    // Validation
    try {
      createYearSchema.parse({ year: yearNumber });
    } catch (error: any) {
      const firstError = error.errors?.[0];
      toast.error(firstError?.message || "Année invalide");
      return;
    }

    // Vérifier si l'année existe déjà
    if (existingYears.includes(yearNumber)) {
      toast.error("Cette année existe déjà");
      return;
    }

    setIsLoading(true);
    try {
      await createNewYear(yearNumber, user.uid);
      toast.success(`Année ${yearNumber} créée avec succès! 12 mois initialisés à 0.`);
      setYear("");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erreur lors de la création:", error);
      toast.error(error.message || "Erreur lors de la création de l'année");
    } finally {
      setIsLoading(false);
    }
  };

  // Suggérer l'année suivante
  const suggestedYear = existingYears.length > 0 
    ? Math.max(...existingYears) + 1 
    : new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            Créer une nouvelle année
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="year" className="font-bold">
              Année à créer
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={`Ex: ${suggestedYear}`}
                  className="pl-10 font-mono font-bold text-lg"
                  min={2020}
                  max={2100}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setYear(suggestedYear.toString())}
                className="gap-2 font-bold"
              >
                <Sparkles className="h-4 w-4" />
                {suggestedYear}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              12 mois seront créés automatiquement avec toutes les valeurs à 0
            </p>
          </div>

          {existingYears.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-semibold">
                📊 Années déjà créées: {existingYears.sort((a, b) => b - a).join(', ')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !year}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg gap-2 font-bold"
          >
            <Plus className="h-4 w-4" />
            {isLoading ? "Création..." : "Créer l'année"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

