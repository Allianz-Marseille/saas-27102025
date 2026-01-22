"use client";

import { useEffect, useState } from "react";
import { useUnreadMessages } from "@/lib/hooks/use-unread-messages";
import { useMessages } from "@/lib/hooks/use-messages";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { toast } from "sonner";
import { Bell, X } from "lucide-react";
import { AdminMessage } from "@/types/message";
import { getRelativeTime, toDate } from "@/lib/utils/date-helpers";
import { cn } from "@/lib/utils";

interface MessageToastProps {
  onMessageClick?: (message: AdminMessage) => void;
}

/**
 * Notification Toast discret en bas à droite si commercial connecté
 * Auto-dismiss après 5 secondes (sauf urgent)
 */
export function MessageToast({ onMessageClick }: MessageToastProps) {
  const { userData } = useAuth();
  const { count } = useUnreadMessages();
  const { messages } = useMessages();
  const [shownMessages, setShownMessages] = useState<Set<string>>(new Set());

  // Ne pas afficher pour les admins
  if (!userData || isAdmin(userData)) {
    return null;
  }

  // Récupérer le premier message non lu
  const unreadMessage = messages.find((msg) => {
    // Pour simplifier, on prend le message le plus récent non encore affiché
    return !shownMessages.has(msg.id);
  });

  useEffect(() => {
    if (count > 0 && unreadMessage && !shownMessages.has(unreadMessage.id)) {
      const isUrgent = unreadMessage.priority === "urgent";
      const duration = isUrgent ? Infinity : 5000; // Urgent ne se ferme pas automatiquement

      const toastId = toast.custom(
        (t) => (
          <div
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg shadow-lg border bg-background min-w-[300px] max-w-[400px]",
              "cursor-pointer hover:shadow-xl transition-shadow",
              isUrgent && "border-red-500 border-2"
            )}
            onClick={() => {
              toast.dismiss(t);
              if (onMessageClick) {
                onMessageClick(unreadMessage);
              }
            }}
          >
            <Bell className={cn(
              "h-5 w-5 shrink-0 mt-0.5",
              isUrgent ? "text-red-500" : "text-blue-500"
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm line-clamp-1">
                  {unreadMessage.title}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t);
                  }}
                  className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {unreadMessage.content.substring(0, 100)}
                {unreadMessage.content.length > 100 && "..."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getRelativeTime(toDate(unreadMessage.createdAt))}
              </p>
            </div>
          </div>
        ),
        {
          duration,
          position: "bottom-right",
        }
      );

      // Marquer comme affiché
      setShownMessages((prev) => new Set(prev).add(unreadMessage.id));

      // Nettoyer après le dismiss
      if (!isUrgent) {
        setTimeout(() => {
          setShownMessages((prev) => {
            const next = new Set(prev);
            next.delete(unreadMessage.id);
            return next;
          });
        }, duration);
      }
    }
  }, [count, unreadMessage, shownMessages, onMessageClick]);

  return null; // Ce composant ne rend rien, il utilise toast
}
