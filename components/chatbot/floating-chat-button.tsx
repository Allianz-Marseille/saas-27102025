"use client";

import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Bouton flottant avec visage de bot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl",
          "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500",
          "hover:scale-110 hover:shadow-blue-500/50",
          "transition-all duration-300 ease-out",
          "group relative overflow-hidden",
          "border-4 border-white dark:border-slate-800",
          isOpen && "scale-95"
        )}
        style={{ zIndex: 9999 }}
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
            <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-40" />
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
          </>
        )}
        
        {/* Badge "Nouveau" ou notification */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center animate-bounce">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        )}
      </button>

      {/* Fenêtre du chatbot */}
      {isOpen && (
        <Card 
          className={cn(
            "fixed bottom-24 right-6 w-96 h-[600px]",
            "shadow-2xl border-2 border-transparent",
            "transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in",
            "flex flex-col overflow-hidden",
            "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30",
            "dark:from-slate-900 dark:via-blue-950/20 dark:to-purple-950/20"
          )}
          style={{ zIndex: 9998 }}
        >
          {/* En-tête moderne avec dégradé */}
          <div className="relative p-4 border-b bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
            {/* Effet de brillance animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
            
            <div className="relative flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {/* Avatar du bot avec visage */}
                <div className="h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center relative">
                  <BotFaceIcon className="h-8 w-8" />
                  {/* Indicateur "en ligne" */}
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
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
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Message de bienvenue avec animation */}
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

              {/* Message informatif avec badge moderne */}
              <div className="text-center py-4 animate-in zoom-in-50 fade-in duration-700 delay-300">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-full text-xs font-medium text-amber-800 dark:text-amber-200 border-2 border-amber-200 dark:border-amber-800 shadow-sm">
                  <div className="relative">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    <span className="absolute inset-0 animate-ping">
                      <Sparkles className="h-3.5 w-3.5 opacity-75" />
                    </span>
                  </div>
                  Configuration en cours...
                </div>
              </div>
            </div>
          </div>

          {/* Zone de saisie moderne */}
          <div className="p-4 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="💬 Posez votre question..."
                  disabled
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white dark:bg-slate-800"
                />
                <button
                  disabled
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white disabled:opacity-50 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Propulsé par</span>
              <span className="text-[10px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Allianz AI</span>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

