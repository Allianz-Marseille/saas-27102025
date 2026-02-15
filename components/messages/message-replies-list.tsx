"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { getRepliesByMessage, markReplyAsRead } from "@/lib/firebase/message-replies";
import { MessageReply } from "@/types/message";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime, toDate } from "@/lib/utils/date-helpers";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { isAdmin } from "@/lib/utils/roles";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageRepliesListProps {
  messageId: string;
  onRepliesChange?: () => void;
}

/**
 * Liste des réponses à un message
 */
export function MessageRepliesList({ messageId, onRepliesChange }: MessageRepliesListProps) {
  const { userData } = useAuth();
  const [replies, setReplies] = useState<MessageReply[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminUser = userData && isAdmin(userData);

  useEffect(() => {
    loadReplies();
  }, [messageId]);

  const loadReplies = async () => {
    setLoading(true);
    try {
      const repliesData = await getRepliesByMessage(messageId);
      setReplies(repliesData);
    } catch (error) {
      console.error("Erreur lors du chargement des réponses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (replyId: string) => {
    if (!isAdminUser) return;

    try {
      await markReplyAsRead(replyId);
      await loadReplies();
      onRepliesChange?.();
    } catch (error) {
      console.error("Erreur lors du marquage de la réponse comme lue:", error);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Chargement des réponses...
      </div>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold">Réponses ({replies.length})</h4>
      <div className="space-y-3">
        {replies.map((reply) => (
          <Card
            key={reply.id}
            className={cn(
              "relative",
              !reply.readByAdmin && isAdminUser && "border-primary/50 bg-primary/5"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {reply.userName || reply.userEmail || "Utilisateur"}
                    </span>
                    {isAdminUser && (
                      <button
                        onClick={() => handleMarkAsRead(reply.id)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title={reply.readByAdmin ? "Marqué comme lu" : "Marquer comme lu"}
                      >
                        {reply.readByAdmin ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getRelativeTime(toDate(reply.createdAt))}
                  </p>
                </div>
                {!reply.readByAdmin && isAdminUser && (
                  <Badge variant="outline" className="text-xs">
                    Non lu
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <MarkdownRenderer content={reply.content} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
