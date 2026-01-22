"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Lock } from "lucide-react";
import { toast } from "sonner";
import { updateAct, calculateCommission } from "@/lib/firebase/acts";
import { logActUpdated } from "@/lib/firebase/logs";
import { Act } from "@/types";
import { getCompanies, type Company } from "@/lib/firebase/companies";
import { Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/use-auth";
import { isActLocked as checkActLocked } from "@/lib/utils/act-lock";
import { isAdmin } from "@/lib/utils/roles";
import { SuiviTags, validateSuiviTags } from "./suivi-tags";
import { ActSuivi } from "@/types";

interface EditActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  act: Act | null;
  onSuccess?: () => void;
}

const CONTRACT_TYPES = [
  { value: "AUTO_MOTO", label: "Auto / Moto" },
  { value: "IRD_PART", label: "IRD Particulier" },
  { value: "IRD_PRO", label: "IRD Professionnel" },
  { value: "PJ", label: "Protection Juridique" },
  { value: "GAV", label: "GAV (Garantie Accident Vie)" },
  { value: "NOP_50_EUR", label: "NOP 50 euros" },
  { value: "SANTE_PREV", label: "Santé / Prévoyance" },
  { value: "VIE_PP", label: "Vie PP (Epargne ou Retraite)" },
  { value: "VIE_PU", label: "Vie PU (Versement libre)" },
];

export function EditActDialog({ open, onOpenChange, act, onSuccess }: EditActDialogProps) {
  const { user, userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [clientNom, setClientNom] = useState("");
  const [note, setNote] = useState("");
  const [numeroContrat, setNumeroContrat] = useState("");
  const [contratType, setContratType] = useState("");
  const [compagnie, setCompagnie] = useState("");
  const [dateEffet, setDateEffet] = useState<Date | undefined>();
  const [dateEffetOpen, setDateEffetOpen] = useState(false);
  const [primeAnnuelle, setPrimeAnnuelle] = useState<number | undefined>();
  const [montantVersement, setMontantVersement] = useState<number | undefined>();
  const [suivi, setSuivi] = useState<ActSuivi | undefined>(undefined);

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
      setNote(act.note || "");
      setNumeroContrat(act.numeroContrat);
      setContratType(act.contratType);
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
      
      setPrimeAnnuelle(act.primeAnnuelle);
      setMontantVersement(act.montantVersement);
      
      // Charger les tags de suivi selon le type d'acte (uniquement M+3 et PRETERME)
      if (act.kind === "M+3" && act.m3Suivi) {
        setSuivi(act.m3Suivi);
      } else if ((act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD") && act.pretermeSuivi) {
        setSuivi(act.pretermeSuivi);
      } else {
        setSuivi(undefined);
      }
    }
  }, [open, act]);

  const isProcess = act?.kind === "M+3" || act?.kind === "PRETERME_AUTO" || act?.kind === "PRETERME_IRD";
  const isPreterme = act?.kind === "PRETERME_AUTO" || act?.kind === "PRETERME_IRD";
  const isM3 = act?.kind === "M+3";
  const isAN = act?.kind === "AN";
  const userIsAdmin = isAdmin(userData);
  const isLocked = checkActLocked(act, userData);
  // Les admins peuvent toujours modifier, même si l'acte est bloqué
  const canEdit = userIsAdmin || !isLocked;

  const handleSubmit = async () => {
    if (!act) return;

    // Validation
    if (!clientNom) {
      toast.error("Le nom du client est obligatoire");
      return;
    }

    // Pour les process, validation simplifiée
    if (isProcess) {
      // Validation des tags de suivi obligatoires pour les process
      if (!suivi || typeof suivi !== 'object' || Object.keys(suivi).length === 0) {
        toast.error("Les tags de suivi sont obligatoires pour les process");
        return;
      }
      
      const suiviValidation = validateSuiviTags(suivi);
      if (!suiviValidation.isValid) {
        toast.error(`Tags de suivi incomplets : ${suiviValidation.missingTags.join(", ")}`);
        return;
      }
      
      setIsLoading(true);
      try {
        const updates: Record<string, unknown> = {
          clientNom,
        };
        
        // Les admins peuvent modifier le numéro de contrat pour les prétermes
        if (userIsAdmin && isPreterme && numeroContrat !== undefined) {
          const trimmedContractNumber = numeroContrat.trim();
          if (!trimmedContractNumber || trimmedContractNumber === "" || trimmedContractNumber === "-") {
            toast.error("Le numéro de contrat est obligatoire pour les prétermes");
            setIsLoading(false);
            return;
          }
          updates.numeroContrat = trimmedContractNumber;
        }
        
        if (note !== undefined) {
          updates.note = note;
        }
        
        // Ajouter les tags de suivi (obligatoires pour M+3 et PRETERME)
        if (act.kind === "M+3") {
          updates.m3Suivi = suivi;
        } else if (isPreterme) {
          updates.pretermeSuivi = suivi;
        }
        
        await updateAct(act.id, updates);
        
        // Logger la modification
        if (user && userData?.email) {
          try {
            await logActUpdated(user.uid, userData.email, act.id, clientNom);
          } catch (logError) {
            console.error("Erreur lors de l'enregistrement du log:", logError);
          }
        }
        
        toast.success("Acte modifié avec succès");
        onSuccess?.();
        onOpenChange(false);
      } catch (err) {
        console.error("Erreur lors de la modification de l'acte:", err);
        toast.error("Erreur lors de la modification de l'acte");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Pour AN, validation complète
    if (!contratType || !compagnie || !dateEffet) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoading(true);
    try {
      // Vérification d'unicité du numéro de contrat pour les AN si l'admin modifie le numéro
      if (userIsAdmin && numeroContrat !== undefined) {
        const trimmedContractNumber = numeroContrat.trim();
        const originalContractNumber = act.numeroContrat?.trim();
        
        // Si le numéro a changé, vérifier l'unicité
        if (trimmedContractNumber !== originalContractNumber && trimmedContractNumber) {
          const { contractNumberExists } = await import("@/lib/firebase/acts");
          const alreadyExists = await contractNumberExists(trimmedContractNumber);
          
          if (alreadyExists) {
            toast.error("Ce numéro de contrat est déjà enregistré");
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Recalculer la commission si nécessaire
      const newCommission = calculateCommission(
        contratType,
        primeAnnuelle || 0,
        montantVersement || 0
      );

      const updates: Record<string, unknown> = {
        clientNom,
        contratType,
        compagnie,
        dateEffet,
        commissionPotentielle: newCommission,
      };
      
      // Les admins peuvent modifier le numéro de contrat pour les AN
      if (userIsAdmin && numeroContrat !== undefined) {
        updates.numeroContrat = numeroContrat.trim();
      }
      
      if (primeAnnuelle !== undefined) {
        updates.primeAnnuelle = primeAnnuelle;
      }
      
      if (montantVersement !== undefined) {
        updates.montantVersement = montantVersement;
      }
      
      if (note !== undefined) {
        updates.note = note;
      }
      
      // Les tags de suivi ne sont pas disponibles pour AN
      // (uniquement pour M+3, PRETERME_AUTO, PRETERME_IRD)
      
      await updateAct(act.id, updates as Partial<Act>);
      
      // Logger la modification
      if (user && userData?.email) {
        try {
          await logActUpdated(user.uid, userData.email, act.id, clientNom);
        } catch (logError) {
          console.error("Erreur lors de l'enregistrement du log:", logError);
        }
      }
      
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

  const showPrimeAnnuelle = contratType && ["AUTO_MOTO", "IRD_PART", "IRD_PRO", "PJ", "GAV", "NOP_50_EUR", "SANTE_PREV", "VIE_PP"].includes(contratType);
  const showMontantVersement = contratType === "VIE_PU";

  if (!act) return null;

  // Formulaire simplifié pour les process
  if (isProcess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Modifier l'acte - {act.kind}
              {checkActLocked(act, userData) && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700">
                  <Lock className="h-3 w-3 mr-1" />
                  Bloqué pour les commerciaux
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Type d'acte (lecture seule) */}
            <div className="grid gap-2">
              <Label>Type d'acte</Label>
              <Input value={act.kind} disabled className="bg-muted" />
            </div>

            {/* Nom du client */}
            <div className="grid gap-2">
              <Label htmlFor="clientNom">Nom du client *</Label>
              <Input
                id="clientNom"
                value={clientNom}
                onChange={(e) => handleClientNomChange(e.target.value)}
                placeholder="Ex: Dupont Jean-Pierre"
                disabled={!canEdit}
                className={!canEdit ? "bg-muted" : ""}
              />
            </div>

            {/* Numéro de contrat (modifiable par admin uniquement pour les prétermes) */}
            {userIsAdmin && isPreterme && (
              <div className="grid gap-2">
                <Label htmlFor="numeroContrat">Numéro de contrat *</Label>
                <Input
                  id="numeroContrat"
                  value={numeroContrat}
                  onChange={(e) => setNumeroContrat(e.target.value)}
                  placeholder="Ex: ABC123456"
                />
                <p className="text-xs text-muted-foreground">
                  Modifiable uniquement par les administrateurs
                </p>
              </div>
            )}

            {/* Note */}
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajoutez une note (optionnel)"
                rows={4}
                disabled={!canEdit}
                className={!canEdit ? "bg-muted" : ""}
              />
            </div>

            {/* Tags de suivi d'appel téléphonique - Uniquement pour M+3 et PRETERME */}
            <SuiviTags
              suivi={suivi}
              onSuiviChange={setSuivi}
              userData={userData}
              disabled={!canEdit}
              isCreation={false}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={
                isLoading || 
                !canEdit || 
                (isProcess && !validateSuiviTags(suivi).isValid)
              } 
              className="bg-[#00529B] hover:bg-[#003d73]"
            >
              {isLoading ? "Modification..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Formulaire complet pour AN
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Modifier l'acte - AN
            {checkActLocked(act, userData) && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700">
                <Lock className="h-3 w-3 mr-1" />
                Bloqué pour les commerciaux
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Type d'acte (lecture seule) */}
          <div className="grid gap-2">
            <Label>Type d'acte</Label>
            <Input value="AN - Apport Nouveau" disabled className="bg-muted" />
          </div>

          {/* Nom du client */}
          <div className="grid gap-2">
            <Label htmlFor="clientNom">Nom du client *</Label>
            <Input
              id="clientNom"
              value={clientNom}
              onChange={(e) => handleClientNomChange(e.target.value)}
              placeholder="Ex: Dupont Jean-Pierre"
              disabled={!canEdit}
              className={!canEdit ? "bg-muted" : ""}
            />
          </div>

          {/* Numéro de contrat (modifiable par admin uniquement) */}
          <div className="grid gap-2">
            <Label htmlFor="numeroContrat">Numéro de contrat</Label>
            <Input
              id="numeroContrat"
              value={numeroContrat}
              disabled={!userIsAdmin}
              className={userIsAdmin ? "" : "bg-muted"}
              onChange={(e) => setNumeroContrat(e.target.value)}
              placeholder="Ex: ABC123456"
            />
            {!userIsAdmin && (
              <p className="text-xs text-muted-foreground">
                Le numéro de contrat ne peut pas être modifié par les commerciaux
              </p>
            )}
            {userIsAdmin && (
            <p className="text-xs text-muted-foreground">
                Modifiable uniquement par les administrateurs
            </p>
            )}
          </div>

          {/* Type de contrat */}
          <div className="grid gap-2">
            <Label htmlFor="contratType">Type de contrat *</Label>
            <Select value={contratType} onValueChange={setContratType} disabled={!canEdit}>
              <SelectTrigger id="contratType" className={!canEdit ? "bg-muted" : ""}>
                <SelectValue placeholder="Sélectionnez un type de contrat" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compagnie */}
          <div className="grid gap-2">
            <Label htmlFor="compagnie">Compagnie *</Label>
            <Select value={compagnie} onValueChange={setCompagnie} disabled={!canEdit}>
              <SelectTrigger id="compagnie" className={!canEdit ? "bg-muted" : ""}>
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
                  disabled={!canEdit}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateEffet && "text-muted-foreground",
                    !canEdit && "bg-muted"
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

          {/* Prime annuelle (conditionnelle) */}
          {showPrimeAnnuelle && (
            <div className="grid gap-2">
              <Label htmlFor="primeAnnuelle">Prime annuelle (€)</Label>
              <Input
                id="primeAnnuelle"
                type="number"
                step="0.01"
                value={primeAnnuelle || ""}
                onChange={(e) => setPrimeAnnuelle(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 500.00"
                disabled={!canEdit}
                className={!canEdit ? "bg-muted" : ""}
              />
            </div>
          )}

          {/* Montant versé (conditionnel) */}
          {showMontantVersement && (
            <div className="grid gap-2">
              <Label htmlFor="montantVersement">Montant versé (€) *</Label>
              <Input
                id="montantVersement"
                type="number"
                step="0.01"
                value={montantVersement || ""}
                onChange={(e) => setMontantVersement(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 1000.00"
                disabled={!canEdit}
                className={!canEdit ? "bg-muted" : ""}
              />
            </div>
          )}

          {/* Note */}
          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ajoutez une note (optionnel)"
              rows={3}
              disabled={!canEdit}
              className={!canEdit ? "bg-muted" : ""}
            />
          </div>

          {/* Tags de suivi d'appel téléphonique - Uniquement pour M+3 et PRETERME (pas pour AN) */}
          {!isAN && (
            <SuiviTags
              suivi={suivi}
              onSuiviChange={setSuivi}
              userData={userData}
              disabled={!canEdit}
              isCreation={false}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !canEdit} className="bg-[#00529B] hover:bg-[#003d73]">
            {isLoading ? "Modification..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


