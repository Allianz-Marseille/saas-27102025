"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAutoLogout } from "@/lib/hooks/use-auto-logout";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/firebase/auth";
import { logUserLogout } from "@/lib/firebase/logs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  isAdmin, 
  isCommercial, 
  isCommercialSanteIndividuel, 
  isCommercialSanteCollective,
  isGestionnaireSinistre
} from "@/lib/utils/roles";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CommercialSidebar } from "@/components/dashboard/commercial-sidebar";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { ResponsiveHeader } from "@/components/navigation/responsive-header";
import { NavigationItems } from "@/components/navigation/navigation-items";
import { 
  Home, 
  FileText, 
  User, 
  Coins, 
  Workflow,
  LayoutDashboard,
  BarChart3,
  Wrench,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ENABLE_BOB_BOT } from "@/lib/assistant/config";

// Navigation items pour chaque rôle
const commercialNavItems = [
  {
    icon: Home,
    label: "Accueil",
    href: "/dashboard",
    exact: true,
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
    icon: Zap,
    label: "Boost",
    href: "/commun/boost",
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

const gestionnaireSinistreNavItems = [
  {
    icon: Zap,
    label: "Boost",
    href: "/commun/boost",
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
];

const healthNavItems = [
  {
    href: "/sante-individuelle",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    exact: true,
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
    href: "/commun/boost",
    label: "Boost",
    icon: Zap,
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
    href: "/sante-individuelle/profile",
    label: "Mon profil",
    icon: User,
  },
];

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
    href: "/commun/boost",
    label: "Boost",
    icon: Zap,
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

const adminNavItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: Home,
    exact: true,
  },
  {
    href: "/admin/commercial",
    label: "Commerciaux",
    icon: User,
  },
  {
    href: "/admin/sante-individuelle",
    label: "Santé Individuelle",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/sante-collective",
    label: "Santé Collective",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/sinistre",
    label: "Sinistre",
    icon: FileText,
  },
  {
    href: "/commun/boost",
    label: "Boost",
    icon: Zap,
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
    href: "/admin/commissions-agence",
    label: "Commissions Agence",
    icon: Coins,
    separator: true,
  },
];


export default function CommunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable = target?.getAttribute?.("contenteditable") === "true";
      if (tag === "input" || tag === "textarea" || editable) return;

      const isAltN = e.altKey && e.key.toLowerCase() === "n";
      const isCmdShiftN = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n";
      if (isAltN || isCmdShiftN) {
        e.preventDefault();
        if (pathname !== "/commun/agents-ia/bot-secretaire") {
          router.push("/commun/agents-ia/bot-secretaire");
        }
        return;
      }

      if (ENABLE_BOB_BOT) {
        const isAltB = e.altKey && e.key.toLowerCase() === "b";
        const isCmdShiftB = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b";
        if (isAltB || isCmdShiftB) {
          e.preventDefault();
          if (pathname !== "/commun/agents-ia/bob-sante") {
            router.push("/commun/agents-ia/bob-sante");
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  // Déconnexion automatique après 10 minutes d'inactivité
  useAutoLogout({
    timeoutMinutes: 10,
    warningMinutes: 1,
    userId: user?.uid,
    userEmail: userData?.email,
  });

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

  // Déterminer le rôle et la sidebar à afficher
  const isAdminUser = isAdmin(userData);
  const isCommercialUser = isCommercial(userData);
  const isHealthIndividuelUser = isCommercialSanteIndividuel(userData);
  const isHealthCollectiveUser = isCommercialSanteCollective(userData);
  const isGestionnaireSinistreUser = isGestionnaireSinistre(userData);

  // Déterminer le variant pour les menus
  let variant: "admin" | "commercial" | "health" = "commercial";
  let navItems = commercialNavItems;
  let title = "Processus";
  let showNotifications = false;

  if (isAdminUser) {
    variant = "admin";
    navItems = adminNavItems;
    title = "Processus";
  } else if (isHealthIndividuelUser) {
    variant = "health";
    navItems = healthNavItems;
    title = "Processus";
  } else if (isHealthCollectiveUser) {
    variant = "health";
    navItems = healthCollectiveNavItems;
    title = "Processus";
  } else if (isGestionnaireSinistreUser && !isCommercialUser) {
    variant = "commercial";
    navItems = gestionnaireSinistreNavItems;
    title = "Processus";
    showNotifications = false;
  } else if (isCommercialUser || isGestionnaireSinistreUser) {
    variant = "commercial";
    navItems = commercialNavItems;
    title = "Processus";
    showNotifications = isCommercialUser;
  }

  // Nina — Bot Secrétaire : pleine page sans sidebar (spec NINA-SECRETAIRE.md)
  const isNinaFullscreen = pathname === "/commun/agents-ia/bot-secretaire";
  if (isNinaFullscreen) {
    return (
      <RouteGuard requireAuth={true}>
        <div className="h-screen w-screen overflow-hidden">{children}</div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireAuth={true}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Desktop - selon le rôle */}
        {isAdminUser && (
          <AdminSidebar 
            onLogout={handleLogout}
            isCollapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
          />
        )}
        {(isCommercialUser || isGestionnaireSinistreUser) && !isAdminUser && (
          <CommercialSidebar />
        )}
        {(isHealthIndividuelUser || isHealthCollectiveUser) && !isAdminUser && (
          <aside className={cn(
            "border-r h-screen fixed left-0 top-0 z-40 transition-all duration-300",
            "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800",
            "hidden lg:block",
            isSidebarCollapsed ? "w-16" : "w-64"
          )}>
            <div className="flex flex-col h-full">
            {/* Logo / Header */}
            <div className={cn(
              "p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between backdrop-blur-sm",
              isHealthIndividuelUser 
                ? "bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 dark:from-green-600/20 dark:via-emerald-600/20 dark:to-green-600/20"
                : "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-600/20 dark:via-teal-600/20 dark:to-emerald-600/20"
            )}>
              {!isSidebarCollapsed ? (
                <div className="flex flex-col gap-1 flex-1">
                  <div className="relative group">
                    <Image
                      src="/allianz.svg"
                      alt="Allianz"
                      width={100}
                      height={24}
                      className="h-6 w-auto brightness-0 dark:brightness-100 transition-all duration-300 group-hover:scale-105"
                    />
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10",
                      isHealthIndividuelUser
                        ? "bg-gradient-to-r from-green-600 to-emerald-600"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600"
                    )} />
                  </div>
                  <span className={cn(
                    "text-xs font-medium bg-clip-text text-transparent",
                    isHealthIndividuelUser
                      ? "bg-gradient-to-r from-green-600 to-emerald-600"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600"
                  )}>
                    {isHealthIndividuelUser ? "Santé Individuelle" : "Santé Collective"}
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
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="h-8 w-8 hover:bg-white/50 dark:hover:bg-black/50"
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isSidebarCollapsed && "rotate-180"
                  )}
                />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = item.href === "/commun/process"
                    ? pathname?.startsWith("/commun/process")
                    : (item as any).exact 
                      ? pathname === item.href
                      : pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.href}>
                      <div className="relative">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative",
                            isActive
                              ? isHealthIndividuelUser
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
                            isSidebarCollapsed && "justify-center px-2"
                          )}
                          title={(item as { title?: string }).title ?? (isSidebarCollapsed ? item.label : undefined)}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {!isSidebarCollapsed && (
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
              {userData && !isSidebarCollapsed && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md",
                      isHealthIndividuelUser
                        ? "bg-gradient-to-br from-green-500 to-emerald-600"
                        : "bg-gradient-to-br from-emerald-500 to-teal-600"
                    )}>
                      {userData.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {userData.email.split('@')[0]}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-white text-[10px] font-bold",
                          isHealthIndividuelUser ? "bg-green-500" : "bg-emerald-500"
                        )}>
                          {isHealthIndividuelUser ? "SANTÉ" : "COLLECTIVE"}
                        </div>
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {userData && isSidebarCollapsed && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-center">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md",
                      isHealthIndividuelUser
                        ? "bg-gradient-to-br from-green-500 to-emerald-600"
                        : "bg-gradient-to-br from-emerald-500 to-teal-600"
                    )}
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
                    isSidebarCollapsed && "px-2"
                  )}
                  onClick={handleLogout}
                >
                  {!isSidebarCollapsed && "Se déconnecter"}
                </Button>
              </div>
            </div>
            </div>
          </aside>
        )}

        {/* Menu Mobile */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          variant={variant}
        >
          <NavigationItems
            items={navItems}
            currentPath={pathname || ""}
            variant={variant}
            onLogout={handleLogout}
            userData={userData}
            onNavigate={handleMobileNavigation}
          />
        </MobileMenu>

        {/* Header Responsive */}
        <ResponsiveHeader
          title={title}
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          variant={variant}
          showNotifications={showNotifications}
        />

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-background",
          "pt-16 lg:pt-0",
          // Marges pour la sidebar desktop
          isAdminUser && (isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"),
          (isCommercialUser || isGestionnaireSinistreUser) && !isAdminUser && "lg:ml-64",
          (isHealthIndividuelUser || isHealthCollectiveUser) && !isAdminUser && (isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64")
        )}>
          <div className="w-full py-6">
            {children}
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
