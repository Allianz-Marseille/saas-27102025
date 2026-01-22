"use client";

import { AdminMessage } from "@/types/message";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getRelativeTime, toDate } from "@/lib/utils/date-helpers";
import { AlertCircle, Info, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { markAsRead } from "@/lib/firebase/messages";
import { useAuth } from "@/lib/firebase/use-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "@/components/assistant/MarkdownRenderer";
import { cn } from "@/lib/utils";

interface MessageModalProps {
  message: AdminMessage | null;
  messages?: AdminMessage[]; // Liste complète pour navigation
  currentIndex?: number; // Index du message actuel dans la liste
  open: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

/**
 * Modale de notification améliorée avec animations et navigation
 */
export function MessageModal({ 
  message, 
  messages = [],
  currentIndex = 0,
  open, 
  onClose,
  onNext,
  onPrevious,
}: MessageModalProps) {
  const { user } = useAuth();
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  // Filtrer les messages non lus pour l'indicateur de progression
  // Note: On utilise la liste complète des messages si fournie, sinon on ne montre pas l'indicateur
  const unreadMessages = messages.length > 0 ? messages : [];
  const currentUnreadIndex = message ? unreadMessages.findIndex((msg) => msg.id === message.id) : -1;
  const hasMultipleUnread = unreadMessages.length > 1 && currentUnreadIndex >= 0;

  useEffect(() => {
    if (message && user && open && !isMarkingAsRead) {
      setIsMarkingAsRead(true);
      // Marquer comme lu automatiquement à l'ouverture
      markAsRead(message.id, user.uid)
        .catch((err) => {
          console.error("Error marking message as read:", err);
        })
        .finally(() => {
          setIsMarkingAsRead(false);
        });
    }
  }, [message, user, open, isMarkingAsRead]);

  if (!message) {
    return null;
  }

  const getPriorityIcon = () => {
    switch (message.priority) {
      case "urgent":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "normal":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "low":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityBorderColor = () => {
    switch (message.priority) {
      case "urgent":
        return "border-red-500";
      case "high":
        return "border-orange-500";
      case "normal":
        return "border-blue-500";
      case "low":
        return "border-green-500";
      default:
        return "border-gray-300";
    }
  };

  const canGoNext = onNext && currentUnreadIndex < unreadMessages.length - 1;
  const canGoPrevious = onPrevious && currentUnreadIndex > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-2xl max-h-[90vh] overflow-y-auto p-0",
          "md:max-w-3xl",
          // Responsive : plein écran sur mobile
          "w-full h-full md:h-auto md:w-auto md:rounded-lg",
          // Bordure selon priorité
          getPriorityBorderColor(),
          message.priority === "urgent" && "border-2 animate-pulse"
        )}
        showCloseButton={true}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {/* Indicateur de progression */}
          {hasMultipleUnread && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Message {currentUnreadIndex + 1} sur {unreadMessages.length}
                </span>
                <span>{Math.round(((currentUnreadIndex + 1) / unreadMessages.length) * 100)}%</span>
              </div>
              <Progress 
                value={((currentUnreadIndex + 1) / unreadMessages.length) * 100} 
                className="h-2"
              />
            </div>
          )}

          <DialogHeader>
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                {getPriorityIcon()}
              </motion.div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold">
                  {message.title}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getRelativeTime(toDate(message.createdAt))}</span>
                    {message.createdByName && (
                      <>
                        <span>•</span>
                        <span>{message.createdByName}</span>
                      </>
                    )}
                  </div>
                </DialogDescription>
              </div>
              {message.pinned && (
                <Badge variant="outline" className="shrink-0">
                  📌 Épinglé
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="mt-4">
            <MarkdownRenderer content={message.content} />
            {message.category && (
              <div className="mt-4">
                <Badge variant="secondary">{message.category}</Badge>
              </div>
            )}
          </div>

          {/* Navigation entre messages */}
          {hasMultipleUnread && (canGoNext || canGoPrevious) && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={!canGoNext}
                className="flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
