"use client";

import { useState } from "react";
import { Home, FileText, User, Coins, Workflow, Wrench } from "lucide-react";
import { CommercialSidebar } from "@/components/dashboard/commercial-sidebar";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { ResponsiveHeader } from "@/components/navigation/responsive-header";
import { NavigationItems } from "@/components/navigation/navigation-items";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAutoLogout } from "@/lib/hooks/use-auto-logout";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/firebase/auth";
import { logUserLogout } from "@/lib/firebase/logs";
import { toast } from "sonner";

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
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
    <RouteGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Desktop - masquée sur mobile/tablette */}
        <CommercialSidebar />

        {/* Menu Mobile - visible uniquement sur mobile/tablette */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          variant="commercial"
        >
          <NavigationItems
            items={commercialNavItems}
            currentPath={pathname || ""}
            variant="commercial"
            onLogout={handleLogout}
            userData={userData}
            onNavigate={handleMobileNavigation}
          />
        </MobileMenu>

        {/* Header Responsive */}
        <ResponsiveHeader
          title="Dashboard Commercial"
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          variant="commercial"
          showNotifications={true}
        />

        <main className="flex-1 overflow-y-auto bg-background pt-16 lg:pt-0 lg:ml-64">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}

