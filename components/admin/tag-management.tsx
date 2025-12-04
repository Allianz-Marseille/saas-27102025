"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Pencil, Trash2, Plus, FileText } from "lucide-react";
import { TagFormDialog } from "./tag-form-dialog";
import { DeleteTagDialog } from "./delete-tag-dialog";
import type { Tag } from "@/types/tag";
import { useAuth } from "@/lib/firebase/use-auth";

const COLORS_MAP: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export function TagManagement() {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États des dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  const fetchTags = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/tags", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des tags");
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  const handleSuccess = () => {
    fetchTags();
  };

  const getColorClass = (color: string) => {
    return COLORS_MAP[color] || COLORS_MAP.gray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
        <p className="font-medium">Erreur</p>
        <p className="text-sm mt-1">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTags}
          className="mt-3"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header avec bouton créer */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {tags.length} tag{tags.length !== 1 ? "s" : ""} disponible{tags.length !== 1 ? "s" : ""}
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer un tag
          </Button>
        </div>

        {/* Liste des tags */}
        {tags.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-muted p-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Aucun tag</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Créez votre premier tag pour organiser vos documents
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un tag
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Card
                key={tag.id}
                className="p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge className={getColorClass(tag.color)}>
                    <span className="text-lg mr-1">{tag.emoji}</span>
                    <span className="font-medium">{tag.name}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {tag.usageCount}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTag(tag)}
                    className="h-8 w-8"
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingTag(tag)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TagFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />

      <TagFormDialog
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
        tag={editingTag || undefined}
        onSuccess={handleSuccess}
      />

      <DeleteTagDialog
        open={!!deletingTag}
        onOpenChange={(open) => !open && setDeletingTag(null)}
        tag={deletingTag}
        onSuccess={handleSuccess}
      />
    </>
  );
}

