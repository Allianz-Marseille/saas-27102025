"use client";

/**
 * Composant pour la zone de saisie du chatbot
 * Auto-select après chaque réponse pour fluidité
 */

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = "Posez votre question...",
  autoFocus = true,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus après chaque réponse
  useEffect(() => {
    if (autoFocus && !isLoading && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isLoading, autoFocus]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading && !disabled) {
      onSend(trimmedMessage);
      setMessage("");
      // Réinitialiser la hauteur du textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Envoyer avec Enter (sans Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              "resize-none min-h-[44px] max-h-[200px] pr-12",
              "focus-visible:ring-2 focus-visible:ring-primary/20"
            )}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {message.length > 0 && `${message.length} caractères`}
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Appuyez sur <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> pour
        envoyer, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> pour
        une nouvelle ligne
      </p>
    </div>
  );
}

