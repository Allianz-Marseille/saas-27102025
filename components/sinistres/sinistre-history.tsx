/**
 * Composant d'affichage de l'historique des modifications d'un sinistre
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, User } from "lucide-react";
import { SinistreHistory } from "@/types/sinistre";
import { getSinistreHistory } from "@/lib/firebase/sinistres";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";

interface SinistreHistoryProps {
  sinistreId: string;
}

const getHistoryTypeLabel = (type: SinistreHistory["type"]) => {
  switch (type) {
    case "status_change":
      return "Changement de statut";
    case "route_change":
      return "Changement de route";
    case "assignment_change":
      return "Changement d'affectation";
    case "amount_change":
      return "Modification de montant";
    case "note_added":
      return "Note ajoutée";
    case "note_updated":
      return "Note modifiée";
    case "note_deleted":
      return "Note supprimée";
    case "field_update":
      return "Modification de champ";
    default:
      return "Modification";
  }
};

const getHistoryTypeColor = (type: SinistreHistory["type"]) => {
  switch (type) {
    case "status_change":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
    case "route_change":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300";
    case "assignment_change":
      return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300";
    case "amount_change":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300";
    case "note_added":
    case "note_updated":
    case "note_deleted":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
};

export function SinistreHistoryComponent({ sinistreId }: SinistreHistoryProps) {
  const [history, setHistory] = useState<SinistreHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [sinistreId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getSinistreHistory(sinistreId);
      setHistory(data);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun historique pour ce sinistre
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getHistoryTypeColor(item.type)}
                      variant="secondary"
                    >
                      {getHistoryTypeLabel(item.type)}
                    </Badge>
                    {item.field && (
                      <span className="text-sm text-muted-foreground">
                        ({item.field})
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm">{item.description}</p>
                  )}
                  {item.oldValue !== undefined && item.newValue !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      <span className="line-through">{String(item.oldValue)}</span>
                      {" → "}
                      <span className="font-medium">{String(item.newValue)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{item.authorEmail}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(
                        item.timestamp instanceof Timestamp
                          ? item.timestamp.toDate()
                          : item.timestamp,
                        "dd/MM/yyyy à HH:mm"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

