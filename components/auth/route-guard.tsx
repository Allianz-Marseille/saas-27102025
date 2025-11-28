"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/use-auth";
import { 
  canAccessAdmin, 
  canAccessDashboard, 
  canAccessHealthDashboard,
  isAdmin,
  isCommercial,
  isCommercialSanteIndividuel
} from "@/lib/utils/roles";
import { toast } from "sonner";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL")[];
  requireAuth?: boolean;
}

export function RouteGuard({
  children,
  allowedRoles,
  requireAuth = true,
}: RouteGuardProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Vérifier si l'utilisateur doit être authentifié
    if (requireAuth && !user) {
      toast.error("Vous devez être connecté pour accéder à cette page");
      router.push("/login");
      return;
    }

    if (!user || !userData) {
      return;
    }

    // Vérifier si l'utilisateur est actif
    if (!userData.active) {
      toast.error("Votre compte est désactivé");
      router.push("/login");
      return;
    }

    // Vérifier l'accès selon le chemin
    if (pathname.startsWith("/admin")) {
      if (!canAccessAdmin(userData)) {
        toast.error("Accès refusé : droits administrateur requis");
        router.push("/dashboard");
        return;
      }
    }

    if (pathname.startsWith("/dashboard")) {
      if (!canAccessDashboard(userData)) {
        toast.error("Accès refusé");
        router.push("/login");
        return;
      }
    }

    if (pathname.startsWith("/sante-individuelle")) {
      if (!canAccessHealthDashboard(userData)) {
        toast.error("Accès refusé");
        router.push("/login");
        return;
      }
    }

    // Vérifier les rôles spécifiques si définis
    if (allowedRoles && allowedRoles.length > 0) {
      const hasValidRole = allowedRoles.some((role) => {
        if (role === "ADMINISTRATEUR") return isAdmin(userData);
        if (role === "CDC_COMMERCIAL") return isCommercial(userData);
        if (role === "COMMERCIAL_SANTE_INDIVIDUEL") return isCommercialSanteIndividuel(userData);
        return false;
      });

      if (!hasValidRole) {
        toast.error("Vous n'avez pas les droits nécessaires pour accéder à cette page");
        // Rediriger vers le dashboard approprié selon le rôle
        if (isCommercialSanteIndividuel(userData)) {
          router.push("/sante-individuelle");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [user, userData, loading, router, pathname, allowedRoles, requireAuth]);

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Ne pas afficher le contenu si l'utilisateur n'est pas authentifié
  if (requireAuth && !user) {
    return null;
  }

  // Ne pas afficher le contenu si l'utilisateur n'a pas accès
  if (user && userData) {
    if (!userData.active) {
      return null;
    }

    if (pathname.startsWith("/admin") && !canAccessAdmin(userData)) {
      return null;
    }

    if (pathname.startsWith("/dashboard") && !canAccessDashboard(userData)) {
      return null;
    }

    if (pathname.startsWith("/sante-individuelle") && !canAccessHealthDashboard(userData)) {
      return null;
    }
  }

  return <>{children}</>;
}
