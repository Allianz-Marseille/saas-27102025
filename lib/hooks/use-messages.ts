"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import {
  getAllMessages,
  getMessagesByUser,
} from "@/lib/firebase/messages";
import { AdminMessage } from "@/types/message";

interface UseMessagesResult {
  messages: AdminMessage[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les messages (comportement différent selon rôle)
 * - ADMIN : Récupère tous les messages
 * - Autres rôles : Récupère uniquement leurs messages reçus
 */
export function useMessages(): UseMessagesResult {
  const { user, userData, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = async () => {
    if (authLoading) {
      return;
    }

    if (!user || !userData) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isAdmin(userData)) {
        // Admin : récupérer tous les messages
        const allMessages = await getAllMessages();
        setMessages(Array.isArray(allMessages) ? allMessages : []);
      } else {
        // Autres rôles : récupérer uniquement leurs messages
        const userMessages = await getMessagesByUser(user.uid);
        setMessages(Array.isArray(userMessages) ? userMessages : []);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erreur lors du chargement des messages");
      setError(error);
      console.error("Error fetching messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userData, authLoading]);

  // S'assurer que messages est toujours un tableau
  const safeMessages = Array.isArray(messages) ? messages : [];

  return {
    messages: safeMessages,
    loading,
    error,
    refetch: fetchMessages,
  };
}
