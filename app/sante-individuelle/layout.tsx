"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAutoLogout } from "@/lib/hooks/use-auto-logout";
import { canAccessHealthDashboard } from "@/lib/utils/roles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  User, 
  LogOut,
  ChevronLeft,
  BarChart3
} from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { logout } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function SanteIndividuelleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Déconnexion automatique après 10 minutes d'inactivité
  useAutoLogout({
    timeoutMinutes: 10,
    warningMinutes: 1,
    userId: user?.uid,
    userEmail: userData?.email,
  });

  // Vérifier les permissions d'accès
  useEffect(() => {
    if (userData && !canAccessHealthDashboard(userData)) {
      router.push("/dashboard");
    }
  }, [userData, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    {
      href: "/sante-individuelle",
      label: "Tableau de bord",
      icon: LayoutDashboard,
    },
    {
      href: "/sante-individuelle/actes",
      label: "Mes actes",
      icon: FileText,
    },
    {
      href: "/sante-individuelle/comparaison",
      label: "Comparaison",
      icon: BarChart3,
    },
    {
      href: "/sante-individuelle/profile",
      label: "Mon profil",
      icon: User,
    },
  ];

  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-64"
        )}>
          {/* Logo / Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 dark:from-green-600/20 dark:via-emerald-600/20 dark:to-green-600/20 backdrop-blur-sm">
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
                  <div className="absolute inset-0 bg-linear-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
                </div>
                <span className="text-xs font-medium bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Santé Individuelle
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
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info et actions */}
          <div className="border-t border-slate-200 dark:border-slate-800">
            {/* Info utilisateur */}
            {userData && !isCollapsed && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {userData.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {userData.email.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
                        SANTÉ
                      </div>
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar seul pour collapsed */}
            {userData && isCollapsed && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-center">
                <div 
                  className="w-10 h-10 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md"
                  title={userData.email}
                >
                  {userData.email.charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            <div className="p-4 space-y-2">
              <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
                <ThemeToggle />
                {!isCollapsed && (
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 border border-red-300 dark:border-red-800"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                  </button>
                )}
                {isCollapsed && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="Déconnexion"
                    className="bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>

        {/* Bouton flottant pour rouvrir la sidebar quand elle est collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="fixed left-16 top-1/2 -translate-y-1/2 z-50 bg-linear-to-r from-green-500 to-emerald-600 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 group"
            title="Ouvrir le menu"
          >
            <ChevronLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
            {/* Effet glow */}
            <div className="absolute inset-0 bg-linear-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
          </button>
        )}

        {/* Bouton flottant pour fermer la sidebar quand elle est ouverte */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="fixed left-64 top-1/2 -translate-y-1/2 z-50 bg-linear-to-r from-emerald-600 to-green-600 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 group"
            title="Fermer le menu"
          >
            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            {/* Effet glow */}
            <div className="absolute inset-0 bg-linear-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
          </button>
        )}
      </div>
    </RouteGuard>
  );
}

