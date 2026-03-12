"use client";

import { LogOut } from "lucide-react";
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
    <div
      className={cn(
        "mt-auto border-t bg-gradient-to-r shrink-0",
        config.bgGradient,
        config.borderColor
      )}
    >
      {/* Ligne 1 : Minuteur + Thème (compact) */}
      <div className="flex items-center justify-center gap-2 py-1.5 px-2">
        {countdownSeconds !== undefined && (
          <CountdownDial
            secondsRemaining={countdownSeconds}
            totalSeconds={totalSeconds}
            size="sm"
          />
        )}
        <ThemeToggle showLabel={false} />
      </div>

      {/* Ligne 2 : Qui est connecté + Déconnexion */}
      <div className="flex items-center gap-2 py-1.5 px-2 border-t border-slate-200/80 dark:border-slate-700/80">
        {userData && (
          <>
            <div
              className={cn(
                "h-7 w-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shrink-0",
                config.avatarGradient
              )}
              title={userData.email}
            >
              {userData.email.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="text-xs font-medium truncate">
                  {userData.email.split("@")[0]}
                </span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold text-white shrink-0",
                    config.badgeColor
                  )}
                >
                  {resolvedBadgeLabel}
                </span>
              </div>
            )}
          </>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={onLogout}
          title="Se déconnecter"
          className={cn(
            "h-8 w-8 shrink-0 rounded-lg border-slate-200 dark:border-slate-700",
            "text-red-600 dark:text-red-400 hover:bg-red-50 hover:border-red-200",
            "dark:hover:bg-red-950/40 dark:hover:border-red-800/60",
            "transition-all duration-200 animate-pulse hover:animate-none",
            !isCollapsed && "ml-auto"
          )}
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
