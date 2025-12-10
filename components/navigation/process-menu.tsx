"use client";

import { useState, useEffect } from "react";
import { Workflow, ChevronDown, ChevronRight, Users, FileText, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProcessMenuProps {
  isCollapsed?: boolean;
  variant?: "admin" | "commercial" | "health";
}

const processItems = [
  {
    href: "/admin/process/leads",
    label: "Gestion des leads",
    icon: Users,
  },
  {
    href: "/admin/process/declaration-affaires",
    label: "Déclaration d'affaires",
    icon: FileText,
  },
  {
    href: "/admin/process/strategie-regularite",
    label: "Stratégie : L'art de la régularité",
    icon: Target,
  },
];

export function ProcessMenu({ isCollapsed = false, variant = "commercial" }: ProcessMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Vérifier si on est sur une page Process
  const isProcessActive = pathname?.startsWith("/admin/process");
  const isOnProcessSubPage = pathname?.startsWith("/admin/process/");

  // Ouvrir automatiquement le menu si on est sur une sous-page Process
  useEffect(() => {
    if (isOnProcessSubPage && !isCollapsed) {
      setIsOpen(true);
    }
  }, [isOnProcessSubPage, isCollapsed]);

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
      <div className="flex items-center gap-1">
        <Link href="/admin/process" className="flex-1">
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
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-8 transition-all",
            isProcessActive && "text-white"
          )}
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sous-menu */}
      {isOpen && (
        <div className="ml-8 mt-1 space-y-1">
          {processItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 transition-all text-sm",
                    isActive
                      ? `bg-gradient-to-r ${styles.activeGradient} text-white font-semibold`
                      : `hover:bg-gradient-to-r hover:${styles.hoverGradient}`
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
