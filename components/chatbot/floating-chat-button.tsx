"use client";

import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/firebase/use-auth";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";

// Composant SVG personnalisé pour le bot avec un visage souriant
function BotFaceIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tête du robot */}
      <circle cx="50" cy="50" r="45" fill="white" opacity="0.95" />
      
      {/* Antenne */}
      <line x1="50" y1="5" x2="50" y2="15" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="3" r="3" fill="white" />
      
      {/* Yeux */}
      <circle cx="35" cy="40" r="6" fill="#3b82f6" className="animate-pulse" />
      <circle cx="65" cy="40" r="6" fill="#3b82f6" className="animate-pulse" />
      
      {/* Reflets dans les yeux pour les rendre vivants */}
      <circle cx="37" cy="38" r="2" fill="white" opacity="0.8" />
      <circle cx="67" cy="38" r="2" fill="white" opacity="0.8" />
      
      {/* Bouche souriante */}
      <path
        d="M 30 60 Q 50 75 70 60"
        stroke="#3b82f6"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Joues roses */}
      <circle cx="25" cy="55" r="5" fill="#ec4899" opacity="0.3" />
      <circle cx="75" cy="55" r="5" fill="#ec4899" opacity="0.3" />
    </svg>
  );
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  imageUrl?: string;
  imageText?: string; // Texte extrait de l'image via OCR
}

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState<number | undefined>(undefined);
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const { user } = useAuth();

  const handleImagePaste = async (imageFile: File) => {
    setPastedImage(imageFile);
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !pastedImage) || !user) return;

    setIsLoading(true);

    try {
      let imageText = "";
      let imageUrl = "";

      // Si une image est collée, l'analyser d'abord
      if (pastedImage) {
        try {
          const formData = new FormData();
          formData.append("image", pastedImage);

          const token = await user.getIdToken();
          const imageResponse = await fetch("/api/chat/analyze-image", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            imageText = imageData.text || "";
            imageUrl = imageData.imageUrl || "";
          } else {
            console.error("Erreur analyse image:", await imageResponse.json());
          }
        } catch (error) {
          console.error("Erreur lors de l'analyse de l'image:", error);
        }
      }

      // Construire le message utilisateur
      let messageContent = inputValue.trim();
      if (imageText) {
        messageContent = messageContent 
          ? `${messageContent}\n\n[Image analysée: ${imageText}]`
          : `[Image analysée: ${imageText}]`;
      }

      const userMessage: Message = {
        role: "user",
        content: messageContent,
        imageUrl: imageUrl || (pastedImage ? URL.createObjectURL(pastedImage) : undefined),
        imageText: imageText || undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setPastedImage(null);

      // Envoyer la requête au chatbot
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: messageContent,
          conversationHistory: messages,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetails = errorData.details || errorData.error || "Erreur lors de l'envoi du message";
        throw new Error(errorDetails);
      }

      const data = await response.json();
      
      // Vérifier si la réponse contient une erreur
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "Désolé, je n'ai pas pu générer de réponse.",
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastResponseTime(Date.now());
    } catch (error) {
      console.error("Erreur:", error);
      let errorText = "Désolé, une erreur s'est produite. Veuillez réessayer.";
      
      if (error instanceof Error) {
        // Messages d'erreur plus spécifiques
        if (error.message.includes("Configuration OpenAI") || error.message.includes("API key")) {
          errorText = "⚠️ Configuration OpenAI manquante. Veuillez contacter l'administrateur.";
        } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorText = "🔑 Clé API OpenAI invalide. Veuillez contacter l'administrateur.";
        } else {
          errorText = `❌ ${error.message}`;
        }
      }
      
      const errorMessage: Message = {
        role: "assistant",
        content: errorText,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setLastResponseTime(Date.now());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant avec visage de bot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "h-16 w-16 rounded-full shadow-2xl",
          "bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600",
          "hover:scale-110 hover:shadow-emerald-500/60",
          "transition-all duration-300 ease-out",
          "group relative overflow-hidden",
          "border-4 border-white dark:border-slate-800",
          "ring-4 ring-emerald-400/30",
          isOpen && "scale-95"
        )}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.3), 0 10px 10px -5px rgba(16, 185, 129, 0.2)',
        }}
        aria-label={isOpen ? "Fermer le chatbot" : "Ouvrir le chatbot"}
      >
        {/* Effet de brillance animé */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        
        {/* Contenu du bouton */}
        <div className="relative z-10 flex items-center justify-center h-full w-full">
          {isOpen ? (
            <X className="h-7 w-7 text-white transition-transform group-hover:rotate-90 drop-shadow-lg" />
          ) : (
            <BotFaceIcon className={cn(
              "h-12 w-12 transition-transform duration-300",
              isHovered && "scale-110 rotate-6"
            )} />
          )}
        </div>
        
        {/* Effet de pulsation quand fermé */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 blur-md opacity-80 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </button>

      {/* Fenêtre du chatbot */}
      {isOpen && (
        <Card 
          className={cn(
            "w-96 h-[600px]",
            "shadow-2xl border-2 border-blue-200 dark:border-blue-800",
            "transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in",
            "flex flex-col overflow-hidden",
            "bg-white dark:bg-slate-900"
          )}
          style={{
            position: 'fixed',
            bottom: '104px',
            right: '24px',
            zIndex: 9998,
          }}
        >
          {/* En-tête moderne avec dégradé */}
          <div className="relative p-4 border-b bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 overflow-hidden">
            {/* Effet de brillance animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
            
            <div className="relative flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {/* Avatar du bot avec visage */}
                <div className="h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center relative ring-2 ring-emerald-300">
                  <BotFaceIcon className="h-8 w-8" />
                  {/* Indicateur "en ligne" */}
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse shadow-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    Assistant Allianz
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </h3>
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <span className="inline-block h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                    En ligne • Prêt à vous aider
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 hover:bg-white/20 rounded-full transition-all hover:rotate-90"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Corps du chat avec fond amélioré */}
          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <div className="space-y-4">
              {/* Message de bienvenue si pas de messages */}
              {messages.length === 0 && (
                <div className="flex gap-3 animate-in slide-in-from-left-4 fade-in duration-500">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shrink-0">
                    <BotFaceIcon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 shadow-md border border-blue-100 dark:border-blue-900">
                      <p className="text-sm leading-relaxed">
                        👋 <strong>Bonjour !</strong> Je suis votre assistant virtuel Allianz.
                        <br />
                        <br />
                        Je suis là pour répondre à toutes vos questions ! 
                        Comment puis-je vous aider aujourd&apos;hui ?
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 ml-2 flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 bg-blue-500 rounded-full" />
                      À l&apos;instant
                    </p>
                  </div>
                </div>
              )}

              {/* Messages de conversation */}
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  userInitial={user?.email?.charAt(0).toUpperCase() || "U"}
                  BotIcon={BotFaceIcon}
                />
              ))}

              {/* Message de chargement */}
              {isLoading && (
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0 ring-2 ring-emerald-300/50">
                  <BotFaceIcon className="h-8 w-8" />
                </div>
                  <div className="flex-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 shadow-md border border-blue-100 dark:border-blue-900">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" />
                        <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce delay-100" />
                        <span className="h-2 w-2 bg-pink-500 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone de saisie moderne */}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            onImagePaste={handleImagePaste}
            isLoading={isLoading}
            disabled={!user}
            autoFocusAfterResponse={true}
            lastResponseTime={lastResponseTime}
          />
        </Card>
      )}
    </>
  );
}

