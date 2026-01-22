"use client";

import { useMessages } from "@/lib/hooks/use-messages";
import { MessageCard } from "./message-card";
import { markAsRead } from "@/lib/firebase/messages";
import { useAuth } from "@/lib/firebase/use-auth";
import { AdminMessage } from "@/types/message";
import { useState } from "react";
import { toast } from "sonner";

interface MessageListProps {
  onMessageClick?: (message: AdminMessage) => void;
}

/**
 * Liste des messages (version basique)
 */
export function MessageList({ onMessageClick }: MessageListProps) {
  const { messages, loading, error, refetch } = useMessages();
  const { user } = useAuth();
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());

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
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          onClick={() => handleMessageClick(message)}
          isRead={readMessages.has(message.id)}
        />
      ))}
    </div>
  );
}
