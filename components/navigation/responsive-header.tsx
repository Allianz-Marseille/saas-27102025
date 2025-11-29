"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ResponsiveHeaderProps {
  title: string;
  onMenuToggle: () => void;
  variant?: "admin" | "commercial" | "health";
  showNotifications?: boolean;
}

export function ResponsiveHeader({
  title,
  onMenuToggle,
  variant = "commercial",
  showNotifications = false,
}: ResponsiveHeaderProps) {
  const variantColors = {
    admin: "from-blue-600 via-purple-600 to-blue-600",
    commercial: "from-blue-600 via-purple-600 to-blue-600",
    health: "from-green-600 via-emerald-600 to-green-600",
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-30 lg:left-64 shadow-sm">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Burger + Logo */}
        <div className="flex items-center gap-3">
          {/* Bouton Burger - visible uniquement sur mobile/tablette */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Logo Allianz */}
          <Image
            src="/allianz.svg"
            alt="Allianz"
            width={80}
            height={20}
            className="h-5 w-auto brightness-0 dark:brightness-100 md:h-6"
            priority
          />

          {/* Titre - masqué sur mobile, visible sur tablette+ */}
          <h1
            className={cn(
              "hidden md:block text-base lg:text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
              variantColors[variant]
            )}
          >
            {title}
          </h1>
        </div>

        {/* Actions (Notifications + Thème) */}
        <div className="flex items-center gap-2">
          {showNotifications && <NotificationCenter />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

