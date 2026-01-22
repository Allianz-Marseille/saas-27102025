"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { createMessage } from "@/lib/firebase/messages";
import { CreateMessageInput, AdminMessage } from "@/types/message";

interface UseCreateMessageResult {
  create: (input: CreateMessageInput) => Promise<AdminMessage>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook pour créer un message (ADMIN uniquement)
 */
export function useCreateMessage(): UseCreateMessageResult {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCreate = async (input: CreateMessageInput): Promise<AdminMessage> => {
    // Vérifier que l'utilisateur est admin
    if (!user || !userData || !isAdmin(userData)) {
      const err = new Error("Accès refusé : administrateur requis");
      setError(err);
      throw err;
    }

    setLoading(true);
    setError(null);

    try {
      // Récupérer le nom de l'admin (email par défaut)
      const createdByName = userData.email || undefined;

      const message = await createMessage(input, user.uid, createdByName);
      return message;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erreur lors de la création du message");
      setError(error);
      console.error("Error creating message:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    create: handleCreate,
    loading,
    error,
  };
}
