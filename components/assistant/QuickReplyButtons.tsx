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
/**
 * Valide qu'une option est valide (pas un fragment, pas trop courte, etc.)
 */
function isValidOption(option: string): boolean {
  // Longueur minimale : au moins 3 caractères
  if (option.length < 3) {
    return false;
  }
  
  // Longueur maximale : 50 caractères
  if (option.length > 50) {
    return false;
  }
  
  // Ne doit pas être juste une lettre ou un chiffre
  if (/^[a-z0-9]$/i.test(option)) {
    return false;
  }
  
  // Ne doit pas être juste des ponctuations
  if (/^[.,;:!?\-_\s]+$/.test(option)) {
    return false;
  }
  
  // Doit contenir au moins une lettre
  if (!/[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(option)) {
    return false;
  }
  
  // Ne doit pas être un mot de liaison seul
  const stopWords = [
    'préfères', 'choisissez', 'souhaitez', 'voulez', 'désirez', 'préférez',
    'tu', 'vous', 'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'pour',
    'avec', 'sans', 'dans', 'sur', 'par', 'et', 'ou', 'mais', 'donc', 'car'
  ];
  if (stopWords.includes(option.toLowerCase())) {
    return false;
  }
  
  return true;
}

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
  const ouPattern = /(?:tu\s+)?(?:préfères?|choisissez?|souhaitez?|voulez?|désirez?|préférez?)\s+(?:la\s+|le\s+|les\s+|un\s+|une\s+)?([^?,\n]{3,30}?)\s+ou\s+(?:la\s+|le\s+|les\s+|un\s+|une\s+)?([^?,\n]{3,30}?)\??/i;
  const ouMatch = cleanContent.match(ouPattern);
  if (ouMatch) {
    const option1 = ouMatch[1].trim().replace(/[.,;:!?]$/, '');
    const option2 = ouMatch[2].trim().replace(/[.,;:!?]$/, '');
    if (isValidOption(option1) && isValidOption(option2)) {
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
      .filter(opt => isValidOption(opt));
    if (cleaned.length >= 2 && cleaned.length <= 4) {
      return cleaned;
    }
  }

  // Pattern 3: "X ou Y" simple dans une phrase interrogative (plus strict)
  // Ne matcher que si c'est dans une vraie question avec "?" à la fin
  const simpleOuPattern = /([a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ][^?,\n]{2,25}?)\s+ou\s+([a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ][^?,\n]{2,25}?)\s*\?/i;
  const simpleOuMatch = cleanContent.match(simpleOuPattern);
  if (simpleOuMatch) {
    const opt1 = simpleOuMatch[1].trim().replace(/[.,;:!?]$/, '');
    const opt2 = simpleOuMatch[2].trim().replace(/[.,;:!?]$/, '');
    // Vérifier que ce ne sont pas des phrases complètes (max 4 mots)
    if (isValidOption(opt1) && isValidOption(opt2) &&
        opt1.split(/\s+/).length <= 4 && 
        opt2.split(/\s+/).length <= 4) {
      return [opt1, opt2];
    }
  }

  // Pattern 4: Format structuré avec tirets, puces ou numéros
  const structuredPattern = /(?:^|\n)[\s]*[-•*]\s*([^\n]{3,50}?)(?:\n|$)/g;
  const structuredMatches = Array.from(cleanContent.matchAll(structuredPattern));
  if (structuredMatches.length >= 2 && structuredMatches.length <= 4) {
    const extracted = structuredMatches
      .map(m => m[1].trim().replace(/[.,;:!?]$/, ''))
      .filter(opt => isValidOption(opt));
    if (extracted.length >= 2) {
      return extracted;
    }
  }

  // Pattern 5: Liste numérotée 1. 2. 3.
  const numberedPattern = /(?:^|\n)[\s]*\d+[.)]\s*([^\n]{3,50}?)(?:\n|$)/g;
  const numberedMatches = Array.from(cleanContent.matchAll(numberedPattern));
  if (numberedMatches.length >= 2 && numberedMatches.length <= 4) {
    const extracted = numberedMatches
      .map(m => m[1].trim().replace(/[.,;:!?]$/, ''))
      .filter(opt => isValidOption(opt));
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

