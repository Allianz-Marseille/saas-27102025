"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuickReplyButtonsProps {
  content: string;
  onSelect: (option: string) => void;
  disabled?: boolean;
}

/**
 * Extrait les options d'une question avec alternatives
 * Détecte plusieurs formats :
 * - "Tu préfères X ou Y ?"
 * - "Choisissez : A, B, ou C"
 * - "Option 1, Option 2, Option 3"
 * - Questions avec "ou" entre options
 */
function extractOptions(content: string): string[] {
  const options: string[] = [];
  
  // Nettoyer le contenu (supprimer le markdown basique)
  const cleanContent = content
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/#{1,6}\s+/g, '')
    .trim();

  // Pattern 1: "Tu préfères X ou Y ?" - Le plus commun
  const ouPattern = /(?:tu\s+)?(?:préfères?|choisissez?|souhaitez?|voulez?|désirez?|préférez?)\s+(?:la\s+|le\s+|les\s+|un\s+|une\s+)?([^?,\n]+?)\s+ou\s+(?:la\s+|le\s+|les\s+|un\s+|une\s+)?([^?,\n]+?)\??/i;
  const ouMatch = cleanContent.match(ouPattern);
  if (ouMatch) {
    const option1 = ouMatch[1].trim().replace(/[.,;:!?]$/, '');
    const option2 = ouMatch[2].trim().replace(/[.,;:!?]$/, '');
    if (option1 && option2 && option1.length < 50 && option2.length < 50) {
      return [option1, option2];
    }
  }

  // Pattern 2: "Choisissez : A, B, ou C" ou "Options : X, Y, Z"
  const choixPattern = /(?:choisissez?|sélectionnez?|préférez?|options?)\s*:?\s*([^?\n]+?)\??/i;
  const choixMatch = cleanContent.match(choixPattern);
  if (choixMatch) {
    const optionsText = choixMatch[1].trim();
    // Séparer par virgules et "ou"
    const splitOptions = optionsText.split(/\s*,\s*(?:ou\s*)?|\s+ou\s+/i);
    const cleaned = splitOptions
      .map(opt => opt.trim().replace(/^[-•*]\s*/, '').replace(/[.,;:!?]$/, ''))
      .filter(opt => opt.length > 0 && opt.length < 50);
    if (cleaned.length >= 2 && cleaned.length <= 4) {
      return cleaned;
    }
  }

  // Pattern 3: "X ou Y" simple dans une phrase interrogative
  const simpleOuPattern = /\b([a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ][^?,\n]{0,30}?)\s+ou\s+([a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ][^?,\n]{0,30}?)\??/i;
  const simpleOuMatch = cleanContent.match(simpleOuPattern);
  if (simpleOuMatch) {
    const opt1 = simpleOuMatch[1].trim().replace(/[.,;:!?]$/, '');
    const opt2 = simpleOuMatch[2].trim().replace(/[.,;:!?]$/, '');
    // Vérifier que ce ne sont pas des phrases complètes (max 4 mots)
    if (opt1 && opt2 && 
        opt1.split(/\s+/).length <= 4 && 
        opt2.split(/\s+/).length <= 4 &&
        opt1.length < 50 && opt2.length < 50) {
      // Exclure les mots de liaison
      if (!opt1.match(/^(préfères?|choisissez?|souhaitez?|voulez?|désirez?|préférez?|tu|vous)$/i) &&
          !opt2.match(/^(préfères?|choisissez?|souhaitez?|voulez?|désirez?|préférez?|tu|vous)$/i)) {
        return [opt1, opt2];
      }
    }
  }

  // Pattern 4: Format structuré avec tirets, puces ou numéros
  const structuredPattern = /(?:^|\n)[\s]*[-•*]\s*([^\n]{1,50}?)(?:\n|$)/g;
  const structuredMatches = Array.from(cleanContent.matchAll(structuredPattern));
  if (structuredMatches.length >= 2 && structuredMatches.length <= 4) {
    const extracted = structuredMatches
      .map(m => m[1].trim().replace(/[.,;:!?]$/, ''))
      .filter(opt => opt.length > 0 && opt.length < 50);
    if (extracted.length >= 2) {
      return extracted;
    }
  }

  // Pattern 5: Liste numérotée 1. 2. 3.
  const numberedPattern = /(?:^|\n)[\s]*\d+[.)]\s*([^\n]{1,50}?)(?:\n|$)/g;
  const numberedMatches = Array.from(cleanContent.matchAll(numberedPattern));
  if (numberedMatches.length >= 2 && numberedMatches.length <= 4) {
    const extracted = numberedMatches
      .map(m => m[1].trim().replace(/[.,;:!?]$/, ''))
      .filter(opt => opt.length > 0 && opt.length < 50);
    if (extracted.length >= 2) {
      return extracted;
    }
  }

  return [];
}

export function QuickReplyButtons({ content, onSelect, disabled = false }: QuickReplyButtonsProps) {
  const options = extractOptions(content);

  if (options.length < 2) {
    return null;
  }

  // Limiter à 4 options maximum pour l'affichage
  const displayOptions = options.slice(0, 4);

  return (
    <div className="mt-4 pt-3 border-t border-border/50">
      <div className="flex flex-wrap gap-2">
        {displayOptions.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(option)}
              disabled={disabled}
              className={cn(
                "rounded-full px-5 py-2.5 h-auto min-w-[80px]",
                "bg-primary/5 hover:bg-primary hover:text-primary-foreground",
                "border-2 border-primary/30 hover:border-primary",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md hover:shadow-primary/20",
                "font-medium text-sm",
                "active:scale-95",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {option}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

