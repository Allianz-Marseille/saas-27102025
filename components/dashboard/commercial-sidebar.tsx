"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, User, LogOut, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { useState } from "react";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

const menuItems: SidebarItem[] = [
  {
    icon: Home,
    label: "Accueil",
    href: "/dashboard",
  },
  {
    icon: FileText,
    label: "Mes actes",
    href: "/dashboard/acts",
  },
  {
    icon: User,
    label: "Profil",
    href: "/dashboard/profile",
  },
];

export function CommercialSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header avec logo */}
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <Image
              src="/allianz.svg"
              alt="Allianz"
              width={80}
              height={20}
              className="h-5 w-auto brightness-0 dark:brightness-100"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-all",
                isActive && "bg-[#00529B] hover:bg-[#003d73]",
                isCollapsed && "justify-center px-2"
              )}
              onClick={() => router.push(item.href)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer avec notifications, thème et déconnexion */}
      <div className="p-4 border-t space-y-2">
        <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
          <NotificationCenter />
          <ThemeToggle />
          {!isCollapsed && (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          )}
          {isCollapsed && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

