"use client";

import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { CountdownDial } from "@/components/dashboard/countdown-dial";
import { cn } from "@/lib/utils";

interface SidebarSessionFooterProps {
  countdownSeconds?: number;
  totalSeconds?: number;
  userData: { email: string; role?: string } | null;
  onLogout: () => void;
  variant: "admin" | "commercial" | "health";
  /** Surcharge le libellé du badge (ex. "SINISTRE" pour gestionnaire sinistre). */
  badgeLabel?: string;
  isCollapsed?: boolean;
}

const variantConfig = {
  admin: {
    avatarGradient: "from-slate-500 to-slate-700",
    badgeColor: "bg-slate-600",
    badgeLabel: "ADMIN",
    borderColor: "border-slate-200 dark:border-slate-700",
    bgGradient:
      "from-slate-500/5 via-slate-600/5 to-slate-700/5 dark:from-slate-600/10 dark:via-slate-700/10 dark:to-slate-800/10",
  },
  commercial: {
    avatarGradient: "from-blue-500 to-purple-600",
    badgeColor: "bg-blue-500",
    badgeLabel: "COMMERCIAL",
    borderColor: "border-slate-200 dark:border-slate-700",
    bgGradient:
      "from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10",
  },
  health: {
    avatarGradient: "from-green-500 to-emerald-600",
    badgeColor: "bg-green-500",
    badgeLabel: "SANTÉ",
    borderColor: "border-slate-200 dark:border-slate-800",
    bgGradient:
      "from-green-500/5 via-emerald-500/5 to-teal-500/5 dark:from-green-600/10 dark:via-emerald-600/10 dark:to-teal-600/10",
  },
};

export function SidebarSessionFooter({
  countdownSeconds,
  totalSeconds = 5 * 60,
  userData,
  onLogout,
  variant,
  badgeLabel,
  isCollapsed = false,
}: SidebarSessionFooterProps) {
  const config = variantConfig[variant];
  const resolvedBadgeLabel = badgeLabel ?? config.badgeLabel;

  return (
    <div className={cn("mt-auto border-t bg-gradient-to-r", config.bgGradient)}>
      {/* 1. Cadran compte à rebours */}
      {countdownSeconds !== undefined && (
        <div className={cn("py-2 border-b flex justify-center", config.borderColor)}>
          <CountdownDial secondsRemaining={countdownSeconds} totalSeconds={totalSeconds} />
        </div>
      )}

      {/* 2. Toggles clair/sombre — centrés */}
      <div className={cn("py-2 border-b flex justify-center", config.borderColor)}>
        <ThemeToggle showLabel={false} />
      </div>

      {/* 3. Qui est connecté */}
      {userData && !isCollapsed && (
        <div className={cn("p-3 border-b", config.borderColor)}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-base shadow-md shrink-0",
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
                  {resolvedBadgeLabel}
                </div>
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}

      {userData && isCollapsed && (
        <div className={cn("p-3 border-b flex justify-center", config.borderColor)}>
          <div
            className={cn(
              "h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-base shadow-md",
              config.avatarGradient
            )}
            title={userData.email}
          >
            {userData.email.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* 4. Bouton Se déconnecter avec pulse léger */}
      <div className="p-3">
        {!isCollapsed ? (
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full gap-2 rounded-xl border-slate-200 dark:border-slate-700 bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:border-red-800/60 dark:hover:text-red-300 transition-all duration-200 animate-pulse hover:animate-none"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Se déconnecter
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={onLogout}
            title="Se déconnecter"
            className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/40 dark:hover:border-red-800/60 dark:hover:text-red-300 transition-all duration-200 animate-pulse hover:animate-none"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
