"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { getUnreadCount } from "@/lib/firebase/messages";

interface UseUnreadMessagesResult {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Cache pour éviter les requêtes trop fréquentes
const cache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 secondes

/**
 * Hook pour messages non lus avec cache (tous rôles sauf admin)
 * Les admins n'ont pas de messages non lus (ils sont émetteurs uniquement)
 */
export function useUnreadMessages(): UseUnreadMessagesResult {
  const { user, userData, loading: authLoading } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnreadCount = async () => {
    if (authLoading) {
      return;
    }

    if (!user || !userData) {
      setCount(0);
      setLoading(false);
      return;
    }

    // Les admins n'ont pas de messages non lus
    if (isAdmin(userData)) {
      setCount(0);
      setLoading(false);
      return;
    }

    // Vérifier le cache
    const cacheKey = user.uid;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setCount(cached.count);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unreadCount = await getUnreadCount(user.uid);
      setCount(unreadCount);

      // Mettre à jour le cache
      cache.set(cacheKey, {
        count: unreadCount,
        timestamp: now,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erreur lors du chargement du nombre de messages non lus");
      setError(error);
      console.error("Error fetching unread count:", error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Rafraîchir automatiquement toutes les 30 secondes
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userData, authLoading]);

  return {
    count,
    loading,
    error,
    refetch: fetchUnreadCount,
  };
}
