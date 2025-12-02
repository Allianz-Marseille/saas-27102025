"use client";

/**
 * Bouton flottant pour accéder au chatbot
 * Visible sur toutes les pages (sauf login)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatbotWindow } from "./chatbot-window";
import { usePathname } from "next/navigation";

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Ne pas afficher sur la page de login
  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Bouton flottant */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="button"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="close"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setIsOpen(false)}
                size="lg"
                variant="destructive"
                className="h-14 w-14 rounded-full shadow-lg"
              >
                <X className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Fenêtre du chatbot */}
      <ChatbotWindow open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

