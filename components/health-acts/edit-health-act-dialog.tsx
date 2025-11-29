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
import { CalendarIcon, Lock } from "lucide-react";
import { toast } from "sonner";
import { updateHealthAct, getHealthActKindLabel } from "@/lib/firebase/health-acts";
import { HealthAct } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getCompanies, type Company } from "@/lib/firebase/companies";
import { Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/use-auth";
import { isActLocked as checkActLocked } from "@/lib/utils/act-lock";

interface EditHealthActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  act: HealthAct | null;
  onSuccess?: () => void;
}

const HEALTH_ACT_KINDS = [
  { value: "AFFAIRE_NOUVELLE", label: "Affaire Nouvelle" },
  { value: "REVISION", label: "Révision" },
  { value: "ADHESION_SALARIE", label: "Adhésion salarié" },
  { value: "COURT_TO_AZ", label: "COURT → AZ" },
  { value: "AZ_TO_COURTAGE", label: "AZ → courtage" },
];

export function EditHealthActDialog({ open, onOpenChange, act, onSuccess }: EditHealthActDialogProps) {
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [clientNom, setClientNom] = useState("");
  const [numeroContrat, setNumeroContrat] = useState("");
  const [kind, setKind] = useState("");
  const [compagnie, setCompagnie] = useState("");
  const [dateEffet, setDateEffet] = useState<Date | undefined>();
  const [dateEffetOpen, setDateEffetOpen] = useState(false);
  const [caAnnuel, setCaAnnuel] = useState<number | undefined>();

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
      
      setCaAnnuel(act.caAnnuel);
    }
  }, [open, act]);

  const handleSubmit = async () => {
    if (!act) return;

    // Validation
    if (!clientNom) {
      toast.error("Le nom du client est obligatoire");
      return;
    }

    if (!numeroContrat || !kind || !compagnie || !dateEffet || caAnnuel === undefined) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (caAnnuel <= 0) {
      toast.error("Le CA annuel doit être supérieur à 0");
      return;
    }

    // Vérification de l'unicité du numéro de contrat pour les Affaires Nouvelles
    // UNIQUEMENT si le numéro a changé
    const trimmedContractNumber = numeroContrat.trim();
    const originalContractNumber = act.numeroContrat?.trim();
    
    if (kind === "AFFAIRE_NOUVELLE" && trimmedContractNumber !== originalContractNumber) {
      setIsLoading(true);
      try {
        // Vérifier si le nouveau numéro existe déjà
        if (!db) {
          toast.error("Erreur de connexion à la base de données");
          setIsLoading(false);
          return;
        }

        const q = query(collection(db, "health_acts"), where("numeroContrat", "==", trimmedContractNumber));
        const snapshot = await getDocs(q);
        
        // Vérifier si le numéro existe déjà (en excluant l'acte actuel)
        const existsInOtherAct = snapshot.docs.some(doc => doc.id !== act.id);
        
        if (existsInOtherAct) {
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
      const updates: Partial<HealthAct> = {
        clientNom,
        numeroContrat: trimmedContractNumber,
        kind: kind as HealthAct["kind"],
        compagnie,
        dateEffet,
        caAnnuel,
      };
      
      await updateHealthAct(act.id, updates);
      
      toast.success("Acte modifié avec succès");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Erreur lors de la modification de l'acte:", err);
      toast.error("Erreur lors de la modification de l'acte");
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
            Modifier l'acte - {getHealthActKindLabel(act.kind)}
            {checkActLocked(act, userData) && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700">
                <Lock className="h-3 w-3 mr-1" />
                Bloqué pour modification
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
            {kind === "AFFAIRE_NOUVELLE" && (
              <p className="text-xs text-muted-foreground">
                Pour les Affaires Nouvelles, le numéro doit être unique
              </p>
            )}
          </div>

          {/* Type d'acte */}
          <div className="grid gap-2">
            <Label htmlFor="kind">Type d'acte *</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger id="kind">
                <SelectValue placeholder="Sélectionnez un type d'acte" />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_ACT_KINDS.map((actKind) => (
                  <SelectItem key={actKind.value} value={actKind.value}>
                    {actKind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label>Date d'effet *</Label>
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
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* CA Annuel */}
          <div className="grid gap-2">
            <Label htmlFor="caAnnuel">CA Annuel (€) *</Label>
            <Input
              id="caAnnuel"
              type="number"
              step="0.01"
              value={caAnnuel || ""}
              onChange={(e) => setCaAnnuel(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ex: 1500.00"
            />
            <p className="text-xs text-muted-foreground">
              Le CA pondéré sera recalculé automatiquement selon le type d'acte
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#00529B] hover:bg-[#003d73]">
            {isLoading ? "Modification..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

