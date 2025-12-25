"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface ClientIdentifyMenuProps {
  onSelect: (method: "manual" | "lagon_ocr") => void;
  onBack: () => void;
  disabled?: boolean;
}

const identifyMethods = [
  {
    id: "manual" as const,
    label: "Saisie rapide",
    icon: "✍️",
    description: "Saisir les informations du client manuellement",
    color: "bg-purple-50 dark:bg-purple-950/20 border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-950/30",
  },
  {
    id: "lagon_ocr" as const,
    label: "Capture Lagon (OCR)",
    icon: "📸",
    description: "Capturer la fiche client depuis Lagon avec reconnaissance automatique",
    color: "bg-orange-50 dark:bg-orange-950/20 border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-950/30",
  },
];

export function ClientIdentifyMenu({ onSelect, onBack, disabled = false }: ClientIdentifyMenuProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={disabled}
        className={cn(
          "w-full justify-start gap-2 h-auto py-2 px-3 mb-1",
          "text-sm text-gray-600 dark:text-gray-400",
          "hover:bg-gray-50 dark:hover:bg-gray-800",
          "rounded-lg",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>
      {identifyMethods.map((method, index) => (
        <motion.div
          key={method.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.1 }}
        >
          <Button
            variant="ghost"
            onClick={() => !disabled && onSelect(method.id)}
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-3 h-auto py-3 px-4",
              "rounded-2xl",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200",
              method.color,
              "border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-2xl flex-shrink-0">{method.icon}</span>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {method.label}
              </div>
              {method.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {method.description}
                </div>
              )}
            </div>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

