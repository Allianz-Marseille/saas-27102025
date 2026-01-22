"use client";

import { AdminMessage } from "@/types/message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime, toDate } from "@/lib/utils/date-helpers";
import {
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  Pin,
  Bell,
  Paperclip,
  PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface MessageCardProps {
  message: AdminMessage;
  onClick?: () => void;
  isRead?: boolean;
  onPinToggle?: (messageId: string, pin: boolean) => void;
  showAdminActions?: boolean;
}

/**
 * Carte de message améliorée avec effets visuels et indicateurs
 */
export function MessageCard({ 
  message, 
  onClick, 
  isRead = false,
  onPinToggle,
  showAdminActions = false,
}: MessageCardProps) {
  const getPriorityIcon = () => {
    switch (message.priority) {
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "normal":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBorderColor = () => {
    switch (message.priority) {
      case "urgent":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "normal":
        return "border-l-blue-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-300";
    }
  };

  const hasAttachments =
    (message.attachments && message.attachments.length > 0) ||
    (message.images && message.images.length > 0) ||
    (message.videos && message.videos.length > 0);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:shadow-lg hover:border-primary/50",
          // Bordure épaisse si non lu
          !isRead && "border-2 border-primary/50",
          // Barre colorée sur le côté gauche selon priorité
          "border-l-4",
          getPriorityBorderColor()
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle
              className={cn(
                "text-lg font-semibold line-clamp-2",
                !isRead && "font-bold"
              )}
            >
              {message.title}
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              {getPriorityIcon()}
              {/* Icônes contextuelles */}
              {message.pinned && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Pin className="h-3 w-3" />
                  Épinglé
                </Badge>
              )}
              {message.awaitingReply && (
                <Badge variant="outline" className="text-xs gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Bell className="h-3 w-3" />
                  Réponse requise
                </Badge>
              )}
              {hasAttachments && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Paperclip className="h-3 w-3" />
                  Pièce jointe
                </Badge>
              )}
              {/* Bouton épingler/désépingler (admin uniquement) */}
              {showAdminActions && onPinToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinToggle(message.id, !message.pinned);
                  }}
                  title={message.pinned ? "Désépingler" : "Épingler"}
                >
                  {message.pinned ? (
                    <PinOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Pin className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {getRelativeTime(toDate(message.createdAt))}
            </span>
            {message.createdByName && (
              <>
                <span>•</span>
                <span>{message.createdByName}</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {message.content}
          </p>
          {message.category && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                {message.category}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
