"use client";

import { MessageSquare, ArrowDown } from "lucide-react";
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
              Votre assistant intelligent disponible 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Carte unique Chatbot */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Chatbot Allianz</CardTitle>
                <CardDescription>Assistant IA basé sur la documentation de l&apos;agence</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500 hover:bg-green-600">
              Actif
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Message principal */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                Accédez au chatbot en cliquant sur le <strong>bouton flottant en bas à droite de votre écran</strong>. 
                Il est disponible sur toutes les pages de l&apos;application.
              </p>
            </div>

            {/* Indicateur visuel */}
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse" />
                <ArrowDown className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-bounce relative" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Regardez en bas à droite →
              </p>
            </div>

            {/* Fonctionnalités succinctes */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-semibold text-sm">Réponses rapides</div>
                <div className="text-xs text-muted-foreground mt-1">Assistance instantanée</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-semibold text-sm">Disponible 24/7</div>
                <div className="text-xs text-muted-foreground mt-1">Toujours à votre écoute</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
