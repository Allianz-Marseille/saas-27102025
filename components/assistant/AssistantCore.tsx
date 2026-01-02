"use client";

import React, { useEffect, useRef, useState, useMemo, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Image as ImageIcon, FileText, X, Copy, Check, ChevronDown } from "lucide-react";
import { useAssistantStore } from "@/lib/assistant/assistant-store";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { QuickReplyButtons } from "./QuickReplyButtons";
import { convertImagesToBase64, processImageFiles } from "@/lib/assistant/image-utils";
import { processFiles, MAX_FILES_PER_MESSAGE } from "@/lib/assistant/file-processing";
import { cn } from "@/lib/utils";
import { getRelativeTime, groupMessagesByDate, getDateLabel } from "@/lib/utils/date-helpers";

interface AssistantCoreProps {
  variant: "drawer";
}

export function AssistantCore({ variant }: AssistantCoreProps) {
  const { user } = useAuth();
  
  // Store Zustand
  const {
    stateMachine,
    setStateMachine,
    messages,
    addMessage,
    updateMessage,
    isLoading,
    setIsLoading,
    selectedRoleId,
    setSelectedRoleId,
    selectedModeId,
    setSelectedModeId,
    selectedImages,
    setSelectedImages,
    selectedFiles,
    setSelectedFiles,
  } = useAssistantStore();

  // États locaux pour l'UI
  const [input, setInput] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = React.useState(false);
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Focus automatique sur le textarea quand la réponse du bot est terminée
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length]);

  // Gérer le collage d'images depuis le presse-papier
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
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

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [setSelectedImages]);

  // ============================================================================
  // HANDLERS BOUTONS (State Machine)
  // ============================================================================

  /**
   * Bouton "👋 Bonjour" cliqué (état idle -> modeActive pour conversation directe)
   */
  const handleBonjourClick = async () => {
    // Ajouter le message "Bonjour" visible dans le chat
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: "Bonjour",
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Passer directement en mode conversation
    setStateMachine("modeActive");

    // Appeler l'API avec uiEvent="start"
    await sendMessageToAPI("Bonjour", [], [], "start");
  };


  // ============================================================================
  // ENVOI DE MESSAGES
  // ============================================================================

  /**
   * Envoyer un message à l'API
   */
  const sendMessageToAPI = async (
    messageText: string,
    imageBase64s: string[],
    filesToSend: { name: string; type: string; content?: string; data?: string }[],
    uiEvent?: "start"
  ) => {
    if (!user) return;

    setIsLoading(true);

    // Construire l'historique
    // Pour "start" (Bonjour), on a ajouté un message avant, donc on enlève le dernier
    const conversationHistory = uiEvent === "start" 
      ? messages.slice(0, -1).map((msg) => ({ role: msg.role, content: msg.content }))
      : messages.map((msg) => ({ role: msg.role, content: msg.content }));

    // Créer le message assistant initial
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant" as const,
      content: "",
      timestamp: new Date(),
    };
    addMessage(assistantMessage);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          message: messageText || " ",
          images: imageBase64s.length > 0 ? imageBase64s : undefined,
          files: filesToSend.length > 0 ? filesToSend : undefined,
          history: conversationHistory,
          uiEvent: uiEvent || undefined,
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
                    updateMessage(assistantMessageId, accumulatedContent);
                  } else if (parsed.type === "error") {
                    throw new Error(parsed.error);
                  } else if (parsed.content) {
                    // Format simple sans type
                    accumulatedContent += parsed.content;
                    updateMessage(assistantMessageId, accumulatedContent);
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
        updateMessage(assistantMessageId, data.response || data.message || "Aucune réponse reçue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi du message"
      );
      // Supprimer le message assistant en cas d'erreur
      // (pas possible avec Zustand sans refonte, on laisse le message vide)
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Envoyer un message classique (depuis le textarea)
   */
  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage !== undefined ? customMessage : input;

    // Permettre l'envoi même sans message si images/fichiers
    if (
      (!messageToSend.trim() && selectedImages.length === 0 && selectedFiles.length === 0) ||
      isLoading ||
      isProcessingFiles ||
      !user
    )
      return;

    // Convertir les images en Base64
    const imageBase64s = await convertImagesToBase64(selectedImages);
    const filesToSend = selectedFiles;

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content:
        messageToSend.trim() ||
        (imageBase64s.length > 0 ? "Analyse cette image" : "") ||
        (filesToSend.length > 0 ? "Analyse ces fichiers" : ""),
      images: imageBase64s.length > 0 ? imageBase64s : undefined,
      files:
        filesToSend.length > 0
          ? filesToSend.map((f) => ({ name: f.name, type: f.type, content: f.content, data: f.data, error: f.error }))
          : undefined,
      timestamp: new Date(),
    };

    addMessage(userMessage);

    const messageText = messageToSend.trim();
    setInput("");
    setSelectedImages([]);
    setSelectedFiles([]);

    await sendMessageToAPI(
      messageText || (imageBase64s.length > 0 ? "Analyse cette image" : "") || (filesToSend.length > 0 ? "Analyse ces fichiers" : ""),
      imageBase64s,
      filesToSend.map((f) => ({ name: f.name, type: f.type, content: f.content, data: f.data }))
    );
  };

  // ============================================================================
  // HANDLERS FICHIERS / IMAGES
  // ============================================================================

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

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      if (selectedFiles.length + files.length > MAX_FILES_PER_MESSAGE) {
        toast.error(`Vous ne pouvez ajouter que ${MAX_FILES_PER_MESSAGE} fichiers maximum.`);
        return;
      }
      setIsProcessingFiles(true);
      try {
        const processedFilesResult = await processFiles(files);
        const validFiles = processedFilesResult.filter((f) => !f.error);
        const errorFilesWithData = processedFilesResult.filter((f) => f.error && f.data); // Fichiers avec erreur mais données brutes (pour parsing serveur)
        const errorFilesWithoutData = processedFilesResult.filter((f) => f.error && !f.data); // Fichiers avec erreur et sans données

        // Ajouter les fichiers valides ET les fichiers avec erreur mais données brutes (Excel/PDF)
        const filesToAdd = [...validFiles, ...errorFilesWithData];
        
        if (filesToAdd.length > 0) {
          setSelectedFiles((prev) => [...prev, ...filesToAdd]);
          if (errorFilesWithData.length > 0) {
            toast.success(`${validFiles.length} fichier(s) ajouté(s). ${errorFilesWithData.length} fichier(s) sera analysé côté serveur.`);
          } else {
            toast.success(`${validFiles.length} fichier(s) ajouté(s)`);
          }
        }

        if (errorFilesWithoutData.length > 0) {
          errorFilesWithoutData.forEach((f) => {
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
        const processedFilesResult = await processFiles(otherFiles);
        const validFiles = processedFilesResult.filter((f) => !f.error);
        const errorFilesWithData = processedFilesResult.filter((f) => f.error && f.data); // Fichiers avec erreur mais données brutes (pour parsing serveur)
        const errorFilesWithoutData = processedFilesResult.filter((f) => f.error && !f.data); // Fichiers avec erreur et sans données

        // Ajouter les fichiers valides ET les fichiers avec erreur mais données brutes (Excel/PDF)
        const filesToAdd = [...validFiles, ...errorFilesWithData];
        
        if (filesToAdd.length > 0) {
          setSelectedFiles((prev) => [...prev, ...filesToAdd]);
          if (errorFilesWithData.length > 0) {
            toast.success(`${validFiles.length} fichier(s) ajouté(s). ${errorFilesWithData.length} fichier(s) sera analysé côté serveur.`);
          } else {
            toast.success(`${validFiles.length} fichier(s) ajouté(s)`);
          }
        }

        if (errorFilesWithoutData.length > 0) {
          errorFilesWithoutData.forEach((f) => {
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

  const removeImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== id));
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  if (!user) return null;

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-1 px-4 py-4 min-h-0 bg-[#ECE5DD] dark:bg-[#0b141a]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {/* État IDLE : Bouton "👋 Bonjour" */}
        {stateMachine === "idle" && messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
                Bienvenue ! Pour commencer, clique sur le bouton ci-dessous :
              </p>
              <Button
                onClick={handleBonjourClick}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white"
              >
                👋 Bonjour
              </Button>
            </div>
          </div>
        )}

        {/* Messages normaux avec groupement par date */}
        {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => {
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
              {dateMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-1`}
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
                        <p className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">{message.content}</p>
                      </>
                    ) : (
                      <div className="relative group">
                        <MarkdownRenderer content={message.content} />
                        {/* Boutons de réponse rapide pour les questions avec alternatives */}
                        {message.role === "assistant" && (
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
                    <p className="text-xs opacity-70 mt-1">{getRelativeTime(message.timestamp)}</p>
                  </div>
                </div>
              ))}
            </Fragment>
          );
        })}

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

      {/* Zone de saisie (affichée dès qu'il y a des messages, après le clic Bonjour) */}
      {messages.length > 0 && (
        <div className="px-6 pb-6 shrink-0">
          <div
            className={`border-2 border-dashed rounded-lg p-2 transition-colors ${
              isDragging ? "border-primary bg-primary/10" : "border-transparent"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-2 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tapez votre message... (Vous pouvez coller des images avec Ctrl+V / Cmd+V)"
                  className="min-h-[60px] pr-12"
                  disabled={isLoading || isProcessingFiles}
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
                {(selectedImages.length > 0 || selectedFiles.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.preview}
                          alt="Preview"
                          className="h-16 w-16 object-cover rounded border border-gray-200 dark:border-gray-700"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(image.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {selectedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2 bg-background border border-border rounded-md text-sm"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          {file.error && <p className="text-xs text-destructive">{file.error}</p>}
                          {file.content && <p className="text-xs text-green-600">Texte extrait</p>}
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
                <div className="flex items-center gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id={`${variant}-image-upload`}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id={`${variant}-file-upload`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isLoading || isProcessingFiles}
                    className="text-xs"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isProcessingFiles || selectedFiles.length >= MAX_FILES_PER_MESSAGE}
                    className="text-xs"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Fichier
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => handleSendMessage()}
                disabled={
                  (!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) ||
                  isLoading ||
                  isProcessingFiles
                }
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
          </div>
        </div>
      )}

      {/* Bouton "Aller en bas" */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 z-50 p-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Aller en bas"
            title="Aller en bas"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
