"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import {
  getSavedFilters,
  createSavedFilter,
  deleteSavedFilter,
} from "@/lib/firebase/saved-filters";
import { SavedFilter, MessageStatus, MessagePriority, MessageCategory } from "@/types/message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bookmark, BookmarkPlus, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedFiltersManagerProps {
  currentFilters: {
    status?: MessageStatus;
    priority?: MessagePriority;
    category?: MessageCategory;
    search?: string;
  };
  currentSort: {
    sortBy: "date" | "readRate" | "recipients" | "priority";
    sortOrder: "asc" | "desc";
  };
  onApplyFilter: (filter: SavedFilter) => void;
}

/**
 * Gestionnaire de filtres sauvegardés
 */
export function SavedFiltersManager({
  currentFilters,
  currentSort,
  onApplyFilter,
}: SavedFiltersManagerProps) {
  const { user } = useAuth();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);
  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterDescription, setNewFilterDescription] = useState("");

  useEffect(() => {
    if (user) {
      loadSavedFilters();
    }
  }, [user]);

  const loadSavedFilters = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const filters = await getSavedFilters(user.uid);
      setSavedFilters(filters);
    } catch (error) {
      console.error("Erreur lors du chargement des filtres:", error);
      toast.error("Erreur lors du chargement des filtres sauvegardés");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentFilter = async () => {
    if (!user || !newFilterName.trim()) {
      toast.error("Veuillez saisir un nom pour le filtre");
      return;
    }

    try {
      const filter: Omit<SavedFilter, "id" | "userId" | "createdAt"> = {
        name: newFilterName.trim(),
        description: newFilterDescription.trim() || undefined,
        status: currentFilters.status ? [currentFilters.status] : undefined,
        priority: currentFilters.priority ? [currentFilters.priority] : undefined,
        category: currentFilters.category ? [currentFilters.category] : undefined,
        tags: undefined,
        sortBy: currentSort.sortBy === "date" ? "createdAt" : currentSort.sortBy === "readRate" ? "readCount" : currentSort.sortBy === "priority" ? "priority" : "createdAt",
        sortOrder: currentSort.sortOrder,
      };

      await createSavedFilter(user.uid, filter);
      toast.success("Filtre sauvegardé avec succès");
      setNewFilterName("");
      setNewFilterDescription("");
      setIsDialogOpen(false);
      await loadSavedFilters();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du filtre:", error);
      toast.error("Erreur lors de la sauvegarde du filtre");
    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    try {
      await deleteSavedFilter(filterId);
      toast.success("Filtre supprimé");
      await loadSavedFilters();
    } catch (error) {
      console.error("Erreur lors de la suppression du filtre:", error);
      toast.error("Erreur lors de la suppression du filtre");
    } finally {
      setIsDeleteDialogOpen(false);
      setFilterToDelete(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-2">
      {/* Bouton pour sauvegarder le filtre actuel */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Sauvegarder ce filtre
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder un filtre</DialogTitle>
            <DialogDescription>
              Enregistrez la combinaison actuelle de filtres et de tri pour y accéder rapidement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">Nom du filtre *</Label>
              <Input
                id="filter-name"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="Ex: Messages urgents non lus"
              />
            </div>
            <div>
              <Label htmlFor="filter-description">Description (optionnel)</Label>
              <Textarea
                id="filter-description"
                value={newFilterDescription}
                onChange={(e) => setNewFilterDescription(e.target.value)}
                placeholder="Description du filtre..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveCurrentFilter}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liste des filtres sauvegardés */}
      {savedFilters.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Filtres sauvegardés</p>
          <div className="space-y-1">
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
              >
                <button
                  onClick={() => onApplyFilter(filter)}
                  className="flex-1 text-left text-sm hover:text-primary"
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-3 w-3" />
                    <span className="font-medium">{filter.name}</span>
                  </div>
                  {filter.description && (
                    <p className="text-xs text-muted-foreground mt-1">{filter.description}</p>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setFilterToDelete(filter.id);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le filtre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le filtre sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => filterToDelete && handleDeleteFilter(filterToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
