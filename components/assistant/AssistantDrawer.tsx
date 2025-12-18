"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, FileText, Image as ImageIcon, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ImageFile, convertImagesToBase64, processImageFiles } from "@/lib/assistant/image-utils";
import { ProcessedFile, processFiles, MAX_FILES_PER_MESSAGE } from "@/lib/assistant/file-processing";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  timestamp: Date;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ReactNode;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "analyze-quote",
    title: "Analyser un devis",
    description: "Extrayez les informations clés d'un devis PDF",
    prompt: "Analyse ce devis et extrait les informations principales : montant, garanties, exclusions, et conditions.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "summarize-contract",
    title: "Résumer un contrat",
    description: "Synthétisez les points essentiels d'un contrat d'assurance",
    prompt: "Résume ce contrat d'assurance en mettant en évidence les garanties, exclusions, franchises et conditions de résiliation.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "explain-kpi",
    title: "Expliquer les KPI",
    description: "Analysez les performances et indicateurs clés",
    prompt: "Analyse ces données de performance et explique-moi les indicateurs clés, les tendances et les points d'attention.",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "write-email",
    title: "Rédiger un mail client",
    description: "Créez un email professionnel de relance ou d'information",
    prompt: "Rédige un email professionnel pour un client concernant :",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "compare-contracts",
    title: "Comparer deux contrats",
    description: "Mettez en évidence les différences entre deux offres",
    prompt: "Compare ces deux contrats d'assurance et identifie les différences en termes de garanties, prix, franchises et conditions.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "analyze-image",
    title: "Analyser une image",
    description: "Extrayez le texte et analysez le contenu d'une image",
    prompt: "Analyse cette image et extrait toutes les informations pertinentes.",
    icon: <ImageIcon className="h-5 w-5" />,
  },
];

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string, images: string[], files: ProcessedFile[]) => Promise<void>;
  messages: Message[];
  isLoading: boolean;
  responseProgress?: number; // Pourcentage de progression (0-100)
}

export function AssistantDrawer({ isOpen, onClose, onSendMessage, messages, isLoading, responseProgress = 0 }: AssistantDrawerProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

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

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(suggestion.prompt);
    textareaRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || isLoading || isProcessingFiles || !user) return;

    const imageBase64s = await convertImagesToBase64(selectedImages);
    const filesToSend = selectedFiles;
    const messageText = input.trim();

    // Appeler la fonction onSendMessage passée en prop
    await onSendMessage(messageText, imageBase64s, filesToSend);

    // Réinitialiser l'input et les fichiers sélectionnés
    setInput("");
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-background/95 backdrop-blur-lg border-l border-border/50 shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-drawer-title"
            aria-describedby="assistant-drawer-description"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 shrink-0"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h2 id="assistant-drawer-title" className="font-semibold text-base sm:text-lg tracking-tight truncate">Assistant Agence Allianz</h2>
                  <p id="assistant-drawer-description" className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">Aide devis, contrats, pilotage</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Fermer"
                className="hover:bg-muted/50 shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Suggestions (affichées seulement si pas de messages) */}
              {messages.length === 0 && (
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                    Suggestions intelligentes
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {SUGGESTIONS.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className="p-4 cursor-pointer hover:bg-muted/50 hover:border-amber-500/20 transition-all duration-200 border-border/50 group"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-500 shrink-0 group-hover:from-amber-500/20 group-hover:to-amber-600/10 transition-colors">
                              {suggestion.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm mb-1.5 group-hover:text-foreground transition-colors">
                                {suggestion.title}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {suggestion.description}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 && (
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-4 shadow-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border border-border/50"
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
                          <MarkdownRenderer content={message.content} />
                        )}
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 w-full max-w-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span className="text-sm text-muted-foreground">
                            {responseProgress > 0 ? `Réponse en cours... ${responseProgress}%` : "Réponse en cours..."}
                          </span>
                        </div>
                        {responseProgress > 0 && (
                          <div className="w-full bg-background rounded-full h-1.5">
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
              )}
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
                    placeholder="Tapez votre message..."
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
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || isLoading}
                  size="icon"
                  className="shrink-0 h-[60px] w-[60px] sm:h-[60px] sm:w-[60px] bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

