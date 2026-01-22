"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { createReply } from "@/lib/firebase/message-replies";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { isAdmin } from "@/lib/utils/roles";

interface MessageReplyProps {
  messageId: string;
  onReplySent?: () => void;
}

/**
 * Composant pour répondre à un message (commerciaux uniquement)
 */
export function MessageReply({ messageId, onReplySent }: MessageReplyProps) {
  const { user, userData } = useAuth();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Ne pas afficher pour les admins
  if (!userData || isAdmin(userData)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !content.trim()) return;

    setSending(true);
    try {
      await createReply(
        messageId,
        user.uid,
        userData.email?.split("@")[0] || undefined,
        userData.email || undefined,
        content.trim()
      );
      toast.success("Réponse envoyée");
      setContent("");
      onReplySent?.();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
      toast.error("Erreur lors de l'envoi de la réponse");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4 mt-4">
      <div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre réponse..."
          rows={4}
          className="resize-none"
          disabled={sending}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!content.trim() || sending}>
          <Send className="h-4 w-4 mr-2" />
          {sending ? "Envoi..." : "Envoyer la réponse"}
        </Button>
      </div>
    </form>
  );
}
