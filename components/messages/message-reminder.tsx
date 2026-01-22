"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { useMessages } from "@/lib/hooks/use-messages";
import { getUserPreferences } from "@/lib/firebase/user-preferences";
import { getRecipientsByUser } from "@/lib/firebase/messages";
import { getOldUnreadMessages, shouldShowReminder, playNotificationSound } from "@/lib/utils/message-reminders";
import { UserMessagePreferences } from "@/types/message";
import { toast } from "sonner";
import { Bell, Clock } from "lucide-react";
import { isAdmin } from "@/lib/utils/roles";

/**
 * Composant de rappel automatique pour messages non lus > 24h
 * Vérifie quotidiennement et affiche un toast discret
 */
export function MessageReminder() {
  const { user, userData } = useAuth();
  const { messages } = useMessages();
  const [preferences, setPreferences] = useState<UserMessagePreferences | null>(null);
  const [lastReminderTime, setLastReminderTime] = useState<Date | null>(null);
  const [oldUnreadCount, setOldUnreadCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ne pas afficher pour les admins
  if (!userData || isAdmin(userData)) {
    return null;
  }

  // Charger les préférences utilisateur
  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences(user.uid);
        setPreferences(prefs);
      } catch (error) {
        console.error("Erreur lors du chargement des préférences:", error);
      }
    };

    loadPreferences();
  }, [user, userData]);

  // Vérifier les messages non lus > 24h
  useEffect(() => {
    if (!user || !preferences || preferences.reminderFrequency === "none") {
      return;
    }

    const checkOldUnreadMessages = async () => {
      try {
        // Récupérer les destinataires de l'utilisateur
        const recipients = await getRecipientsByUser(user.uid);
        
        // Filtrer les messages non lus > 24h
        const oldUnread = getOldUnreadMessages(messages, recipients);
        setOldUnreadCount(oldUnread.length);

        // Vérifier si on doit afficher un rappel
        if (oldUnread.length > 0 && shouldShowReminder(lastReminderTime, preferences.reminderFrequency)) {
          // Afficher le toast
          toast.info(
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <div>
                <p className="font-semibold">Rappel de messages</p>
                <p className="text-sm text-muted-foreground">
                  {oldUnread.length === 1
                    ? "1 message non lu depuis plus de 24h"
                    : `${oldUnread.length} messages non lus depuis plus de 24h`}
                </p>
              </div>
            </div>,
            {
              duration: 8000,
              action: {
                label: "Voir",
                onClick: () => {
                  window.location.href = "/messages";
                },
              },
            }
          );

          // Jouer le son si activé
          if (preferences.soundNotifications) {
            playNotificationSound();
          }

          // Mettre à jour le dernier rappel
          setLastReminderTime(new Date());
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des rappels:", error);
      }
    };

    // Vérifier immédiatement
    checkOldUnreadMessages();

    // Vérifier toutes les heures
    intervalRef.current = setInterval(() => {
      checkOldUnreadMessages();
    }, 3600000); // 1 heure

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, messages, preferences, lastReminderTime]);

  // Ne rien rendre (composant invisible)
  return null;
}
