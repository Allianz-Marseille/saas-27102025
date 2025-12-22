"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface RCTStepProps {
  title: string;
  explanation: string;
  stepNumber: number;
  totalSteps: number;
  options: Array<{ id: string; label: string; description?: string }>;
  selectedValue?: string;
  onSelect: (value: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function RCTStep({
  title,
  explanation,
  stepNumber,
  totalSteps,
  options,
  selectedValue,
  onSelect,
  onBack,
  showBackButton = false,
}: RCTStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* En-tête avec progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">
            Étape {stepNumber}/{totalSteps}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div
            className="bg-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(stepNumber / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Explication pédagogique */}
      <div className="flex gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 dark:text-blue-100">{explanation}</p>
      </div>

      {/* Options cliquables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: options.indexOf(option) * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={selectedValue === option.id ? "default" : "outline"}
              className={cn(
                "w-full h-auto py-4 px-4 text-left justify-start",
                "transition-all duration-200",
                selectedValue === option.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted hover:border-primary/50"
              )}
              onClick={() => onSelect(option.id)}
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <span
                    className={cn(
                      "text-xs",
                      selectedValue === option.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {option.description}
                  </span>
                )}
              </div>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Bouton retour */}
      {showBackButton && onBack && (
        <div className="flex justify-start pt-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Retour
          </Button>
        </div>
      )}
    </motion.div>
  );
}

