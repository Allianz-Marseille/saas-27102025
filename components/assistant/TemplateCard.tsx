"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { PromptTemplate } from "@/lib/assistant/templates";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: PromptTemplate;
  onClick: (template: PromptTemplate) => void;
  compact?: boolean;
}

const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  email: { border: "border-blue-300", bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-300" },
  analyse: { border: "border-purple-300", bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-700 dark:text-purple-300" },
  devis: { border: "border-green-300", bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-700 dark:text-green-300" },
  resume: { border: "border-orange-300", bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-300" },
  comparaison: { border: "border-cyan-300", bg: "bg-cyan-50 dark:bg-cyan-950/20", text: "text-cyan-700 dark:text-cyan-300" },
  commercial: { border: "border-pink-300", bg: "bg-pink-50 dark:bg-pink-950/20", text: "text-pink-700 dark:text-pink-300" },
  gestion: { border: "border-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/20", text: "text-indigo-700 dark:text-indigo-300" },
  sinistre: { border: "border-red-300", bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-300" },
  default: { border: "border-gray-300", bg: "bg-gray-50 dark:bg-gray-950/20", text: "text-gray-700 dark:text-gray-300" },
};

export function TemplateCard({ template, onClick, compact = false }: TemplateCardProps) {
  const category = template.category || "default";
  const colors = categoryColors[category] || categoryColors.default;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(template)}
      className={cn(
        "group relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 overflow-hidden",
        colors.border,
        "bg-gradient-to-br from-background to-muted/30",
        "hover:shadow-lg hover:shadow-purple-500/10",
        compact && "p-3"
      )}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className={cn(
              "font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors",
              compact ? "text-sm" : "text-base"
            )}>
              {template.name}
            </h4>
            {template.category && (
              <span className={cn(
                "px-2 py-0.5 text-xs rounded-full font-medium shrink-0",
                colors.bg,
                colors.text
              )}>
                {template.category}
              </span>
            )}
          </div>
          <p className={cn(
            "text-muted-foreground line-clamp-2",
            compact ? "text-xs" : "text-sm"
          )}>
            {template.description}
          </p>
          {template.variables && template.variables.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.variables.map((varName) => (
                <span
                  key={varName}
                  className="px-1.5 py-0.5 text-xs rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  {varName}
                </span>
              ))}
            </div>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

