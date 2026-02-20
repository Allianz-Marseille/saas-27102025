"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";

export default function TestBotsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Test des Bots</h1>
        <p className="text-muted-foreground mt-1">
          Interface de test des agents IA pour les administrateurs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Environnement de test
          </CardTitle>
          <CardDescription>
            Cette page est réservée aux administrateurs pour tester les bots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contenu à venir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
