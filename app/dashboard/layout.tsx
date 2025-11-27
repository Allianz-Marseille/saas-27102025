"use client";

import { CommercialSidebar } from "@/components/dashboard/commercial-sidebar";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAutoLogout } from "@/lib/hooks/use-auto-logout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData } = useAuth();

  // Déconnexion automatique après 10 minutes d'inactivité
  useAutoLogout({
    timeoutMinutes: 10,
    warningMinutes: 1,
    userId: user?.uid,
    userEmail: userData?.email,
  });

  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden">
        <CommercialSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}

