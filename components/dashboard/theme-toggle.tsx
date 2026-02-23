"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  /** Afficher le libellé "Mode clair" / "Mode sombre". Par défaut true (masqué sur très petit écran via sm:inline). */
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const newTheme = isDark ? "light" : "dark";
  const label = isDark ? "Mode clair" : "Mode sombre";

  return (
    <Button
      variant="outline"
      size={showLabel ? "sm" : "icon"}
      onClick={() => setTheme(newTheme)}
      aria-label={label}
      title={label}
      className="gap-2 border-border bg-background hover:bg-muted shrink-0"
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {showLabel && (
        <span className="hidden sm:inline text-sm font-medium">{label}</span>
      )}
    </Button>
  );
}

