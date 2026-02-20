"use client";

import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createBoostAdmin,
  updateBoost,
} from "@/lib/firebase/boosts";
import type { BoostType, BoostWithUser } from "@/types/boost";
import { BOOST_REMUNERATION } from "@/types/boost";

/** Utilisateur pour le select (id, email + optionnellement firstName/lastName depuis Firestore) */
type UserForSelect = { id: string; email: string; firstName?: string; lastName?: string };

const BOOST_TYPES: { value: BoostType; label: string }[] = [
  { value: "GOOGLE", label: "Google" },
];

interface BoostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boost: BoostWithUser | null;
  users: UserForSelect[];
  onSuccess?: () => void;
}

function getBoostDate(boost: BoostWithUser): Date {
  const d = boost.date;
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function getUserDisplayName(u: UserForSelect): string {
  if (u.firstName || u.lastName) {
    return [u.firstName, u.lastName].filter(Boolean).join(" ");
  }
  return u.email ?? u.id;
}

export function BoostFormDialog({
  open,
  onOpenChange,
  boost,
  users,
  onSuccess,
}: BoostFormDialogProps) {
  const isEdit = !!boost;

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<BoostType>("GOOGLE");
  const [clientName, setClientName] = useState("");
  const [stars, setStars] = useState<number>(5);
  const [date, setDate] = useState<Date>(new Date());
  const [remuneration, setRemuneration] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (boost) {
      setSelectedUserId(boost.userId);
      setSelectedType(boost.type as BoostType);
      setClientName(boost.clientName ?? "");
      setStars(boost.stars ?? 5);
      setDate(getBoostDate(boost));
      setRemuneration(boost.remuneration ?? BOOST_REMUNERATION[boost.type as BoostType] ?? 5);
    } else {
      setSelectedUserId(users[0]?.id ?? "");
      setSelectedType("GOOGLE");
      setClientName("");
      setStars(5);
      setDate(new Date());
      setRemuneration(BOOST_REMUNERATION.GOOGLE);
    }
  }, [open, boost, users]);

  useEffect(() => {
    if (!isEdit && selectedType) {
      setRemuneration(BOOST_REMUNERATION[selectedType] ?? 5);
    }
  }, [isEdit, selectedType]);

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
    setClientName(formatClientName(e.target.value));
  };

  const handleClose = (openState: boolean) => {
    if (!openState) onOpenChange(false);
  };

  const handleSubmit = async () => {
    const trimmedClient = clientName.trim();
    if (!trimmedClient) {
      toast.error("Veuillez saisir le nom du client");
      return;
    }
    if (stars < 1 || stars > 5) {
      toast.error("Les étoiles doivent être entre 1 et 5");
      return;
    }
    if (!isEdit && !selectedUserId) {
      toast.error("Veuillez sélectionner un collaborateur");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && boost?.id) {
        await updateBoost(boost.id, {
          type: selectedType,
          clientName: trimmedClient,
          stars,
          date,
          remuneration,
        });
        toast.success("Boost mis à jour avec succès");
      } else {
        await createBoostAdmin(
          selectedUserId,
          selectedType,
          trimmedClient,
          stars,
          date,
          remuneration
        );
        toast.success("Boost ajouté avec succès");
      }
      handleClose(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du boost:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const collaborateurLabel = isEdit
    ? (boost &&
        (boost.userFirstName || boost.userLastName
          ? [boost.userFirstName, boost.userLastName].filter(Boolean).join(" ")
          : boost.userEmail ?? "Inconnu"))
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le boost" : "Ajouter un boost"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Corrigez les informations du boost."
              : "Saisissez les informations du boost pour un collaborateur."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isEdit ? (
            <div className="space-y-2">
              <Label>Collaborateur</Label>
              <p className="text-sm text-muted-foreground rounded-md border bg-muted/50 px-3 py-2">
                {collaborateurLabel}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Collaborateur</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un collaborateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {getUserDisplayName(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as BoostType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boost-client">Nom du client</Label>
            <Input
              id="boost-client"
              placeholder="Ex: Dupont Martin"
              value={clientName}
              onChange={handleClientNameChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Nombre d&apos;étoiles</Label>
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

          <div className="space-y-2">
            <Label>Date du boost</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) setDate(d);
                    setDateOpen(false);
                  }}
                  locale={fr}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boost-remuneration">Rémunération (€)</Label>
            <Input
              id="boost-remuneration"
              type="number"
              min={0}
              step={1}
              value={remuneration}
              onChange={(e) => setRemuneration(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!clientName.trim() || isSubmitting}
          >
            {isSubmitting ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
