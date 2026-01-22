"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { AdminMessage } from "@/types/message";
import {
  getScheduledMessages,
  cancelScheduledMessage,
} from "@/lib/firebase/scheduled-messages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, X, Calendar } from "lucide-react";
import { getRelativeTime, toDate } from "@/lib/utils/date-helpers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Liste des messages programmés avec possibilité d'annulation
 */
export function ScheduledMessagesList() {
  const { userData } = useAuth();
  const [scheduledMessages, setScheduledMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  useEffect(() => {
    if (userData && isAdmin(userData)) {
      loadScheduledMessages();
    }
  }, [userData]);

  const loadScheduledMessages = async () => {
    setLoading(true);
    try {
      const messages = await getScheduledMessages();
      setScheduledMessages(messages);
    } catch (error) {
      console.error("Erreur lors du chargement des messages programmés:", error);
      toast.error("Erreur lors du chargement des messages programmés");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedMessage) return;

    try {
      await cancelScheduledMessage(selectedMessage.id);
      toast.success("Message programmé annulé");
      setShowCancelDialog(false);
      setSelectedMessage(null);
      loadScheduledMessages();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'annulation";
      toast.error(errorMessage);
    }
  };

  const openCancelDialog = (message: AdminMessage) => {
    setSelectedMessage(message);
    setShowCancelDialog(true);
  };

  if (!userData || !isAdmin(userData)) {
    return null;
  }

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  if (scheduledMessages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucun message programmé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {scheduledMessages.map((message) => {
          const scheduledDate = message.scheduledAt
            ? toDate(message.scheduledAt)
            : null;

          return (
            <Card key={message.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{message.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {message.createdByName || "Admin"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Programmé
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {message.content}
                </div>
                {scheduledDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Envoi prévu le{" "}
                      {format(scheduledDate, "PPP 'à' HH:mm", { locale: fr })}
                    </span>
                    <span className="text-muted-foreground">
                      ({getRelativeTime(scheduledDate)})
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {message.totalRecipients} destinataire
                    {message.totalRecipients > 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCancelDialog(message)}
                    className="text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog d'annulation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler le message programmé</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler le message "{selectedMessage?.title}" ?
              Cette action est irréversible et le message ne sera pas envoyé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conserver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground"
            >
              Annuler le message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
