"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Phone, FileText, CheckCircle2, Check, X, RotateCcw, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActSuivi } from "@/types";
import { isAdmin } from "@/lib/utils/roles";
import { UserData } from "@/lib/firebase/auth";

interface SuiviTagsProps {
  suivi: ActSuivi | undefined;
  onSuiviChange: (suivi: ActSuivi) => void;
  userData: UserData | null;
  disabled?: boolean;
  isCreation?: boolean; // Si true, permet aux commerciaux de modifier/réinitialiser les tags
}

export function SuiviTags({ suivi, onSuiviChange, userData, disabled = false, isCreation = false }: SuiviTagsProps) {
  const userIsAdmin = isAdmin(userData);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const resetTag = (tag: keyof ActSuivi) => {
    const newSuivi: ActSuivi = { ...suivi };
    delete newSuivi[tag];
    
    // Si on réinitialise appelTelephonique, on supprime aussi les suivants
    if (tag === "appelTelephonique") {
      delete newSuivi.miseAJourFicheLagoon;
      delete newSuivi.bilanEffectue;
    } else if (tag === "miseAJourFicheLagoon") {
      delete newSuivi.bilanEffectue;
    }
    
    onSuiviChange(newSuivi);
    setOpenPopover(null);
  };

  const updateTag = (tag: keyof ActSuivi, value: "OK" | "KO") => {
    const newSuivi: ActSuivi = {
      ...suivi,
      [tag]: value,
    };
    
    // Si on met KO, on supprime les tags suivants
    if (value === "KO") {
      if (tag === "appelTelephonique") {
        delete newSuivi.miseAJourFicheLagoon;
        delete newSuivi.bilanEffectue;
      } else if (tag === "miseAJourFicheLagoon") {
        delete newSuivi.bilanEffectue;
      }
    }
    
    // Si on met OK sur appelTelephonique, on peut accéder à miseAJourFicheLagoon
    // Si on met OK sur miseAJourFicheLagoon, on peut accéder à bilanEffectue
    
    onSuiviChange(newSuivi);
    setOpenPopover(null);
  };

  const getTagBadge = (
    tag: keyof ActSuivi,
    label: string,
    icon: React.ElementType,
    isVisible: boolean,
    useOuiNon: boolean = false // Pour "bilanEffectue", utiliser Oui/Non au lieu de OK/KO
  ) => {
    if (!isVisible) return null;

    const value = suivi?.[tag];
    const Icon = icon;

    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let badgeClassName = "";
    let textColor = "";

    // Pour "bilanEffectue", OK = Oui et KO = Non
    const displayValue = useOuiNon 
      ? (value === "OK" ? "Oui" : value === "KO" ? "Non" : undefined)
      : value;

    if (value === "OK") {
      badgeVariant = "default";
      badgeClassName = "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/50 dark:text-green-300 dark:border-green-700";
      textColor = "text-green-700 dark:text-green-300";
    } else if (value === "KO") {
      badgeVariant = "destructive";
      badgeClassName = "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700";
      textColor = "text-red-700 dark:text-red-300";
    } else {
      badgeClassName = "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
      textColor = "text-gray-600 dark:text-gray-400";
    }

    // Les commerciaux peuvent modifier lors de la création, mais pas lors de la modification
    const isDisabled = disabled || (!userIsAdmin && !isCreation && value !== undefined);

    return (
      <Popover
        open={openPopover === tag}
        onOpenChange={(open) => setOpenPopover(open ? tag : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-auto p-2 hover:bg-transparent",
              isDisabled && "cursor-not-allowed opacity-60"
            )}
            disabled={isDisabled}
          >
            <Badge
              variant={badgeVariant}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium cursor-pointer transition-all hover:scale-105",
                badgeClassName,
                isDisabled && "cursor-not-allowed"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>
                {label}
                {displayValue && ` : ${displayValue}`}
              </span>
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-2">
            <p className="text-sm font-medium mb-2">{label}</p>
            <div className="flex gap-2">
              <Button
                variant={value === "OK" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex-1",
                  value === "OK" && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => updateTag(tag, "OK")}
              >
                <Check className="h-4 w-4 mr-1" />
                {useOuiNon ? "Oui" : "OK"}
              </Button>
              <Button
                variant={value === "KO" ? "destructive" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => updateTag(tag, "KO")}
              >
                <X className="h-4 w-4 mr-1" />
                {useOuiNon ? "Non" : "KO"}
              </Button>
            </div>
            {(userIsAdmin || isCreation) && value !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => resetTag(tag)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const appelTelephoniqueOK = suivi?.appelTelephonique === "OK";
  const miseAJourFicheLagoonOK = suivi?.miseAJourFicheLagoon === "OK";
  
  // Le tag complémentaire apparaît si au moins un des tags principaux est KO
  const hasKO = 
    suivi?.appelTelephonique === "KO" || 
    suivi?.miseAJourFicheLagoon === "KO" || 
    suivi?.bilanEffectue === "KO";

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Suivi d'appel téléphonique</Label>
      <div className="flex flex-wrap gap-2">
        {getTagBadge(
          "appelTelephonique",
          "Appel téléphonique",
          Phone,
          true
        )}
        {getTagBadge(
          "miseAJourFicheLagoon",
          "Mise à jour fiche Lagoon",
          FileText,
          appelTelephoniqueOK
        )}
        {getTagBadge(
          "bilanEffectue",
          "Bilan effectué",
          CheckCircle2,
          miseAJourFicheLagoonOK,
          true // Utiliser Oui/Non au lieu de OK/KO
        )}
        {getTagBadge(
          "smsMailCoordonnees",
          "SMS / Mail avec mes coordonnées ?",
          Mail,
          hasKO
        )}
      </div>
      {!userIsAdmin && !isCreation && suivi && Object.keys(suivi).length > 0 && (
        <p className="text-xs text-muted-foreground">
          Les tags validés ne peuvent pas être modifiés par les commerciaux
        </p>
      )}
      {isCreation && (
        <p className="text-xs text-muted-foreground">
          Vous pouvez modifier ou réinitialiser les tags avant de créer l'acte
        </p>
      )}
    </div>
  );
}

