"use client";

import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTagConfig } from "@/lib/config/rag-tags";

interface TagCount {
  tagId: string;
  count: number;
}

interface TagFilterProps {
  availableTags: TagCount[];
  selectedTags: string[];
  onFilterChange: (tags: string[]) => void;
  className?: string;
}

export function TagFilter({ availableTags, selectedTags, onFilterChange, className }: TagFilterProps) {
  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      // Retirer le tag du filtre
      onFilterChange(selectedTags.filter((t) => t !== tagId));
    } else {
      // Ajouter le tag au filtre
      onFilterChange([...selectedTags, tagId]);
    }
  };

  const handleClearFilters = () => {
    onFilterChange([]);
  };

  if (availableTags.length === 0) {
    return null;
  }

  const hasActiveFilters = selectedTags.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtrer par tags
        </p>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Badge "Tous" */}
        <button
          onClick={handleClearFilters}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
            "hover:scale-105 active:scale-95",
            !hasActiveFilters
              ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400 dark:border-purple-800 shadow-sm ring-2 ring-offset-2 ring-purple-500/20"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
          )}
        >
          <span>Tous</span>
          <span className="text-xs opacity-70">({availableTags.reduce((sum, t) => sum + t.count, 0)})</span>
        </button>

        {/* Tags avec compteurs */}
        {availableTags
          .sort((a, b) => b.count - a.count) // Trier par nombre décroissant
          .map(({ tagId, count }) => {
            const isSelected = selectedTags.includes(tagId);
            const config = getTagConfig(tagId);

            return (
              <button
                key={tagId}
                onClick={() => handleToggleTag(tagId)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  "hover:scale-105 active:scale-95",
                  isSelected
                    ? config.color + " shadow-sm ring-2 ring-offset-2 ring-current ring-opacity-20"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                )}
              >
                {config.icon && <span>{config.icon}</span>}
                <span>{config.label}</span>
                <span className="text-xs opacity-70">({count})</span>
                {isSelected && <span className="text-xs">✓</span>}
              </button>
            );
          })}
      </div>

      {/* Message si filtres actifs */}
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground animate-in fade-in">
          Affichage des documents avec{" "}
          <span className="font-medium text-foreground">
            {selectedTags.length === 1 ? "1 tag" : `${selectedTags.length} tags`}
          </span>{" "}
          sélectionné{selectedTags.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

