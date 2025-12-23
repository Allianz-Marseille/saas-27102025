"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, FileText, Image as ImageIcon, Loader2, MessageSquare, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ImageFile, convertImagesToBase64, processImageFiles } from "@/lib/assistant/image-utils";
import { ProcessedFile, processFiles, MAX_FILES_PER_MESSAGE } from "@/lib/assistant/file-processing";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { MainButtonMenu } from "./MainButtonMenu";
import { SubButtonMenu } from "./SubButtonMenu";
import { requiresSubButton } from "@/lib/assistant/main-buttons";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  timestamp: Date;
}

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string, images: string[], files: ProcessedFile[], mainButton?: string, subButton?: string) => Promise<void>;
  onReset?: () => void;
  messages: Message[];
  isLoading: boolean;
  responseProgress?: number; // Pourcentage de progression (0-100)
}

export function AssistantDrawer({ isOpen, onClose, onSendMessage, onReset, messages, isLoading, responseProgress = 0 }: AssistantDrawerProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedMainButton, setSelectedMainButton] = useState<string | null>(null);
  const [selectedSubButton, setSelectedSubButton] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

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

  // Focus trap et gestion du focus
  useEffect(() => {
    if (!isOpen) return;

    // Sauvegarder l'élément actif avant l'ouverture
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus sur le textarea à l'ouverture
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    // Focus trap : garder le focus dans le drawer
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !drawerRef.current) return;

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Fermer avec Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        // Restaurer le focus sur l'élément précédent
        previousActiveElementRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleTabKey);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleTabKey);
      window.removeEventListener("keydown", handleEscape);
      // Restaurer le focus à la fermeture
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  // Scroll automatique
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Gérer la sélection du bouton principal
  const handleMainButtonSelect = (buttonId: string) => {
    setSelectedMainButton(buttonId);
    setSelectedSubButton(null);
    // Si le bouton nécessite un sous-bouton, on ne démarre pas encore la conversation
    // Sinon, on peut commencer directement
    if (!requiresSubButton(buttonId)) {
      // Pas de sous-bouton nécessaire, on peut commencer la conversation
      // Envoyer automatiquement un message initial pour déclencher l'IA
      setTimeout(() => {
        handleSendMessage("Bonjour"); // Message initial pour déclencher le prompt système
      }, 100);
    }
  };

  // Gérer la sélection du sous-bouton
  const handleSubButtonSelect = (subButtonId: string) => {
    setSelectedSubButton(subButtonId);
    // Envoyer automatiquement un message initial pour déclencher l'IA
    // Utiliser un petit délai pour s'assurer que l'état est mis à jour
    setTimeout(() => {
      handleSendMessage("Bonjour"); // Message initial pour déclencher le prompt système
    }, 100);
  };

  // Gérer le retour au menu principal
  const handleBackToMainMenu = () => {
    setSelectedMainButton(null);
    setSelectedSubButton(null);
  };

  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage !== undefined ? customMessage : input;
    // Permettre l'envoi même sans bouton sélectionné (chat libre)
    if ((!messageToSend.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || isLoading || isProcessingFiles || !user) return;

    const imageBase64s = await convertImagesToBase64(selectedImages);
    const filesToSend = selectedFiles;
    const messageText = messageToSend.trim();

    // Appeler la fonction onSendMessage passée en prop avec les boutons sélectionnés
    await onSendMessage(messageText, imageBase64s, filesToSend, selectedMainButton || undefined, selectedSubButton || undefined);

    // Réinitialiser l'input et les fichiers sélectionnés
    if (!customMessage) {
      setInput("");
    }
    setSelectedImages([]);
    setSelectedFiles([]);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const processedImages = await processImageFiles(Array.from(files));
      if (processedImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...processedImages]);
        toast.success(`${processedImages.length} image(s) ajoutée(s)`);
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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    try {
      const processedFiles = await processFiles(Array.from(files));
      const validFiles = processedFiles.filter((f) => !f.error);
      const errorFiles = processedFiles.filter((f) => f.error);

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => {
          const newFiles = [...prev, ...validFiles];
          return newFiles.length > MAX_FILES_PER_MESSAGE ? newFiles.slice(0, MAX_FILES_PER_MESSAGE) : newFiles;
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePasteImage = async (e: React.ClipboardEvent) => {
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

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const imageFiles: File[] = [];
    const otherFiles: File[] = [];

    for (const file of files) {
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
      setIsProcessingFiles(true);
      try {
        const processedFiles = await processFiles(otherFiles);
        const validFiles = processedFiles.filter((f) => !f.error);
        const errorFiles = processedFiles.filter((f) => f.error);

        if (validFiles.length > 0) {
          setSelectedFiles((prev) => {
            const newFiles = [...prev, ...validFiles];
            return newFiles.length > MAX_FILES_PER_MESSAGE
              ? newFiles.slice(0, MAX_FILES_PER_MESSAGE)
              : newFiles;
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
      }
    }
  };

  if (!user) return null;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-background/95 backdrop-blur-lg border-l border-border/50 shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-drawer-title"
        aria-describedby="assistant-drawer-description"
      >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-sm opacity-50" />
                  <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-2 sm:p-2.5 rounded-lg">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="assistant-drawer-title" className="font-bold text-base sm:text-lg tracking-tight truncate bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Assistant IA
                  </h2>
                  <p id="assistant-drawer-description" className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">Comment puis-je vous aider ?</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {messages.length > 0 && onReset && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedMainButton(null);
                      setSelectedSubButton(null);
                      onReset();
                    }}
                    aria-label="Réinitialiser la conversation"
                    className="hover:bg-muted/50"
                    title="Réinitialiser la conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="hover:bg-muted/50"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-1 px-4 py-4 min-h-0 bg-[#ECE5DD] dark:bg-[#0b141a]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              {/* Menu de boutons (affichés seulement si pas de messages) */}
              {messages.length === 0 ? (
                <div className="flex justify-start">
                  <div className="max-w-[75%] bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">Bonjour ! Comment puis-je vous aider aujourd'hui ?</p>
                    {/* Menu principal ou sous-menu */}
                    {!selectedMainButton ? (
                      <MainButtonMenu
                        onSelect={handleMainButtonSelect}
                        disabled={isLoading}
                      />
                    ) : requiresSubButton(selectedMainButton) && !selectedSubButton ? (
                      <SubButtonMenu
                        mainButtonId={selectedMainButton}
                        onSelect={handleSubButtonSelect}
                        onBack={handleBackToMainMenu}
                        disabled={isLoading}
                      />
                    ) : null}
                  </div>
                </div>
              ) : (

                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } mb-1`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                        message.role === "user"
                          ? "bg-[#DCF8C6] dark:bg-[#056162] text-gray-900 dark:text-gray-100 rounded-tr-none"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700"
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
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </>
                        ) : (
                          <>
                            <div className="relative group">
                              <MarkdownRenderer content={message.content} />
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
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start mb-1">
                    <div className="max-w-[75%] bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span className="text-sm text-muted-foreground">
                          {responseProgress > 0 ? `Réponse en cours... ${responseProgress}%` : "Réponse en cours..."}
                        </span>
                      </div>
                      {responseProgress > 0 && (
                        <div className="w-full bg-background rounded-full h-1.5 mt-2">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${responseProgress}%` }}
                            role="progressbar"
                            aria-valuenow={responseProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progression de la réponse: ${responseProgress}%`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
              className={`relative border-t border-border/50 bg-gradient-to-t from-background to-muted/10 p-3 sm:p-4 space-y-2 sm:space-y-3 transition-colors ${
                isDragging ? "bg-amber-500/5 border-amber-500/30" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-lg pointer-events-none z-10 m-3 sm:m-4">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Déposez les fichiers ici
                  </p>
                </div>
              )}
              {/* Prévisualisation fichiers/images */}
              {(selectedImages.length > 0 || selectedFiles.length > 0) && (
                <div className="flex flex-wrap gap-2">
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
                        onClick={() => setSelectedImages((prev) => prev.filter((i) => i.id !== img.id))}
                        aria-label={`Supprimer l'image ${img.file.name}`}
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                  {selectedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => setSelectedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        aria-label={`Supprimer le fichier ${file.name}`}
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone de saisie */}
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-2">
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
                    onPaste={handlePasteImage}
                    placeholder="Tapez votre message... (Vous pouvez coller des images avec Ctrl+V / Cmd+V)"
                    className="min-h-[60px] max-h-[120px] resize-none"
                    disabled={isLoading || isProcessingFiles}
                    aria-label="Zone de saisie du message"
                    aria-describedby="textarea-help"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isLoading || isProcessingFiles}
                      className="text-xs"
                    >
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isProcessingFiles}
                      className="text-xs"
                    >
                      {isProcessingFiles ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <FileText className="h-3 w-3 mr-1" />
                          Fichier
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={(!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || isLoading || isProcessingFiles}
                  size="icon"
                  className="shrink-0 h-[60px] w-[60px] sm:h-[60px] sm:w-[60px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}

