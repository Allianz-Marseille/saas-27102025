"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/firebase/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createBoost } from "@/lib/firebase/boosts";
import type { BoostType } from "@/types/boost";
import { BOOST_REMUNERATION } from "@/types/boost";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Star } from "lucide-react";

interface BoostDeclarationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const BOOST_TYPES: { type: BoostType; label: string; imagePath: string }[] = [
  { type: "GOOGLE", label: "Google", imagePath: "/boost/google.png" },
];

export function BoostDeclarationModal({
  open,
  onOpenChange,
  onSuccess,
}: BoostDeclarationModalProps) {
  const [selectedType, setSelectedType] = useState<BoostType | null>(null);
  const [clientName, setClientName] = useState("");
  const [stars, setStars] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const formatClientName = (name: string): string => {
    return name
      .split(/[\s-]+/)
      .map((word) => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ")
      .replace(/\s-\s/g, "-");
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatClientName(e.target.value);
    setClientName(formatted);
  };

  const resetForm = () => {
    setSelectedType(null);
    setClientName("");
    setStars(5);
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      resetForm();
    }
    onOpenChange(openState);
  };

  const handleSubmit = async () => {
    if (!selectedType || !clientName.trim()) {
      toast.error("Veuillez sélectionner un type et saisir le nom du client");
      return;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBoost(user.uid, selectedType, clientName.trim(), stars);
      toast.success("Boost déclaré avec succès");
      handleClose(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la déclaration du boost:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Déclarer un boost</DialogTitle>
          <DialogDescription>
            Choisissez le type de boost et complétez les informations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection du type */}
          <div className="space-y-3">
            <Label>Type de boost</Label>
            <div className="flex flex-wrap gap-3">
              {BOOST_TYPES.map(({ type, label, imagePath }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                    selectedType === type
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <Image
                    src={imagePath}
                    alt={label}
                    width={80}
                    height={40}
                    className="object-contain"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedType && (
            <>
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du client</Label>
                <Input
                  id="clientName"
                  placeholder="Ex: Dupont Martin ou Jean-Pierre Dubois"
                  value={clientName}
                  onChange={handleClientNameChange}
                  className="max-w-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>Nombre d'étoiles</Label>
                <Select
                  value={String(stars)}
                  onValueChange={(v) => setStars(Number(v))}
                >
                  <SelectTrigger className="max-w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        <span className="flex items-center gap-1">
                          {n} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Date de saisie : <strong>{today}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Rémunération :{" "}
                  <strong>{BOOST_REMUNERATION[selectedType]} €</strong>
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedType || !clientName.trim() || isSubmitting}
          >
            {isSubmitting ? "Enregistrement..." : "Valider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
