"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MAIN_TAGS } from "@/lib/assistant/tags-definitions";
import { X } from "lucide-react";

interface TagSelectorProps {
  selectedMainTag?: string;
  onMainTagSelect: (tagId: string) => void;
  compact?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  metier: "Domaines métier",
  reglementaire: "Réglementaire & Conformité",
  gestion: "Gestion quotidienne",
  process: "Process internes",
  intention: "Intentions",
};

const CATEGORY_COLORS: Record<string, string> = {
  metier: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300",
  reglementaire: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300",
  gestion: "border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-950/20 dark:text-slate-300",
  process: "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-300",
  intention: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300",
};

export function TagSelector({
  selectedMainTag,
  onMainTagSelect,
  compact = false,
}: TagSelectorProps) {

  const renderTag = (tag: typeof MAIN_TAGS[0]) => {
    const isSelected = selectedMainTag === tag.id;

    return (
      <motion.button
        key={tag.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onMainTagSelect(tag.id)}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          "border-2 shadow-sm hover:shadow-md",
          isSelected
            ? "bg-primary text-primary-foreground border-primary shadow-md"
            : "bg-background border-primary/30 text-foreground hover:border-primary hover:bg-primary/10",
          compact && "text-xs px-2 py-1"
        )}
        title={tag.description}
      >
        {tag.label}
      </motion.button>
    );
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-2")}>
      {/* Tag principal sélectionné */}
      {selectedMainTag && (
        <div className="flex items-center gap-2 pb-2 border-b">
          <span className="text-sm font-medium text-muted-foreground">
            Domaine métier :
          </span>
          <Badge variant="default" className="px-3 py-1 text-sm font-medium">
            {MAIN_TAGS.find((t) => t.id === selectedMainTag)?.label}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMainTagSelect("")}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Tags principaux (Domaines métier) */}
      {!compact && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Sélectionnez un domaine métier :
          </p>
          <div className="flex flex-wrap gap-2">
            {MAIN_TAGS.map((tag) => renderTag(tag))}
          </div>
        </div>
      )}
    </div>
  );
}

