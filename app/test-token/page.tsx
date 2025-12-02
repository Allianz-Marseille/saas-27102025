"use client";

/**
 * Page temporaire pour obtenir le token Firebase
 * À supprimer après les tests
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

export default function TestTokenPage() {
  const { user, userData, loading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && !token) {
      user
        .getIdToken()
        .then((t) => {
          setToken(t);
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération du token:", error);
          toast.error("Erreur lors de la récupération du token");
        });
    }
  }, [user, token]);

  const handleCopy = async () => {
    if (token) {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("Token copié dans le presse-papiers !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    if (user) {
      try {
        const newToken = await user.getIdToken(true); // Force refresh
        setToken(newToken);
        toast.success("Token actualisé !");
      } catch (error) {
        console.error("Erreur lors du refresh du token:", error);
        toast.error("Erreur lors du refresh du token");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Non connecté</CardTitle>
            <CardDescription>
              Vous devez être connecté pour obtenir un token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => (window.location.href = "/login")}
              className="w-full"
            >
              Aller à la page de connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Token Firebase</CardTitle>
          <CardDescription>
            Utilisez ce token pour tester les routes API RAG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations utilisateur */}
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">UID:</span>
              <span className="text-sm font-mono text-xs">{user.uid}</span>
            </div>
            {userData && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rôle:</span>
                <span className="text-sm">{userData.role}</span>
              </div>
            )}
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="token">Token Firebase</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                value={token || "Chargement..."}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                disabled={!token}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le token expire après 1 heure. Cliquez sur "Actualiser" pour obtenir un nouveau token.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" className="flex-1">
              Actualiser le token
            </Button>
            <Button
              onClick={() => {
                if (token) {
                  navigator.clipboard.writeText(
                    `npm run test-rag-api ${token}`
                  );
                  toast.success("Commande copiée !");
                }
              }}
              disabled={!token}
              className="flex-1"
            >
              Copier la commande de test
            </Button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold mb-2">Instructions :</h3>
            <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Copiez le token ci-dessus</li>
              <li>Ouvrez un terminal</li>
              <li>Exécutez : <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">npm run test-rag-api VOTRE_TOKEN</code></li>
              <li>Ou utilisez le bouton "Copier la commande de test"</li>
            </ol>
          </div>

          {/* Note de sécurité */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              ⚠️ <strong>Note de sécurité :</strong> Cette page est temporaire et doit être supprimée après les tests.
              Ne partagez jamais votre token avec des personnes non autorisées.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

