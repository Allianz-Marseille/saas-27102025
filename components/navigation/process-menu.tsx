"use client";

import { Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProcessMenuProps {
  isCollapsed?: boolean;
  variant?: "admin" | "commercial" | "health";
}

export function ProcessMenu({ isCollapsed = false, variant = "commercial" }: ProcessMenuProps) {
  const pathname = usePathname();

  // Vérifier si on est sur une page Process
  const isProcessActive = pathname?.startsWith("/admin/process");

  // Styles selon le variant
  const variantStyles = {
    admin: {
      activeGradient: "from-blue-600 via-purple-600 to-blue-600",
      hoverGradient: "from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30",
    },
    commercial: {
      activeGradient: "from-blue-600 via-purple-600 to-blue-600",
      hoverGradient: "from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30",
    },
    health: {
      activeGradient: "from-green-500 to-emerald-600",
      hoverGradient: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    },
  };

  const styles = variantStyles[variant];

  if (isCollapsed) {
    return (
      <div className="mb-2">
        <Link href="/admin/process">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-center px-2 transition-all relative overflow-hidden",
              isProcessActive
                ? `bg-gradient-to-r ${styles.activeGradient} text-white font-semibold shadow-md`
                : `hover:bg-gradient-to-r hover:${styles.hoverGradient}`
            )}
            title="Process"
          >
            <Workflow className="h-5 w-5 shrink-0" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-2">
      {/* Bouton principal Process */}
      <Link href="/admin/process">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 transition-all relative overflow-hidden",
            isProcessActive
              ? `bg-gradient-to-r ${styles.activeGradient} text-white font-semibold shadow-md`
              : `hover:bg-gradient-to-r hover:${styles.hoverGradient}`
          )}
        >
          <Workflow className="h-5 w-5 shrink-0" />
          <span className="font-medium">Process</span>
        </Button>
      </Link>
    </div>
  );
}
