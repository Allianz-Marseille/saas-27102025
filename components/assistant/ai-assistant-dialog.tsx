"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Car, Building2, Briefcase, Shield, Home, Building, Heart, Send, Loader2, Sparkles } from "lucide-react";
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
  CategoryConfig,
  ChatMessage,
} from "@/types/assistant.type";

const CATEGORIES: CategoryConfig[] = [
  {
    id: "auto",
    label: "Auto",
    icon: Car,
    color: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
    description: "Assurance automobile",
  },
  {
    id: "mrh",
    label: "MRH",
    icon: Building2,
    color: "text-green-600",
    gradient: "from-green-500 to-green-600",
    description: "Mutuelle Retraite Hospitalière",
  },
  {
    id: "pj",
    label: "PJ",
    icon: Briefcase,
    color: "text-purple-600",
    gradient: "from-purple-500 to-purple-600",
    description: "Personne Juridique",
  },
  {
    id: "gav",
    label: "GAV",
    icon: Shield,
    color: "text-orange-600",
    gradient: "from-orange-500 to-orange-600",
    description: "Garantie Accident de la Vie",
  },
  {
    id: "particulier",
    label: "Marché Particulier",
    icon: Home,
    color: "text-pink-600",
    gradient: "from-pink-500 to-pink-600",
    description: "Marché des particuliers",
  },
  {
    id: "pro",
    label: "Marché Pro",
    icon: Building,
    color: "text-indigo-600",
    gradient: "from-indigo-500 to-indigo-600",
    description: "Marché professionnel",
  },
  {
    id: "sante",
    label: "Marché Santé",
    icon: Heart,
    color: "text-red-600",
    gradient: "from-red-500 to-red-600",
    description: "Marché de la santé",
  },
];

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
  const [showCategories, setShowCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<AssistantCategory | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setShowCategories(true);
      setMessages([]);
      setSelectedCategory(null);
      setInputValue("");
    }
  }, [open]);

  // Scroll automatique vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus sur l'input quand les catégories sont masquées
  useEffect(() => {
    if (!showCategories && open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showCategories, open]);

  const sendMessage = async (content: string, category?: AssistantCategory) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date(),
      category: category || selectedCategory || undefined,
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
          message: content,
          category: category || selectedCategory || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur HTTP:", response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText || "Erreur serveur"}`);
      }

      const data = await response.json();

      // Si c'est une erreur, afficher le message d'erreur mais aussi logger pour le debug
      if (data.error) {
        console.error("Erreur API assistant:", data.error);
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response || data.error || "Désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Une erreur s'est produite : ${error.message || "Erreur réseau"}. Veuillez réessayer ou contacter le support si le problème persiste.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category: AssistantCategory) => {
    setSelectedCategory(category);
    setShowCategories(false);
    const categoryConfig = CATEGORIES.find((c) => c.id === category);
    const categoryLabel = categoryConfig?.label || category;
    sendMessage(
      `Je souhaite des informations sur ${categoryLabel}`,
      category
    );
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
          {showCategories ? (
            // Écran de sélection de catégorie
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Bonjour ! Je suis Nono le robot 🤖
                </h2>
                <p className="text-muted-foreground">
                  Sur quel sujet souhaitez-vous que je vous aide ?
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant="outline"
                      className={cn(
                        "h-auto flex-col gap-2 p-4 hover:scale-105 transition-transform",
                        "hover:bg-gradient-to-br hover:from-white hover:to-gray-50",
                        "dark:hover:from-gray-900 dark:hover:to-gray-800"
                      )}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-lg bg-gradient-to-br",
                          category.gradient
                        )}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-semibold">{category.label}</span>
                      {category.description && (
                        <span className="text-xs text-muted-foreground">
                          {category.description}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Zone de chat
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

