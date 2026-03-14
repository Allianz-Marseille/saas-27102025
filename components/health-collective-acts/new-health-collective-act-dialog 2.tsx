"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Sparkles, Zap, TrendingUp, User, FileText, Building2, Target } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createHealthCollectiveAct, getHealthCollectiveActKindLabel, HEALTH_COLLECTIVE_ORIGIN_COEFFICIENTS, HEALTH_COLLECTIVE_ACT_COEFFICIENTS, getCompanyCoefficient } from "@/lib/firebase/health-collective-acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { getCompanies, type Company } from "@/lib/firebase/companies";
import { HealthCollectiveActKind, HealthCollectiveActOrigin } from "@/types";

interface NewHealthCollectiveActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Exclut COLL_ADHESION_RENFORT (100%) : doublon avec ADHESION_RENFORT (50%)
const HEALTH_COLLECTIVE_ACT_KINDS: HealthCollectiveActKind[] = [
  "IND_AN_SANTE",
  "IND_AN_PREVOYANCE",
  "IND_AN_RETRAITE",
  "COLL_AN_SANTE",
  "COLL_AN_PREVOYANCE",
  "COLL_AN_RETRAITE",
  "REVISION",
  "ADHESION_RENFORT",
  "COURTAGE_TO_ALLIANZ",
  "ALLIANZ_TO_COURTAGE",
];

const HEALTH_COLLECTIVE_ORIGINS: HealthCollectiveActOrigin[] = ["PROACTIF", "REACTIF", "PROSPECTION"];

export function NewHealthCollectiveActDialog({ open, onOpenChange, onSuccess }: NewHealthCollectiveActDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [kind, setKind] = useState<HealthCollectiveActKind | "">("");
  const [origine, setOrigine] = useState<HealthCollectiveActOrigin | "">("");
  const [clientNom, setClientNom] = useState("");
  const [numeroContrat, setNumeroContrat] = useState("");
  const [compagnie, setCompagnie] = useState("");
  const [dateEffet, setDateEffet] = useState<Date>();
  const [prime, setPrime] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

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

  const handleReset = () => {
    setKind("");
    setOrigine("");
    setClientNom("");
    setNumeroContrat("");
    setCompagnie("");
    setDateEffet(undefined);
    setPrime("");
  };

  // Capitalise les noms avec gestion des noms composés
  const capitalizeWords = (text: string): string => {
    if (!text) return text;
    
    const particules = ["de", "la", "le", "du", "des", "van", "von", "di"];
    
    return text
      .split(/(\s+|-|')/)
      .map((part, index, array) => {
        if (part === " " || part === "-" || part === "'") {
          return part;
        }
        
        if (part.length === 0) return part;
        
        let prevWordIndex = index - 2;
        while (prevWordIndex >= 0 && (array[prevWordIndex] === " " || array[prevWordIndex] === "-" || array[prevWordIndex] === "'")) {
          prevWordIndex -= 2;
        }
        const prevWord = prevWordIndex >= 0 ? array[prevWordIndex] : "";
        
        const capitalized = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        
        if (index > 0 && particules.includes(part.toLowerCase())) {
          return part.toLowerCase();
        }
        
        return capitalized;
      })
      .join("");
  };

  // Formate la prime avec séparateur de milliers (entiers uniquement)
  const formatPrime = (value: string): string => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Récupère la valeur numérique de la prime (sans espaces)
  const getNumericPrime = (formattedValue: string): number => {
    const numericValue = formattedValue.replace(/\s/g, "");
    return numericValue ? parseFloat(numericValue) : 0;
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

    if (!origine) {
      toast.error("Veuillez sélectionner une origine");
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

    if (!compagnie) {
      toast.error("Veuillez sélectionner une compagnie");
      return;
    }

    if (!dateEffet) {
      toast.error("Veuillez sélectionner la date d'effet");
      return;
    }

    const primeNum = getNumericPrime(prime);
    if (isNaN(primeNum) || primeNum <= 0) {
      toast.error("Veuillez saisir un montant de prime valide");
      return;
    }

    setIsSubmitting(true);

    try {
      // Vérification de l'unicité du numéro de contrat - UNIQUEMENT pour les affaires nouvelles (*_AN_*)
      const healthCollectiveANTypes = [
        "IND_AN_SANTE",
        "IND_AN_PREVOYANCE",
        "IND_AN_RETRAITE",
        "COLL_AN_SANTE",
        "COLL_AN_PREVOYANCE",
        "COLL_AN_RETRAITE",
      ];
      
      if (healthCollectiveANTypes.includes(kind as string)) {
        const trimmedContractNumber = numeroContrat.trim();
        const response = await fetch("/api/health-acts/check-contract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numeroContrat: trimmedContractNumber,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la vérification du numéro de contrat");
        }

        const data = await response.json();
        
        if (data.exists) {
          toast.error("Ce numéro de contrat est déjà utilisé par un autre acte");
          setIsSubmitting(false);
          return;
        }
      }

      await createHealthCollectiveAct({
        userId: user.uid,
        kind: kind as HealthCollectiveActKind,
        origine: origine as HealthCollectiveActOrigin,
        clientNom: capitalizeWords(clientNom),
        numeroContrat: numeroContrat.trim(),
        compagnie: compagnie,
        dateEffet,
        prime: primeNum,
      });

      toast.success("Acte créé avec succès ! 🎉");
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

  // Calcul du CA pondéré pour l'affichage
  const primeNum = getNumericPrime(prime);
  const coefficientOrigine = origine ? HEALTH_COLLECTIVE_ORIGIN_COEFFICIENTS[origine] : 0;
  const coefficientTypeActe = kind ? HEALTH_COLLECTIVE_ACT_COEFFICIENTS[kind] : 0;
  const coefficientCompagnie = compagnie ? getCompanyCoefficient(compagnie) : 0;
  const caPondere = primeNum * coefficientOrigine * coefficientTypeActe * coefficientCompagnie;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl h-[95vh] border-2 border-emerald-500/50 bg-white dark:bg-slate-950 shadow-2xl p-0 gap-0 flex flex-col overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none rounded-lg" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 shadow-lg shadow-emerald-500/50" />
        
        <div className="relative z-10 p-6 pb-4 border-b border-emerald-200/30 dark:border-emerald-800/30 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Nouvel acte santé collective
            </DialogTitle>
            <DialogDescription className="font-semibold">
              Saisissez les informations de votre nouvel acte
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto overflow-x-hidden flex-1 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Origine */}
            <div className="space-y-2">
              <Label htmlFor="origine" className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                Origine *
              </Label>
              <Select value={origine} onValueChange={(value) => setOrigine(value as HealthCollectiveActOrigin)}>
                <SelectTrigger 
                  id="origine" 
                  className={cn(
                    "border-2 font-bold transition-all duration-300",
                    origine ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                  )}
                >
                  <SelectValue placeholder="Sélectionnez une origine" />
                </SelectTrigger>
                <SelectContent className="border-2 border-emerald-500/30">
                  {HEALTH_COLLECTIVE_ORIGINS.map((originOption) => (
                    <SelectItem 
                      key={originOption} 
                      value={originOption}
                      className="font-bold cursor-pointer"
                    >
                      {originOption === "PROACTIF" ? "Proactif" : originOption === "REACTIF" ? "Réactif" : "Prospection"} 
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({(HEALTH_COLLECTIVE_ORIGIN_COEFFICIENTS[originOption] * 100).toFixed(0)}%)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type d'acte */}
            <div className="space-y-2">
              <Label htmlFor="kind" className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                Type d&apos;acte *
              </Label>
              <Select value={kind} onValueChange={(value) => setKind(value as HealthCollectiveActKind)}>
                <SelectTrigger 
                  id="kind" 
                  className={cn(
                    "border-2 font-bold transition-all duration-300",
                    kind ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                  )}
                >
                  <SelectValue placeholder="Sélectionnez un type d'acte" />
                </SelectTrigger>
                <SelectContent className="border-2 border-emerald-500/30 max-h-[300px]">
                  {HEALTH_COLLECTIVE_ACT_KINDS.map((kindOption) => (
                    <SelectItem 
                      key={kindOption} 
                      value={kindOption}
                      className="font-bold cursor-pointer"
                    >
                      {getHealthCollectiveActKindLabel(kindOption)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({(HEALTH_COLLECTIVE_ACT_COEFFICIENTS[kindOption] * 100).toFixed(0)}%)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nom du client */}
            <div className="space-y-2">
              <Label htmlFor="clientNom" className="text-sm font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Nom du client *
              </Label>
              <Input
                id="clientNom"
                value={clientNom}
                onChange={(e) => setClientNom(capitalizeWords(e.target.value))}
                placeholder="Jean Dupont"
                className="border-2 border-blue-500/30 focus:border-blue-500/70 font-semibold transition-all duration-300"
              />
            </div>

            {/* Numéro de contrat */}
            <div className="space-y-2">
              <Label htmlFor="numeroContrat" className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Numéro de contrat *
              </Label>
              <Input
                id="numeroContrat"
                value={numeroContrat}
                onChange={(e) => setNumeroContrat(e.target.value)}
                placeholder="12345678"
                className="border-2 border-purple-500/30 focus:border-purple-500/70 font-mono font-bold transition-all duration-300"
              />
            </div>

            {/* Compagnie */}
            <div className="space-y-2">
              <Label htmlFor="compagnie" className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Compagnie *
              </Label>
              <Select value={compagnie} onValueChange={setCompagnie}>
                <SelectTrigger 
                  id="compagnie"
                  className={cn(
                    "border-2 font-bold transition-all duration-300",
                    compagnie ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20" : ""
                  )}
                >
                  <SelectValue placeholder="Sélectionnez une compagnie" />
                </SelectTrigger>
                <SelectContent className="border-2 border-indigo-500/30">
                  {companies.map((company) => (
                    <SelectItem 
                      key={company.id} 
                      value={company.name}
                      className="font-bold cursor-pointer"
                    >
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date d'effet */}
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-cyan-600" />
                Date d&apos;effet *
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-bold border-2 border-cyan-500/30 hover:border-cyan-500/70 transition-all duration-300",
                      !dateEffet && "text-muted-foreground",
                      dateEffet && "bg-cyan-50/50 dark:bg-cyan-950/20"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateEffet ? format(dateEffet, "PPP", { locale: fr }) : "Sélectionnez une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-2 border-cyan-500/30">
                  <Calendar
                    mode="single"
                    selected={dateEffet}
                    onSelect={(date) => {
                      setDateEffet(date);
                      setIsCalendarOpen(false);
                    }}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Montant de la prime */}
            <div className="space-y-2">
              <Label htmlFor="prime" className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                Montant de la prime (€) *
              </Label>
              <Input
                id="prime"
                type="text"
                inputMode="numeric"
                value={prime}
                onChange={(e) => setPrime(formatPrime(e.target.value))}
                placeholder="10 000"
                className="border-2 border-orange-500/30 focus:border-orange-500/70 font-bold text-lg transition-all duration-300"
              />
            </div>

            {/* CA pondéré (calculé automatiquement) */}
            {origine && kind && compagnie && primeNum > 0 && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-2 border-emerald-500/50 relative overflow-hidden animate-in slide-in-from-bottom shadow-xl">
                <div className="absolute inset-0 holographic opacity-5" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg neon-border">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <Label className="text-sm font-bold text-muted-foreground">
                      CA pondéré (calculé automatiquement)
                    </Label>
                  </div>
                  <p className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    {formatCurrency(Math.round(caPondere))}
                  </p>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-bold">
                      {formatCurrency(Math.round(primeNum))}
                    </span>
                    <span className="text-muted-foreground font-bold">×</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 font-black text-blue-600 dark:text-blue-400">
                      {(coefficientOrigine * 100).toFixed(0)}% (origine)
                    </span>
                    <span className="text-muted-foreground font-bold">×</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 font-black text-purple-600 dark:text-purple-400">
                      {(coefficientTypeActe * 100).toFixed(0)}% (type)
                    </span>
                    <span className="text-muted-foreground font-bold">×</span>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 font-black text-indigo-600 dark:text-indigo-400">
                      {(coefficientCompagnie * 100).toFixed(0)}% (compagnie)
                    </span>
                    <span className="text-muted-foreground font-bold">=</span>
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-lg">
                      {formatCurrency(Math.round(caPondere))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 justify-end pt-4 border-t border-emerald-200/30 dark:border-emerald-800/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleReset();
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
                className="font-bold border-2 hover:scale-105 transition-all duration-300"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 text-white font-black shadow-xl shadow-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 neon-border px-8"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Création en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Créer l&apos;acte
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

