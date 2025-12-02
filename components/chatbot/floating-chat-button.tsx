"use client";

import { MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton flottant */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl",
          "bg-gradient-to-br from-blue-600 to-purple-600",
          "hover:from-blue-700 hover:to-purple-700",
          "transition-all duration-300",
          "group",
          isOpen && "rotate-0"
        )}
        aria-label={isOpen ? "Fermer le chatbot" : "Ouvrir le chatbot"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white transition-transform group-hover:rotate-90" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
        )}
        
        {/* Effet de pulsation quand fermé */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600" />
          </>
        )}
      </Button>

      {/* Fenêtre du chatbot */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-24 right-6 z-40 w-96 h-[600px]",
          "shadow-2xl border-2 border-blue-200 dark:border-blue-800",
          "transition-all duration-300",
          "flex flex-col"
        )}>
          {/* En-tête */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Assistant Allianz</h3>
                  <p className="text-xs opacity-90">Posez vos questions</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Corps du chat */}
          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
            <div className="space-y-4">
              {/* Message de bienvenue */}
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  A
                </div>
                <div className="flex-1">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                    <p className="text-sm">
                      Bonjour ! Je suis votre assistant virtuel Allianz. 
                      Comment puis-je vous aider aujourd&apos;hui ?
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maintenant
                  </p>
                </div>
              </div>

              {/* Message informatif */}
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-full text-xs text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                  <MessageSquare className="h-3 w-3" />
                  Chatbot en cours de configuration
                </div>
              </div>
            </div>
          </div>

          {/* Zone de saisie */}
          <div className="p-4 border-t bg-white dark:bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Posez votre question..."
                disabled
                className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button
                disabled
                size="icon"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Configuration en cours...
            </p>
          </div>
        </Card>
      )}
    </>
  );
}

