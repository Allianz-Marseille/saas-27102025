"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  separator?: boolean;
}

interface NavigationItemsProps {
  items: NavItem[];
  currentPath: string;
  variant?: "admin" | "commercial" | "health";
  onLogout: () => void;
  userData: {
    email: string;
    role?: string;
  } | null;
  onNavigate?: () => void; // Callback pour fermer le menu mobile après navigation
}

export function NavigationItems({
  items,
  currentPath,
  variant = "commercial",
  onLogout,
  userData,
  onNavigate,
}: NavigationItemsProps) {
  const variantConfig = {
    admin: {
      activeGradient: "from-blue-600 via-purple-600 to-blue-600",
      hoverGradient: "from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30",
      badgeColor: "bg-purple-500",
      badgeLabel: "ADMIN",
      headerGradient: "from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20",
      avatarGradient: "from-blue-500 to-purple-600",
    },
    commercial: {
      activeGradient: "from-blue-600 via-purple-600 to-blue-600",
      hoverGradient: "from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30",
      badgeColor: "bg-blue-500",
      badgeLabel: "COMMERCIAL",
      headerGradient: "from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20",
      avatarGradient: "from-blue-500 to-purple-600",
    },
    health: {
      activeGradient: "from-green-500 to-emerald-600",
      hoverGradient: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
      badgeColor: "bg-green-500",
      badgeLabel: "SANTÉ",
      headerGradient: "from-green-500/10 via-emerald-500/10 to-green-500/10 dark:from-green-600/20 dark:via-emerald-600/20 dark:to-green-600/20",
      avatarGradient: "from-green-500 to-emerald-600",
    },
  };

  const config = variantConfig[variant];

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? currentPath === item.href
            : currentPath?.startsWith(item.href);

          return (
            <div key={item.href}>
              {/* Séparateur visuel */}
              {item.separator && <div className="my-3 border-t border-muted" />}
              
              <Link href={item.href} onClick={onNavigate}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 transition-all relative overflow-hidden",
                    isActive
                      ? `bg-gradient-to-r ${config.activeGradient} text-white font-semibold shadow-md`
                      : `hover:bg-gradient-to-r hover:${config.hoverGradient}`
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="mt-auto border-t bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10">
        {/* Info utilisateur */}
        {userData && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md",
                  config.avatarGradient
                )}
              >
                {userData.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {userData.email.split("@")[0]}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-full text-white text-[10px] font-bold",
                      config.badgeColor
                    )}
                  >
                    {config.badgeLabel}
                  </div>
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton Déconnexion */}
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full gap-3 bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}

