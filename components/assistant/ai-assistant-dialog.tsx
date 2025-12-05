"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Car, Building2, Briefcase, Shield, Home, Building, Heart, Send, Loader2, Sparkles, ArrowLeft, Lightbulb, Users, Briefcase as BriefcaseIcon, Award } from "lucide-react";
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
import { THEME_CONFIGS, type PromptSuggestion } from "@/lib/assistant/prompts";

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
  const [showPrompts, setShowPrompts] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<"retail" | "pro" | "specialized" | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<AssistantCategory | null>(null);
  const [currentTheme, setCurrentTheme] = useState<"retail" | "pro" | "specialized" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setShowCategories(true);
      setShowPrompts(false);
      setMessages([]);
      setSelectedCategory(null);
      setSelectedTheme(null);
      setCurrentTheme(null);
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

  const sendMessage = async (
    content: string,
    category?: AssistantCategory,
    theme?: "retail" | "pro" | "specialized"
  ) => {
    if (!content.trim() || isLoading) return;

    const finalCategory = category || selectedCategory || undefined;
    const finalTheme = theme || currentTheme || selectedTheme || undefined;

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

  const handleCategorySelect = (category: AssistantCategory) => {
    setSelectedCategory(category);
    setShowCategories(false);
    setShowPrompts(false);
    const categoryConfig = CATEGORIES.find((c) => c.id === category);
    const categoryLabel = categoryConfig?.label || category;
    sendMessage(
      `Je souhaite des informations sur ${categoryLabel}`,
      category
    );
  };

  const handlePromptSelect = (prompt: PromptSuggestion) => {
    setShowPrompts(false);
    setShowCategories(false);
    if (prompt.category) {
      setSelectedCategory(prompt.category as AssistantCategory);
    }
    setCurrentTheme(prompt.theme);
    sendMessage(prompt.text, prompt.category as AssistantCategory | undefined, prompt.theme);
  };

  const handleThemeSelect = (theme: "retail" | "pro" | "specialized") => {
    setSelectedTheme(theme);
    setCurrentTheme(theme);
    setShowCategories(false);
    setShowPrompts(true);
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
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Bonjour ! Je suis Nono le robot 🤖
                </h2>
                <p className="text-muted-foreground">
                  Sur quel sujet souhaitez-vous que je vous aide ?
                </p>
              </div>

              {/* Section des thèmes d'offres commerciales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <h3 className="font-semibold text-lg">Offres Commerciales</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {THEME_CONFIGS.map((theme) => {
                    const themeIcons = {
                      retail: Home,
                      pro: BriefcaseIcon,
                      specialized: Award,
                    };
                    const Icon = themeIcons[theme.id];
                    const themeColors = {
                      retail: "from-pink-500 to-pink-600",
                      pro: "from-indigo-500 to-indigo-600",
                      specialized: "from-purple-500 to-purple-600",
                    };
                    return (
                      <Button
                        key={theme.id}
                        variant="outline"
                        className={cn(
                          "h-auto flex-col gap-3 p-5 hover:scale-105 transition-transform text-left",
                          "hover:bg-gradient-to-br hover:from-white hover:to-gray-50",
                          "dark:hover:from-gray-900 dark:hover:to-gray-800",
                          "min-h-[140px] overflow-hidden"
                        )}
                        onClick={() => handleThemeSelect(theme.id)}
                      >
                        <div
                          className={cn(
                            "p-3 rounded-lg bg-gradient-to-br flex-shrink-0",
                            themeColors[theme.id]
                          )}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-semibold text-sm md:text-base">
                          {theme.label}
                        </span>
                        <span className="text-xs text-muted-foreground text-center line-clamp-2 overflow-hidden">
                          {theme.description}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Section des catégories produits */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <h3 className="font-semibold text-lg">Produits & Marchés</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant="outline"
                      className={cn(
                          "h-auto flex-col gap-2 p-5 hover:scale-105 transition-transform",
                        "hover:bg-gradient-to-br hover:from-white hover:to-gray-50",
                          "dark:hover:from-gray-900 dark:hover:to-gray-800",
                          "min-h-[120px] overflow-hidden"
                      )}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <div
                        className={cn(
                            "p-3 rounded-lg bg-gradient-to-br flex-shrink-0",
                          category.gradient
                        )}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                        <span className="font-semibold text-sm md:text-base">
                          {category.label}
                        </span>
                      {category.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2 overflow-hidden text-center">
                          {category.description}
                        </span>
                      )}
                    </Button>
                  );
                })}
                </div>
              </div>
            </div>
          ) : showPrompts && selectedTheme ? (
            // Écran de sélection d'amorces pour un thème
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-6 space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPrompts(false);
                    setShowCategories(true);
                    setSelectedTheme(null);
                  }}
                  className="w-fit"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux catégories
                </Button>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {THEME_CONFIGS.find((t) => t.id === selectedTheme)?.label}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {THEME_CONFIGS.find((t) => t.id === selectedTheme)?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      Questions suggérées :
                    </h3>
                    <div className="space-y-2">
                      {THEME_CONFIGS.find((t) => t.id === selectedTheme)?.prompts.map(
                        (prompt) => (
                          <Button
                            key={prompt.id}
                            variant="outline"
                            className="w-full justify-start text-left h-auto p-3 hover:bg-muted"
                            onClick={() => handlePromptSelect(prompt)}
                          >
                            <span className="text-sm">{prompt.text}</span>
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Zone de chat
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <p className="text-muted-foreground text-center">
                      Commencez une conversation avec Nono le robot
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCategories(true);
                        setShowPrompts(false);
                        setSelectedTheme(null);
                        setSelectedCategory(null);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voir les catégories
                    </Button>
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

