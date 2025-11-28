"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SanteCollectivePage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-lg border-2 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full w-fit">
            <Construction className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Building2 className="h-7 w-7 text-emerald-600" />
            Santé Collective
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              🚧 Page en construction
            </p>
            <p className="text-sm text-muted-foreground">
              Cette section permettra de gérer les commerciaux santé collective :
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground text-left">
              <li>• 📊 Suivi des contrats collectifs</li>
              <li>• 💼 Gestion des entreprises clientes</li>
              <li>• 📈 KPIs et performances</li>
              <li>• 🎯 Timeline et historique</li>
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

