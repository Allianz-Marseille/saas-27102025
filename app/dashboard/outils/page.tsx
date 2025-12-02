"use client";

import { MessageSquare, HelpCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OutilsCommercialPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* En-tête */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Assistant Virtuel
            </h1>
            <p className="text-muted-foreground">
              Votre assistant intelligent pour répondre à toutes vos questions
            </p>
          </div>
        </div>
      </div>

      {/* Section Chatbot */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Chatbot RAG Allianz
          </CardTitle>
          <CardDescription>
            Posez vos questions directement via le bouton flottant en bas à droite
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium mb-1">Assistant activé</p>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur le bouton flottant pour commencer une conversation
                </p>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600">
                Actif
              </Badge>
            </div>

            {/* Bouton d'indication */}
            <div className="flex justify-center py-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Cliquez sur le bouton en bas à droite →</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guide d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Comment utiliser l&apos;assistant ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Ouvrez le chatbot</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur le bouton flottant bleu en bas à droite de votre écran
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Posez votre question</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tapez votre question dans le champ de saisie et appuyez sur Entrée
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Recevez une réponse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  L&apos;assistant vous répond en se basant sur la base de connaissances Allianz
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Copiez la réponse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilisez le bouton de copie pour sauvegarder les informations importantes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalités */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Fonctionnalités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Réponses intelligentes</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Basées sur la documentation Allianz
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
              <div className="p-2 bg-purple-500 rounded-lg text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Contexte préservé</p>
                <p className="text-xs text-muted-foreground mt-1">
                  L&apos;assistant se souvient de la conversation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
              <div className="p-2 bg-pink-500 rounded-lg text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Disponible partout</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Accessible sur toutes les pages
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
              <div className="p-2 bg-orange-500 rounded-lg text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Copie rapide</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Copiez les réponses en un clic
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

