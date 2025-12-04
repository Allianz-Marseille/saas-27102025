"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TagSelector } from "./tag-selector";
import { Tag as TagIcon, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";

interface Document {
  id: string;
  filename: string;
  tags?: string[];
}

interface EditTagsDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditTagsDialog({ document, open, onOpenChange, onSuccess }: EditTagsDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Initialiser les tags sélectionnés quand le document change
  useEffect(() => {
    if (document && open) {
      setSelectedTags(document.tags || []);
    }
  }, [document, open]);

  const handleSave = async () => {
    if (!document || !user) return;

    try {
      setSaving(true);
      const token = await user.getIdToken();

      const response = await fetch(`/api/chat/documents/${document.id}/tags`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tags: selectedTags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      toast.success("Tags mis à jour", {
        description: `Les tags du document "${document.filename}" ont été mis à jour`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erreur mise à jour tags:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Impossible de mettre à jour les tags",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const originalTags = document?.tags || [];
    if (originalTags.length !== selectedTags.length) return true;
    return !originalTags.every((tag) => selectedTags.includes(tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <TagIcon className="h-5 w-5" />
            </div>
            Modifier les tags
          </DialogTitle>
          <DialogDescription className="text-base">
            {document ? (
              <>
                Gérez les tags du document <span className="font-medium text-foreground">{document.filename}</span>
              </>
            ) : (
              "Chargement..."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            disabled={saving}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

