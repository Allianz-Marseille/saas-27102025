"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onImagePaste?: (imageFile: File) => void;
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
  onImagePaste,
  isLoading = false,
  disabled = false,
  placeholder = "💬 Posez votre question...",
  autoFocusAfterResponse = true,
  lastResponseTime,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousResponseTimeRef = useRef<number | undefined>(undefined);
  const [pastedImage, setPastedImage] = useState<File | null>(null);

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

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Vérifier si c'est une image
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

        // Vérifier le type d'image
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          // Utiliser toast pour afficher l'erreur
          if (typeof window !== "undefined" && (window as any).toast) {
            (window as any).toast.error("Type d'image non supporté", {
              description: `Type autorisé: PNG, JPG, JPEG, WEBP`,
            });
          }
          console.warn("Type d'image non supporté:", file.type);
          continue;
        }

        // Vérifier la taille (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          if (typeof window !== "undefined" && (window as any).toast) {
            (window as any).toast.error("Image trop volumineuse", {
              description: `Taille maximale: 5MB`,
            });
          }
          console.warn("Image trop volumineuse:", file.size);
          continue;
        }

        // Appeler le callback avec l'image
        setPastedImage(file);
        if (onImagePaste) {
          onImagePaste(file);
        }
        break;
      }
    }
  };

  const removePastedImage = () => {
    setPastedImage(null);
  };

  return (
    <div className="p-4 border-t bg-white dark:bg-slate-900">
      {/* Preview de l'image collée */}
      {pastedImage && (
        <div className="mb-2 relative inline-block">
          <div className="relative group">
            <img
              src={URL.createObjectURL(pastedImage)}
              alt="Image collée"
              className="h-20 w-20 object-cover rounded-lg border-2 border-emerald-500"
            />
            <button
              onClick={removePastedImage}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Supprimer l'image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[80px]">
            {pastedImage.name || "Image collée"}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
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
            disabled={disabled || isLoading || (!value.trim() && !pastedImage)}
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
          
          {/* Indicateur de collage d'image */}
          {pastedImage && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <ImageIcon className="h-4 w-4" />
              <span>Image prête</span>
            </div>
          )}
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

