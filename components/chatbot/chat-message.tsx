"use client";

/**
 * Composant pour afficher un message dans le chatbot
 * Supporte le formatage markdown pour les réponses du bot
 */

import { motion } from "framer-motion";
import { Copy, Check, Bot, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  sources?: string[];
  onCopy?: () => void;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  sources,
  onCopy,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
    }
  };

  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser
          ? "bg-primary/10 dark:bg-primary/20 ml-auto max-w-[85%]"
          : "bg-slate-50 dark:bg-slate-800/50 mr-auto max-w-[90%]"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {isUser ? "Vous" : "Assistant"}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Message */}
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            "prose-headings:font-semibold prose-headings:text-foreground",
            "prose-p:text-foreground prose-p:leading-relaxed",
            "prose-ul:my-2 prose-ol:my-2",
            "prose-li:my-1",
            "prose-code:text-sm prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
            "prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:p-3 prose-pre:rounded-lg",
            "prose-strong:font-semibold prose-strong:text-foreground",
            "prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80"
          )}
        >
          {isUser ? (
            <p className="text-foreground whitespace-pre-wrap">{content}</p>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>

        {/* Sources (pour les réponses du bot) */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Sources :</p>
            <div className="flex flex-wrap gap-1">
              {sources.map((source, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bouton copier (pour les réponses du bot uniquement) */}
        {!isUser && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copier
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

