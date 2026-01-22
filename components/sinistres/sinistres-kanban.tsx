/**
 * Composant Vue Kanban pour les sinistres
 * Colonnes par statut avec drag & drop
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sinistre, SinistreStatus } from "@/types/sinistre";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { updateSinistre } from "@/lib/firebase/sinistres";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { GripVertical, AlertTriangle } from "lucide-react";
import { getRouteLabel } from "@/lib/utils/sinistres-utils";

interface SinistresKanbanProps {
  sinistres: Sinistre[];
  onSinistreClick?: (sinistre: Sinistre) => void;
  onStatusChange?: () => void;
}

const STATUS_COLUMNS: Array<{
  status: SinistreStatus;
  label: string;
  color: string;
}> = [
  { status: SinistreStatus.A_QUALIFIER, label: "À qualifier", color: "bg-gray-100 dark:bg-gray-800" },
  { status: SinistreStatus.EN_ATTENTE_PIECES_ASSURE, label: "En attente pièces assuré", color: "bg-orange-100 dark:bg-orange-900/20" },
  { status: SinistreStatus.EN_ATTENTE_INFOS_TIERS, label: "En attente infos tiers", color: "bg-orange-100 dark:bg-orange-900/20" },
  { status: SinistreStatus.MISSION_EN_COURS, label: "Mission en cours", color: "bg-blue-100 dark:bg-blue-900/20" },
  { status: SinistreStatus.EN_ATTENTE_DEVIS, label: "En attente devis", color: "bg-yellow-100 dark:bg-yellow-900/20" },
  { status: SinistreStatus.EN_ATTENTE_RAPPORT, label: "En attente rapport", color: "bg-yellow-100 dark:bg-yellow-900/20" },
  { status: SinistreStatus.EN_ATTENTE_ACCORD_COMPAGNIE, label: "En attente accord compagnie", color: "bg-yellow-100 dark:bg-yellow-900/20" },
  { status: SinistreStatus.TRAVAUX_EN_COURS, label: "Travaux en cours", color: "bg-blue-100 dark:bg-blue-900/20" },
  { status: SinistreStatus.EN_ATTENTE_FACTURE, label: "En attente facture", color: "bg-orange-100 dark:bg-orange-900/20" },
  { status: SinistreStatus.REGLEMENT_EN_COURS, label: "Règlement en cours", color: "bg-green-100 dark:bg-green-900/20" },
  { status: SinistreStatus.CLOS, label: "Clos", color: "bg-green-100 dark:bg-green-900/20" },
  { status: SinistreStatus.LITIGE_CONTESTATION, label: "Litige / contestation", color: "bg-red-100 dark:bg-red-900/20" },
];

export function SinistresKanban({
  sinistres,
  onSinistreClick,
  onStatusChange,
}: SinistresKanbanProps) {
  const { userData } = useAuth();
  const [draggedSinistre, setDraggedSinistre] = useState<Sinistre | null>(null);
  const [draggedOverStatus, setDraggedOverStatus] = useState<SinistreStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, sinistre: Sinistre) => {
    setDraggedSinistre(sinistre);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sinistre.id || "");
  };

  const handleDragOver = (e: React.DragEvent, status: SinistreStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverStatus(status);
  };

  const handleDragLeave = () => {
    setDraggedOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: SinistreStatus) => {
    e.preventDefault();
    setDraggedOverStatus(null);

    if (!draggedSinistre || draggedSinistre.status === targetStatus) {
      setDraggedSinistre(null);
      return;
    }

    if (!draggedSinistre.id || !userData) {
      setDraggedSinistre(null);
      return;
    }

    try {
      await updateSinistre(
        draggedSinistre.id,
        { status: targetStatus },
        userData.id,
        userData.email
      );
      toast.success("Statut mis à jour avec succès");
      onStatusChange?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setDraggedSinistre(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedSinistre(null);
    setDraggedOverStatus(null);
  };

  // Grouper les sinistres par statut
  const sinistresByStatus = STATUS_COLUMNS.reduce((acc, column) => {
    acc[column.status] = sinistres.filter(
      (s) => s.status === column.status || (!s.status && column.status === SinistreStatus.A_QUALIFIER)
    );
    return acc;
  }, {} as Record<SinistreStatus, Sinistre[]>);

  // Détecter les sinistres en retard (plus de 30 jours sans modification)
  const getSinistreAlerts = (sinistre: Sinistre) => {
    const alerts: string[] = [];
    const updatedAtDate = sinistre.updatedAt instanceof Timestamp
      ? sinistre.updatedAt.toDate()
      : sinistre.updatedAt;
    const daysSinceUpdate = Math.floor(
      (Date.now() - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 30) {
      alerts.push(`${daysSinceUpdate}j`);
    }
    return alerts;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((column) => {
        const columnSinistres = sinistresByStatus[column.status] || [];
        const isDraggedOver = draggedOverStatus === column.status;

        return (
          <div
            key={column.status}
            className={cn(
              "flex-shrink-0 w-80",
              isDraggedOver && "ring-2 ring-primary ring-offset-2"
            )}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <Card className="h-full">
              <CardHeader className={cn("pb-3", column.color)}>
                <CardTitle className="text-sm font-semibold">
                  {column.label}
                </CardTitle>
                <Badge variant="secondary" className="mt-2">
                  {columnSinistres.length}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {columnSinistres.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun sinistre
                  </p>
                ) : (
                  columnSinistres.map((sinistre) => {
                    const alerts = getSinistreAlerts(sinistre);
                    const isDragging = draggedSinistre?.id === sinistre.id;

                    return (
                      <div
                        key={sinistre.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, sinistre)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSinistreClick?.(sinistre)}
                        className={cn(
                          "p-3 rounded-lg border bg-card cursor-move hover:shadow-md transition-shadow",
                          isDragging && "opacity-50",
                          "hover:border-primary"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {sinistre.clientName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sinistre.claimNumber}
                            </div>
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span>
                              {format(
                                sinistre.incidentDate instanceof Timestamp
                                  ? sinistre.incidentDate.toDate()
                                  : sinistre.incidentDate,
                                "dd/MM/yyyy"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Montant:</span>
                            <span className="font-medium">
                              {formatCurrency(sinistre.totalAmount)}
                            </span>
                          </div>
                          {sinistre.route && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Route:</span>
                              <Badge variant="outline" className="text-xs">
                                {getRouteLabel(sinistre.route)}
                              </Badge>
                            </div>
                          )}
                          {sinistre.assignedToEmail && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Affecté à:</span>
                              <span className="truncate max-w-[120px]">
                                {sinistre.assignedToEmail}
                              </span>
                            </div>
                          )}
                        </div>

                        {alerts.length > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-orange-600" />
                            <span className="text-xs text-orange-600 font-medium">
                              {alerts.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

