"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import {
  MessageTemplate,
  MessageCategory,
} from "@/types/message";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/firebase/message-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, Sparkles } from "lucide-react";
import { getRelativeTime, toDate } from "@/lib/utils/date-helpers";

/**
 * Gestionnaire de templates (CRUD) pour les admins
 */
export function TemplateManager() {
  const { user, userData } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    title: "",
    content: "",
    category: "" as MessageCategory | "",
  });

  useEffect(() => {
    if (userData && isAdmin(userData)) {
      loadTemplates();
    }
  }, [userData]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const loadedTemplates = await getAllTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error("Erreur lors du chargement des templates:", error);
      toast.error("Erreur lors du chargement des templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !formData.name || !formData.title || !formData.content) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createTemplate({
        name: formData.name,
        description: formData.description || undefined,
        title: formData.title,
        content: formData.content,
        category: formData.category || undefined,
        createdBy: user.uid,
      });
      toast.success("Template créé avec succès");
      setShowCreateDialog(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création";
      toast.error(errorMessage);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTemplate || !formData.name || !formData.title || !formData.content) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await updateTemplate(selectedTemplate.id, {
        name: formData.name,
        description: formData.description || undefined,
        title: formData.title,
        content: formData.content,
        category: formData.category || undefined,
      });
      toast.success("Template mis à jour avec succès");
      setShowEditDialog(false);
      resetForm();
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await deleteTemplate(selectedTemplate.id);
      toast.success("Template supprimé avec succès");
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      title: "",
      content: "",
      category: "",
    });
  };

  const openEditDialog = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      title: template.title,
      content: template.content,
      category: template.category || "",
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  if (!userData || !isAdmin(userData)) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Bibliothèque de templates
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez vos templates de messages réutilisables
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun template. Créez-en un pour commencer.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  {template.category && (
                    <Badge variant="secondary">{template.category}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Titre :</p>
                  <p className="text-sm text-muted-foreground">{template.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Contenu :</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.content}
                  </p>
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Variables :</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs font-mono">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Créé {getRelativeTime(toDate(template.createdAt))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(template)}
                    className="flex-1 text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau template</DialogTitle>
            <DialogDescription>
              Créez un template réutilisable pour vos messages
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom du template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Rappel commission mensuelle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as MessageCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formation">Formation</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="information">Information</SelectItem>
                  <SelectItem value="urgence">Urgence</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre par défaut <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre du message (peut contenir {variables})"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">
                Contenu par défaut <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                placeholder="Contenu du message (peut contenir {variables} comme {nom_commercial}, {date})"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le template</DialogTitle>
            <DialogDescription>
              Modifiez les informations du template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Nom du template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as MessageCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formation">Formation</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="information">Information</SelectItem>
                  <SelectItem value="urgence">Urgence</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Titre par défaut <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">
                Contenu par défaut <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le template</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le template "{selectedTemplate?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
