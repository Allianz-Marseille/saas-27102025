"use client";

import { useState, useMemo } from "react";
import { Search, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TemplateCard } from "./TemplateCard";
import { CategoryFilters } from "./CategoryFilters";
import type { PromptTemplate } from "@/lib/assistant/templates";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  templates: PromptTemplate[];
  onSelectTemplate: (template: PromptTemplate) => void;
  compact?: boolean;
  showEmptyState?: boolean;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  hideSearchAndFilters?: boolean;
}

export function TemplateSelector({
  templates,
  onSelectTemplate,
  compact = false,
  showEmptyState = false,
  selectedCategory: externalSelectedCategory,
  onCategoryChange: externalOnCategoryChange,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  hideSearchAndFilters = false,
}: TemplateSelectorProps) {
  const [internalSelectedCategory, setInternalSelectedCategory] = useState<string>("all");
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  
  const selectedCategory = externalSelectedCategory ?? internalSelectedCategory;
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  
  const setSelectedCategory = externalOnCategoryChange ?? setInternalSelectedCategory;
  const setSearchQuery = externalOnSearchChange ?? setInternalSearchQuery;

  // Filtrer les templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory =
        selectedCategory === "all" || template.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  if (showEmptyState && filteredTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg mb-2">Aucun template trouvé</p>
        <p className="text-sm text-muted-foreground">
          Essayez de modifier vos filtres ou votre recherche
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full", compact ? "max-h-[400px]" : "h-full min-h-[300px]")}>
      {/* Header avec recherche - masqué si hideSearchAndFilters est true */}
      {!hideSearchAndFilters && (
        <div className={cn("space-y-4 mb-4 pb-4 border-b shrink-0", compact && "mb-3 pb-3")}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 focus:ring-2 focus:ring-purple-500",
                compact && "h-8 text-sm"
              )}
            />
          </div>

          {/* Filtres par catégorie */}
          <div className="overflow-x-auto -mx-1 px-1">
            <CategoryFilters
              templates={templates}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        </div>
      )}

      {/* Liste des templates */}
      <div
        className={cn(
          "flex-1 overflow-y-auto pr-2 min-h-[200px]",
          compact ? "space-y-2" : "space-y-3"
        )}
      >
        {filteredTemplates.length > 0 ? (
          <div
            className={cn(
              "grid gap-3",
              compact
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={onSelectTemplate}
                compact={compact}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-lg mb-2">Aucun template trouvé</p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        )}
      </div>

      {/* Compteur */}
      {filteredTemplates.length > 0 && (
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {filteredTemplates.length} template{filteredTemplates.length > 1 ? "s" : ""} disponible{filteredTemplates.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

