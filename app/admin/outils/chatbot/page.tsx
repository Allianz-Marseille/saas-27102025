"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Upload, FileText, ChevronRight, Sparkles, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PdfUploadDialog } from "@/components/chatbot/pdf-upload-dialog";
import { PdfList } from "@/components/chatbot/pdf-list";
import { useAuth } from "@/lib/firebase/use-auth";

export default function ChatbotManagementPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="h-4 w-4" />
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/outils" className="hover:text-foreground transition-colors">
          Outils
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Gestion Chatbot</span>
      </div>

      {/* En-tête */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gestion du Chatbot
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
            <div className="text-2xl font-bold" id="documents-count">-</div>
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
            <div className="text-2xl font-bold" id="chunks-count">-</div>
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
          <PdfList key={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />
        </CardContent>
      </Card>

      {/* Section Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Configuration du chatbot
          </CardTitle>
          <CardDescription>
            Paramètres et modèles utilisés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Modèle LLM</p>
                <p className="text-xs text-muted-foreground mt-1">OpenAI GPT-4o</p>
              </div>
              <Badge variant="secondary">Actif</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Modèle Embeddings</p>
                <p className="text-xs text-muted-foreground mt-1">text-embedding-3-small</p>
              </div>
              <Badge variant="secondary">Actif</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Base vectorielle</p>
                <p className="text-xs text-muted-foreground mt-1">Qdrant Cloud</p>
              </div>
              <Badge variant="secondary">Connecté</Badge>
            </div>
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
                Comment fonctionne le chatbot RAG ?
              </p>
              <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                <li>• Importez des documents (PDFs, images) pour construire la base de connaissances</li>
                <li>• Les documents sont découpés en chunks et vectorisés</li>
                <li>• Le chatbot recherche les informations pertinentes pour répondre aux questions</li>
                <li>• Les utilisateurs accèdent au chatbot via le bouton flottant</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'upload */}
      <PdfUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          // Mettre à jour les statistiques
          setTimeout(() => {
            const event = new CustomEvent("refresh-stats");
            window.dispatchEvent(event);
          }, 1000);
        }}
      />
    </div>
  );
}

