"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw, LogIn } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-2 border-destructive/20">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <AlertCircle className="h-14 w-14 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">Erreur sur le tableau de bord</h1>
            <p className="text-sm text-muted-foreground">
              Une erreur s&apos;est produite au chargement. Réessayez ou déconnectez-vous puis reconnectez-vous.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Se reconnecter
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
