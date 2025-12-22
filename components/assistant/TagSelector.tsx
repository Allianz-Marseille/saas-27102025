"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  MAIN_TAGS,
  REGLEMENTAIRE_TAGS,
  GESTION_TAGS,
  PROCESS_TAGS,
  INTENTION_TAGS,
  CONTEXT_TAGS,
  type Tag,
} from "@/lib/assistant/tags-definitions";
import { ChevronDown, ChevronUp, X } from "lucide-react";

interface TagSelectorProps {
  selectedMainTag?: string;
  selectedOptionalTags: string[];
  onMainTagSelect: (tagId: string) => void;
  onOptionalTagToggle: (tagId: string) => void;
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
  selectedOptionalTags,
  onMainTagSelect,
  onOptionalTagToggle,
  compact = false,
}: TagSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["metier"])
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const renderTag = (tag: Tag, isMain: boolean = false) => {
    const isSelected = isMain
      ? selectedMainTag === tag.id
      : selectedOptionalTags.includes(tag.id);

    return (
      <motion.button
        key={tag.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isMain) {
            onMainTagSelect(tag.id);
          } else {
            onOptionalTagToggle(tag.id);
          }
        }}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          "border-2 shadow-sm hover:shadow-md",
          isMain
            ? isSelected
              ? "bg-primary text-primary-foreground border-primary shadow-md"
              : "bg-background border-primary/30 text-foreground hover:border-primary hover:bg-primary/10"
            : isSelected
            ? "bg-primary/20 text-primary border-primary/50"
            : "bg-muted border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/5",
          compact && "text-xs px-2 py-1"
        )}
        title={tag.description}
      >
        {tag.label}
      </motion.button>
    );
  };

  const renderCategory = (
    title: string,
    tags: Tag[],
    categoryKey: string,
    defaultExpanded: boolean = false
  ) => {
    const isExpanded = expandedCategories.has(categoryKey);
    const hasSelected = tags.some(
      (tag) =>
        (selectedMainTag === tag.id) ||
        selectedOptionalTags.includes(tag.id)
    );

    if (compact && !hasSelected && !isExpanded) {
      return null;
    }

    return (
      <div key={categoryKey} className="space-y-2">
        <button
          onClick={() => toggleCategory(categoryKey)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
          <span>{title}</span>
          {hasSelected && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {tags.filter(
                (tag) =>
                  selectedMainTag === tag.id ||
                  selectedOptionalTags.includes(tag.id)
              ).length}
            </Badge>
          )}
        </button>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {tags.map((tag) => renderTag(tag, categoryKey === "metier"))}
          </motion.div>
        )}
      </div>
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
            {MAIN_TAGS.map((tag) => renderTag(tag, true))}
          </div>
        </div>
      )}

      {/* Tags optionnels par catégories */}
      {selectedMainTag && (
        <div className="space-y-3 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">
            Tags optionnels (pour affiner le contexte) :
          </p>
          {renderCategory(
            "Réglementaire & Conformité",
            REGLEMENTAIRE_TAGS,
            "reglementaire"
          )}
          {renderCategory("Gestion quotidienne", GESTION_TAGS, "gestion")}
          {renderCategory("Process internes", PROCESS_TAGS, "process")}
          {renderCategory("Intentions", INTENTION_TAGS, "intention")}
          {renderCategory("Contexte", CONTEXT_TAGS, "context")}
        </div>
      )}

      {/* Mode compact : affichage des tags sélectionnés */}
      {compact && selectedOptionalTags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {selectedOptionalTags.map((tagId) => {
            const tag = [...REGLEMENTAIRE_TAGS, ...GESTION_TAGS, ...PROCESS_TAGS, ...INTENTION_TAGS, ...CONTEXT_TAGS].find(
              (t) => t.id === tagId
            );
            if (!tag) return null;
            return (
              <Badge
                key={tagId}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag.label}
                <button
                  onClick={() => onOptionalTagToggle(tagId)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

