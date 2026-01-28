"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Send, Copy, Check, FileText, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/assistant/MarkdownRenderer";
import { QuickReplyButtons } from "@/components/assistant/QuickReplyButtons";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/date-helpers";
import { createM3Session, getM3Session } from "@/lib/firebase/m3-sessions";
import { M3Session } from "@/types/m3-session";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  structuredResponse?: {
    message: string;
    buttons?: Array<{ label: string; value: string; type: string }>;
  };
}

export default function MPlus3BotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [m3SessionId, setM3SessionId] = useState<string | null>(null);
  const [m3Session, setM3Session] = useState<M3Session | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll automatique
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText?: string, uiEvent?: string) => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    const textToSend = messageText || input.trim();
    if (!textToSend && !uiEvent) return;

    // Ajouter le message utilisateur
    if (textToSend) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: textToSend,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    }

    // Créer le message assistant en attente
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          message: textToSend || " ",
          history: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          context: {
            buttonId: "commercial",
            subButtonId: "m-plus-3",
          },
          uiEvent: uiEvent || undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi du message");
      }

      // Mode streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setIsLoading(false);
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content" && parsed.content) {
                  accumulatedContent += parsed.content;
                  updateMessage(assistantMessageId, accumulatedContent);
                } else if (parsed.content) {
                  // Format simple sans type
                  accumulatedContent += parsed.content;
                  updateMessage(assistantMessageId, accumulatedContent);
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch {
                // Ignorer les erreurs de parsing
              }
            }
          }
        }
      }

      // Mettre à jour la session M+3 après la réponse
      if (m3SessionId) {
        try {
          const updatedSession = await getM3Session(m3SessionId);
          setM3Session(updatedSession);
        } catch (error) {
          console.error("Erreur lors de la mise à jour de la session:", error);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi du message");
      setIsLoading(false);
      // Supprimer le message assistant en erreur
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    }
  }, [user, input, messages, m3SessionId]);

  // Initialiser la session M+3 au chargement
  useEffect(() => {
    const initializeM3Session = async () => {
      if (!user?.uid) return;

      try {
        const sessionId = await createM3Session(user.uid);
        setM3SessionId(sessionId);
        
        const session = await getM3Session(sessionId);
        setM3Session(session);

        // Envoyer le message initial pour démarrer le workflow M+3
        // On envoie un message explicite pour déclencher le prompt M+3
        handleSendMessage("Démarrer le workflow M+3", "m3-start");
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la session M+3:", error);
        toast.error("Erreur lors de l'initialisation du bot M+3");
      }
    };

    initializeM3Session();
  }, [user?.uid, handleSendMessage]);

  const updateMessage = (messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, content } : msg))
    );
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success("Message copié");
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              Bot M+3 — Workflow Interactif
            </h1>
            <p className="text-muted-foreground">
              Assistant dédié pour réaliser un M+3 complet : préparation, appel client, et génération de sorties
            </p>
          </div>
        </div>
      </div>

      {/* Zone de chat */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-250px)]">
        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Initialisation du bot M+3...</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl p-4 shadow-sm",
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none"
                )}
              >
                <div className="relative group">
                  <MarkdownRenderer content={message.content} />
                  
                  {/* Boutons de réponse rapide */}
                  {message.role === "assistant" && message.content && (
                    <QuickReplyButtons
                      content={message.content}
                      onSelect={(option) => {
                        handleSendMessage(option);
                      }}
                      disabled={isLoading}
                    />
                  )}

                  {/* Bouton copier */}
                  {message.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      aria-label="Copier le message"
                      title="Copier le message"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {getRelativeTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-none p-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message ou collez la fiche client Lagon..."
              disabled={isLoading}
              className="min-h-[60px] max-h-[200px] resize-none"
              rows={2}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
          </p>
        </div>
      </div>

      {/* Informations session */}
      {m3Session && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Session M+3 active
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Statut : {m3Session.status} • Créée le {new Date(m3Session.createdAt).toLocaleString("fr-FR")}
              </p>
            </div>
            {m3Session.outputs && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Afficher les sorties générées
                  const outputsCount = [
                    m3Session.outputs?.der,
                    m3Session.outputs?.mail,
                    m3Session.outputs?.checklist,
                  ].filter(Boolean).length;
                  toast.info(`${outputsCount} sortie(s) générée(s)`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Voir les sorties
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
