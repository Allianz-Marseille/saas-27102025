"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/firebase/use-auth";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BotChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface BotChatProps {
  botId: string;
  botName: string;
  className?: string;
}

/**
 * Interface de chat avec un bot IA.
 * Appel POST /api/chat avec { message, botId, history }.
 */
export function BotChat({ botId, botName, className }: BotChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BotChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !user || isLoading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);
    setStreamingContent("");

    try {
      const token = await user.getIdToken();
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          botId,
          history,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? `Erreur ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Pas de stream");
      }

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
      setStreamingContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
      setStreamingContent("");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="border-b bg-muted/30 px-4 py-2">
        <p className="font-medium text-sm">Chat avec {botName}</p>
      </div>

      <div className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <p className="text-muted-foreground text-sm">
            Posez votre question à {botName}. Santé et prévoyance TNS.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg px-3 py-2 text-sm max-w-[85%]",
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted"
            )}
          >
            {msg.content}
          </div>
        ))}
        {streamingContent && (
          <div className="mr-auto rounded-lg px-3 py-2 text-sm bg-muted max-w-[85%]">
            {streamingContent}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Votre message..."
            rows={2}
            className="resize-none min-h-[44px]"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="shrink-0 h-11 w-11">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
