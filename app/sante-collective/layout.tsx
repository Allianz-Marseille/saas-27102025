"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, FileText, User, BarChart3, ChevronLeft, Workflow, Wrench } from "lucide-react";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAutoLogout } from "@/lib/hooks/use-auto-logout";
import { useRouter, usePathname } from "next/navigation";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { ResponsiveHeader } from "@/components/navigation/responsive-header";
import { NavigationItems } from "@/components/navigation/navigation-items";
import { logout } from "@/lib/firebase/auth";
import { logUserLogout } from "@/lib/firebase/logs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const healthCollectiveNavItems = [
  {
    href: "/sante-collective",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/sante-collective/actes",
    label: "Mes actes",
    icon: FileText,
  },
  {
    href: "/sante-collective/comparaison",
    label: "Comparaison",
    icon: BarChart3,
  },
  {
    href: "/commun/process",
    label: "Process",
    icon: Workflow,
  },
  {
    href: "/commun/outils",
    label: "Outils",
    icon: Wrench,
  },
  {
    href: "/sante-collective/profile",
    label: "Mon profil",
    icon: User,
  },
];

// Date de création du bouton Process - à partir d'aujourd'hui
const PROCESS_FEATURE_START_DATE = new Date();

export default function SanteCollectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProcessCapsule, setShowProcessCapsule] = useState(false);

  // Vérifier si on est dans la fenêtre de 7 jours
  useEffect(() => {
    const today = new Date();
    const daysDiff = Math.floor(
      (today.getTime() - PROCESS_FEATURE_START_DATE.getTime()) / (1000 * 60 * 60 * 24)
    );
    setShowProcessCapsule(daysDiff < 7);
  }, []);

  // Déconnexion automatique après 10 minutes d'inactivité
  useAutoLogout({
    timeoutMinutes: 10,
    warningMinutes: 1,
    userId: user?.uid,
    userEmail: userData?.email,
  });

  // La vérification des permissions est gérée par le RouteGuard

  const handleLogout = async () => {
    try {
      if (user && userData?.email) {
        try {
          await logUserLogout(user.uid, userData.email);
        } catch (logError) {
          console.error("Erreur lors de l'enregistrement du log:", logError);
        }
      }
      
      await logout();
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const handleMobileNavigation = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className={cn(
          "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col transition-all duration-300 relative",
          "hidden lg:flex",
          isCollapsed ? "w-16" : "w-64"
        )}>
          {/* Logo / Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-600/20 dark:via-teal-600/20 dark:to-emerald-600/20 backdrop-blur-sm">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
                </div>
                <span className="text-xs font-medium bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Santé Collective
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
              {healthCollectiveNavItems.map((item) => {
                const isActive = item.href === "/commun/process"
                  ? pathname?.startsWith("/commun/process")
                  : item.exact 
                    ? pathname === item.href
                    : pathname?.startsWith(item.href);
                const Icon = item.icon;
                const isProcessButton = item.href === "/commun/process";
                
                return (
                  <li key={item.href}>
                    <div
                      className={cn(
                        "relative",
                        isProcessButton && showProcessCapsule && !isCollapsed && "p-1"
                      )}
                    >
                      {isProcessButton && showProcessCapsule && !isCollapsed && (
                        <div className="absolute inset-0 rounded-lg bg-red-500 border-2 border-red-600 shadow-lg shadow-red-500/50 animate-pulse" />
                      )}
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative",
                          isProcessButton && showProcessCapsule && !isCollapsed && "z-10",
                          isActive
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
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
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info et actions */}
          <div className="mt-auto border-t border-slate-200 dark:border-slate-800">
            {userData && !isCollapsed && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {userData.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {userData.email.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        COLLECTIVE
                      </div>
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {userData && isCollapsed && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-center">
                <div 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md"
                  title={userData.email}
                >
                  {userData.email.charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            <div className="p-4">
              <Button
                variant="outline"
                className={cn(
                  "w-full gap-3 bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
                  isCollapsed && "px-2"
                )}
                onClick={handleLogout}
              >
                {!isCollapsed && "Se déconnecter"}
              </Button>
            </div>
          </div>
        </aside>

        {/* Boutons flottants pour collapse */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden lg:flex fixed left-16 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 group"
            title="Ouvrir le menu"
          >
            <ChevronLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
          </button>
        )}

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:flex fixed left-64 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 hover:scale-110 group"
            title="Fermer le menu"
          >
            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
          </button>
        )}

        {/* Menu Mobile */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          variant="health"
        >
          <NavigationItems
            items={healthCollectiveNavItems}
            currentPath={pathname || ""}
            variant="health"
            onLogout={handleLogout}
            userData={userData}
            onNavigate={handleMobileNavigation}
          />
        </MobileMenu>

        {/* Header Responsive */}
        <ResponsiveHeader
          title="Santé Collective"
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          variant="health"
          showNotifications={false}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}

