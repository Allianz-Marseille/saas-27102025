"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onClose: () => void;
  currentIndex: number;
  totalResults: number;
  isOpen: boolean;
}

export function SearchBar({
  onSearch,
  onNavigate,
  onClose,
  currentIndex,
  totalResults,
  isOpen,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Gérer Escape pour fermer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b animate-in slide-in-from-top duration-200">
      <Input
        type="text"
        placeholder="Rechercher dans la conversation..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 h-8 text-sm"
        autoFocus
      />
      
      {totalResults > 0 && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {currentIndex + 1} / {totalResults}
        </span>
      )}

      {query && totalResults === 0 && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Aucun résultat
        </span>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate("prev")}
          disabled={totalResults === 0}
          title="Résultat précédent"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate("next")}
          disabled={totalResults === 0}
          title="Résultat suivant"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          title="Fermer (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

