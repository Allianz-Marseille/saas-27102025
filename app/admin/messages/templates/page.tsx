"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { TemplateManager } from "@/components/messages/template-manager";

/**
 * Page de gestion des templates de messages (ADMIN uniquement)
 */
export default function TemplatesPage() {
  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      <div className="container mx-auto py-6">
        <TemplateManager />
      </div>
    </RouteGuard>
  );
}
