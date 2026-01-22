"use client";

import { useState, useMemo } from "react";
import { useMessages } from "@/lib/hooks/use-messages";
import { MessageCard } from "./message-card";
import { markAsRead } from "@/lib/firebase/messages";
import { useAuth } from "@/lib/firebase/use-auth";
import { AdminMessage, MessagePriority } from "@/types/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckSquare, Square, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDate } from "@/lib/utils/date-helpers";
import { toast } from "sonner";

interface UserMessageListProps {
  onMessageClick?: (message: AdminMessage) => void;
}

type ViewMode = "compact" | "extended";
type QuickFilter = "unread" | "urgent" | "thisWeek" | "all";

/**
 * Liste améliorée des messages pour utilisateurs (commerciaux)
 * - Toggle vue compacte/étendue
 * - Marquage groupé ("Marquer tout comme lu")
 * - Filtres rapides (chips)
 * - Recherche
 * - Tri personnalisé (non lus en premier, puis priorité)
 */
export function UserMessageList({ onMessageClick }: UserMessageListProps) {
  const { messages, loading, error, refetch } = useMessages();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("extended");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Filtrer les messages selon le filtre rapide
  const filteredByQuickFilter = useMemo(() => {
    if (quickFilter === "all") return messages;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return messages.filter((msg) => {
      const msgDate = toDate(msg.createdAt);

      switch (quickFilter) {
        case "unread":
          // Messages non lus (on vérifie via les recipients)
          return !readMessages.has(msg.id);
        case "urgent":
          return msg.priority === "urgent";
        case "thisWeek":
          return msgDate >= oneWeekAgo;
        default:
          return true;
      }
    });
  }, [messages, quickFilter, readMessages]);

  // Recherche full-text
  const searchedMessages = useMemo(() => {
    if (!searchQuery.trim()) return filteredByQuickFilter;

    const query = searchQuery.toLowerCase();
    return filteredByQuickFilter.filter(
      (msg) =>
        msg.title.toLowerCase().includes(query) ||
        msg.content.toLowerCase().includes(query)
    );
  }, [filteredByQuickFilter, searchQuery]);

  // Tri personnalisé : non lus en premier, puis par priorité
  const sortedMessages = useMemo(() => {
    const sorted = [...searchedMessages];

    sorted.sort((a, b) => {
      // 0. Messages épinglés toujours en premier
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // 1. Non lus en premier
      const aUnread = !readMessages.has(a.id);
      const bUnread = !readMessages.has(b.id);
      if (aUnread !== bUnread) {
        return aUnread ? -1 : 1;
      }

      // 2. Puis par priorité
      const priorityOrder: Record<MessagePriority, number> = {
        urgent: 4,
        high: 3,
        normal: 2,
        low: 1,
      };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // 3. Puis par date (plus récent en premier)
      const dateA = toDate(a.createdAt).getTime();
      const dateB = toDate(b.createdAt).getTime();
      return dateB - dateA;
    });

    return sorted;
  }, [searchedMessages, readMessages]);

  // Messages non lus
  const unreadMessages = useMemo(() => {
    return sortedMessages.filter((msg) => !readMessages.has(msg.id));
  }, [sortedMessages, readMessages]);

  const handleMessageClick = async (message: AdminMessage) => {
    if (!user) return;

    // Marquer comme lu si pas déjà lu
    if (!readMessages.has(message.id)) {
      try {
        await markAsRead(message.id, user.uid);
        setReadMessages((prev) => new Set(prev).add(message.id));
        refetch();
      } catch (err) {
        console.error("Error marking message as read:", err);
        toast.error("Erreur lors du marquage du message comme lu");
      }
    }

    if (onMessageClick) {
      onMessageClick(message);
    }
  };

  const handleSelectAll = () => {
    if (selectedMessages.size === unreadMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(unreadMessages.map((msg) => msg.id)));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || unreadMessages.length === 0) return;

    setIsMarkingAll(true);
    try {
      // Marquer tous les messages non lus comme lus
      const promises = unreadMessages.map((msg) => markAsRead(msg.id, user.uid));
      await Promise.all(promises);

      // Mettre à jour l'état local
      const newReadSet = new Set(readMessages);
      unreadMessages.forEach((msg) => newReadSet.add(msg.id));
      setReadMessages(newReadSet);
      setSelectedMessages(new Set());

      toast.success(`${unreadMessages.length} message(s) marqué(s) comme lu(s)`);
      refetch();
    } catch (err) {
      console.error("Error marking all messages as read:", err);
      toast.error("Erreur lors du marquage des messages");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleToggleSelect = (messageId: string) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleMarkSelectedAsRead = async () => {
    if (!user || selectedMessages.size === 0) return;

    setIsMarkingAll(true);
    try {
      const promises = Array.from(selectedMessages).map((msgId) =>
        markAsRead(msgId, user.uid)
      );
      await Promise.all(promises);

      const newReadSet = new Set(readMessages);
      selectedMessages.forEach((id) => newReadSet.add(id));
      setReadMessages(newReadSet);
      setSelectedMessages(new Set());

      toast.success(`${selectedMessages.size} message(s) marqué(s) comme lu(s)`);
      refetch();
    } catch (err) {
      console.error("Error marking selected messages as read:", err);
      toast.error("Erreur lors du marquage des messages");
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement des messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Erreur : {error.message}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Aucun message</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et contrôles */}
      <div className="space-y-3">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans vos messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres rapides et contrôles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtres rapides (chips) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filtres :</span>
            {(
              [
                { value: "all", label: "Tous" },
                { value: "unread", label: "Non lus" },
                { value: "urgent", label: "Urgents" },
                { value: "thisWeek", label: "Cette semaine" },
              ] as const
            ).map((filter) => (
              <Button
                key={filter.value}
                variant={quickFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setQuickFilter(filter.value as QuickFilter)}
                className="h-8"
              >
                {filter.label}
                {filter.value === "unread" && unreadMessages.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {unreadMessages.length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Actions groupées */}
          {unreadMessages.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-8"
              >
                {selectedMessages.size === unreadMessages.length ? (
                  <CheckSquare className="h-4 w-4 mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                Tout sélectionner
              </Button>
              {selectedMessages.size > 0 ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                  disabled={isMarkingAll}
                  className="h-8"
                >
                  Marquer {selectedMessages.size} comme lu(s)
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="h-8"
                >
                  Marquer tout comme lu
                </Button>
              )}
            </div>
          )}

          {/* Toggle vue */}
          <div className="flex items-center gap-1 border rounded-lg p-1 ml-auto">
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compact")}
              className="h-8"
              title="Vue compacte"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "extended" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("extended")}
              className="h-8"
              title="Vue étendue"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Résultats */}
        <div className="text-sm text-muted-foreground">
          {sortedMessages.length} message{sortedMessages.length > 1 ? "s" : ""}
          {unreadMessages.length > 0 && (
            <span className="ml-2">
              ({unreadMessages.length} non lu{unreadMessages.length > 1 ? "s" : ""})
            </span>
          )}
        </div>
      </div>

      {/* Liste des messages */}
      {sortedMessages.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Aucun message trouvé</p>
        </div>
      ) : (
        <div className={cn("space-y-3", viewMode === "compact" && "space-y-2")}>
          {sortedMessages.map((message) => {
            const isUnread = !readMessages.has(message.id);
            const isSelected = selectedMessages.has(message.id);

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  viewMode === "compact" && "gap-2"
                )}
              >
                {/* Checkbox pour sélection */}
                {isUnread && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelect(message.id)}
                    className="mt-1"
                  />
                )}
                {!isUnread && <div className="w-5" />} {/* Spacer pour alignement */}

                {/* Carte de message */}
                <div className="flex-1">
                  <MessageCard
                    message={message}
                    onClick={() => handleMessageClick(message)}
                    isRead={!isUnread}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
