"use client";

import { useState, useEffect } from "react";
import { MessageTargetType } from "@/types/message";
import { UserRole } from "@/lib/utils/roles";
import { getUsersByRole } from "@/lib/firebase/messages";
import { getAllUsers } from "@/lib/firebase/auth";

interface UseRecipientsCountResult {
  count: number;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook pour calculer le nombre de destinataires en temps réel
 * selon le type de ciblage
 */
export function useRecipientsCount(
  targetType: MessageTargetType,
  targetRole?: UserRole,
  targetUserId?: string
): UseRecipientsCountResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const calculateCount = async () => {
      setLoading(true);
      setError(null);

      try {
        let recipients: Array<{ id: string }> = [];

        switch (targetType) {
          case "global":
            const allUsers = await getAllUsers();
            recipients = allUsers.filter(
              (u) => u.active && u.role !== "ADMINISTRATEUR"
            );
            break;
          case "role":
            if (targetRole) {
              const roleUsers = await getUsersByRole(targetRole);
              recipients = roleUsers;
            }
            break;
          case "personal":
            if (targetUserId) {
              recipients = [{ id: targetUserId }];
            }
            break;
        }

        setCount(recipients.length);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erreur lors du calcul des destinataires");
        setError(error);
        console.error("Error calculating recipients count:", error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    // Ne calculer que si les paramètres requis sont présents
    if (targetType === "role" && !targetRole) {
      setCount(0);
      return;
    }
    if (targetType === "personal" && !targetUserId) {
      setCount(0);
      return;
    }

    calculateCount();
  }, [targetType, targetRole, targetUserId]);

  return { count, loading, error };
}
