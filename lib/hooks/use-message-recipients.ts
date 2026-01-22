"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { getRecipientsByMessage } from "@/lib/firebase/messages";
import { MessageRecipient } from "@/types/message";

interface UseMessageRecipientsResult {
  recipients: MessageRecipient[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour les destinataires d'un message (ADMIN uniquement)
 */
export function useMessageRecipients(messageId: string | null): UseMessageRecipientsResult {
  const { userData, loading: authLoading } = useAuth();
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipients = async () => {
    if (authLoading) {
      return;
    }

    // Vérifier que l'utilisateur est admin
    if (!userData || !isAdmin(userData)) {
      setRecipients([]);
      setLoading(false);
      setError(new Error("Accès refusé : administrateur requis"));
      return;
    }

    if (!messageId) {
      setRecipients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const messageRecipients = await getRecipientsByMessage(messageId);
      setRecipients(messageRecipients);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erreur lors du chargement des destinataires");
      setError(error);
      console.error("Error fetching recipients:", error);
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId, userData, authLoading]);

  return {
    recipients,
    loading,
    error,
    refetch: fetchRecipients,
  };
}
