"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bot, FileText, Trash2, Loader2, Send, Image as ImageIcon, X, RotateCcw, Copy, Check, Plus, Save, XCircle, ClipboardCopy, AlertTriangle, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MarkdownRenderer } from "@/components/assistant/MarkdownRenderer";
import { SearchBar } from "@/components/assistant/SearchBar";
import { HighlightedText } from "@/components/assistant/HighlightedText";
import { QuickReplyButtons } from "@/components/assistant/QuickReplyButtons";
import { cn } from "@/lib/utils";
import { ImageFile, convertImagesToBase64, processImageFiles } from "@/lib/assistant/image-utils";
import { ProcessedFile, processFiles, MAX_FILES_PER_MESSAGE } from "@/lib/assistant/file-processing";
import { extractLagonOCRData } from "@/lib/assistant/ocr-parser";
import { convertOCRToContext, extractAgeFromText, extractCAFromText, extractEffectifFromText } from "@/lib/assistant/context-converter";
import { motion, AnimatePresence } from "framer-motion";
import { getRelativeTime, groupMessagesByDate, getDateLabel } from "@/lib/utils/date-helpers";
import { useMemo } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[]; // Base64 data URLs
  timestamp: Date;
}

export default function AssistantIAPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [lastSavedMessagesCount, setLastSavedMessagesCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [clientProfile, setClientProfile] = useState<object | null>(null);
  const [ocrExtractedData, setOcrExtractedData] = useState<any>(null);
  const [clientContext, setClientContext] = useState<{
    caseType: "general" | "client" | null;
    clientType: "particulier" | "tns" | "entreprise" | null;
    csp: string | null;
    ageBand: string | null;
    companyBand: { effectifBand: string | null; caBand: string | null } | null;
    dirigeantStatut: "tns" | "assimile_salarie" | null;
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ messageId: string; index: number }[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchResultRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const isUserAdmin = isAdmin(userData);

  // Groupement des messages par date
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(messages);
  }, [messages]);

  // Scroll intelligent - détection de la position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      setShouldAutoScroll(isNearBottom);
      setShowScrollToBottom(!isNearBottom && messages.length > 0);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // Vérifier la position initiale

    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages.length]);

  // Scroll automatique seulement si l'utilisateur est en bas
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  // Fonction pour scroller vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShouldAutoScroll(true);
  };

  // Focus automatique sur le textarea quand la réponse du bot est terminée
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      // Attendre un court délai pour s'assurer que le DOM est mis à jour
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length]);

  // Détecter les changements non sauvegardés
  useEffect(() => {
    if (messages.length > 0 && messages.length !== lastSavedMessagesCount) {
      setHasUnsavedChanges(true);
    } else if (messages.length === 0) {
      setHasUnsavedChanges(false);
    }
  }, [messages, lastSavedMessagesCount]);

  // Charger les conversations sauvegardées
  useEffect(() => {
    loadSavedConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N / Cmd+N pour nouveau chat
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewChatClick();
      }
      // Ctrl+F / Cmd+F pour rechercher
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges, messages.length]);

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
      setLastSavedMessagesCount(messages.length);
      setHasUnsavedChanges(false);
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
        }) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          images: msg.images,
          timestamp: new Date(msg.timestamp),
        }));

        setMessages(loadedMessages);
        setIsStarted(true); // Marquer la session comme démarrée
        toast.success("Conversation chargée avec succès");
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement de la conversation");
    }
  };

  // Ouvrir le dialog de confirmation de suppression
  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setShowDeleteDialog(true);
  };

  // Supprimer une conversation sauvegardée
  const handleDeleteConversation = async () => {
    if (!user || !conversationToDelete) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/assistant/conversations?id=${conversationToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Conversation supprimée avec succès");
      setShowDeleteDialog(false);
      setConversationToDelete(null);
      loadSavedConversations();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la conversation");
    }
  };

  // Gérer le clic sur "Bonjour"
  const handleBonjourClick = async () => {
    setIsStarted(true);
    await handleSendMessageWithUIEvent("Bonjour", "start");
  };

  // Clic sur "Nouveau chat" - vérifier si changements non sauvegardés
  const handleNewChatClick = () => {
    if (hasUnsavedChanges && messages.length > 0) {
      setShowNewChatDialog(true);
    } else {
      handleResetConversation();
    }
  };

  // Réinitialiser la conversation
  const handleResetConversation = () => {
    setMessages([]);
    setInput("");
    setSelectedImages([]);
    setSelectedFiles([]);
    setIsStarted(false);
    setClientProfile(null);
    setOcrExtractedData(null);
    setClientContext(null);
    setHasUnsavedChanges(false);
    setLastSavedMessagesCount(0);
    setShowNewChatDialog(false);
    toast.success("Nouvelle conversation démarrée");
  };

  // Sauvegarder puis nouveau chat
  const handleSaveAndNewChat = async () => {
    await handleSaveConversation();
    handleResetConversation();
  };

  // Gérer la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    // Trouver toutes les occurrences dans les messages
    const results: { messageId: string; index: number }[] = [];
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

    messages.forEach((message) => {
      let matchCount = 0;
      let match;
      while ((match = regex.exec(message.content)) !== null) {
        results.push({
          messageId: message.id,
          index: matchCount,
        });
        matchCount++;
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);

    // Scroll vers le premier résultat
    if (results.length > 0) {
      scrollToSearchResult(0);
    }
  };

  // Naviguer dans les résultats de recherche
  const handleSearchNavigate = (direction: "prev" | "next") => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchIndex;
    if (direction === "next") {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }

    setCurrentSearchIndex(newIndex);
    scrollToSearchResult(newIndex);
  };

  // Scroll vers un résultat de recherche
  const scrollToSearchResult = (index: number) => {
    if (index < 0 || index >= searchResults.length) return;

    const result = searchResults[index];
    const messageElement = document.getElementById(`message-${result.messageId}`);
    
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Fermer la recherche
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setCurrentSearchIndex(0);
  };

  // Copier un message
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success("Message copié dans le presse-papier");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast.error("Erreur lors de la copie");
    }
  };

  // Copier la dernière réponse du bot
  const handleCopyLastBotResponse = async () => {
    // Trouver le dernier message de l'assistant
    const lastBotMessage = messages.filter(msg => msg.role === "assistant").pop();
    
    if (!lastBotMessage) {
      toast.error("Aucune réponse du bot à copier");
      return;
    }

    try {
      await navigator.clipboard.writeText(lastBotMessage.content);
      toast.success("Dernière réponse copiée dans le presse-papier");
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast.error("Erreur lors de la copie");
    }
  };

  // Copier toute la conversation
  const handleCopyAllMessages = async () => {
    if (messages.length === 0) {
      toast.error("Aucun message à copier");
      return;
    }

    try {
      let text = "=".repeat(60) + "\n";
      text += "CONVERSATION ASSISTANT IA\n";
      text += `Date: ${new Date().toLocaleDateString("fr-FR", { 
        day: "numeric", 
        month: "long", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}\n`;
      text += `Messages: ${messages.length}\n`;
      text += "=".repeat(60) + "\n\n";

      for (const message of messages) {
        const role = message.role === "user" ? "👤 UTILISATEUR" : "🤖 ASSISTANT";
        const timestamp = message.timestamp.toLocaleString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        
        text += `${role} - ${timestamp}\n`;
        text += "-".repeat(60) + "\n";
        
        if (message.images && message.images.length > 0) {
          text += `[${message.images.length} image(s) jointe(s)]\n\n`;
        }
        
        text += message.content + "\n\n";
      }

      await navigator.clipboard.writeText(text);
      toast.success(`${messages.length} message(s) copié(s) dans le presse-papier`);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast.error("Erreur lors de la copie de la conversation");
    }
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

  // Fonction auxiliaire pour envoyer un message avec uiEvent
  const handleSendMessageWithUIEvent = async (
    messageText: string,
    uiEvent?: "start"
  ) => {
    if (isLoading) return;

    // Construire l'historique AVANT d'ajouter le nouveau message
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Ajouter le message utilisateur si c'est "Bonjour"
    if (messageText.trim() && uiEvent === "start") {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    setIsLoading(true);

    // Créer le message assistant initial
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          message: messageText,
          history: conversationHistory,
          uiEvent: uiEvent || undefined,
          context: clientContext || undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi du message");
      }

      // Stream SSE
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
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
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "content" && parsed.content) {
                    accumulatedContent += parsed.content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg
                      )
                    );
                  } else if (parsed.type === "error") {
                    throw new Error(parsed.error);
                  } else if (parsed.content) {
                    accumulatedContent += parsed.content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg
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
        
        // Après la fin du streaming, vérifier si c'est une réponse OCR (automatique)
        if (accumulatedContent) {
          const extractedData = extractLagonOCRData(accumulatedContent);
          if (extractedData) {
            setOcrExtractedData(extractedData);
            setClientProfile(extractedData);
            
            // Convertir les données OCR en contexte de segmentation
            const age = extractAgeFromText(accumulatedContent);
            const ca = extractCAFromText(accumulatedContent);
            const effectif = extractEffectifFromText(accumulatedContent);
            const context = convertOCRToContext(extractedData, age, ca, effectif);
            if (context) {
              setClientContext(context);
            }
          }
        }
      } else {
        const data = await response.json();
        const responseContent = data.response || data.message || "Aucune réponse reçue";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: responseContent }
              : msg
          )
        );
        
        // Vérifier si c'est une réponse OCR (mode non-streaming, automatique)
        if (responseContent) {
          const extractedData = extractLagonOCRData(responseContent);
          if (extractedData) {
            setOcrExtractedData(extractedData);
            setClientProfile(extractedData);
            
            // Convertir les données OCR en contexte de segmentation
            const age = extractAgeFromText(responseContent);
            const ca = extractCAFromText(responseContent);
            const effectif = extractEffectifFromText(responseContent);
            const context = convertOCRToContext(extractedData, age, ca, effectif);
            if (context) {
              setClientContext(context);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi du message");
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage !== undefined ? customMessage : input;
    // Permettre l'envoi même sans bouton sélectionné (chat libre)
    if ((!messageToSend.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || isLoading) return;

    // Convertir les images en Base64
    const imageBase64s = await convertImagesToBase64(selectedImages);

    // ⚠️ CORRECTION : Construire l'historique AVANT d'ajouter les nouveaux messages
    // Utiliser messages actuel (état React) pour construire l'historique
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      // Ne pas inclure les images et fichiers dans l'historique pour éviter la surcharge
    }));

    // Si une image est uploadée, l'IA fera automatiquement l'OCR si c'est une fiche Lagon
    // On peut laisser le message tel quel ou vide, l'IA détectera automatiquement
    let finalMessageText = messageToSend;
    if (imageBase64s.length > 0 && !messageToSend.trim()) {
      // Si pas de message mais une image, laisser vide pour que l'IA détecte automatiquement
      finalMessageText = "";
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: finalMessageText,
      images: imageBase64s.length > 0 ? imageBase64s : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = finalMessageText;
    const imagesToSend = imageBase64s;
    const filesToSend = selectedFiles;
    setInput("");
    setSelectedImages([]);
    setSelectedFiles([]);
    setIsLoading(true);

    // Créer le message assistant initial
    const assistantMessageId = (Date.now() + 1).toString();

    try {
      const endpoint = "/api/assistant/chat";
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
          message: messageText || (imagesToSend.length > 0 ? "" : "") || (filesToSend.length > 0 ? "Analyse ce(s) fichier(s)" : ""),
          images: imagesToSend.length > 0 ? imagesToSend : undefined,
          files: filesToSend.length > 0 ? filesToSend : undefined,
          history: conversationHistory,
          context: clientContext || undefined,
          stream: true, // Activer le streaming
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
                  
                  if (parsed.type === "content" && parsed.content) {
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
        
        // Après la fin du streaming, vérifier si c'est une réponse OCR (automatique)
        if (accumulatedContent) {
          const extractedData = extractLagonOCRData(accumulatedContent);
          if (extractedData) {
            setOcrExtractedData(extractedData);
            setClientProfile(extractedData);
            
            // Convertir les données OCR en contexte de segmentation
            const age = extractAgeFromText(accumulatedContent);
            const ca = extractCAFromText(accumulatedContent);
            const effectif = extractEffectifFromText(accumulatedContent);
            const context = convertOCRToContext(extractedData, age, ca, effectif);
            if (context) {
              setClientContext(context);
            }
          }
        }
      } else {
        // Mode non-streaming (fallback)
        const data = await response.json();
        const responseContent = data.response || data.message || "Aucune réponse reçue";

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: responseContent,
                }
              : msg
          )
        );
        
        // Vérifier si c'est une réponse OCR (mode non-streaming, automatique)
        if (responseContent) {
          const extractedData = extractLagonOCRData(responseContent);
          if (extractedData) {
            setOcrExtractedData(extractedData);
            setClientProfile(extractedData);
            
            // Convertir les données OCR en contexte de segmentation
            const age = extractAgeFromText(responseContent);
            const ca = extractCAFromText(responseContent);
            const effectif = extractEffectifFromText(responseContent);
            const context = convertOCRToContext(extractedData, age, ca, effectif);
            if (context) {
              setClientContext(context);
            }
          }
        }
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

        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card className="min-h-[600px] h-[calc(100vh-280px)] flex flex-col">
            <SearchBar
              onSearch={handleSearch}
              onNavigate={handleSearchNavigate}
              onClose={handleCloseSearch}
              currentIndex={currentSearchIndex}
              totalResults={searchResults.length}
              isOpen={isSearchOpen}
            />
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  Votre chatbot
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {messages.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLastBotResponse}
                        title="Copier la dernière réponse du bot"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copier réponse
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyAllMessages}
                        title="Copier toute la conversation"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      >
                        <ClipboardCopy className="h-4 w-4 mr-2" />
                        Copier tout
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewChatClick}
                        title="Nouveau chat (Ctrl+N / Cmd+N)"
                        className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau chat
                      </Button>
                      <Button
                        variant={hasUnsavedChanges ? "default" : "outline"}
                        size="sm"
                        onClick={handleSaveConversation}
                        disabled={isSavingConversation}
                        className={hasUnsavedChanges 
                          ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-950/30"}
                      >
                        {isSavingConversation ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder
                            {hasUnsavedChanges && <span className="ml-1 animate-pulse">•</span>}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0 relative">
              {/* Zone de messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto mb-4 space-y-1 px-4 py-4 min-h-0 bg-[#ECE5DD] dark:bg-[#0b141a]" 
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
              >
                {messages.length === 0 && !isStarted ? (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">Bienvenue ! Pour commencer, clique sur le bouton ci-dessous :</p>
                      <Button
                        onClick={handleBonjourClick}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white"
                      >
                        👋 Bonjour
                      </Button>
                    </div>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, dateMessages]) => {
                    const date = new Date(dateKey);
                    const dateLabel = getDateLabel(date);
                    
                    return (
                      <Fragment key={dateKey}>
                        {/* Séparateur de date */}
                        <div className="flex items-center justify-center my-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-white/80 dark:bg-gray-800/80 rounded-full border border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {dateLabel}
                            </span>
                          </div>
                        </div>
                        
                        {/* Messages du jour */}
                        {dateMessages.map((message, msgIndex) => {
                          // Calculer l'index de correspondance pour ce message
                          let matchIndexInMessage = -1;
                          if (searchQuery && searchResults.length > 0) {
                            const currentResult = searchResults[currentSearchIndex];
                            if (currentResult && currentResult.messageId === message.id) {
                              matchIndexInMessage = currentResult.index;
                            }
                          }

                          return (
                            <div
                              key={message.id}
                              id={`message-${message.id}`}
                              className={`flex mb-1 ${
                                message.role === "user" ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-2xl p-3 shadow-sm",
                                  message.role === "user"
                                    ? "bg-[#DCF8C6] dark:bg-[#056162] text-gray-900 dark:text-gray-100 rounded-tr-none"
                                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700"
                                )}
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
                                    <p className="whitespace-pre-wrap">
                                      <HighlightedText
                                        text={message.content}
                                        searchQuery={searchQuery}
                                        currentMatchIndex={matchIndexInMessage}
                                      />
                                    </p>
                                    <p className="text-xs opacity-70 mt-1">{getRelativeTime(message.timestamp)}</p>
                                  </>
                                ) : (
                                  <div className="relative group">
                                    {searchQuery ? (
                                      <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <HighlightedText
                                          text={message.content}
                                          searchQuery={searchQuery}
                                          currentMatchIndex={matchIndexInMessage}
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <MarkdownRenderer content={message.content} />
                                        {/* Boutons de réponse rapide pour les questions avec alternatives */}
                                        {message.role === "assistant" && (
                                          <QuickReplyButtons
                                            content={message.content}
                                            onSelect={(option) => {
                                              // Envoyer directement le message avec l'option sélectionnée
                                              handleSendMessage(option);
                                            }}
                                            disabled={isLoading}
                                          />
                                        )}
                                      </>
                                    )}
                                    {message.role === "assistant" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleCopyMessage(message.id, message.content)}
                                        aria-label="Copier le message"
                                        title="Copier le message"
                                      >
                                        {copiedMessageId === message.id ? (
                                          <Check className="h-3.5 w-3.5 text-green-600" />
                                        ) : (
                                          <Copy className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    )}
                                    <p className="text-xs opacity-70 mt-1">{getRelativeTime(message.timestamp)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </Fragment>
                    );
                  })
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">L'assistant réfléchit...</span>
                      </div>
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

              {/* Zone de saisie - désactivée si pas de tag principal */}
              <div className="px-6 pb-6 shrink-0">
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
                  <div className="flex-1 flex flex-col gap-2 relative">
                    <Textarea
                      ref={textareaRef}
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
                      className="min-h-[60px] pr-12"
                      disabled={isLoading}
                      maxLength={4000}
                    />
                    {input.length > 0 && (
                      <div className="absolute bottom-2 right-2">
                        <span
                          className={cn(
                            "text-xs",
                            input.length > 3500 ? "text-red-500" : "text-muted-foreground"
                          )}
                        >
                          {input.length}/4000
                        </span>
                      </div>
                    )}
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
                    onClick={() => handleSendMessage()}
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
              </div>

              {/* Bouton "Aller en bas" */}
              <AnimatePresence>
                {showScrollToBottom && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-24 right-8 z-50 p-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    aria-label="Aller en bas"
                    title="Aller en bas"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.button>
                )}
              </AnimatePresence>
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
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
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
                if (historySearchQuery.trim()) {
                  const query = historySearchQuery.toLowerCase();
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
                            className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700"
                          >
                            Charger
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportConversation(conv.id, "txt")}
                            className="hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-700"
                          >
                            Exporter
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(conv.id)}
                            className="group relative hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700 transition-all duration-300 hover:scale-105"
                            title="Supprimer la conversation"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors group-hover:rotate-12 transition-transform duration-300" />
                            <span className="absolute inset-0 rounded-md bg-red-500/0 group-hover:bg-red-500/10 transition-all duration-300" />
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

        {/* Dialog de confirmation pour nouveau chat */}
        <AlertDialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <AlertDialogContent className="sm:max-w-[480px]">
            <AlertDialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </div>
                <AlertDialogTitle className="text-xl">Conversation non sauvegardée</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base leading-relaxed pt-2">
                Votre conversation contient des messages non sauvegardés. Souhaitez-vous les enregistrer avant de continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 pt-6">
              <AlertDialogCancel 
                onClick={() => setShowNewChatDialog(false)}
                className="sm:flex-1 h-11 rounded-xl font-medium"
              >
                Annuler
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={handleResetConversation}
                className="sm:flex-1 h-11 rounded-xl font-medium border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-900/50 dark:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:hover:border-red-900 flex items-center justify-center"
              >
                <XCircle className="h-4 w-4 mr-2 shrink-0" />
                <span>Abandonner</span>
              </Button>
              <AlertDialogAction 
                onClick={handleSaveAndNewChat} 
                disabled={isSavingConversation}
                className="sm:flex-1 h-11 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isSavingConversation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 shrink-0 animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2 shrink-0" />
                    <span>Sauvegarder</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de confirmation pour supprimer une conversation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la conversation</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false);
                setConversationToDelete(null);
              }}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConversation}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </Tabs>
    </div>
  );
}


