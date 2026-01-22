"use client";

import { useState, useEffect, useMemo } from "react";
import { useCreateMessage } from "@/lib/hooks/use-create-message";
import { useRecipientsCount } from "@/lib/hooks/use-recipients-count";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { CreateMessageInput, MessagePriority, MessageTargetType } from "@/types/message";
import { UserRole } from "@/lib/utils/roles";
import { getAllUsers } from "@/lib/firebase/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { Search, CheckCircle2, Users, X, CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageEditor } from "./message-editor";
import { TemplateSelector } from "./template-selector";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";

interface MessageFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Formulaire de création de message amélioré (ADMIN uniquement)
 * - Compteur de destinataires dynamique
 * - Dropdown avec recherche
 * - Validation visuelle
 * - Compteur de mots
 * - Modal de confirmation
 */
export function MessageForm({ open, onClose, onSuccess }: MessageFormProps) {
  const { userData } = useAuth();
  const { create, loading, error } = useCreateMessage();
  const [formData, setFormData] = useState<CreateMessageInput>({
    title: "",
    content: "",
    priority: "normal",
    targetType: "global",
  });
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState<string>("09:00");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; email: string; role: UserRole }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecipientsList, setShowRecipientsList] = useState(false);

  // Calculer le nombre de destinataires en temps réel
  const { count: recipientsCount, loading: loadingCount } = useRecipientsCount(
    formData.targetType,
    formData.targetRole,
    formData.targetUserId
  );

  // Vérifier que l'utilisateur est admin
  if (!userData || !isAdmin(userData)) {
    return null;
  }

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(
        allUsers
          .filter((u) => u.role !== "ADMINISTRATEUR" && u.active)
          .map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role as UserRole,
          }))
      );
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((u) => u.email.toLowerCase().includes(query));
  }, [users, searchQuery]);

  // Compter les mots dans le contenu
  const wordCount = useMemo(() => {
    return formData.content.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }, [formData.content]);

  // Validation du formulaire
  const isFormValid = useMemo(() => {
    return (
      formData.title.trim().length > 0 &&
      formData.title.trim().length <= 100 &&
      formData.content.trim().length > 0 &&
      (formData.targetType !== "role" || formData.targetRole) &&
      (formData.targetType !== "personal" || formData.targetUserId) &&
      recipientsCount > 0
    );
  }, [formData, recipientsCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Afficher la modal de confirmation
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);

    try {
      // Préparer les données avec la date de programmation si nécessaire
      const messageData: CreateMessageInput = {
        ...formData,
        scheduledAt: isScheduled && scheduledDate
          ? (() => {
              const [hours, minutes] = scheduledTime.split(":").map(Number);
              const scheduledDateTime = new Date(scheduledDate);
              scheduledDateTime.setHours(hours, minutes, 0, 0);
              return scheduledDateTime;
            })()
          : undefined,
      };

      await create(messageData);
      toast.success(
        isScheduled
          ? "Message programmé avec succès"
          : "Message créé avec succès"
      );
      setFormData({
        title: "",
        content: "",
        priority: "normal",
        targetType: "global",
      });
      setIsScheduled(false);
      setScheduledDate(undefined);
      setScheduledTime("09:00");
      setSearchQuery("");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création du message";
      toast.error(errorMessage);
    }
  };

  const handleTargetTypeChange = (value: string) => {
    const targetType = value as MessageTargetType;
    setFormData({
      ...formData,
      targetType,
      targetRole: targetType === "role" ? "CDC_COMMERCIAL" : undefined,
      targetUserId: targetType === "personal" ? undefined : undefined,
    });
  };

  const getSelectedUser = () => {
    if (formData.targetType !== "personal" || !formData.targetUserId) return null;
    return users.find((u) => u.id === formData.targetUserId);
  };

  const getPriorityLabel = (priority: MessagePriority) => {
    switch (priority) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Haute";
      case "normal":
        return "Normale";
      case "low":
        return "Basse";
      default:
        return "Normale";
    }
  };

  const getTargetTypeLabel = () => {
    switch (formData.targetType) {
      case "global":
        return "Tous les commerciaux";
      case "role":
        const roleLabels: Record<UserRole, string> = {
          CDC_COMMERCIAL: "CDC Commercial",
          COMMERCIAL_SANTE_INDIVIDUEL: "Commercial Santé Individuel",
          COMMERCIAL_SANTE_COLLECTIVE: "Commercial Santé Collective",
          GESTIONNAIRE_SINISTRE: "Gestionnaire Sinistre",
          ADMINISTRATEUR: "Administrateur",
        };
        return roleLabels[formData.targetRole || "CDC_COMMERCIAL"];
      case "personal":
        const selectedUser = getSelectedUser();
        return selectedUser ? selectedUser.email : "Utilisateur sélectionné";
      default:
        return "";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau message</DialogTitle>
            <DialogDescription>
              Créez un message à envoyer aux commerciaux
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                maxLength={100}
                placeholder="Titre du message (max 100 caractères)"
                className={cn(
                  formData.title.length > 100 && "border-red-500"
                )}
              />
              <div className="flex items-center justify-between">
                <p className={cn(
                  "text-xs",
                  formData.title.length > 100 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {formData.title.length}/100 caractères
                </p>
                {formData.title.length > 0 && formData.title.length <= 100 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valide
                  </Badge>
                )}
              </div>
            </div>

            {/* Sélecteur de templates */}
            <TemplateSelector
              onSelect={(template) => {
                // Template sélectionné, sera appliqué via onApply
              }}
              onApply={(title, content) => {
                setFormData({
                  ...formData,
                  title,
                  content,
                });
              }}
            />

            <div className="space-y-2">
              <Label htmlFor="content">
                Contenu <span className="text-red-500">*</span>
              </Label>
              <MessageEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Contenu du message (support markdown)"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {wordCount} {wordCount === 1 ? "mot" : "mots"}
                </p>
                {formData.content.trim().length > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valide
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as MessagePriority })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetType">Type de ciblage</Label>
                <Select value={formData.targetType} onValueChange={handleTargetTypeChange}>
                  <SelectTrigger id="targetType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global - Tous les commerciaux</SelectItem>
                    <SelectItem value="role">Par rôle</SelectItem>
                    <SelectItem value="personal">Personnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Compteur de destinataires dynamique */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Destinataires</span>
              </div>
              {loadingCount ? (
                <span className="text-sm text-muted-foreground">Calcul...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant={recipientsCount > 0 ? "default" : "destructive"}>
                    {recipientsCount} {recipientsCount === 1 ? "destinataire" : "destinataires"}
                  </Badge>
                  {formData.targetType !== "personal" && (
                    <Popover open={showRecipientsList} onOpenChange={setShowRecipientsList}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7">
                          <Search className="h-3 w-3 mr-1" />
                          Voir la liste
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Rechercher un utilisateur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Aucun utilisateur trouvé
                            </div>
                          ) : (
                            <div className="p-2">
                              {filteredUsers.map((user) => (
                                <div
                                  key={user.id}
                                  className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                                >
                                  {user.email}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
            </div>

            {formData.targetType === "role" && (
              <div className="space-y-2">
                <Label htmlFor="targetRole">Rôle cible</Label>
                <Select
                  value={formData.targetRole}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetRole: value as UserRole })
                  }
                >
                  <SelectTrigger id="targetRole">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDC_COMMERCIAL">CDC Commercial</SelectItem>
                    <SelectItem value="COMMERCIAL_SANTE_INDIVIDUEL">Commercial Santé Individuel</SelectItem>
                    <SelectItem value="COMMERCIAL_SANTE_COLLECTIVE">Commercial Santé Collective</SelectItem>
                    <SelectItem value="GESTIONNAIRE_SINISTRE">Gestionnaire Sinistre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.targetType === "personal" && (
              <div className="space-y-2">
                <Label htmlFor="targetUserId">Destinataire</Label>
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground">Chargement des utilisateurs...</p>
                ) : (
                  <div className="space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          type="button"
                        >
                          {getSelectedUser() ? (
                            <>
                              {getSelectedUser()?.email}
                            </>
                          ) : (
                            "Sélectionner un utilisateur"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Rechercher un utilisateur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Aucun utilisateur trouvé
                            </div>
                          ) : (
                            <div className="p-2">
                              {filteredUsers.map((user) => (
                                <div
                                  key={user.id}
                                  onClick={() => {
                                    setFormData({ ...formData, targetUserId: user.id });
                                    setSearchQuery("");
                                  }}
                                  className={cn(
                                    "p-2 hover:bg-muted rounded cursor-pointer text-sm",
                                    formData.targetUserId === user.id && "bg-muted"
                                  )}
                                >
                                  {user.email}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {getSelectedUser() && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {getSelectedUser()?.email}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, targetUserId: undefined })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Programmation du message */}
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="schedule" className="text-sm font-medium">
                    Programmer l'envoi
                  </Label>
                </div>
                <Switch
                  id="schedule"
                  checked={isScheduled}
                  onCheckedChange={setIsScheduled}
                />
              </div>

              {isScheduled && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Date</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !scheduledDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? (
                            format(scheduledDate, "PPP", { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={(date) => {
                            setScheduledDate(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Heure</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {isScheduled && scheduledDate && (
                <div className="text-xs text-muted-foreground pt-1">
                  Le message sera envoyé le{" "}
                  {format(
                    (() => {
                      const [hours, minutes] = scheduledTime.split(":").map(Number);
                      const date = new Date(scheduledDate);
                      date.setHours(hours, minutes, 0, 0);
                      return date;
                    })(),
                    "PPP 'à' HH:mm",
                    { locale: fr }
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !isFormValid}>
                {loading ? "Création..." : "Créer le message"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'envoi du message</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Veuillez vérifier les informations suivantes avant d'envoyer :</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Titre :</span>
                  <span>{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Priorité :</span>
                  <span>{getPriorityLabel(formData.priority)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Destinataires :</span>
                  <span>{recipientsCount} {getTargetTypeLabel()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Mots :</span>
                  <span>{wordCount}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Confirmer l'envoi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
