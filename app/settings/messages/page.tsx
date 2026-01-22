"use client";

import { useState, useEffect } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/firebase/use-auth";
import { getUserPreferences, updateUserPreferences } from "@/lib/firebase/user-preferences";
import { UserMessagePreferences } from "@/types/message";
import { toast } from "sonner";
import { Bell, Volume2, VolumeX, LayoutGrid, List, Settings } from "lucide-react";
import { isAdmin } from "@/lib/utils/roles";

/**
 * Page de paramètres des messages
 */
export default function MessageSettingsPage() {
  const { user, userData } = useAuth();
  const [preferences, setPreferences] = useState<UserMessagePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences(user.uid);
        setPreferences(prefs);
      } catch (error) {
        console.error("Erreur lors du chargement des préférences:", error);
        toast.error("Erreur lors du chargement des préférences");
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleUpdate = async (updates: Partial<Omit<UserMessagePreferences, "userId" | "updatedAt">>) => {
    if (!user || !preferences) return;

    setSaving(true);
    try {
      await updateUserPreferences(user.uid, updates);
      setPreferences((prev) => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      toast.success("Préférences mises à jour");
    } catch (error) {
      console.error("Erreur lors de la mise à jour des préférences:", error);
      toast.error("Erreur lors de la mise à jour des préférences");
    } finally {
      setSaving(false);
    }
  };

  // Ne pas afficher pour les admins (ils n'ont pas de messages)
  if (userData && isAdmin(userData)) {
    return (
      <RouteGuard>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Les paramètres de messages ne sont pas disponibles pour les administrateurs.</p>
        </div>
      </RouteGuard>
    );
  }

  if (loading) {
    return (
      <RouteGuard>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </RouteGuard>
    );
  }

  if (!preferences) {
    return (
      <RouteGuard>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Impossible de charger les préférences</p>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Paramètres des messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos préférences de notifications et d'affichage
          </p>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configurez vos préférences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notifications sonores */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-notifications" className="flex items-center gap-2">
                  {preferences.soundNotifications ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  Notifications sonores
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activer les sons pour les notifications de messages
                </p>
              </div>
              <Switch
                id="sound-notifications"
                checked={preferences.soundNotifications}
                onCheckedChange={(checked) => handleUpdate({ soundNotifications: checked })}
                disabled={saving}
              />
            </div>

            {/* Fréquence des rappels */}
            <div className="space-y-2">
              <Label htmlFor="reminder-frequency">Fréquence des rappels</Label>
              <p className="text-sm text-muted-foreground">
                Choisissez la fréquence des rappels pour les messages non lus
              </p>
              <Select
                value={preferences.reminderFrequency}
                onValueChange={(value: "none" | "daily" | "weekly") =>
                  handleUpdate({ reminderFrequency: value })
                }
                disabled={saving}
              >
                <SelectTrigger id="reminder-frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun rappel</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Affichage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {preferences.defaultViewMode === "grid" ? (
                <LayoutGrid className="h-5 w-5" />
              ) : (
                <List className="h-5 w-5" />
              )}
              Affichage
            </CardTitle>
            <CardDescription>
              Préférences d'affichage des messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode d'affichage par défaut */}
            <div className="space-y-2">
              <Label htmlFor="view-mode">Mode d'affichage par défaut</Label>
              <p className="text-sm text-muted-foreground">
                Choisissez comment afficher vos messages par défaut
              </p>
              <Select
                value={preferences.defaultViewMode}
                onValueChange={(value: "list" | "grid") =>
                  handleUpdate({ defaultViewMode: value })
                }
                disabled={saving}
              >
                <SelectTrigger id="view-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Liste
                    </div>
                  </SelectItem>
                  <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Grille
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour :{" "}
              {preferences.updatedAt instanceof Date
                ? preferences.updatedAt.toLocaleString("fr-FR")
                : new Date(preferences.updatedAt.seconds * 1000).toLocaleString("fr-FR")}
            </p>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
