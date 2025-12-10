"use client";

export const dynamic = 'force-dynamic';

import { RouteGuard } from "@/components/auth/route-guard";

export default function ProcessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Les pages Process sont accessibles à tous les utilisateurs authentifiés
  // Pas de restriction de rôle
  return (
    <RouteGuard requireAuth={true}>
      {children}
    </RouteGuard>
  );
}
