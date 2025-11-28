"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CommissionsAgencePage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-lg border-2 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full w-fit">
            <Construction className="h-16 w-16 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Coins className="h-7 w-7 text-yellow-600" />
            Commissions Agence
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              🚧 Page en construction
            </p>
            <p className="text-sm text-muted-foreground">
              Cette section permettra de gérer les commissions de l'agence :
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground text-left">
              <li>• 📊 Suivi des commissions par rôle</li>
              <li>• 💰 Calcul global et répartition</li>
              <li>• 📈 Évolution mensuelle et annuelle</li>
              <li>• 🎯 Objectifs et prévisions</li>
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

