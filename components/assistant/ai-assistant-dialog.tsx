"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  AssistantCategory,
  ChatMessage,
} from "@/types/assistant.type";

interface AiAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiAssistantDialog({
  open,
  onOpenChange,
}: AiAssistantDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setMessages([]);
      setInputValue("");
      // Focus sur l'input quand le modal s'ouvre
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Scroll automatique vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const sendMessage = async (
    content: string,
    category?: AssistantCategory,
    theme?: "retail" | "pro" | "specialized"
  ) => {
    if (!content.trim() || isLoading) return;

    const finalCategory = category || undefined;
    const finalTheme = theme || undefined;

    const userMessage: ChatMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      category: finalCategory,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content.trim(),
          category: finalCategory,
          theme: finalTheme,
        }),
      });

      // L'API retourne toujours 200, même en cas d'erreur
      const data = await response.json();

      // Vérifier si c'est une erreur
      if (data.error) {
        console.error("Erreur API assistant:", data.error);
      }

      // Utiliser le message de réponse (qui peut être un message d'erreur user-friendly)
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response || data.error || "Désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error);
      
      // Déterminer le message d'erreur approprié
      let errorMessage = "Une erreur s'est produite. Veuillez réessayer.";
      
      if (error.name === "AbortError" || error.message?.includes("timeout")) {
        errorMessage = "La requête a pris trop de temps. Veuillez réessayer avec une question plus courte.";
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("network")) {
        errorMessage = "Problème de connexion. Vérifiez votre connexion internet et réessayez.";
      } else if (error.message) {
        errorMessage = `Erreur : ${error.message}`;
      }

      const errorChatMessage: ChatMessage = {
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="relative">
              <Bot className="h-6 w-6 text-blue-600" />
              <Sparkles className="h-3 w-3 text-purple-500 absolute -top-1 -right-1" />
            </div>
            Nono le robot
          </DialogTitle>
          <DialogDescription>
            Assistant IA pour vos questions sur les actions commerciales, codes de réduction et dispositifs
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Zone de chat */}
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Bot className="h-12 w-12 text-blue-600 opacity-50" />
                    <p className="text-muted-foreground text-center">
                      Commencez une conversation avec Nono le robot
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {message.role === "user" ? "Vous" : "Nono"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t p-4 flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Posez votre question à Nono le robot..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </>
        </div>
      </DialogContent>
    </Dialog>
  );
}

