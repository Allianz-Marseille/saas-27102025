"use client";

import { useEffect, useRef } from "react";
import { X, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAssistantStore } from "@/lib/assistant/assistant-store";
import { AssistantCore } from "./AssistantCore";
import { toast } from "sonner";

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssistantDrawer({ isOpen, onClose }: AssistantDrawerProps) {
  const { user } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store Zustand
  const { resetConversation, messages } = useAssistantStore();

  // Focus trap et gestion du focus
  useEffect(() => {
    if (!isOpen) return;

    // Sauvegarder l'élément actif avant l'ouverture
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus trap : garder le focus dans le drawer
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !drawerRef.current) return;

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Fermer avec Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        // Restaurer le focus sur l'élément précédent
        previousActiveElementRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleTabKey);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleTabKey);
      window.removeEventListener("keydown", handleEscape);
      // Restaurer le focus à la fermeture
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleResetConversation = () => {
    resetConversation();
    toast.success("Conversation réinitialisée");
  };

  if (!user) return null;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-background/95 backdrop-blur-lg border-l border-border/50 shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-drawer-title"
        aria-describedby="assistant-drawer-description"
      >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-sm opacity-50" />
                  <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-2 sm:p-2.5 rounded-lg">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
              <h2
                id="assistant-drawer-title"
                className="font-bold text-base sm:text-lg tracking-tight truncate bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                    Assistant IA
                  </h2>
              <p
                id="assistant-drawer-description"
                className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block"
              >
                Comment puis-je vous aider ?
              </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                onClick={handleResetConversation}
                    aria-label="Réinitialiser la conversation"
                    className="hover:bg-muted/50"
                    title="Réinitialiser la conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer" className="hover:bg-muted/50">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

        {/* Core Assistant */}
        <AssistantCore variant="drawer" />
      </div>
    </>
  );
}
