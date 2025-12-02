"use client";

/**
 * Page "Outils" avec accès au chatbot RAG
 * Tous les utilisateurs peuvent accéder au chatbot
 * Les admins peuvent uploader des documents
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, FileText, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatbotWindow } from "@/components/chatbot/chatbot-window";
import { PdfUploadDialog } from "@/components/chatbot/pdf-upload-dialog";
import { PdfList } from "@/components/chatbot/pdf-list";
import { useAuth } from "@/lib/firebase/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";

export default function OutilsPage() {
  const { userData } = useAuth();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const isAdmin = userData?.role === "ADMINISTRATEUR";

  return (
    <RouteGuard allowedRoles={[]} requireAuth={true}>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Outils</h1>
              <p className="text-muted-foreground">
                Accédez au chatbot RAG et gérez les documents
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contenu principal */}
        <Tabs defaultValue="chatbot" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chatbot" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Chatbot RAG
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
            )}
          </TabsList>

          {/* Onglet Chatbot */}
          <TabsContent value="chatbot">
            <Card>
              <CardHeader>
                <CardTitle>Assistant RAG</CardTitle>
                <CardDescription>
                  Posez vos questions sur les documents de l'agence. Le chatbot utilise une base de
                  connaissances vectorielle pour vous fournir des réponses précises.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Comment ça fonctionne ?</h3>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>
                            Les documents sont indexés dans une base de données vectorielle
                            (Qdrant)
                          </li>
                          <li>
                            Vos questions sont analysées et comparées aux documents indexés
                          </li>
                          <li>
                            Le chatbot génère des réponses basées sur le contenu trouvé
                          </li>
                          <li>
                            Les réponses sont aérées, claires, complètes et pédagogiques
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setChatbotOpen(true)}
                    size="lg"
                    className="w-full"
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    Ouvrir le chatbot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Documents (Admin uniquement) */}
          {isAdmin && (
            <TabsContent value="documents">
              <div className="space-y-6">
                {/* Section Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Uploader un document
                    </CardTitle>
                    <CardDescription>
                      Ajoutez des PDFs ou des images (avec OCR) à la base de connaissances
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setUploadDialogOpen(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Sélectionner un fichier
                    </Button>
                  </CardContent>
                </Card>

                {/* Liste des documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documents indexés
                    </CardTitle>
                    <CardDescription>
                      Liste de tous les documents disponibles dans la base de connaissances
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PdfList onDelete={() => {}} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Fenêtre du chatbot */}
      <ChatbotWindow open={chatbotOpen} onOpenChange={setChatbotOpen} />

      {/* Dialog d'upload (Admin uniquement) */}
      {isAdmin && (
        <PdfUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSuccess={() => {
            // Recharger la liste des documents si nécessaire
          }}
        />
      )}
    </RouteGuard>
  );
}

