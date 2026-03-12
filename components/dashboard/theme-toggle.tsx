"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** Afficher le libellé "Mode clair" / "Mode sombre". Par défaut true. */
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5",
          showLabel ? "flex gap-0.5" : "inline-flex gap-0.5"
        )}
        aria-hidden
      >
        <span className="h-8 w-9 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
        <span className="h-8 w-9 rounded-full" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const label = isDark ? "Mode clair" : "Mode sombre";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex rounded-full p-0.5 transition-colors duration-200",
        "bg-slate-100 dark:bg-slate-800/80",
        "ring-1 ring-slate-200/60 dark:ring-slate-700/60",
        showLabel ? "gap-0.5" : ""
      )}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        title="Mode clair"
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-200",
          "h-8 min-w-[2rem]",
          showLabel && "px-3 gap-1.5",
          !isDark
            ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-600/80"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        )}
      >
        <Sun className="h-4 w-4 shrink-0" aria-hidden />
        {showLabel && (
          <span className="text-xs font-medium hidden sm:inline">Clair</span>
        )}
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        title="Mode sombre"
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-200",
          "h-8 min-w-[2rem]",
          showLabel && "px-3 gap-1.5",
          isDark
            ? "bg-slate-700 dark:bg-slate-600 text-slate-100 shadow-sm ring-1 ring-slate-600/80 dark:ring-slate-500/80"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        )}
      >
        <Moon className="h-4 w-4 shrink-0" aria-hidden />
        {showLabel && (
          <span className="text-xs font-medium hidden sm:inline">Sombre</span>
        )}
      </button>
    </div>
  );
}
