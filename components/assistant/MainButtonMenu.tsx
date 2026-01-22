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
    <div className="flex flex-col gap-2">
      {MAIN_BUTTONS.map((button, index) => (
        <motion.div
          key={button.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <Button
            variant="ghost"
            onClick={() => !disabled && onSelect(button.id)}
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-3 h-auto py-3 px-4",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              "rounded-2xl",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200",
              "hover:bg-gray-50 dark:hover:bg-gray-700",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-2xl flex-shrink-0">{button.icon}</span>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {button.label}
              </div>
              {button.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {button.description}
                </div>
              )}
            </div>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
