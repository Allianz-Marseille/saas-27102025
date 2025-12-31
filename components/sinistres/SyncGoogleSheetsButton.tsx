"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SyncGoogleSheetsButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      const response = await fetch("/api/sinistres/sync-google-sheets", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la synchronisation");
      }

      const { result } = data;
      
      toast.success("Synchronisation réussie", {
        description: `${result.newSinistres} nouveaux sinistres importés, ${result.existingSinistres} existants ignorés`,
      });

      // Recharger la page pour afficher les nouveaux sinistres
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Erreur synchronisation:", error);
      toast.error("Erreur lors de la synchronisation", {
        description:
          error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      className="gap-2"
    >
      {syncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Synchronisation...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Synchroniser Google Sheets
        </>
      )}
    </Button>
  );
}

