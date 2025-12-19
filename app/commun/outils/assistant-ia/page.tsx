"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bot, Upload, FileText, Trash2, Loader2, Send, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/assistant/MarkdownRenderer";
import { ImageFile, convertImagesToBase64, processImageFiles } from "@/lib/assistant/image-utils";
import { ProcessedFile, processFiles, MAX_FILES_PER_MESSAGE } from "@/lib/assistant/file-processing";
import type { PromptTemplate } from "@/lib/assistant/templates";
import { replaceTemplateVariables, extractTemplateVariables } from "@/lib/assistant/templates";

interface SourceWithScore {
  title: string;
  score: number;
  documentId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[]; // Base64 data URLs
  sources?: string[];
  sourcesWithScores?: SourceWithScore[];
  timestamp: Date;
  context?: string; // Pour le mode debug
}

interface RAGDocument {
  id: string;
  title: string;
  type: string;
  source: string;
  chunkCount: number;
  createdAt: Date;
}

export default function AssistantIAPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useRAG, setUseRAG] = useState(false);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  interface SavedConversation {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: Date | string;
  }
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSavingConversation, setIsSavingConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const isUserAdmin = isAdmin(userData);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Charger les documents indexés (admin uniquement)
  useEffect(() => {
    if (isUserAdmin) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserAdmin]);

  // Charger les conversations sauvegardées et les templates
  useEffect(() => {
    loadSavedConversations();
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDocuments = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/assistant/rag/documents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des documents");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      toast.error("Erreur lors du chargement des documents");
    }
  };

  // Gérer les fichiers images
  const handleImageFiles = async (files: File[]) => {
    try {
      const processedImages = await processImageFiles(files);
      if (processedImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...processedImages]);
        toast.success(`${processedImages.length} image(s) ajoutée(s)`);
      } else {
        toast.error("Aucune image valide sélectionnée");
      }
    } catch (error) {
      console.error("Erreur lors du traitement des images:", error);
      toast.error("Erreur lors du traitement des images");
    }
  };

  // Gérer l'upload de fichiers pour le chat
  const handleChatFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    try {
      const filesArray = Array.from(files);
      const processedFiles: ProcessedFile[] = [];

      // Traiter chaque fichier
      for (const file of filesArray) {
        const fileName = file.name.toLowerCase();
        const mimeType = file.type;

        // Vérifier le type de fichier
        const isPDF = mimeType === "application/pdf" || fileName.endsWith(".pdf");
        const isText = mimeType === "text/plain" || mimeType === "text/csv" || fileName.endsWith(".txt") || fileName.endsWith(".csv");

        if (isPDF || isText) {
          // Extraire le texte côté serveur via l'API
          try {
            const token = await user?.getIdToken();
            if (!token) {
              throw new Error("Token d'authentification manquant");
            }

            const formData = new FormData();
            formData.append("file", file);

            console.log("Envoi du fichier à l'API d'extraction:", file.name, file.type);

            const response = await fetch("/api/assistant/files/extract", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });

            console.log("Réponse API:", response.status, response.statusText);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error("Erreur API:", errorData);
              throw new Error(errorData.error || `Erreur API (${response.status}): ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Données reçues:", data.success ? "Succès" : "Échec", data.text ? `Texte extrait (${data.text.length} caractères)` : "Pas de texte");
            
            if (data.success && data.text) {
              processedFiles.push({
                id: `${Date.now()}-${Math.random()}`,
                name: file.name,
                type: file.type,
                size: file.size,
                content: data.text,
              });
            } else {
              processedFiles.push({
                id: `${Date.now()}-${Math.random()}`,
                name: file.name,
                type: file.type,
                size: file.size,
                error: data.error || "Erreur lors de l'extraction du texte",
              });
            }
          } catch (error) {
            console.error("Erreur lors de l'extraction:", error);
            processedFiles.push({
              id: `${Date.now()}-${Math.random()}`,
              name: file.name,
              type: file.type,
              size: file.size,
              error: error instanceof Error ? error.message : "Erreur lors de l'extraction du texte",
            });
          }
        } else {
          // Pour les autres types de fichiers, utiliser processFiles (qui gère les erreurs)
          const singleFileProcessed = await processFiles([file]);
          processedFiles.push(...singleFileProcessed);
        }
      }

      // Filtrer les fichiers avec erreurs
      const validFiles = processedFiles.filter((f) => !f.error);
      const errorFiles = processedFiles.filter((f) => f.error);

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => {
          const newFiles = [...prev, ...validFiles];
          if (newFiles.length > MAX_FILES_PER_MESSAGE) {
            toast.warning(`Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message. Seuls les ${MAX_FILES_PER_MESSAGE} premiers seront envoyés.`);
            return newFiles.slice(0, MAX_FILES_PER_MESSAGE);
          }
          return newFiles;
        });
        toast.success(`${validFiles.length} fichier(s) ajouté(s)`);
      }

      if (errorFiles.length > 0) {
        errorFiles.forEach((f) => {
          toast.error(`${f.name}: ${f.error}`);
        });
      }
    } catch (error) {
      console.error("Erreur lors du traitement des fichiers:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du traitement des fichiers");
    } finally {
      setIsProcessingFiles(false);
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = "";
      }
    }
  };

  // Supprimer un fichier
  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Charger les conversations sauvegardées
  const loadSavedConversations = async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/assistant/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || "Erreur lors du chargement des conversations";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSavedConversations(data.conversations || []);
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des conversations";
      toast.error(errorMessage);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Sauvegarder la conversation actuelle
  const handleSaveConversation = async () => {
    if (!user || messages.length === 0) return;

    setIsSavingConversation(true);
    try {
      const token = await user.getIdToken();
      
      // Convertir les messages au format attendu
      const conversationMessages = messages.map((msg: Message) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        images: msg.images,
        timestamp: msg.timestamp,
        sources: msg.sources,
        sourcesWithScores: msg.sourcesWithScores,
      }));

      const response = await fetch("/api/assistant/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: conversationMessages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      toast.success("Conversation sauvegardée avec succès");
      loadSavedConversations();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSavingConversation(false);
    }
  };

  // Charger une conversation sauvegardée
  const handleLoadConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/assistant/conversations?id=${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement de la conversation");
      }

      const data = await response.json();
      const conversation = data.conversation;

      if (conversation) {
        // Convertir les messages au format Message
        const loadedMessages: Message[] = conversation.messages.map((msg: {
          id: string;
          role: "user" | "assistant";
          content: string;
          images?: string[];
          timestamp: Date | string;
          sources?: string[];
          sourcesWithScores?: SourceWithScore[];
        }) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          images: msg.images,
          timestamp: new Date(msg.timestamp),
          sources: msg.sources,
          sourcesWithScores: msg.sourcesWithScores,
        }));

        setMessages(loadedMessages);
        toast.success("Conversation chargée avec succès");
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement de la conversation");
    }
  };

  // Supprimer une conversation sauvegardée
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user || !confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/assistant/conversations?id=${conversationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Conversation supprimée avec succès");
      loadSavedConversations();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la conversation");
    }
  };

  // Charger les templates
  const loadTemplates = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/assistant/templates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Erreur lors du chargement des templates:", error);
    }
  };

  // Appliquer un template
  const handleApplyTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    const variables = extractTemplateVariables(template.prompt);
    
    if (variables.length > 0) {
      // Ouvrir un dialogue pour remplir les variables
      setTemplateVariables({});
      setShowTemplateDialog(true);
    } else {
      // Appliquer directement le template
      setInput(template.prompt);
      setSelectedTemplate(null);
    }
  };

  // Confirmer l'application du template avec variables
  const handleConfirmTemplate = () => {
    if (!selectedTemplate) return;

    const filledPrompt = replaceTemplateVariables(selectedTemplate.prompt, templateVariables);
    setInput(filledPrompt);
    setSelectedTemplate(null);
    setTemplateVariables({});
    setShowTemplateDialog(false);
  };

  // Exporter une conversation
  const handleExportConversation = async (conversationId: string, format: "txt" | "pdf" | "word") => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/assistant/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          format,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'export");
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation_${conversationId}.${format === "word" ? "docx" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Conversation exportée avec succès");
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'export");
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || isLoading) return;

    // Convertir les images en Base64
    const imageBase64s = await convertImagesToBase64(selectedImages);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      images: imageBase64s.length > 0 ? imageBase64s : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    const imagesToSend = imageBase64s;
    const filesToSend = selectedFiles;
    setInput("");
    setSelectedImages([]);
    setSelectedFiles([]);
    setIsLoading(true);

    // Créer le message assistant initial
    const assistantMessageId = (Date.now() + 1).toString();

    try {
      const endpoint = useRAG && isUserAdmin ? "/api/assistant/rag" : "/api/assistant/chat";
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          message: messageText || (imagesToSend.length > 0 ? "Analyse cette image" : "") || (filesToSend.length > 0 ? "Analyse ce(s) fichier(s)" : ""),
          images: imagesToSend.length > 0 ? imagesToSend : undefined,
          files: filesToSend.length > 0 ? filesToSend : undefined,
          useRAG: useRAG && isUserAdmin,
          stream: true, // Activer le streaming
          showDebug: showDebug,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi du message");
      }

      // Vérifier si c'est un stream
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        // Mode streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === "metadata") {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              sources: parsed.sources,
                              sourcesWithScores: parsed.sourcesWithScores,
                              context: parsed.context,
                            }
                          : msg
                      )
                    );
                  } else if (parsed.type === "content" && parsed.content) {
                    accumulatedContent += parsed.content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  } else if (parsed.type === "error") {
                    throw new Error(parsed.error);
                  } else if (parsed.content) {
                    // Format simple sans type
                    accumulatedContent += parsed.content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  }
                } catch (e) {
                  console.error("Erreur parsing SSE:", e);
                }
              }
            }
          }
        }
      } else {
        // Mode non-streaming (fallback)
        const data = await response.json();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: data.response || data.message || "Aucune réponse reçue",
                  sources: data.sources,
                  sourcesWithScores: data.sourcesWithScores,
                  context: data.context,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi du message"
      );
      // Supprimer le message assistant en cas d'erreur
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("Aucun fichier sélectionné");
      return;
    }

    console.log("Fichier sélectionné:", file.name, file.type, file.size);

    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (maximum 20 MB)");
      return;
    }

    setIsUploading(true);
    console.log("Début de l'upload...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(".pdf", ""));
      formData.append("type", "document");

      console.log("Récupération du token...");
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      console.log("Token récupéré, envoi de la requête...");

      const response = await fetch("/api/assistant/rag/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Réponse reçue:", response.status, response.statusText, response.headers.get("content-type"));

      if (!response.ok) {
        // Toujours utiliser response.text() d'abord pour voir la vraie erreur
        let errorText = "";
        try {
          errorText = await response.text();
          console.error("Réponse erreur (texte brut):", errorText);
        } catch (e) {
          console.error("Impossible de lire le texte de la réponse:", e);
        }

        // Essayer de parser en JSON si possible
        let errorData: { error?: string; message?: string; details?: string } = {};
        if (errorText && errorText.trim()) {
          try {
            errorData = JSON.parse(errorText);
          } catch {
            // Si ce n'est pas du JSON, utiliser le texte brut comme message d'erreur
            errorData = { error: errorText };
          }
        }

        console.error("Erreur API complète:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          parsed: errorData,
        });

        const errorMessage =
          errorData.error ||
          errorData.message ||
          errorData.details ||
          errorText ||
          `Erreur API (${response.status}): ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Upload réussi:", data);
      toast.success(`Document "${data.title}" indexé avec succès (${data.chunkCount} chunks)`);
      
      // Recharger la liste des documents
      loadDocuments();
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'upload du document"
      );
    } finally {
      setIsUploading(false);
      console.log("Upload terminé (succès ou échec)");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/assistant/rag/documents?id=${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Document supprimé avec succès");
      loadDocuments();
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression du document"
      );
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Bot className="h-8 w-8" />
              Assistant IA
            </h1>
            <p className="text-muted-foreground">
              Assistant IA intelligent pour vous aider dans vos tâches quotidiennes
            </p>
          </div>

          {isUserAdmin && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <Label htmlFor="rag-mode" className="cursor-pointer">
                  Mode RAG
                </Label>
                <Switch
                  id="rag-mode"
                  checked={useRAG}
                  onCheckedChange={setUseRAG}
                />
              </div>
              {useRAG && (
                <>
                  <span className="text-xs text-orange-500 font-medium">
                    Réponses enrichies avec contexte métier
                  </span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="debug-mode" className="cursor-pointer text-xs">
                      Debug
                    </Label>
                    <Switch
                      id="debug-mode"
                      checked={showDebug}
                      onCheckedChange={setShowDebug}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          {isUserAdmin && <TabsTrigger value="documents">Base de connaissances</TabsTrigger>}
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversation</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Menu templates */}
                  {templates.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplateDialog(true)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Templates
                    </Button>
                  )}
                  {messages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveConversation}
                      disabled={isSavingConversation}
                    >
                      {isSavingConversation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {/* Zone de messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Commencez une conversation avec l&apos;assistant IA</p>
                      {isUserAdmin && useRAG && (
                        <p className="text-sm mt-2 text-orange-500">
                          Mode RAG activé - Les réponses seront enrichies avec le contexte métier
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.role === "user" ? (
                          <>
                            {message.images && message.images.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {message.images.map((img, idx) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Image ${idx + 1}`}
                                    className="max-w-[200px] max-h-[200px] rounded-md object-cover"
                                  />
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}
                        {message.sourcesWithScores && message.sourcesWithScores.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              Sources utilisées :
                            </p>
                            <ul className="text-xs space-y-2">
                              {message.sourcesWithScores.map((source, idx) => {
                                const scorePercent = Math.round(source.score * 100);
                                return (
                                  <li key={idx} className="flex items-center justify-between gap-2 p-2 bg-background/50 rounded hover:bg-background/70 transition-colors">
                                    <div className="flex items-center gap-2 flex-1">
                                      <FileText className="h-3 w-3 text-muted-foreground" />
                                      <button
                                        onClick={() => {
                                          // Scroll vers l'onglet documents et highlight le document
                                          if (typeof window !== "undefined") {
                                            const documentsTab = window.document.querySelector('[value="documents"]') as HTMLElement;
                                            if (documentsTab) {
                                              documentsTab.click();
                                              setTimeout(() => {
                                                const docElement = window.document.querySelector(`[data-document-id="${source.documentId}"]`);
                                                docElement?.scrollIntoView({ behavior: "smooth", block: "center" });
                                                docElement?.classList.add("ring-2", "ring-orange-500");
                                                setTimeout(() => {
                                                  docElement?.classList.remove("ring-2", "ring-orange-500");
                                                }, 2000);
                                              }, 100);
                                            }
                                          }
                                        }}
                                        className="font-medium hover:text-orange-500 transition-colors text-left"
                                      >
                                        {source.title}
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                                        {scorePercent}%
                                      </span>
                                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-orange-500 transition-all"
                                          style={{ width: `${scorePercent}%` }}
                                          title={`Score de similarité: ${scorePercent}%`}
                                        />
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                        {message.sources && message.sources.length > 0 && !message.sourcesWithScores && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-semibold mb-2">Sources :</p>
                            <ul className="text-xs space-y-1">
                              {message.sources.map((source, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <FileText className="h-3 w-3" />
                                  {source}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {showDebug && message.context && (
                          <div className="mt-3 pt-3 border-t border-dashed border-border/50">
                            <details className="text-xs">
                              <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                                🔍 Contexte utilisé (Debug)
                              </summary>
                              <pre className="mt-2 p-2 bg-background/50 rounded text-xs overflow-auto max-h-40">
                                {message.context}
                              </pre>
                            </details>
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Prévisualisation des images */}
              {selectedImages.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          setSelectedImages((prev) => prev.filter((i) => i.id !== img.id))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Prévisualisation des fichiers */}
              {selectedFiles.length > 0 && (
                <div className="mb-2 space-y-2">
                  {selectedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md border"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                            {file.error && (
                              <span className="text-destructive ml-2">• {file.error}</span>
                            )}
                            {file.content && (
                              <span className="text-green-600 ml-2">• Texte extrait</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone de saisie */}
              <div
                className={`border-2 border-dashed rounded-lg p-2 transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-transparent"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = Array.from(e.dataTransfer.files);
                  
                  // Séparer les images et les fichiers
                  const imageFiles: File[] = [];
                  const otherFiles: File[] = [];
                  
                  for (const file of files) {
                    if (file.type.startsWith("image/")) {
                      imageFiles.push(file);
                    } else {
                      otherFiles.push(file);
                    }
                  }
                  
                  // Traiter les images
                  if (imageFiles.length > 0) {
                    await handleImageFiles(imageFiles);
                  }
                  
                  // Traiter les fichiers (PDF, etc.) via handleChatFileUpload
                  if (otherFiles.length > 0) {
                    // Créer un événement simulé pour handleChatFileUpload
                    const dataTransfer = new DataTransfer();
                    otherFiles.forEach(file => dataTransfer.items.add(file));
                    const fakeEvent = {
                      target: { files: dataTransfer.files }
                    } as React.ChangeEvent<HTMLInputElement>;
                    await handleChatFileUpload(fakeEvent);
                  }
                }}
              >
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      onPaste={async (e) => {
                        const items = Array.from(e.clipboardData.items);
                        const imageFiles: File[] = [];
                        for (const item of items) {
                          if (item.type.startsWith("image/")) {
                            const file = item.getAsFile();
                            if (file) imageFiles.push(file);
                          }
                        }
                        if (imageFiles.length > 0) {
                          e.preventDefault();
                          await handleImageFiles(imageFiles);
                        }
                      }}
                      placeholder="Tapez votre message... (Vous pouvez coller des images avec Ctrl+V / Cmd+V)"
                      className="min-h-[60px]"
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          await handleImageFiles(files);
                          e.target.value = "";
                        }}
                      />
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files) {
                            await handleImageFiles(Array.from(files));
                            e.target.value = "";
                          }
                        }}
                      />
                      <input
                        ref={chatFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                        multiple
                        className="hidden"
                        onChange={handleChatFileUpload}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        type="button"
                        disabled={isProcessingFiles}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => chatFileInputRef.current?.click()}
                        type="button"
                        disabled={isProcessingFiles || isLoading}
                      >
                        {isProcessingFiles ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Fichier
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || (!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0)}
                    size="lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barre de recherche et filtres */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher dans les conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={dateFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("all")}
                  >
                    Toutes
                  </Button>
                  <Button
                    variant={dateFilter === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("today")}
                  >
                    Aujourd&apos;hui
                  </Button>
                  <Button
                    variant={dateFilter === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("week")}
                  >
                    Cette semaine
                  </Button>
                  <Button
                    variant={dateFilter === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("month")}
                  >
                    Ce mois
                  </Button>
                </div>
              </div>

              {/* Liste des conversations */}
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (() => {
                // Filtrer les conversations
                let filtered = savedConversations;

                // Filtre par date
                if (dateFilter !== "all") {
                  const now = new Date();
                  const startDate = new Date();
                  
                  switch (dateFilter) {
                    case "today":
                      startDate.setHours(0, 0, 0, 0);
                      break;
                    case "week":
                      startDate.setDate(now.getDate() - 7);
                      break;
                    case "month":
                      startDate.setMonth(now.getMonth() - 1);
                      break;
                  }

                  filtered = filtered.filter((conv) => {
                    const updatedAt = new Date(conv.updatedAt);
                    return updatedAt >= startDate;
                  });
                }

                // Filtre par recherche
                if (searchQuery.trim()) {
                  const query = searchQuery.toLowerCase();
                  filtered = filtered.filter(
                    (conv) =>
                      conv.title.toLowerCase().includes(query) ||
                      conv.messages?.some((msg) =>
                        msg.content.toLowerCase().includes(query)
                      )
                  );
                }

                if (filtered.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-8">
                      {savedConversations.length === 0
                        ? "Aucune conversation sauvegardée"
                        : "Aucune conversation ne correspond aux critères de recherche"}
                    </p>
                  );
                }

                return (
                  <div className="space-y-2">
                    {filtered.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conv.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {conv.messages?.length || 0} message(s) •{" "}
                            {new Date(conv.updatedAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadConversation(conv.id)}
                          >
                            Charger
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportConversation(conv.id, "txt")}
                          >
                            Exporter
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConversation(conv.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dialogue pour sélectionner/appliquer un template */}
        {showTemplateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sélectionner un template</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowTemplateDialog(false);
                      setSelectedTemplate(null);
                      setTemplateVariables({});
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate ? (
                  // Formulaire pour remplir les variables
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">{selectedTemplate.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedTemplate.description}
                      </p>
                      <div className="space-y-2">
                        {extractTemplateVariables(selectedTemplate.prompt).map((varName) => (
                          <div key={varName}>
                            <Label htmlFor={`var-${varName}`}>{varName}</Label>
                            <Input
                              id={`var-${varName}`}
                              value={templateVariables[varName] || ""}
                              onChange={(e) =>
                                setTemplateVariables((prev) => ({
                                  ...prev,
                                  [varName]: e.target.value,
                                }))
                              }
                              placeholder={`Entrez la valeur pour ${varName}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleConfirmTemplate} className="flex-1">
                        Appliquer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setTemplateVariables({});
                        }}
                      >
                        Retour
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Liste des templates
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                            {template.variables && template.variables.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Variables : {template.variables.join(", ")}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            Utiliser
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {isUserAdmin && (
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Base de connaissances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Section upload */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">Ajouter un document PDF</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Les documents seront indexés et utilisés pour enrichir les réponses RAG
                      </p>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        variant="outline"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Indexation en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choisir un fichier PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Liste des documents */}
                <div>
                  <h3 className="font-semibold mb-4">Documents indexés</h3>
                  {documents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Aucun document indexé pour le moment
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          data-document-id={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.chunkCount} chunks • {doc.type}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

