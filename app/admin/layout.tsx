"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Home, Building2, Users, ScrollText, Heart, AlertTriangle, Coins, Workflow, Wrench, Banknote, Zap, Bot } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { ResponsiveHeader } from "@/components/navigation/responsive-header";
import { NavigationItems } from "@/components/navigation/navigation-items";
import { RouteGuard } from "@/components/auth/route-guard";
import { logout } from "@/lib/firebase/auth";
import { logUserLogout } from "@/lib/firebase/logs";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAutoLogout } from "@/lib/hooks/use-auto-logout";

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
    icon: Users,
  },
  {
    href: "/admin/sante-individuelle",
    label: "Santé Individuelle",
    icon: Heart,
  },
  {
    href: "/admin/sante-collective",
    label: "Santé Collective",
    icon: Building2,
  },
  {
    href: "/admin/sinistre",
    label: "Sinistre",
    icon: AlertTriangle,
  },
  {
    href: "/admin/boost",
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
    href: "#",
    label: "Mes agents IA",
    icon: Bot,
    comingSoon: true,
  },
  {
    href: "/admin/commissions-agence",
    label: "Commissions Agence",
    icon: Coins,
    separator: true,
  },
  {
    href: "/admin/remunerations",
    label: "Rémunérations",
    icon: Banknote,
  },
  {
    href: "/admin/companies",
    label: "Compagnies",
    icon: Building2,
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    icon: Users,
  },
  {
    href: "/admin/logs",
    label: "Journal des logs",
    icon: ScrollText,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Déconnexion automatique après 10 minutes d'inactivité
  useAutoLogout({
    timeoutMinutes: 10,
    warningMinutes: 1,
    userId: user?.uid,
    userEmail: userData?.email,
  });

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

  const handleMobileNavigation = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Sidebar Desktop - masquée sur mobile/tablette */}
        <AdminSidebar 
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />

        {/* Menu Mobile - visible uniquement sur mobile/tablette */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          variant="admin"
        >
          <NavigationItems
            items={adminNavItems}
            currentPath={pathname || ""}
            variant="admin"
            onLogout={handleLogout}
            userData={userData}
            onNavigate={handleMobileNavigation}
          />
        </MobileMenu>

        {/* Header Responsive */}
        <ResponsiveHeader
          title="Administration"
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          variant="admin"
          showNotifications={false}
        />

        {/* Main content */}
        <div className={cn(
          "transition-all duration-300",
          // Mobile : padding top pour le header fixe
          "pt-16",
          // Desktop : margin left pour la sidebar + pas de padding top
          "lg:pt-0",
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}>
          {/* Page content */}
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}

