"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: "admin" | "commercial" | "health";
}

export function MobileMenu({
  isOpen,
  onClose,
  children,
  variant = "commercial",
}: MobileMenuProps) {
  // Bloquer le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fermer le menu avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const variantColors = {
    admin: "from-blue-600 to-purple-600",
    commercial: "from-blue-500 to-purple-600",
    health: "from-green-500 to-emerald-600",
  };

  return (
    <>
      {/* Overlay - masqué sur desktop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Menu Slide - masqué sur desktop */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-950 shadow-2xl z-50 transition-transform duration-300 lg:hidden",
          "border-r border-slate-200 dark:border-slate-800",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        {/* Header avec titre et bouton close */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div
            className={cn(
              "text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent",
              variantColors[variant]
            )}
          >
            Menu
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Fermer le menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu du menu (navigation items) */}
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {children}
        </div>
      </aside>
    </>
  );
}

