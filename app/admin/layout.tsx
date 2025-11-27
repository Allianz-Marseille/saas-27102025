"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import Image from "next/image";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RouteGuard } from "@/components/auth/route-guard";
import { logout } from "@/lib/firebase/auth";
import { logUserLogout } from "@/lib/firebase/logs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAutoLogout } from "@/lib/hooks/use-auto-logout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Sidebar */}
        <AdminSidebar 
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />

        {/* Main content */}
        <div className={cn(
          "transition-all duration-300",
          isSidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          {/* Header */}
          <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-30 shadow-md">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/allianz.svg"
                  alt="Allianz"
                  width={100}
                  height={26}
                  className="h-6 w-auto brightness-0 dark:brightness-100"
                />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Dashboard Administrateur</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}

