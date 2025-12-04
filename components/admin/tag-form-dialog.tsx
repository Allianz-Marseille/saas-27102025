"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { Tag } from "@/types/tag";
import { useAuth } from "@/lib/hooks/use-auth";

// Charger EmojiPicker dynamiquement (côté client uniquement)
const EmojiPicker = dynamic(
  () => import("emoji-picker-react"),
  { ssr: false }
);

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag; // Si présent = mode édition
  onSuccess: () => void;
}

const COLORS = [
  { name: "Bleu", value: "blue", class: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { name: "Violet", value: "violet", class: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  { name: "Vert", value: "green", class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { name: "Ambre", value: "amber", class: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { name: "Rouge", value: "red", class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { name: "Rose", value: "pink", class: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  { name: "Indigo", value: "indigo", class: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  { name: "Gris", value: "gray", class: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
];

export function TagFormDialog({ open, onOpenChange, tag, onSuccess }: TagFormDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Formulaire
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [color, setColor] = useState("gray");

  // Initialiser le formulaire en mode édition
  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setEmoji(tag.emoji);
      setColor(tag.color);
    } else {
      setName("");
      setEmoji("🏷️");
      setColor("gray");
    }
    setError(null);
  }, [tag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user) {
        throw new Error("Non authentifié");
      }

      const token = await user.getIdToken();
      const url = tag
        ? `/api/admin/tags/${tag.id}`
        : "/api/admin/tags";

      const method = tag ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          emoji: emoji.trim(),
          color: color.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (colorValue: string) => {
    return COLORS.find((c) => c.value === colorValue)?.class || COLORS[7].class;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {tag ? "✏️ Modifier le tag" : "✨ Créer un tag"}
            </DialogTitle>
            <DialogDescription>
              {tag
                ? "Modifiez le tag. Les changements seront appliqués à tous les documents."
                : "Créez un nouveau tag avec un emoji et une couleur personnalisée."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Emoji */}
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="text-4xl h-20 w-20 p-0"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  {emoji}
                </Button>
                <Input
                  id="emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🏷️"
                  className="text-2xl"
                  maxLength={10}
                />
              </div>
              {showEmojiPicker && (
                <div className="mt-2 border rounded-lg p-2 bg-white dark:bg-gray-900">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setEmoji(emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    width="100%"
                    height={400}
                  />
                </div>
              )}
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom du tag</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Auto, Santé, Design..."
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50 caractères
              </p>
            </div>

            {/* Couleur */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setColor(colorOption.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      color === colorOption.value
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Badge className={colorOption.class}>
                      {colorOption.name}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Aperçu</Label>
              <div className="flex items-center gap-2">
                <Badge className={getColorClass(color)}>
                  {emoji} {name || "Votre tag"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Voilà comment votre tag apparaîtra sur les documents
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tag ? "Modification..." : "Création..."}
                </>
              ) : tag ? (
                "Enregistrer"
              ) : (
                "Créer le tag"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

