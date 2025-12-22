"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FlowReplyButtonsProps {
  options: Array<{ id: string; label: string }>;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  color?: "green" | "blue";
  showOther?: boolean;
  onOtherSelect?: () => void;
}

export function FlowReplyButtons({
  options,
  onSelect,
  disabled = false,
  color = "green",
  showOther = true,
  onOtherSelect,
}: FlowReplyButtonsProps) {
  if (options.length === 0) {
    return null;
  }

  const colorClasses = {
    green: "bg-green-500 hover:bg-green-600 text-white border-green-600",
    blue: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600",
  };

  return (
    <div className="mt-4 pt-3 border-t border-border/50">
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(option.id)}
            disabled={disabled}
            className={cn(
              "rounded-full px-5 py-2.5 h-auto min-w-[80px]",
              "border-2 shadow-sm hover:shadow-md",
              "transition-all duration-200",
              "font-medium text-sm",
              colorClasses[color],
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.label}
          </motion.button>
        ))}
        {showOther && onOtherSelect && (
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: options.length * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOtherSelect}
            disabled={disabled}
            className={cn(
              "rounded-full px-5 py-2.5 h-auto",
              "border-2 border-dashed shadow-sm hover:shadow-md",
              "transition-all duration-200",
              "font-medium text-sm",
              "bg-muted hover:bg-muted/80 text-foreground border-border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            Autre... à préciser
          </motion.button>
        )}
      </div>
    </div>
  );
}

