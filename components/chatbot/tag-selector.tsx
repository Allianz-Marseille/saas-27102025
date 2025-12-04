"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PREDEFINED_TAGS, validateTag, normalizeTag, getTagConfig } from "@/lib/config/rag-tags";
import { toast } from "sonner";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function TagSelector({ selectedTags, onTagsChange, disabled = false, className }: TagSelectorProps) {
  const [customTagInput, setCustomTagInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleToggleTag = (tagId: string) => {
    if (disabled) return;

    if (selectedTags.includes(tagId)) {
      // Retirer le tag
      onTagsChange(selectedTags.filter((t) => t !== tagId));
    } else {
      // Ajouter le tag
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    if (disabled) return;
    onTagsChange(selectedTags.filter((t) => t !== tagId));
  };

  const handleAddCustomTag = () => {
    const normalizedTag = normalizeTag(customTagInput);
    
    if (!normalizedTag) return;

    const validation = validateTag(normalizedTag);
    if (!validation.valid) {
      toast.error("Tag invalide", {
        description: validation.error,
      });
      return;
    }

    if (selectedTags.includes(normalizedTag)) {
      toast.error("Ce tag est déjà sélectionné");
      return;
    }

    onTagsChange([...selectedTags, normalizedTag]);
    setCustomTagInput("");
    setShowCustomInput(false);
    
    toast.success("Tag ajouté", {
      description: `Le tag "${normalizedTag}" a été ajouté`,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tags prédéfinis */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Tags prédéfinis
        </p>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                disabled={disabled}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  "hover:scale-105 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  isSelected
                    ? tag.color + " shadow-sm ring-2 ring-offset-2 ring-current ring-opacity-20"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                )}
              >
                <span>{tag.icon}</span>
                <span>{tag.label}</span>
                {isSelected && <span className="text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags sélectionnés (si non vides) */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Tags sélectionnés ({selectedTags.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tagId) => {
              const config = getTagConfig(tagId);
              return (
                <Badge
                  key={tagId}
                  className={cn(
                    "gap-1.5 pl-2.5 pr-2 py-1.5 border animate-in fade-in zoom-in",
                    config.color
                  )}
                >
                  {config.icon && <span>{config.icon}</span>}
                  <span>{config.label}</span>
                  <button
                    onClick={() => handleRemoveTag(tagId)}
                    disabled={disabled}
                    className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Créer un tag custom */}
      <div className="space-y-2">
        {!showCustomInput ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(true)}
            disabled={disabled}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer un tag personnalisé
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nom du tag (ex: vie-courante)"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTag();
                } else if (e.key === "Escape") {
                  setShowCustomInput(false);
                  setCustomTagInput("");
                }
              }}
              disabled={disabled}
              className="flex-1"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomTag}
              disabled={disabled || !customTagInput.trim()}
            >
              Ajouter
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCustomInput(false);
                setCustomTagInput("");
              }}
              disabled={disabled}
            >
              Annuler
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Les tags personnalisés peuvent contenir des lettres, chiffres, tirets et underscores
        </p>
      </div>
    </div>
  );
}

