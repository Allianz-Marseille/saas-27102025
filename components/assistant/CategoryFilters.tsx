"use client";

import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptTemplate } from "@/lib/assistant/templates";

interface CategoryFiltersProps {
  templates: PromptTemplate[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categoryLabels: Record<string, string> = {
  all: "Tous",
  commercial: "Commercial",
  gestion: "Gestion",
  sinistre: "Sinistre",
  iard: "IARD",
  santé: "Santé",
  prévoyance: "Prévoyance",
  retraite: "Retraite",
  support: "Support",
  formation: "Formation",
  interne: "Interne",
  procédure: "Procédure",
  vente: "Vente",
  email: "Email",
  analyse: "Analyse",
  devis: "Devis",
  resume: "Résumé",
  comparaison: "Comparaison",
};

export function CategoryFilters({
  templates,
  selectedCategory,
  onCategoryChange,
}: CategoryFiltersProps) {
  // Extraire toutes les catégories uniques
  const categories = Array.from(
    new Set(templates.map((t) => t.category).filter((cat): cat is string => Boolean(cat)))
  ).sort();

  // Compter les templates par catégorie
  const getCategoryCount = (category: string) => {
    if (category === "all") return templates.length;
    return templates.filter((t) => t.category === category).length;
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button
        variant={selectedCategory === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange("all")}
        className={cn(
          selectedCategory === "all"
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg"
            : "hover:bg-purple-50 dark:hover:bg-purple-950/30"
        )}
      >
        <Filter className="h-3 w-3 mr-1.5" />
        Tous ({getCategoryCount("all")})
      </Button>
      
      {categories.map((category) => {
        const count = getCategoryCount(category);
        if (count === 0) return null;
        
        return (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category)}
            className={cn(
              selectedCategory === category
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg"
                : "hover:bg-purple-50 dark:hover:bg-purple-950/30"
            )}
          >
            {categoryLabels[category] || category} ({count})
          </Button>
        );
      })}

      {selectedCategory !== "all" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCategoryChange("all")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}

