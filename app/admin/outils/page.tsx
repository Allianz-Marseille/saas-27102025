"use client";

import { MessageSquare, ArrowRight, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OutilsAdminPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* En-tête */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Outils & Gestion
            </h1>
            <p className="text-muted-foreground">
              Gérez les outils et services de l&apos;agence
            </p>
          </div>
        </div>
      </div>

      {/* Grille de cartes cliquables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Carte Gestion Chatbot */}
        <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-400 dark:hover:border-blue-600 group">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Gestion Chatbot</CardTitle>
                <CardDescription className="mt-1">
                  Base de connaissances RAG
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Statistiques rapides */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <Badge className="bg-green-500 hover:bg-green-600">
                  Actif
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Documents</span>
                <span className="font-semibold">0 indexé</span>
              </div>

              {/* Bouton d'action */}
              <Link href="/admin/outils/chatbot" className="block">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group-hover:shadow-lg transition-all"
                >
                  Gérer
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder pour futurs outils */}
        <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/10">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-center">Prochain outil</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground text-center">
              D&apos;autres outils seront ajoutés prochainement
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Note informative */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="p-2 bg-blue-500 rounded-lg h-fit">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                À propos des outils
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Cette page centralise tous les outils de gestion de l&apos;agence. 
                Cliquez sur une carte pour accéder à l&apos;interface de gestion complète.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
