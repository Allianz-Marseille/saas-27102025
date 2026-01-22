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
    <div className="space-y-2">
      {/* Bouton retour */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="w-full justify-start h-auto py-2 px-3 text-xs"
        disabled={disabled}
      >
        <ArrowLeft className="h-3 w-3 mr-2" />
        Retour
      </Button>

      {/* Liste des sous-boutons */}
      <div className="flex flex-col gap-2">
        {subButtons.map((subButton, index) => (
          <motion.div
            key={subButton.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
          >
            <Button
              variant="ghost"
              onClick={() => !disabled && onSelect(subButton.id)}
              disabled={disabled}
              className={cn(
                "w-full justify-start gap-3 h-auto py-2.5 px-3",
                "bg-white dark:bg-gray-800",
                "border border-gray-200 dark:border-gray-700",
                "rounded-xl",
                "shadow-sm hover:shadow-md",
                "transition-all duration-200",
                "hover:bg-gray-50 dark:hover:bg-gray-700",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex-1 text-left">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {subButton.label}
                </div>
                {subButton.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {subButton.description}
                  </div>
                )}
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

