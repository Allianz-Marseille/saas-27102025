"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssistantTriggerProps {
  onClick: () => void;
}

export function AssistantTrigger({ onClick }: AssistantTriggerProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
    >
      <Button
        onClick={onClick}
        size="lg"
        className="h-auto px-5 py-3.5 rounded-full shadow-xl backdrop-blur-md bg-background/90 border border-border/60 hover:bg-background hover:border-amber-500/30 transition-all duration-300 group"
        aria-label="Ouvrir l'assistant IA"
      >
        <motion.div
          animate={{ opacity: [1, 0.8, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2.5"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <Sparkles className="h-4 w-4 text-amber-500 group-hover:text-amber-600 transition-colors" />
          </motion.div>
          <span className="text-sm font-semibold tracking-tight">Assistant</span>
        </motion.div>
      </Button>
    </motion.div>
  );
}

