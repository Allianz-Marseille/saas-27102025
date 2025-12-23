"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MAIN_BUTTONS, type MainButton } from "@/lib/assistant/main-buttons";

interface MainButtonMenuProps {
  onSelect: (buttonId: string) => void;
  disabled?: boolean;
}

export function MainButtonMenu({ onSelect, disabled = false }: MainButtonMenuProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Comment puis-je vous aider ?
        </p>
        <p className="text-xs text-muted-foreground">
          Sélectionnez un domaine métier
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MAIN_BUTTONS.map((button, index) => (
          <motion.div
            key={button.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
          >
            <Button
              variant="outline"
              onClick={() => !disabled && onSelect(button.id)}
              disabled={disabled}
              className={cn(
                "w-full h-auto py-4 px-4 flex flex-col items-center gap-2",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md",
                "border-2",
                button.borderColor,
                button.color,
                "hover:bg-opacity-80",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-2xl">{button.icon}</span>
              <span className="text-sm font-semibold text-center leading-tight">
                {button.label}
              </span>
              {button.description && (
                <span className="text-xs text-muted-foreground text-center line-clamp-2">
                  {button.description}
                </span>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

