"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CaseTypeMenuProps {
  onSelect: (type: "general" | "client") => void;
  disabled?: boolean;
}

const caseTypes = [
  {
    id: "general" as const,
    label: "Général",
    icon: "🧠",
    description: "Question générale sur le sujet",
    color: "bg-blue-50 dark:bg-blue-950/20 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950/30",
  },
  {
    id: "client" as const,
    label: "Client-Dossier",
    icon: "👤",
    description: "Question concernant un client ou dossier spécifique",
    color: "bg-green-50 dark:bg-green-950/20 border-green-500 hover:bg-green-100 dark:hover:bg-green-950/30",
  },
];

export function CaseTypeMenu({ onSelect, disabled = false }: CaseTypeMenuProps) {
  return (
    <div className="flex flex-col gap-2">
      {caseTypes.map((type, index) => (
        <motion.div
          key={type.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.1 }}
        >
          <Button
            variant="ghost"
            onClick={() => !disabled && onSelect(type.id)}
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-3 h-auto py-3 px-4",
              "rounded-2xl",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200",
              type.color,
              "border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-2xl flex-shrink-0">{type.icon}</span>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {type.label}
              </div>
              {type.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {type.description}
                </div>
              )}
            </div>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

