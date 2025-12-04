import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/use-auth";

interface RagStats {
  documents: number;
  chunks: number;
  requests: number;
}

export function useRagStats() {
  const [stats, setStats] = useState<RagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const response = await fetch("/api/chat/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Erreur récupération stats:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      // Valeurs par défaut en cas d'erreur
      setStats({ documents: 0, chunks: 0, requests: 0 });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Écouter l'événement de refresh personnalisé
  useEffect(() => {
    const handleRefresh = () => {
      fetchStats();
    };

    window.addEventListener("refresh-stats", handleRefresh);
    return () => {
      window.removeEventListener("refresh-stats", handleRefresh);
    };
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

