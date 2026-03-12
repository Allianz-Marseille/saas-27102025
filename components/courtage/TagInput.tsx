"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const REFERENCE_TAGS = [
  // Auto
  "jeune conducteur", "malussé", "flotte auto", "camping-car", "deux-roues", "utilitaire", "résiliation",
  // Habitation
  "locataire", "propriétaire", "copropriété", "immeuble",
  // Pro
  "RC pro", "décennale", "cyber", "multi-risque pro", "garantie financière", "caution",
  // Santé / Prévoyance
  "santé individuelle", "santé collective", "prévoyance", "invalidité", "TNS",
  // Voyage / Assistance
  "assistance voyage", "rapatriement", "annulation",
  // Sinistre
  "expertise sinistre", "recours", "assistance juridique",
  // Outils
  "DSN", "résiliation assurée", "signature électronique", "extranet courtier",
  // Spécial
  "animaux", "sport", "événementiel",
];

export function getTagStyle(tag: string): string {
  const lc = tag.toLowerCase();
  if (["jeune conducteur", "malussé", "flotte auto", "camping-car", "deux-roues", "utilitaire", "résiliation"].includes(lc))
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50";
  if (["rc pro", "décennale", "cyber", "multi-risque pro", "garantie financière", "caution"].includes(lc))
    return "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50";
  if (["santé individuelle", "santé collective", "prévoyance", "invalidité", "tns"].includes(lc))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50";
  if (["assistance voyage", "rapatriement", "annulation"].includes(lc))
    return "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50";
  if (["locataire", "propriétaire", "copropriété", "immeuble"].includes(lc))
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50";
  if (["dsn", "résiliation assurée", "signature électronique", "extranet courtier"].includes(lc))
    return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50";
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({ value, onChange, placeholder = "Ajouter un tag...", disabled }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = REFERENCE_TAGS.filter(
    (t) => !value.includes(t) && t.toLowerCase().includes(input.toLowerCase())
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
    setShowDropdown(false);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
    if (e.key === "Escape") setShowDropdown(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "min-h-[44px] flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background cursor-text transition-colors",
          !disabled && "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              getTagStyle(tag)
            )}
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        )}
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && !disabled && (input.trim() || suggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {suggestions.length === 0 && input.trim() ? (
            <div
              className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center gap-2"
              onMouseDown={(e) => { e.preventDefault(); addTag(input); }}
            >
              <span className="text-muted-foreground text-xs">Créer :</span>
              <span className="font-medium">"{input.trim()}"</span>
            </div>
          ) : (
            suggestions.slice(0, 10).map((s) => (
              <div
                key={s}
                className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              >
                <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", getTagStyle(s))}>
                  {s}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
