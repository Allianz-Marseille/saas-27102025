"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Bot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
            Cette page est réservée aux administrateurs pour tester les bots et agents IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous pouvez accéder aux agents IA depuis la page communautaire pour effectuer vos
            tests.
          </p>
          <Button asChild variant="outline">
            <Link href="/commun/agents-ia" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Ouvrir Mes agents IA
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
