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
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { contractNumberExists, createAct } from "@/lib/firebase/acts";
import { Act } from "@/types";
import { useAuth } from "@/lib/firebase/use-auth";
import { getCompanies, type Company } from "@/lib/firebase/companies";

interface NewActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const ACT_KINDS = [
  { value: "AN", label: "AN - Apport Nouveau", color: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700" },
  { value: "M+3", label: "M+3 - Bilan client", color: "bg-green-50 border-green-200 hover:bg-green-100 text-green-700" },
  { value: "PRETERME_AUTO", label: "Préterme Auto", color: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700" },
  { value: "PRETERME_IRD", label: "Préterme IRD", color: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700" },
];

export function NewActDialog({ open, onOpenChange, onSuccess }: NewActDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [step, setStep] = useState<1 | 2>(1); // Nouvelle gestion des étapes
  
  const [kind, setKind] = useState<"AN" | "M+3" | "PRETERME_AUTO" | "PRETERME_IRD">("AN");
  const [clientNom, setClientNom] = useState("");
  const [note, setNote] = useState("");
  
  // Fonction pour mettre la première lettre en majuscule, en préservant les noms composés
  const formatClientName = (name: string) => {
    return name
      .toLowerCase()
      .split(" ")
      .map(word => {
        // Gérer les mots avec traits d'union (noms composés)
        if (word.includes("-")) {
          return word
            .split("-")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join("-");
        }
        // Gérer les mots avec apostrophes
        if (word.includes("'")) {
          return word
            .split("'")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join("'");
        }
        // Cas normal
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };
  
  const handleClientNomChange = (value: string) => {
    setClientNom(formatClientName(value));
  };
  const [numeroContrat, setNumeroContrat] = useState("");
  const [contratType, setContratType] = useState("");
  const [compagnie, setCompagnie] = useState("");
  const [dateEffet, setDateEffet] = useState<Date | undefined>();
  const [dateEffetOpen, setDateEffetOpen] = useState(false);
  const [primeAnnuelle, setPrimeAnnuelle] = useState<number | undefined>();
  const [montantVersement, setMontantVersement] = useState<number | undefined>();
  const [formErrors, setFormErrors] = useState<{ numeroContrat?: string }>({});

  // Charger les compagnies actives
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await getCompanies();
        const activeCompanies = companiesData.filter(c => c.active);
        
        // Trier : Allianz en premier, puis les autres par ordre alphabétique
        const sortedCompanies = activeCompanies.sort((a, b) => {
          if (a.name.toLowerCase() === 'allianz') return -1;
          if (b.name.toLowerCase() === 'allianz') return 1;
          return a.name.localeCompare(b.name);
        });
        
        setCompanies(sortedCompanies);
        
        // Définir Allianz par défaut s'il existe, sinon la première compagnie
        if (sortedCompanies.length > 0 && !compagnie) {
          const allianz = sortedCompanies.find(c => c.name.toLowerCase() === 'allianz');
          setCompagnie(allianz ? allianz.name : sortedCompanies[0].name);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des compagnies:", error);
        toast.error("Impossible de charger les compagnies");
      }
    };
    
    if (open) {
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetForm = () => {
    setStep(1);
    setKind("AN");
    setClientNom("");
    setNote("");
    setNumeroContrat("");
    setContratType("");
    setFormErrors({});
    // Réinitialiser avec Allianz si disponible, sinon la première compagnie
    const allianz = companies.find(c => c.name.toLowerCase() === 'allianz');
    setCompagnie(allianz ? allianz.name : (companies.length > 0 ? companies[0].name : ""));
    setDateEffet(undefined);
    setPrimeAnnuelle(undefined);
    setMontantVersement(undefined);
  };
  
  const isProcess = kind === "M+3" || kind === "PRETERME_AUTO" || kind === "PRETERME_IRD";

  const handleKindSelect = (selectedKind: "AN" | "M+3" | "PRETERME_AUTO" | "PRETERME_IRD") => {
    setKind(selectedKind);
    setStep(2);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    // Validation spécifique selon le type
    if (!clientNom) {
      toast.error("Le nom du client est obligatoire");
      return;
    }

    // Pour les process, validation simplifiée
    if (isProcess) {
      setIsLoading(true);
      try {
        const actData: any = {
          userId: user.uid,
          kind,
          clientNom,
          numeroContrat: "-",
          contratType: "-",
          compagnie: "-",
          dateEffet: new Date(),
        };
        
        // Ajouter la note seulement si elle est définie
        if (note) {
          actData.note = note;
        }
        
        await createAct(actData);
        toast.success("Acte créé avec succès");
        resetForm();
        onSuccess?.();
        onOpenChange(false);
      } catch (err) {
        console.error("Erreur lors de la création de l'acte:", err);
        toast.error("Erreur lors de la création de l'acte");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Pour AN, validation complète
    const trimmedContractNumber = numeroContrat.trim();

    const errors: { numeroContrat?: string } = {};
    if (!trimmedContractNumber) {
      errors.numeroContrat = "Le numéro de contrat est obligatoire.";
    }

    if (!contratType || !compagnie || !dateEffet) {
      toast.error("Veuillez remplir tous les champs obligatoires");
    }

    if (errors.numeroContrat || !contratType || !compagnie || !dateEffet) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    setIsLoading(true);
    try {
      const alreadyExists = await contractNumberExists(trimmedContractNumber);

      if (alreadyExists) {
        const duplicateError = "Ce numéro de contrat est déjà enregistré.";
        setFormErrors({ numeroContrat: duplicateError });
        toast.error(duplicateError);
        setIsLoading(false);
        return;
      }

      const actData: any = {
        userId: user.uid,
        kind,
        clientNom,
        numeroContrat: trimmedContractNumber,
        contratType,
        compagnie,
        dateEffet,
      };
      
      // Ajouter les champs optionnels seulement s'ils sont définis
      if (primeAnnuelle !== undefined) {
        actData.primeAnnuelle = primeAnnuelle;
      }
      
      if (montantVersement !== undefined) {
        actData.montantVersement = montantVersement;
      }
      
      if (note) {
        actData.note = note;
      }
      
      await createAct(actData);
      toast.success("Acte créé avec succès");
      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Erreur lors de la création de l'acte:", err);
      toast.error("Erreur lors de la création de l'acte");
    } finally {
      setIsLoading(false);
    }
  };

  const showPrimeAnnuelle = contratType && ["AUTO_MOTO", "IRD_PART", "IRD_PRO", "PJ", "GAV", "NOP_50_EUR", "SANTE_PREV", "VIE_PP"].includes(contratType);
  const showMontantVersement = contratType === "VIE_PU";

  // Étape 1 : Sélection du type d'acte
  const renderStep1 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Nouvel acte commercial - Étape 1</DialogTitle>
      </DialogHeader>

      <div className="py-6">
        <Label className="text-lg mb-6 block">Sélectionnez le type d'acte :</Label>
        <div className="grid grid-cols-2 gap-4">
          {ACT_KINDS.map((actKind) => (
            <button
              key={actKind.value}
              onClick={() => handleKindSelect(actKind.value as any)}
              className={cn(
                "border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer",
                "hover:scale-105 hover:shadow-lg hover:border-blue-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "active:scale-95",
                actKind.color
              )}
            >
              <div className="font-semibold text-base">{actKind.label}</div>
            </button>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
      </DialogFooter>
    </>
  );

  // Étape 2 : Formulaire selon le type d'acte sélectionné
  const renderStep2 = () => {
    if (isProcess) {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              Nouvel acte - {ACT_KINDS.find(a => a.value === kind)?.label}
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

            {/* Note */}
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajoutez une note (optionnel)"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#00529B] hover:bg-[#003d73]">
              {isLoading ? "Création..." : "Créer l'acte"}
            </Button>
          </DialogFooter>
        </>
      );
    }

    // Formulaire complet pour AN
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            Nouvel acte - {ACT_KINDS.find(a => a.value === kind)?.label}
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
              onChange={(e) => {
                setNumeroContrat(e.target.value);
                if (formErrors.numeroContrat) {
                  setFormErrors((prev) => ({ ...prev, numeroContrat: undefined }));
                }
              }}
              placeholder="Ex: CT001234"
              className={cn(
                formErrors.numeroContrat &&
                  "border-red-500 focus-visible:ring-red-500 dark:border-red-400"
              )}
            />
            {formErrors.numeroContrat && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {formErrors.numeroContrat}
              </span>
            )}
          </div>

          {/* Type de contrat */}
          <div className="grid gap-2">
            <Label htmlFor="contratType">Type de contrat *</Label>
            <Select value={contratType} onValueChange={setContratType}>
              <SelectTrigger id="contratType">
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
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#00529B] hover:bg-[#003d73]">
            {isLoading ? "Création..." : "Créer l'acte"}
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 1 ? renderStep1() : renderStep2()}
      </DialogContent>
    </Dialog>
  );
}

