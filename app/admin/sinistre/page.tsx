"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Construction } from "lucide-react";
import { RouteGuard } from "@/components/auth/route-guard";

export default function SinistrePage() {
  return (
    <RouteGuard
      allowedRoles={["ADMINISTRATEUR", "GESTIONNAIRE_SINISTRE", "CDC_COMMERCIAL"]}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <header className="border-b bg-white dark:bg-slate-950 sticky top-16 lg:top-0 z-10 shadow-md">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-orange-600" />
                  Gestion des Sinistres
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Pilotage et suivi des sinistres
                </p>
              </div>
            </div>
          </div>
        </header>
          
        <div className="container mx-auto px-6 py-12">
          <Card>
            <CardContent className="py-24 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-6">
                  <Construction className="h-12 w-12 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Page en cours de construction</h2>
                  <p className="text-muted-foreground max-w-md">
                    Cette page est actuellement en développement. Elle sera bientôt disponible.
                  </p>
                </div>
          </div>
        </CardContent>
      </Card>
    </div>
      </div>
    </RouteGuard>
  );
}
