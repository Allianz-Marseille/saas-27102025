"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocusAfterResponse?: boolean;
  lastResponseTime?: number;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = "💬 Posez votre question...",
  autoFocusAfterResponse = true,
  lastResponseTime,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousResponseTimeRef = useRef<number | undefined>(undefined);

  // Auto-select après réponse
  useEffect(() => {
    if (
      autoFocusAfterResponse &&
      lastResponseTime !== undefined &&
      lastResponseTime !== previousResponseTimeRef.current
    ) {
      previousResponseTimeRef.current = lastResponseTime;
      
      // Délai pour laisser le temps à l'UI de se mettre à jour
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [lastResponseTime, autoFocusAfterResponse]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t bg-white dark:bg-slate-900">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isLoading}
            className={cn(
              "w-full px-4 py-3 pr-12 border-2 rounded-2xl text-sm",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all bg-white dark:bg-slate-800",
              "border-gray-200 dark:border-gray-700",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500"
            )}
          />
          <Button
            onClick={onSend}
            disabled={disabled || isLoading || !value.trim()}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full",
              "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center shadow-md hover:shadow-lg",
              "transition-all hover:scale-110 ring-2 ring-emerald-300/30"
            )}
            title="Envoyer"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1 mt-2">
        <span className="text-[10px] text-muted-foreground">Propulsé par</span>
        <span className="text-[10px] font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
          Allianz AI
        </span>
      </div>
    </div>
  );
}

