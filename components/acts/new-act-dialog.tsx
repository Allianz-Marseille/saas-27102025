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
import { CalendarIcon, ArrowLeft, Plus, FileText, Clock, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { contractNumberExists, createAct } from "@/lib/firebase/acts";
import { logActCreated } from "@/lib/firebase/logs";
import { Act, ActSuivi } from "@/types";
import { useAuth } from "@/lib/firebase/use-auth";
import { getCompanies, type Company } from "@/lib/firebase/companies";
import { SuiviTags, validateSuiviTags } from "./suivi-tags";

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
  { 
    value: "AN", 
    label: "AN - Apport Nouveau",
    description: "Nouvelle souscription",
    icon: Plus,
    gradient: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
    darkBgGradient: "dark:from-blue-950/30 dark:to-blue-900/30",
    borderColor: "border-blue-300 dark:border-blue-700",
    textColor: "text-blue-700 dark:text-blue-300"
  },
  { 
    value: "M+3", 
    label: "M+3 - Bilan client",
    description: "Suivi à 3 mois",
    icon: Clock,
    gradient: "from-green-500 to-emerald-600",
    bgGradient: "from-green-50 to-emerald-100",
    darkBgGradient: "dark:from-green-950/30 dark:to-emerald-900/30",
    borderColor: "border-green-300 dark:border-green-700",
    textColor: "text-green-700 dark:text-green-300"
  },
  { 
    value: "PRETERME_AUTO", 
    label: "Préterme Auto",
    description: "Renouvellement anticipé",
    icon: AlertCircle,
    gradient: "from-orange-500 to-amber-600",
    bgGradient: "from-orange-50 to-amber-100",
    darkBgGradient: "dark:from-orange-950/30 dark:to-amber-900/30",
    borderColor: "border-orange-300 dark:border-orange-700",
    textColor: "text-orange-700 dark:text-orange-300"
  },
  { 
    value: "PRETERME_IRD", 
    label: "Préterme IRD",
    description: "Renouvellement anticipé",
    icon: CheckCircle2,
    gradient: "from-purple-500 to-violet-600",
    bgGradient: "from-purple-50 to-violet-100",
    darkBgGradient: "dark:from-purple-950/30 dark:to-violet-900/30",
    borderColor: "border-purple-300 dark:border-purple-700",
    textColor: "text-purple-700 dark:text-purple-300"
  },
];

export function NewActDialog({ open, onOpenChange, onSuccess }: NewActDialogProps) {
  const { user, userData } = useAuth();
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
  const [suivi, setSuivi] = useState<ActSuivi | undefined>(undefined);

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
    setSuivi(undefined);
  };
  
  const isProcess = kind === "M+3" || kind === "PRETERME_AUTO" || kind === "PRETERME_IRD";
  const isPreterme = kind === "PRETERME_AUTO" || kind === "PRETERME_IRD";
  const isM3 = kind === "M+3";

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

    // Pour M+3 uniquement : validation simplifiée (pas de numéro de contrat)
    if (isM3) {
      // Validation de la note obligatoire pour M+3
      if (!note || note.trim().length === 0) {
        toast.error("Une note est obligatoire pour ce type d'acte");
        return;
      }
      
      // Validation des tags de suivi obligatoires pour M+3
      if (!suivi || typeof suivi !== 'object' || Object.keys(suivi).length === 0) {
        toast.error("Les tags de suivi sont obligatoires pour les actes M+3");
        return;
      }
      
      const suiviValidation = validateSuiviTags(suivi);
      if (!suiviValidation.isValid) {
        toast.error(`Tags de suivi incomplets : ${suiviValidation.missingTags.join(", ")}`);
        return;
      }
      
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
          m3Suivi: suivi, // Tags obligatoires pour M+3
        };
        
        // Ajouter la note
        if (note) {
          actData.note = note;
        }
        
        await createAct(actData);
        
        // Logger la création
        if (userData?.email) {
          try {
            await logActCreated(user.uid, userData.email, {
              clientNom,
              kind,
              contratType: "-",
            });
          } catch (logError) {
            console.error("Erreur lors de l'enregistrement du log:", logError);
          }
        }
        
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

    // Pour PRETERME_AUTO et PRETERME_IRD : validation avec numéro de contrat obligatoire
    if (isPreterme) {
      const trimmedContractNumber = numeroContrat.trim();
      
      // Validation stricte : le numéro de contrat ne peut pas être vide, "-", ou uniquement des espaces
      if (!trimmedContractNumber || trimmedContractNumber === "" || trimmedContractNumber === "-") {
        toast.error("Le numéro de contrat est obligatoire pour les prétermes");
        setFormErrors({ numeroContrat: "Le numéro de contrat est obligatoire pour les prétermes" });
        return;
      }
      
      if (!note || note.trim().length === 0) {
        toast.error("Une note est obligatoire pour ce type d'acte");
        return;
      }
      
      // Validation des tags de suivi obligatoires pour PRETERME
      if (!suivi || typeof suivi !== 'object' || Object.keys(suivi).length === 0) {
        toast.error("Les tags de suivi sont obligatoires pour les prétermes");
        return;
      }
      
      const suiviValidation = validateSuiviTags(suivi);
      if (!suiviValidation.isValid) {
        toast.error(`Tags de suivi incomplets : ${suiviValidation.missingTags.join(", ")}`);
        return;
      }

      setIsLoading(true);
      try {
        const actData: any = {
          userId: user.uid,
          kind,
          clientNom,
          numeroContrat: trimmedContractNumber,
          contratType: "-",
          compagnie: "-",
          dateEffet: new Date(),
          note,
          pretermeSuivi: suivi, // Tags obligatoires pour PRETERME
        };
        
        await createAct(actData);
        
        // Logger la création
        if (userData?.email) {
          try {
            await logActCreated(user.uid, userData.email, {
              clientNom,
              kind,
              contratType: "-",
            });
          } catch (logError) {
            console.error("Erreur lors de l'enregistrement du log:", logError);
          }
        }
        
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
      // Vérification de l'unicité (insensible à la casse) - Protection client
      const alreadyExists = await contractNumberExists(trimmedContractNumber);

      if (alreadyExists) {
        const duplicateError = "Ce numéro de contrat est déjà enregistré.";
        setFormErrors({ numeroContrat: duplicateError });
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
      
      // Les tags de suivi ne sont pas disponibles pour AN
      // (uniquement pour M+3, PRETERME_AUTO, PRETERME_IRD)
      
      await createAct(actData);
      
      // Logger la création
      if (userData?.email) {
        try {
          await logActCreated(user.uid, userData.email, {
            clientNom,
            kind,
            contratType: contratType || "",
          });
        } catch (logError) {
          console.error("Erreur lors de l'enregistrement du log:", logError);
        }
      }
      
      toast.success("Acte créé avec succès");
      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erreur lors de la création de l'acte:", err);
      
      // Gérer l'erreur de doublon depuis le serveur (protection serveur)
      if (err?.message?.includes("déjà enregistré")) {
        const duplicateError = "Ce numéro de contrat est déjà enregistré.";
        setFormErrors({ numeroContrat: duplicateError });
      } else {
        toast.error("Erreur lors de la création de l'acte");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showPrimeAnnuelle = contratType && ["AUTO_MOTO", "IRD_PART", "IRD_PRO", "PJ", "GAV", "NOP_50_EUR", "SANTE_PREV", "VIE_PP"].includes(contratType);
  const showMontantVersement = contratType === "VIE_PU";

  // Étape 1 : Sélection du type d'acte
  const renderStep1 = () => (
    <>
      <DialogHeader className="pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nouvel acte commercial
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Étape 1/2 : Sélectionnez le type d'acte</p>
          </div>
        </div>
      </DialogHeader>

      <div className="py-8">
        <div className="grid grid-cols-2 gap-4">
          {ACT_KINDS.map((actKind) => {
            const Icon = actKind.icon;
            return (
            <button
              key={actKind.value}
              onClick={() => handleKindSelect(actKind.value as any)}
              className={cn(
                  "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 cursor-pointer",
                  "border-2 hover:scale-105 hover:shadow-2xl",
                  "focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2",
                "active:scale-95",
                  "bg-gradient-to-br",
                  actKind.bgGradient,
                  actKind.darkBgGradient,
                  actKind.borderColor
              )}
            >
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex flex-col items-start gap-3">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                    actKind.gradient
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="text-left">
                    <div className={cn("font-bold text-base mb-1", actKind.textColor)}>
                      {actKind.label}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {actKind.description}
                    </p>
                  </div>
                </div>
            </button>
            );
          })}
        </div>
      </div>

      <DialogFooter className="border-t pt-6">
        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)}
          className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-900 dark:hover:to-gray-800"
        >
          Annuler
        </Button>
      </DialogFooter>
    </>
  );

  // Étape 2 : Formulaire selon le type d'acte sélectionné
  const renderStep2 = () => {
    const currentKind = ACT_KINDS.find(a => a.value === kind);
    const KindIcon = currentKind?.icon || FileText;
    
    if (isProcess) {
      return (
        <>
          <DialogHeader className="pb-6 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="h-10 w-10 p-0 rounded-xl hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className={cn(
                "p-3 rounded-xl bg-gradient-to-br shadow-lg",
                currentKind?.gradient
              )}>
                <KindIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {currentKind?.label}
            </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Étape 2/2 : Informations du process</p>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-6 py-6">
          {/* Nom du client */}
            <div className="grid gap-3">
              <Label htmlFor="clientNom" className="text-sm font-semibold flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                  1
                </span>
                Nom du client *
              </Label>
            <Input
              id="clientNom"
              value={clientNom}
              onChange={(e) => handleClientNomChange(e.target.value)}
              placeholder="Ex: Dupont Jean-Pierre"
                className="h-11 border-2 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>

            {/* Numéro de contrat pour PRETERME uniquement */}
            {isPreterme && (
              <div className="grid gap-3">
                <Label htmlFor="numeroContrat" className="text-sm font-semibold flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    2
                  </span>
                  Numéro de contrat *
                </Label>
                <Input
                  id="numeroContrat"
                  value={numeroContrat}
                  onChange={(e) => setNumeroContrat(e.target.value)}
                  placeholder="Ex: 12345678"
                  className={cn(
                    "h-11 border-2 focus:border-blue-500 dark:focus:border-blue-400",
                    formErrors.numeroContrat && "border-red-500 focus:border-red-500"
                  )}
                />
                {formErrors.numeroContrat && (
                  <p className="text-xs text-red-500">{formErrors.numeroContrat}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Le même numéro de contrat peut être saisi plusieurs fois pour suivre les révisions dans le temps (ex: révision en 2022, 2023, 2024, etc.).
                </p>
              </div>
            )}

            {/* Note obligatoire */}
            <div className="grid gap-3">
              <Label htmlFor="note" className="text-sm font-semibold flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                  {isPreterme ? "3" : "2"}
                </span>
                Note *
                <span className="ml-auto text-xs font-normal text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Obligatoire pour les process
                </span>
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isPreterme 
                  ? "Décrivez le contexte du préterme (ex: Échéance du contrat, opportunités de renégociation...)"
                  : "Décrivez le contexte de ce bilan (ex: Échanges avec le client, besoins détectés, opportunités...)"}
                rows={5}
                className="border-2 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Cette note permet de garder une trace du suivi {isPreterme ? "du contrat" : "client"} et facilite le pilotage de l'activité.
              </p>
            </div>

            {/* Tags de suivi d'appel téléphonique - Uniquement pour M+3 et PRETERME */}
            <SuiviTags
              suivi={suivi}
              onSuiviChange={setSuivi}
              userData={userData}
              isCreation={true}
            />
          </div>

          <DialogFooter className="border-t pt-6 gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
              className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-900 dark:hover:to-gray-800"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={
                isLoading || 
                !clientNom || 
                !note || 
                (isPreterme && !numeroContrat.trim()) ||
                !validateSuiviTags(suivi).isValid
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Créer le process
                </>
              )}
            </Button>
          </DialogFooter>
        </>
      );
    }

    // Formulaire complet pour AN
    return (
      <>
        <DialogHeader className="pb-6 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="h-10 w-10 p-0 rounded-xl hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br shadow-lg",
              currentKind?.gradient
            )}>
              <KindIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currentKind?.label}
          </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Étape 2/2 : Détails du contrat</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 py-6">
          {/* Nom du client */}
          <div className="grid gap-3">
            <Label htmlFor="clientNom" className="text-sm font-semibold">
              Nom du client *
            </Label>
            <Input
              id="clientNom"
              value={clientNom}
              onChange={(e) => handleClientNomChange(e.target.value)}
              placeholder="Ex: Dupont Jean-Pierre"
              className="h-11 border-2 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>

          {/* Numéro de contrat */}
          <div className="grid gap-3">
            <Label htmlFor="numeroContrat" className="text-sm font-semibold">
              Numéro de contrat *
            </Label>
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
                "h-11 border-2",
                formErrors.numeroContrat
                  ? "border-red-500 focus:border-red-500 dark:border-red-400"
                  : "focus:border-blue-500 dark:focus:border-blue-400"
              )}
            />
            {formErrors.numeroContrat && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formErrors.numeroContrat}</span>
              </div>
            )}
          </div>

          {/* Type de contrat */}
          <div className="grid gap-3">
            <Label htmlFor="contratType" className="text-sm font-semibold">
              Type de contrat *
            </Label>
            <Select value={contratType} onValueChange={setContratType}>
              <SelectTrigger id="contratType" className="h-11 border-2 focus:border-blue-500">
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
          <div className="grid gap-3">
            <Label htmlFor="compagnie" className="text-sm font-semibold">
              Compagnie *
            </Label>
            <Select value={compagnie} onValueChange={setCompagnie}>
              <SelectTrigger id="compagnie" className="h-11 border-2 focus:border-blue-500">
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
          <div className="grid gap-3">
            <Label className="text-sm font-semibold">Date d'effet *</Label>
            <Popover open={dateEffetOpen} onOpenChange={setDateEffetOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal border-2 hover:border-blue-500",
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
            <div className="grid gap-3">
              <Label htmlFor="primeAnnuelle" className="text-sm font-semibold">
                Prime annuelle (€)
              </Label>
              <Input
                id="primeAnnuelle"
                type="number"
                step="0.01"
                value={primeAnnuelle || ""}
                onChange={(e) => setPrimeAnnuelle(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 500.00"
                className="h-11 border-2 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
          )}

          {/* Montant versé (conditionnel) */}
          {showMontantVersement && (
            <div className="grid gap-3">
              <Label htmlFor="montantVersement" className="text-sm font-semibold">
                Montant versé (€) *
              </Label>
              <Input
                id="montantVersement"
                type="number"
                step="0.01"
                value={montantVersement || ""}
                onChange={(e) => setMontantVersement(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 1000.00"
                className="h-11 border-2 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
          )}

          {/* Note */}
          <div className="grid gap-3">
            <Label htmlFor="note" className="text-sm font-semibold">
              Note <span className="text-muted-foreground font-normal">(optionnel)</span>
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ajoutez une note si nécessaire..."
              rows={3}
              className="border-2 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
            />
          </div>

          {/* Les tags de suivi ne sont pas disponibles pour AN */}
        </div>

        <DialogFooter className="border-t pt-6 gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
            className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-900 dark:hover:to-gray-800"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Créer l'acte
              </>
            )}
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-2 shadow-2xl">
        {step === 1 ? renderStep1() : renderStep2()}
      </DialogContent>
    </Dialog>
  );
}

