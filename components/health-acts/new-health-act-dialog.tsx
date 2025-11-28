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
import { CalendarIcon, Sparkles, Zap, TrendingUp, User, FileText } from "lucide-react";
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

const getKindIcon = (kind: HealthActKind) => {
  switch (kind) {
    case "AFFAIRE_NOUVELLE": return "🆕";
    case "REVISION": return "🔄";
    case "ADHESION_SALARIE": return "👥";
    case "COURT_TO_AZ": return "➡️";
    case "AZ_TO_COURTAGE": return "⬅️";
    default: return "📄";
  }
};

const getKindColor = (kind: HealthActKind) => {
  switch (kind) {
    case "AFFAIRE_NOUVELLE": return "from-blue-500 to-cyan-500";
    case "REVISION": return "from-purple-500 to-pink-500";
    case "ADHESION_SALARIE": return "from-orange-500 to-amber-500";
    case "COURT_TO_AZ": return "from-cyan-500 to-teal-500";
    case "AZ_TO_COURTAGE": return "from-green-500 to-emerald-500";
    default: return "from-gray-500 to-gray-600";
  }
};

export function NewHealthActDialog({ open, onOpenChange, onSuccess }: NewHealthActDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [kind, setKind] = useState<HealthActKind | "">("");
  const [clientNom, setClientNom] = useState("");
  const [numeroContrat, setNumeroContrat] = useState("");
  const [dateEffet, setDateEffet] = useState<Date>();
  const [caAnnuel, setCaAnnuel] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleReset = () => {
    setKind("");
    setClientNom("");
    setNumeroContrat("");
    setDateEffet(undefined);
    setCaAnnuel("");
  };

  // Capitalise les noms avec gestion des noms composés
  const capitalizeWords = (text: string): string => {
    if (!text) return text;
    
    // Particules à conserver en minuscule (sauf en début)
    const particules = ["de", "la", "le", "du", "des", "van", "von", "di"];
    
    return text
      .split(/(\s+|-|')/) // Découpe sur espaces, tirets et apostrophes
      .map((part, index, array) => {
        // Conserver les séparateurs tels quels
        if (part === " " || part === "-" || part === "'") {
          return part;
        }
        
        // Si vide, retourner tel quel
        if (part.length === 0) return part;
        
        // Récupérer le mot précédent (en sautant les séparateurs)
        let prevWordIndex = index - 2;
        while (prevWordIndex >= 0 && (array[prevWordIndex] === " " || array[prevWordIndex] === "-" || array[prevWordIndex] === "'")) {
          prevWordIndex -= 2;
        }
        const prevWord = prevWordIndex >= 0 ? array[prevWordIndex] : "";
        
        // Première lettre en majuscule
        const capitalized = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        
        // Si c'est une particule et pas le premier mot, garder en minuscule
        if (index > 0 && particules.includes(part.toLowerCase())) {
          return part.toLowerCase();
        }
        
        return capitalized;
      })
      .join("");
  };

  // Formate le CA avec séparateur de milliers (entiers uniquement)
  const formatCA = (value: string): string => {
    // Retire tous les caractères non numériques
    const numericValue = value.replace(/\D/g, "");
    
    // Si vide, retourner vide
    if (!numericValue) return "";
    
    // Ajoute les séparateurs de milliers
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Récupère la valeur numérique du CA (sans espaces)
  const getNumericCA = (formattedValue: string): number => {
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

    const caAnnuelNum = getNumericCA(caAnnuel);
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

  const coefficient = kind ? HEALTH_ACT_COEFFICIENTS[kind] || 1.0 : 0;
  const caAnnuelNum = getNumericCA(caAnnuel);
  const caPondere = caAnnuelNum * coefficient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl h-[95vh] border-2 border-green-500/50 bg-white dark:bg-slate-950 shadow-2xl p-0 gap-0 flex flex-col overflow-hidden">
        {/* Effet de fond cyber */}
        <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none rounded-lg" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 shadow-lg shadow-green-500/50" />
        
        {/* Header fixe */}
        <div className="relative z-10 p-6 pb-4 border-b border-green-200/30 dark:border-green-800/30 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Nouvel acte santé individuelle
            </DialogTitle>
            <DialogDescription className="font-semibold">
              Saisissez les informations de votre nouvel acte
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Formulaire scrollable */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Type d'acte - Style gaming */}
          <div className="space-y-2">
            <Label htmlFor="kind" className="text-sm font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              Type d&apos;acte *
            </Label>
            <Select value={kind} onValueChange={(value) => setKind(value as HealthActKind)}>
              <SelectTrigger 
                id="kind" 
                className={cn(
                  "border-2 font-bold transition-all duration-300",
                  kind ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : ""
                )}
              >
                <SelectValue placeholder="Sélectionnez un type d'acte" />
              </SelectTrigger>
              <SelectContent className="border-2 border-green-500/30">
                {(["AFFAIRE_NOUVELLE", "REVISION", "ADHESION_SALARIE", "COURT_TO_AZ", "AZ_TO_COURTAGE"] as HealthActKind[]).map((kindOption) => (
                  <SelectItem 
                    key={kindOption} 
                    value={kindOption}
                    className="font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{getKindIcon(kindOption)}</span>
                      {getHealthActKindLabel(kindOption)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kind && (
              <div className={cn(
                "p-3 rounded-lg bg-gradient-to-r border-2 border-opacity-50 animate-in slide-in-from-top shadow-lg",
                getKindColor(kind)
              )}>
                <div className="flex items-center justify-between text-white">
                  <span className="font-bold flex items-center gap-2">
                    <span className="text-2xl">{getKindIcon(kind)}</span>
                    {getHealthActKindLabel(kind)}
                  </span>
                  <div className="px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm border border-white/50">
                    <span className="font-black text-lg">
                      {(coefficient * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
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
                    setIsCalendarOpen(false); // Fermer automatiquement après sélection
                  }}
                  locale={fr}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* CA annuel */}
          <div className="space-y-2">
            <Label htmlFor="caAnnuel" className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              CA annuel (€) *
            </Label>
            <Input
              id="caAnnuel"
              type="text"
              inputMode="numeric"
              value={caAnnuel}
              onChange={(e) => setCaAnnuel(formatCA(e.target.value))}
              placeholder="10 000"
              className="border-2 border-orange-500/30 focus:border-orange-500/70 font-bold text-lg transition-all duration-300"
            />
          </div>

          {/* CA pondéré (calculé automatiquement) - Style gaming */}
          {kind && caAnnuelNum > 0 && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-500/50 relative overflow-hidden animate-in slide-in-from-bottom shadow-xl">
              <div className="absolute inset-0 holographic opacity-5" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg neon-border">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <Label className="text-sm font-bold text-muted-foreground">
                    CA pondéré (calculé automatiquement)
                  </Label>
                </div>
                <p className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  {formatCurrency(Math.round(caPondere))}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 font-bold">
                    {formatCurrency(Math.round(caAnnuelNum))}
                  </span>
                  <span className="text-muted-foreground font-bold">×</span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 font-black text-blue-600 dark:text-blue-400">
                    {(coefficient * 100).toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground font-bold">=</span>
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black shadow-lg">
                    {formatCurrency(Math.round(caPondere))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action - Style gaming */}
          <div className="flex gap-3 justify-end pt-4 border-t border-green-200/30 dark:border-green-800/30">
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
              className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white font-black shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 neon-border px-8"
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
