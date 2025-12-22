"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, X, Minimize2, Maximize2, Image as ImageIcon, FileText, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/use-auth";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { QuickActionButtons } from "./QuickActionButtons";
import { QuickReplyButtons } from "./QuickReplyButtons";
import { FlowReplyButtons } from "./FlowReplyButtons";
import { TagSelector } from "./TagSelector";
import { ImageFile, convertImagesToBase64, processImageFiles } from "@/lib/assistant/image-utils";
import { ProcessedFile, processFiles, MAX_FILES_PER_MESSAGE } from "@/lib/assistant/file-processing";
import {
  generateRoleQuestionMessage,
  generateContextQuestionMessage,
  generateTaskQuestionMessage,
  generateCompletionMessage,
  getFlowOptions,
  isFlowComplete,
  type InteractiveFlowState,
} from "@/lib/assistant/interactive-flow";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[]; // Base64 data URLs
  files?: { name: string; type: string; content?: string; error?: string }[];
  timestamp: Date;
}

export function FloatingAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedMainTag, setSelectedMainTag] = useState<string>("");
  const [flowState, setFlowState] = useState<InteractiveFlowState>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger l'état depuis localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("floating-assistant-open");
    if (savedState === "true") {
      setIsOpen(true);
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem("floating-assistant-open", "true");
    } else {
      localStorage.setItem("floating-assistant-open", "false");
    }
  }, [isOpen]);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus automatique sur le textarea quand la réponse du bot est terminée
  useEffect(() => {
    if (!isLoading && messages.length > 0 && isOpen && !isMinimized) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length, isOpen, isMinimized]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input, selectedImages, selectedFiles]);

  // Gérer le collage d'images depuis le presse-papier
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isOpen || isMinimized) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        try {
          const processedImages = await processImageFiles(imageFiles);
          setSelectedImages((prev) => [...prev, ...processedImages]);
          toast.success(`${processedImages.length} image(s) ajoutée(s)`);
        } catch (error) {
          console.error("Erreur lors du traitement des images:", error);
          toast.error("Erreur lors du traitement des images");
        }
      }
    };

    if (isOpen && !isMinimized) {
      window.addEventListener("paste", handlePaste);
      return () => window.removeEventListener("paste", handlePaste);
    }
  }, [isOpen, isMinimized]);

  // Gérer l'upload d'images
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const processedImages = await processImageFiles(Array.from(files));
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

    // Réinitialiser l'input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Gérer l'upload de fichiers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      if (selectedFiles.length + files.length > MAX_FILES_PER_MESSAGE) {
        toast.error(`Vous ne pouvez ajouter que ${MAX_FILES_PER_MESSAGE} fichiers maximum.`);
        return;
      }
      setIsProcessingFiles(true);
      try {
        const processedFiles: ProcessedFile[] = [];

        // Traiter chaque fichier
        for (const file of files) {
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

              const response = await fetch("/api/assistant/files/extract", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Erreur lors de l'extraction du texte");
              }

              const data = await response.json();
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

        // Filtrer les fichiers avec erreurs et afficher les messages
        const validFiles = processedFiles.filter((f) => !f.error);
        const errorFiles = processedFiles.filter((f) => f.error);

        if (validFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...validFiles]);
          toast.success(`${validFiles.length} fichier(s) ajouté(s)`);
        }

        if (errorFiles.length > 0) {
          errorFiles.forEach((f) => {
            toast.error(`${f.name}: ${f.error}`);
          });
        }
      } catch (error) {
        console.error("Erreur lors du traitement des fichiers:", error);
        toast.error("Erreur lors du traitement des fichiers");
      } finally {
        setIsProcessingFiles(false);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Gérer le drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const imageFiles: File[] = [];
    const otherFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        imageFiles.push(file);
      } else {
        otherFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      try {
        const processedImages = await processImageFiles(imageFiles);
        if (processedImages.length > 0) {
          setSelectedImages((prev) => [...prev, ...processedImages]);
          toast.success(`${processedImages.length} image(s) ajoutée(s)`);
        }
      } catch (error) {
        console.error("Erreur lors du traitement des images:", error);
        toast.error("Erreur lors du traitement des images");
      }
    }

    if (otherFiles.length > 0) {
      if (selectedFiles.length + otherFiles.length > MAX_FILES_PER_MESSAGE) {
        toast.error(`Vous ne pouvez ajouter que ${MAX_FILES_PER_MESSAGE} fichiers maximum.`);
        return;
      }
      setIsProcessingFiles(true);
      try {
        const processedFiles: ProcessedFile[] = [];

        // Traiter chaque fichier
        for (const file of otherFiles) {
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

              const response = await fetch("/api/assistant/files/extract", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Erreur lors de l'extraction du texte");
              }

              const data = await response.json();
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

        // Filtrer les fichiers avec erreurs et afficher les messages
        const validFiles = processedFiles.filter((f) => !f.error);
        const errorFiles = processedFiles.filter((f) => f.error);

        if (validFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...validFiles]);
          toast.success(`${validFiles.length} fichier(s) ajouté(s)`);
        }

        if (errorFiles.length > 0) {
          errorFiles.forEach((f) => {
            toast.error(`${f.name}: ${f.error}`);
          });
        }
      } catch (error) {
        console.error("Erreur lors du traitement des fichiers:", error);
        toast.error("Erreur lors du traitement des fichiers");
      } finally {
        setIsProcessingFiles(false);
      }
    }
  };

  // Supprimer une image
  const removeImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Supprimer un fichier
  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleResetConversation = () => {
    setMessages([]);
    setInput("");
    setSelectedImages([]);
    setSelectedFiles([]);
    setSelectedMainTag("");
    setFlowState({});
    toast.success("Conversation réinitialisée");
  };

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

  // Gérer la sélection du tag principal
  const handleMainTagSelect = async (tagId: string) => {
    setSelectedMainTag(tagId);
    setFlowState({}); // Réinitialiser le flux
    setMessages([]); // Réinitialiser les messages
    
    if (tagId) {
      // Envoyer automatiquement le message du bot pour demander le rôle
      const roleQuestion = generateRoleQuestionMessage(tagId);
      const botMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: roleQuestion,
        timestamp: new Date(),
      };
      setMessages([botMessage]);
      
      // Scroll vers le bas
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Gérer la sélection d'une option du flux interactif
  const handleFlowOptionSelect = async (optionId: string, step: "role" | "context" | "task") => {
    const newFlowState = { ...flowState };
    
    if (step === "role") {
      newFlowState.role = optionId;
      newFlowState.context = undefined;
      newFlowState.task = undefined;
      
      const contextQuestion = generateContextQuestionMessage(optionId);
      const botMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: contextQuestion,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } else if (step === "context") {
      newFlowState.context = optionId;
      newFlowState.task = undefined;
      
      const taskQuestion = generateTaskQuestionMessage();
      const botMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: taskQuestion,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } else if (step === "task") {
      newFlowState.task = optionId;
      
      const completionMessage = generateCompletionMessage(
        selectedMainTag,
        newFlowState.role!,
        newFlowState.context!,
        optionId
      );
      const botMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: completionMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }
    
    setFlowState(newFlowState);
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if ((!messageToSend.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || isLoading || isProcessingFiles || !user || !selectedMainTag) return;

    // Convertir les images en Base64
    const imageBase64s = await convertImagesToBase64(selectedImages);
    const filesToSend = selectedFiles;

    // ⚠️ CORRECTION : Construire l'historique AVANT d'ajouter les nouveaux messages
    // Utiliser messages actuel (état React) pour construire l'historique
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      // Ne pas inclure les images et fichiers dans l'historique pour éviter la surcharge
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend.trim() || (imageBase64s.length > 0 ? "Analyse cette image" : "") || (filesToSend.length > 0 ? "Analyse ces fichiers" : ""),
      images: imageBase64s.length > 0 ? imageBase64s : undefined,
      files: filesToSend.length > 0 ? filesToSend.map(f => ({ name: f.name, type: f.type, content: f.content, error: f.error })) : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = messageToSend.trim();
    const imagesToSend = imageBase64s;
    setInput("");
    setSelectedImages([]);
    setSelectedFiles([]);
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
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
          body: JSON.stringify({
            message: messageText || (imagesToSend.length > 0 ? "Analyse cette image" : "") || (filesToSend.length > 0 ? "Analyse ces fichiers" : ""),
            images: imagesToSend.length > 0 ? imagesToSend : undefined,
            files: filesToSend.length > 0 ? filesToSend.map(f => ({ name: f.name, type: f.type, content: f.content })) : undefined,
            history: conversationHistory,
            mainTag: selectedMainTag || undefined,
            flowRole: flowState.role || undefined,
            flowContext: flowState.context || undefined,
            flowTask: flowState.task || undefined,
            stream: true,
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
      } else {
        // Mode non-streaming (fallback)
        const data = await response.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: data.response || data.message || "Aucune réponse reçue",
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
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
      setInput("");
      setSelectedImages([]);
      setSelectedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Bouton flottant */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {/* Animation de pulsation en arrière-plan */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 opacity-20 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Badge IA */}
            <motion.div
              className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg z-10"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              IA
            </motion.div>

            <motion.button
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] transition-all duration-300 flex items-center justify-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Ouvrir l'assistant IA"
            >
              {/* Effet de brillance animé */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "linear",
                }}
              />
              
              {/* Icône principale */}
              <div className="relative z-10 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 absolute" />
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                </motion.div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? "auto" : "600px"
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "calc(100vh - 3rem)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-sm opacity-50" />
                  <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-2 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Assistant IA
                  </h3>
                  <p className="text-xs text-muted-foreground">Comment puis-je vous aider ?</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetConversation}
                    aria-label="Réinitialiser la conversation"
                    title="Réinitialiser la conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  aria-label={isMinimized ? "Agrandir" : "Réduire"}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground py-4">
                    <div className="relative mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full opacity-20 blur-xl" />
                      <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-3 rounded-full">
                        <MessageSquare className="h-8 w-8 text-white" />
                      </div>
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Sparkles className="h-5 w-5 text-amber-400" />
                      </motion.div>
                    </div>
                    <p className="font-medium">Bonjour ! Comment puis-je vous aider aujourd'hui ?</p>
                    </div>
                    {/* Sélecteur de tag */}
                    <div className="mt-4 pb-4 border-b">
                      <TagSelector
                        selectedMainTag={selectedMainTag}
                        onMainTagSelect={handleMainTagSelect}
                        compact={true}
                      />
                    </div>
                    {/* Boutons d'action rapide - seulement si pas de tag sélectionné */}
                    {!selectedMainTag && (
                      <QuickActionButtons
                        onSelect={(prompt) => {
                          setInput(prompt);
                          setTimeout(() => {
                            textareaRef.current?.focus();
                          }, 100);
                        }}
                        onOpenFullAssistant={() => setIsOpen(false)}
                      />
                    )}
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
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.role === "user" ? (
                          <>
                            {message.images && message.images.length > 0 && (
                              <div className="mb-2 space-y-1">
                                {message.images.map((img, idx) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Image ${idx + 1}`}
                                    className="max-w-full h-auto rounded max-h-32 object-contain"
                                  />
                                ))}
                              </div>
                            )}
                            {message.files && message.files.length > 0 && (
                              <div className="mb-2 space-y-1">
                                {message.files.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                    {file.error && <span className="text-xs text-destructive">({file.error})</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </>
                        ) : (
                          <div className="relative group">
                            <MarkdownRenderer content={message.content} />
                            {/* Boutons de réponse pour le flux interactif */}
                            {message.role === "assistant" && selectedMainTag && !isFlowComplete(flowState) && (
                              <>
                                {/* Demande de rôle */}
                                {!flowState.role &&
                                  (message.content.toLowerCase().includes("préciser votre rôle") ||
                                    message.content.toLowerCase().includes("préciser mon rôle") ||
                                    message.content.toLowerCase().includes("votre rôle")) && (
                                  <FlowReplyButtons
                                    options={getFlowOptions("role", selectedMainTag)}
                                    onSelect={(optionId) => handleFlowOptionSelect(optionId, "role")}
                                    disabled={isLoading}
                                    color="green"
                                    showOther={true}
                                    onOtherSelect={() => {
                                      setInput("Je suis ");
                                      setTimeout(() => textareaRef.current?.focus(), 100);
                                    }}
                                  />
                                )}
                                {/* Demande de contexte */}
                                {flowState.role &&
                                  !flowState.context &&
                                  (message.content.toLowerCase().includes("contexte") ||
                                    message.content.toLowerCase().includes("situation")) && (
                                  <FlowReplyButtons
                                    options={getFlowOptions("context", selectedMainTag, flowState.role)}
                                    onSelect={(optionId) => handleFlowOptionSelect(optionId, "context")}
                                    disabled={isLoading}
                                    color="blue"
                                    showOther={true}
                                    onOtherSelect={() => {
                                      setInput("Le contexte est ");
                                      setTimeout(() => textareaRef.current?.focus(), 100);
                                    }}
                                  />
                                )}
                                {/* Demande de tâche */}
                                {flowState.role &&
                                  flowState.context &&
                                  !flowState.task &&
                                  (message.content.toLowerCase().includes("souhaitez-vous") ||
                                    message.content.toLowerCase().includes("souhaitez que") ||
                                    message.content.toLowerCase().includes("que je fasse")) && (
                                  <FlowReplyButtons
                                    options={getFlowOptions("task")}
                                    onSelect={(optionId) => handleFlowOptionSelect(optionId, "task")}
                                    disabled={isLoading}
                                    color="green"
                                    showOther={true}
                                    onOtherSelect={() => {
                                      setInput("Je souhaite ");
                                      setTimeout(() => textareaRef.current?.focus(), 100);
                                    }}
                                  />
                                )}
                              </>
                            )}
                            {/* Boutons de réponse rapide pour les questions avec alternatives (après flux complété) */}
                            {message.role === "assistant" && isFlowComplete(flowState) && (
                              <QuickReplyButtons
                                content={message.content}
                                onSelect={(option) => {
                                  handleSendMessage(option);
                                }}
                                disabled={isLoading}
                              />
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
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            {!isMinimized && (
              <div
                className="p-4 border-t bg-muted/30"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Prévisualisation des images */}
                {selectedImages.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedImages.map((img) => (
                      <div key={img.id} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.preview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(img.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prévisualisation des fichiers */}
                {selectedFiles.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {selectedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 bg-background/50 rounded-md border"
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

                {/* Zone de drag & drop visuelle */}
                {isDragging && (
                  <div className="mb-2 p-4 border-2 border-dashed border-primary rounded-lg bg-primary/10 text-center">
                    <p className="text-sm text-primary">Déposez les fichiers ici</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-2">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={selectedMainTag ? "Tapez votre message..." : "Sélectionnez un domaine métier pour commencer"}
                      className="min-h-[60px] max-h-[120px] resize-none"
                      disabled={!selectedMainTag || isLoading || isProcessingFiles}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="floating-assistant-image-upload"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="floating-assistant-file-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={!selectedMainTag || isLoading || isProcessingFiles}
                        className="text-xs"
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!selectedMainTag || isLoading || isProcessingFiles || selectedFiles.length >= MAX_FILES_PER_MESSAGE}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Fichier
                      </Button>
                    </div>
                  </div>
                    {!selectedMainTag && (
                      <div className="mb-2 p-2 rounded-lg bg-muted border border-dashed text-center text-xs text-muted-foreground">
                        Sélectionnez un domaine métier pour commencer
                      </div>
                    )}
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={(!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || isLoading || isProcessingFiles || !selectedMainTag}
                      size="icon"
                      className="shrink-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isLoading || isProcessingFiles ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne. Collez une image avec Ctrl+V / Cmd+V
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

