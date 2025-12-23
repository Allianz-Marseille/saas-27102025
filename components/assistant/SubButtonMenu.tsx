"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  getSubButtonsByMainButtonId,
  getMainButtonById,
  type SubButton,
} from "@/lib/assistant/main-buttons";

interface SubButtonMenuProps {
  mainButtonId: string;
  onSelect: (subButtonId: string) => void;
  onBack: () => void;
  disabled?: boolean;
}

export function SubButtonMenu({
  mainButtonId,
  onSelect,
  onBack,
  disabled = false,
}: SubButtonMenuProps) {
  const mainButton = getMainButtonById(mainButtonId);
  const subButtons = getSubButtonsByMainButtonId(mainButtonId);

  if (!mainButton) {
    return null;
  }

  if (subButtons.length === 0) {
    // Si pas de sous-boutons, on peut revenir en arrière
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full"
          disabled={disabled}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bouton retour */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="w-full justify-start"
        disabled={disabled}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au menu principal
      </Button>

      {/* Titre avec icône du bouton principal */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{mainButton.icon}</span>
          <h3 className="text-lg font-semibold">{mainButton.label}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Sélectionnez une option
        </p>
      </div>

      {/* Liste des sous-boutons */}
      <div className="grid grid-cols-1 gap-2">
        {subButtons.map((subButton, index) => (
          <motion.div
            key={subButton.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            whileTap={{ scale: disabled ? 1 : 0.99 }}
          >
            <Button
              variant="outline"
              onClick={() => !disabled && onSelect(subButton.id)}
              disabled={disabled}
              className={cn(
                "w-full h-auto py-3 px-4 justify-start",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md",
                "border-2",
                mainButton.borderColor,
                mainButton.color,
                "hover:bg-opacity-80",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-start gap-1 flex-1">
                <span className="text-sm font-medium text-left">
                  {subButton.label}
                </span>
                {subButton.description && (
                  <span className="text-xs text-muted-foreground text-left">
                    {subButton.description}
                  </span>
                )}
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

