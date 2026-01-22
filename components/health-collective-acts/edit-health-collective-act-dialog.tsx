"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { updateHealthCollectiveAct, getHealthCollectiveActKindLabel, getHealthCollectiveActOriginLabel } from "@/lib/firebase/health-collective-acts";
import { HealthCollectiveAct, HealthCollectiveActKind, HealthCollectiveActOrigin } from "@/types";
import { getCompanies, type Company } from "@/lib/firebase/companies";
import { Timestamp } from "firebase/firestore";

interface EditHealthCollectiveActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  act: HealthCollectiveAct | null;
  onSuccess?: () => void;
}

const HEALTH_COLLECTIVE_ACT_KINDS: HealthCollectiveActKind[] = [
  "IND_AN_SANTE",
  "IND_AN_PREVOYANCE",
  "IND_AN_RETRAITE",
  "COLL_AN_SANTE",
  "COLL_AN_PREVOYANCE",
  "COLL_AN_RETRAITE",
  "COLL_ADHESION_RENFORT",
  "REVISION",
  "ADHESION_RENFORT",
  "COURTAGE_TO_ALLIANZ",
  "ALLIANZ_TO_COURTAGE",
];

const HEALTH_COLLECTIVE_ORIGINS: HealthCollectiveActOrigin[] = ["PROACTIF", "REACTIF", "PROSPECTION"];

const HEALTH_COLLECTIVE_AN_TYPES = [
  "IND_AN_SANTE",
  "IND_AN_PREVOYANCE",
  "IND_AN_RETRAITE",
  "COLL_AN_SANTE",
  "COLL_AN_PREVOYANCE",
  "COLL_AN_RETRAITE",
];

export function EditHealthCollectiveActDialog({ open, onOpenChange, act, onSuccess }: EditHealthCollectiveActDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [clientNom, setClientNom] = useState("");
  const [numeroContrat, setNumeroContrat] = useState("");
  const [kind, setKind] = useState<HealthCollectiveActKind | "">("");
  const [origine, setOrigine] = useState<HealthCollectiveActOrigin | "">("");
  const [compagnie, setCompagnie] = useState("");
  const [dateEffet, setDateEffet] = useState<Date | undefined>();
  const [dateEffetOpen, setDateEffetOpen] = useState(false);
  const [prime, setPrime] = useState<number | undefined>();

  // Charger les compagnies actives
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await getCompanies();
        const activeCompanies = companiesData.filter(c => c.active);
        
        const sortedCompanies = activeCompanies.sort((a, b) => {
          if (a.name.toLowerCase() === 'allianz') return -1;
          if (b.name.toLowerCase() === 'allianz') return 1;
          return a.name.localeCompare(b.name);
        });
        
        setCompanies(sortedCompanies);
      } catch (error) {
        console.error("Erreur lors du chargement des compagnies:", error);
        toast.error("Impossible de charger les compagnies");
      }
    };
    
    if (open) {
      loadCompanies();
    }
  }, [open]);

  // Charger les données de l'acte quand le dialog s'ouvre
  useEffect(() => {
    if (open && act) {
      setClientNom(act.clientNom);
      setNumeroContrat(act.numeroContrat);
      setKind(act.kind);
      setOrigine(act.origine);
      setCompagnie(act.compagnie);
      
      // Gérer la conversion de dateEffet (peut être Date ou Timestamp)
      const dateEffetValue = act.dateEffet as Date | Timestamp | unknown;
      if (dateEffetValue instanceof Date) {
        setDateEffet(dateEffetValue);
      } else if (dateEffetValue && typeof dateEffetValue === 'object' && 'toDate' in dateEffetValue) {
        setDateEffet((dateEffetValue as Timestamp).toDate());
      } else {
        setDateEffet(new Date(dateEffetValue as string | number));
      }
      
      setPrime(act.prime);
    }
  }, [open, act]);

  // Fonction pour mettre la première lettre en majuscule
  const formatClientName = (name: string) => {
    return name
      .toLowerCase()
      .split(" ")
      .map(word => {
        if (word.includes("-")) {
          return word
            .split("-")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join("-");
        }
        if (word.includes("'")) {
          return word
            .split("'")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join("'");
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };
  
  const handleClientNomChange = (value: string) => {
    setClientNom(formatClientName(value));
  };

  const handleSubmit = async () => {
    if (!act) return;

    // Validation
    if (!clientNom.trim()) {
      toast.error("Le nom du client est obligatoire");
      return;
    }

    if (!numeroContrat.trim() || !kind || !origine || !compagnie || !dateEffet || prime === undefined) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (prime <= 0) {
      toast.error("Le montant de la prime doit être supérieur à 0");
      return;
    }

    // Vérification de l'unicité du numéro de contrat - UNIQUEMENT pour les affaires nouvelles (*_AN_*)
    // UNIQUEMENT si le numéro a changé
    const trimmedContractNumber = numeroContrat.trim();
    const originalContractNumber = act.numeroContrat?.trim();
    
    if (HEALTH_COLLECTIVE_AN_TYPES.includes(kind as string) && trimmedContractNumber !== originalContractNumber) {
      setIsLoading(true);
      try {
        // Vérifier si le nouveau numéro existe déjà via l'API route
        const response = await fetch("/api/health-acts/check-contract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numeroContrat: trimmedContractNumber,
            actId: act.id,
            collection: "health_collective_acts",
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la vérification du numéro de contrat");
        }

        const data = await response.json();
        
        if (data.exists) {
          toast.error("Ce numéro de contrat est déjà utilisé par un autre acte");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du numéro de contrat:", error);
        toast.error("Erreur lors de la vérification du numéro de contrat");
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      const updates: Partial<HealthCollectiveAct> = {
        clientNom: formatClientName(clientNom),
        numeroContrat: numeroContrat.trim(),
        kind: kind as HealthCollectiveActKind,
        origine: origine as HealthCollectiveActOrigin,
        compagnie,
        dateEffet,
        prime,
      };
      
      await updateHealthCollectiveAct(act.id, updates);
      
      toast.success("Acte modifié avec succès");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Erreur lors de la modification de l'acte:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Erreur lors de la modification de l'acte");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!act) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Modifier l&apos;acte - {getHealthCollectiveActKindLabel(act.kind)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Origine */}
          <div className="grid gap-2">
            <Label htmlFor="origine">Origine *</Label>
            <Select value={origine} onValueChange={(value) => setOrigine(value as HealthCollectiveActOrigin)}>
              <SelectTrigger id="origine">
                <SelectValue placeholder="Sélectionnez une origine" />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_COLLECTIVE_ORIGINS.map((originOption) => (
                  <SelectItem key={originOption} value={originOption}>
                    {getHealthCollectiveActOriginLabel(originOption)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type d'acte */}
          <div className="grid gap-2">
            <Label htmlFor="kind">Type d&apos;acte *</Label>
            <Select value={kind} onValueChange={(value) => setKind(value as HealthCollectiveActKind)}>
              <SelectTrigger id="kind">
                <SelectValue placeholder="Sélectionnez un type d'acte" />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_COLLECTIVE_ACT_KINDS.map((actKind) => (
                  <SelectItem key={actKind} value={actKind}>
                    {getHealthCollectiveActKindLabel(actKind)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nom du client */}
          <div className="grid gap-2">
            <Label htmlFor="clientNom">Nom du client *</Label>
            <Input
              id="clientNom"
              value={clientNom}
              onChange={(e) => handleClientNomChange(e.target.value)}
              placeholder="Ex: Dupont Jean-Pierre"
            />
          </div>

          {/* Numéro de contrat */}
          <div className="grid gap-2">
            <Label htmlFor="numeroContrat">Numéro de contrat *</Label>
            <Input
              id="numeroContrat"
              value={numeroContrat}
              onChange={(e) => setNumeroContrat(e.target.value)}
              placeholder="Ex: 123456789"
            />
            {HEALTH_COLLECTIVE_AN_TYPES.includes(kind as string) && (
              <p className="text-xs text-muted-foreground">
                Pour les Affaires Nouvelles, le numéro doit être unique
              </p>
            )}
          </div>

          {/* Compagnie */}
          <div className="grid gap-2">
            <Label htmlFor="compagnie">Compagnie *</Label>
            <Select value={compagnie} onValueChange={setCompagnie}>
              <SelectTrigger id="compagnie">
                <SelectValue placeholder="Sélectionnez une compagnie" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((comp) => (
                  <SelectItem key={comp.id} value={comp.name}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date d'effet */}
          <div className="grid gap-2">
            <Label>Date d&apos;effet *</Label>
            <Popover open={dateEffetOpen} onOpenChange={setDateEffetOpen}>
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
                  onSelect={(date) => {
                    setDateEffet(date);
                    setDateEffetOpen(false);
                  }}
                  locale={fr}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Montant de la prime */}
          <div className="grid gap-2">
            <Label htmlFor="prime">Montant de la prime (€) *</Label>
            <Input
              id="prime"
              type="number"
              value={prime ?? ""}
              onChange={(e) => setPrime(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ex: 10000"
              min="0"
              step="1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Modification..." : "Modifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

