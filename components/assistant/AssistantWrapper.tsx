"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AssistantTrigger } from "./AssistantTrigger";
import { AssistantDrawer } from "./AssistantDrawer";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { ProcessedFile } from "@/lib/assistant/file-processing";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  files?: { name: string; type: string; content?: string; error?: string }[];
  timestamp: Date;
}

export function AssistantWrapper() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [responseProgress, setResponseProgress] = useState(0);

  const handleOpenDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleResetConversation = useCallback(() => {
    setMessages([]);
    toast.success("Conversation réinitialisée");
  }, []);

  const handleSendMessage = useCallback(async (input: string, images: string[], files: ProcessedFile[], mainButton?: string, subButton?: string) => {
    if (!user) {
      toast.error("Vous devez être connecté pour utiliser l'assistant.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      images: images.length > 0 ? images : undefined,
      files: files.length > 0 ? files.map(f => ({ name: f.name, type: f.type, content: f.content, error: f.error })) : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setResponseProgress(0);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Préparer l'historique de conversation (sans les fichiers/images pour éviter la surcharge)
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        // Ne pas inclure les images et fichiers dans l'historique pour éviter la surcharge
      }));

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          message: input,
          images: images.length > 0 ? images : undefined,
          files: files.length > 0 ? files.map(f => ({ name: f.name, type: f.type, content: f.content })) : undefined,
          history: conversationHistory,
          mainButton: mainButton || undefined,
          subButton: subButton || undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi du message");
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";
        let totalLength = 0;
        const estimatedMaxLength = 2000;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              setResponseProgress(100);
              setTimeout(() => setResponseProgress(0), 500);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  setResponseProgress(100);
                  setTimeout(() => setResponseProgress(0), 500);
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === "content" && parsed.content) {
                    accumulatedContent += parsed.content;
                    totalLength += parsed.content.length;
                    const progress = Math.min(95, Math.floor((totalLength / estimatedMaxLength) * 100));
                    setResponseProgress(progress);
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  } else if (parsed.type === "error") {
                    throw new Error(parsed.error);
                  } else if (parsed.content) {
                    accumulatedContent += parsed.content;
                    totalLength += parsed.content.length;
                    const progress = Math.min(95, Math.floor((totalLength / estimatedMaxLength) * 100));
                    setResponseProgress(progress);
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  }
                } catch (e) {
                  console.error("Erreur parsing SSE:", e);
                }
              }
            }
          }
        }
      } else {
        const data = await response.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: data.response || data.message || "Aucune réponse reçue",
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi du message"
      );
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
      setResponseProgress(0);
    }
  }, [user]);

  // Ne pas afficher le bot si l'utilisateur n'est pas connecté
  if (!user) return null;

  // Ne pas afficher le bot sur la homepage et la page de login
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <>
      <AssistantTrigger onClick={handleOpenDrawer} />
          <AssistantDrawer
            isOpen={isOpen}
            onClose={handleCloseDrawer}
            onSendMessage={handleSendMessage}
            onReset={handleResetConversation}
            messages={messages}
            isLoading={isLoading}
            responseProgress={responseProgress}
          />
    </>
  );
}

