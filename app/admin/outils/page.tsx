"use client";

import { MessageSquare, Upload, FileText, Trash2, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OutilsPage() {
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
              Outils & Chatbot
            </h1>
            <p className="text-muted-foreground">
              Gérez la base de connaissances du chatbot RAG
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents indexés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              PDFs et images
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chunks vectorisés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Segments de texte
            </p>
          </CardContent>
        </Card>

        <Card className="border-pink-200 dark:border-pink-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requêtes ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Questions posées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer des documents
          </CardTitle>
          <CardDescription>
            Ajoutez des PDFs ou des images (PNG, JPG, WEBP) pour enrichir la base de connaissances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">
              Glissez-déposez vos fichiers ici ou cliquez pour parcourir
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              PDFs jusqu&apos;à 10MB, Images jusqu&apos;à 5MB
            </p>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Sélectionner des fichiers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section Documents existants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents indexés
          </CardTitle>
          <CardDescription>
            Gérez les documents disponibles pour le chatbot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Exemple de document (vide pour l'instant) */}
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Aucun document indexé pour le moment</p>
              <p className="text-xs mt-2">
                Commencez par importer des documents ci-dessus
              </p>
            </div>
            
            {/* Template pour afficher les documents une fois implémenté */}
            {/* <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Document exemple.pdf</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">PDF</Badge>
                    <span className="text-xs text-muted-foreground">1.2 MB • 15 chunks</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Section Chatbot */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Tester le chatbot
          </CardTitle>
          <CardDescription>
            Utilisez le bouton flottant en bas à droite pour tester le chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium mb-1">Chatbot RAG activé</p>
              <p className="text-sm text-muted-foreground">
                Visible par tous les utilisateurs via le bouton flottant
              </p>
            </div>
            <Badge className="bg-green-500 hover:bg-green-600">
              Actif
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Note informative */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="p-2 bg-amber-500 rounded-lg h-fit">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Comment utiliser le chatbot ?
              </p>
              <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                <li>• Le chatbot est accessible via le bouton flottant en bas à droite</li>
                <li>• Il répond aux questions en se basant sur les documents indexés</li>
                <li>• Plus vous ajoutez de documents, plus il sera pertinent</li>
                <li>• Les réponses peuvent être copiées en un clic</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

