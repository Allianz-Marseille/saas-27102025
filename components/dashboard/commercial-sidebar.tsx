"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, User, LogOut, ChevronLeft, Coins, Workflow, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/firebase/auth";
import { logUserLogout } from "@/lib/firebase/logs";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";

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
    icon: Coins,
    label: "Commissions",
    href: "/dashboard/commissions",
  },
  {
    icon: Workflow,
    label: "Process",
    href: "/commun/process",
  },
  {
    icon: Wrench,
    label: "Outils",
    href: "/commun/outils",
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
  const { user, userData, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ne rien rendre pendant le chargement ou si userData n'est pas disponible
  if (loading || !userData) {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Logger la déconnexion avant de se déconnecter
      if (user && userData?.email) {
        try {
          await logUserLogout(user.uid, userData.email);
        } catch (logError) {
          console.error("Erreur lors de l'enregistrement du log:", logError);
          // Ne pas bloquer la déconnexion si le log échoue
        }
      }
      
      await logout();
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <>
    <aside
      className={cn(
          "border-r h-screen fixed left-0 top-0 z-40 transition-all duration-300",
          "bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30",
          "dark:from-slate-950 dark:via-blue-950/10 dark:to-purple-950/10",
          "hidden lg:block", // Masquer sur mobile/tablette
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
      {/* Header avec logo */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 backdrop-blur-sm">
        {!isCollapsed ? (
          <div className="flex flex-col gap-1 flex-1">
            <div className="relative group">
            <Image
              src="/allianz.svg"
              alt="Allianz"
                width={100}
                height={24}
                className="h-6 w-auto brightness-0 dark:brightness-100 transition-all duration-300 group-hover:scale-105"
            />
              {/* Effet glow au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
            </div>
            <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Agence Marseille
            </span>
          </div>
        ) : (
          <div className="relative group mx-auto">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 p-1">
              <Image
                src="/favicon.png"
                alt="Allianz"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 hover:bg-white/50 dark:hover:bg-black/50"
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
          const isActive = item.href === "/commun/process" 
            ? pathname?.startsWith("/commun/process")
            : pathname === item.href;

          return (
            <div
              key={item.href}
              className="relative"
            >
              <Button
                data-href={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 transition-all relative",
                  isActive && "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-md shadow-blue-500/20",
                  !isActive && "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30",
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
            </div>
          );
        })}
      </nav>

      {/* Footer avec utilisateur connecté, notifications, thème et déconnexion */}
      <div className="mt-auto border-t bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10">
        {/* Info utilisateur */}
        {userData && !isCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {userData.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {userData.email.split('@')[0]}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                    COMMERCIAL
                  </div>
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Avatar seul pour collapsed */}
        {userData && isCollapsed && (
          <div className="p-4 border-b flex justify-center">
            <div 
              className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md"
              title={userData.email}
            >
              {userData.email.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        <div className="p-4 space-y-2">
          <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
            <NotificationCenter />
            <ThemeToggle />
          {!isCollapsed && (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 gap-2 bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all"
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
              className="bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
          </div>
        </div>
      </div>
      </div>
    </aside>

    {/* Bouton flottant pour rouvrir la sidebar quand elle est collapsed - Desktop uniquement */}
    {isCollapsed && (
      <button
        onClick={() => setIsCollapsed(false)}
        className="hidden lg:flex fixed left-16 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 group"
        title="Ouvrir le menu"
      >
        <ChevronLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
        {/* Effet glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
      </button>
    )}

    {/* Bouton flottant pour fermer la sidebar quand elle est ouverte - Desktop uniquement */}
    {!isCollapsed && (
      <button
        onClick={() => setIsCollapsed(true)}
        className="hidden lg:flex fixed left-64 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 group"
        title="Fermer le menu"
      >
        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        {/* Effet glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
      </button>
    )}
  </>
  );
}

