"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SinistrePage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-lg border-2 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full w-fit">
            <Construction className="h-16 w-16 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="h-7 w-7 text-orange-600" />
            Sinistre
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
              🚧 Page en construction
            </p>
            <p className="text-sm text-muted-foreground">
              Cette section permettra de gérer les sinistres :
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground text-left">
              <li>• 📋 Suivi des déclarations</li>
              <li>• ⏱️ Délais de traitement</li>
              <li>• 💰 Montants et indemnisations</li>
              <li>• 📊 Statistiques et reporting</li>
            </ul>
          </div>
          
          <div className="pt-4">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin">
                ← Retour au Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

