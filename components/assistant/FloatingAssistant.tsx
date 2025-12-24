"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, X, Minimize2, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAssistantStore } from "@/lib/assistant/assistant-store";
import { AssistantCore } from "./AssistantCore";
import { toast } from "sonner";

export function FloatingAssistant() {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);

  // Store Zustand
  const {
    isOpenFloating: isOpen,
    setIsOpenFloating: setIsOpen,
    resetConversation,
    messages,
  } = useAssistantStore();

  // Charger l'état depuis localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("floating-assistant-open");
    if (savedState === "true") {
      setIsOpen(true);
    }
  }, [setIsOpen]);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem("floating-assistant-open", "true");
    } else {
      localStorage.setItem("floating-assistant-open", "false");
    }
  }, [isOpen]);

  const handleResetConversation = () => {
    resetConversation();
    toast.success("Conversation réinitialisée");
  };

  if (!user) return null;

  return (
    <>
      {/* Bouton flottant */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {/* Animation de pulsation en arrière-plan */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 opacity-20 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Badge IA */}
            <motion.div
              className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg z-10"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              IA
            </motion.div>

            <motion.button
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] transition-all duration-300 flex items-center justify-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Ouvrir l'assistant IA"
            >
              {/* Effet de brillance animé */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "linear",
                }}
              />

              {/* Icône principale */}
              <div className="relative z-10 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 absolute" />
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                </motion.div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? "auto" : "600px",
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] bg-[#ECE5DD] dark:bg-[#0b141a] border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "calc(100vh - 3rem)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-sm opacity-50" />
                  <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-2 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">Assistant IA</h3>
                  <p className="text-xs text-white/80">En ligne</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetConversation}
                    aria-label="Réinitialiser la conversation"
                    title="Réinitialiser la conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  aria-label={isMinimized ? "Agrandir" : "Réduire"}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Fermer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Core Assistant (si pas minimisé) */}
            {!isMinimized && <AssistantCore variant="floating" />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
