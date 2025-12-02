"use client";

/**
 * Fenêtre principale du chatbot RAG
 * Gère l'historique de conversation et les appels API
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import type { ChatMessage as ChatMessageType } from "@/lib/rag/types";

interface ChatbotWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatbotWindow({ open, onOpenChange }: ChatbotWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Récupérer le token Firebase pour l'authentification
  const getAuthToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error("Erreur lors de la récupération du token:", error);
      return null;
    }
  };

  // Envoyer un message
  const handleSend = async (content: string) => {
    if (!user) {
      toast.error("Vous devez être connecté pour utiliser le chatbot");
      return;
    }

    // Ajouter le message utilisateur
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Impossible d'obtenir le token d'authentification");
      }

      // Préparer l'historique de conversation (derniers 10 messages)
      const conversationHistory = messages.slice(-10);

      // Appeler l'API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: content,
          conversationHistory: conversationHistory.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la génération de la réponse");
      }

      const data = await response.json();

      // Ajouter la réponse du bot
      const assistantMessage: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        sources: data.sources,
        metadata: {
          query: content,
          searchResults: data.searchResults,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la génération de la réponse"
      );

      // Ajouter un message d'erreur
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Désolé, une erreur s'est produite. Veuillez réessayer dans quelques instants.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Réinitialiser la conversation
  const handleClear = () => {
    setMessages([]);
    toast.success("Conversation réinitialisée");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Fenêtre du chatbot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 z-50 w-full max-w-2xl h-[600px] flex flex-col bg-background border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Assistant RAG</h2>
                  <p className="text-xs text-muted-foreground">
                    Posez vos questions sur les documents de l'agence
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-xs"
                  >
                    Effacer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Zone de messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-4">
                      <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      Bienvenue dans l'assistant RAG
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Posez vos questions sur les documents de l'agence. Je peux vous aider à
                      trouver des informations dans la base de connaissances.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp}
                      sources={message.sources}
                    />
                  ))
                )}

                {/* Indicateur de chargement */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-4"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Référence pour le scroll automatique */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Zone de saisie */}
            <ChatInput
              onSend={handleSend}
              isLoading={isLoading}
              disabled={!user}
              autoFocus={true}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

