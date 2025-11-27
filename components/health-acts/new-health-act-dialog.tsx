"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createHealthAct, HEALTH_ACT_COEFFICIENTS, getHealthActKindLabel } from "@/lib/firebase/health-acts";
import { useAuth } from "@/lib/firebase/use-auth";

interface NewHealthActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type HealthActKind = "AFFAIRE_NOUVELLE" | "REVISION" | "ADHESION_SALARIE" | "COURT_TO_AZ" | "AZ_TO_COURTAGE";

export function NewHealthActDialog({ open, onOpenChange, onSuccess }: NewHealthActDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [kind, setKind] = useState<HealthActKind | "">("");
  const [clientNom, setClientNom] = useState("");
  const [numeroContrat, setNumeroContrat] = useState("");
  const [dateEffet, setDateEffet] = useState<Date>();
  const [caAnnuel, setCaAnnuel] = useState("");

  const handleReset = () => {
    setKind("");
    setClientNom("");
    setNumeroContrat("");
    setDateEffet(undefined);
    setCaAnnuel("");
  };

  const capitalizeWords = (text: string): string => {
    return text
      .split(/(\s+|-|')/)
      .map((word, index, array) => {
        if (word === " " || word === "-" || word === "'") {
          return word;
        }
        
        const prevWord = index > 0 ? array[index - 2] : "";
        
        if (prevWord.toLowerCase() === "le" || 
            prevWord.toLowerCase() === "la" || 
            prevWord.toLowerCase() === "les" ||
            prevWord.toLowerCase() === "de" ||
            prevWord.toLowerCase() === "du") {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Utilisateur non connecté");
      return;
    }

    if (!kind) {
      toast.error("Veuillez sélectionner un type d'acte");
      return;
    }

    if (!clientNom.trim()) {
      toast.error("Veuillez saisir le nom du client");
      return;
    }

    if (!numeroContrat.trim()) {
      toast.error("Veuillez saisir le numéro de contrat");
      return;
    }

    if (!dateEffet) {
      toast.error("Veuillez sélectionner la date d'effet");
      return;
    }

    const caAnnuelNum = parseFloat(caAnnuel);
    if (isNaN(caAnnuelNum) || caAnnuelNum <= 0) {
      toast.error("Veuillez saisir un CA annuel valide");
      return;
    }

    setIsSubmitting(true);

    try {
      const coefficient = HEALTH_ACT_COEFFICIENTS[kind] || 1.0;
      
      await createHealthAct({
        userId: user.uid,
        kind: kind as HealthActKind,
        clientNom: capitalizeWords(clientNom),
        numeroContrat: numeroContrat.trim(),
        dateEffet,
        caAnnuel: caAnnuelNum,
        coefficient,
      });

      toast.success("Acte créé avec succès");
      handleReset();
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erreur lors de la création de l'acte");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const coefficient = kind ? HEALTH_ACT_COEFFICIENTS[kind] || 1.0 : 0;
  const caAnnuelNum = parseFloat(caAnnuel) || 0;
  const caPondere = caAnnuelNum * coefficient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel acte santé individuelle</DialogTitle>
          <DialogDescription>
            Saisissez les informations de votre nouvel acte
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type d'acte */}
          <div className="space-y-2">
            <Label htmlFor="kind">Type d'acte *</Label>
            <Select value={kind} onValueChange={(value) => setKind(value as HealthActKind)}>
              <SelectTrigger id="kind">
                <SelectValue placeholder="Sélectionnez un type d'acte" />
              </SelectTrigger>
              <SelectContent>
                {(["AFFAIRE_NOUVELLE", "REVISION", "ADHESION_SALARIE", "COURT_TO_AZ", "AZ_TO_COURTAGE"] as HealthActKind[]).map((kindOption) => (
                  <SelectItem key={kindOption} value={kindOption}>
                    {getHealthActKindLabel(kindOption)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kind && (
              <p className="text-sm text-muted-foreground">
                Coefficient : <span className="font-bold text-blue-600 dark:text-blue-400">{(coefficient * 100).toFixed(0)}%</span>
              </p>
            )}
          </div>

          {/* Nom du client */}
          <div className="space-y-2">
            <Label htmlFor="clientNom">Nom du client *</Label>
            <Input
              id="clientNom"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>

          {/* Numéro de contrat */}
          <div className="space-y-2">
            <Label htmlFor="numeroContrat">Numéro de contrat *</Label>
            <Input
              id="numeroContrat"
              value={numeroContrat}
              onChange={(e) => setNumeroContrat(e.target.value)}
              placeholder="12345678"
            />
          </div>

          {/* Date d'effet */}
          <div className="space-y-2">
            <Label>Date d&apos;effet *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateEffet && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateEffet ? format(dateEffet, "PPP", { locale: fr }) : "Sélectionnez une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateEffet}
                  onSelect={setDateEffet}
                  locale={fr}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* CA annuel */}
          <div className="space-y-2">
            <Label htmlFor="caAnnuel">CA annuel (€) *</Label>
            <Input
              id="caAnnuel"
              type="number"
              step="0.01"
              value={caAnnuel}
              onChange={(e) => setCaAnnuel(e.target.value)}
              placeholder="10000"
            />
          </div>

          {/* CA pondéré (calculé automatiquement) */}
          {kind && caAnnuelNum > 0 && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <Label className="text-sm text-muted-foreground">CA pondéré (calculé automatiquement)</Label>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(Math.round(caPondere))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(Math.round(caAnnuelNum))} × {(coefficient * 100).toFixed(0)}%
              </p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSubmitting ? "Création en cours..." : "Créer l'acte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

