"use client";

import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image as ImageIcon, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
import { ragConfig } from "@/lib/config/rag-config";

interface PdfUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "extracting" | "embedding" | "indexing" | "success" | "error";
  error?: string;
  currentStep?: string;
  metrics?: {
    chunksCount?: number;
    fileSize?: number;
    traceId?: string;
  };
}

export function PdfUploadDialog({ open, onOpenChange, onSuccess }: PdfUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Vérifier le type
    const isPDF = file.type === "application/pdf";
    const isImage = ragConfig.files.allowedImageTypes.includes(file.type as any);
    
    if (!isPDF && !isImage) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types autorisés: PDF, PNG, JPG, JPEG, WEBP`,
      };
    }

    // Vérifier la taille
    const maxSize = isPDF ? ragConfig.files.maxSizePDF : ragConfig.files.maxSizeImage;
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximale: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  };

  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        newFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input pour permettre de sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setUploadProgress((prev) => {
      const next = new Map(prev);
      next.delete(fileName);
      return next;
    });
  };

  const updateProgress = (
    fileName: string,
    status: UploadProgress["status"],
    progress: number,
    currentStep?: string,
    metrics?: UploadProgress["metrics"]
  ) => {
    setUploadProgress((prev) => {
      const next = new Map(prev);
      next.set(fileName, {
        fileName,
        progress,
        status,
        currentStep,
        metrics,
      });
      return next;
    });
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      toast.error("Vous devez être connecté pour uploader des fichiers");
      return;
    }

    const fileName = file.name;
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    // Initialiser le progrès
    updateProgress(fileName, "uploading", 10, "Upload du fichier vers le serveur...");

    try {
      // Récupérer le token d'authentification
      const token = await user.getIdToken();

      // Créer FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload avec suivi de progression
      updateProgress(fileName, "uploading", 20, "Envoi du fichier...");
      
      const response = await fetch("/api/chat/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Simuler la progression pendant le traitement serveur
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const current = prev.get(fileName);
          if (!current || current.status === "error" || current.status === "success") {
            clearInterval(progressInterval);
            return prev;
          }
          
          let newProgress = current.progress;
          let newStatus = current.status;
          let newStep = current.currentStep;

          // Progression selon l'étape
          if (current.status === "uploading" && newProgress < 30) {
            newProgress = Math.min(30, newProgress + 2);
            newStep = "Upload du fichier...";
          } else if (current.status === "extracting" || (current.status === "uploading" && newProgress >= 30)) {
            newStatus = "extracting";
            newProgress = Math.min(50, newProgress + 2);
            newStep = "Extraction du texte...";
          } else if (current.status === "embedding" || (newStatus === "extracting" && newProgress >= 50)) {
            newStatus = "embedding";
            newProgress = Math.min(75, newProgress + 2);
            newStep = "Génération des embeddings...";
          } else if (current.status === "indexing" || (newStatus === "embedding" && newProgress >= 75)) {
            newStatus = "indexing";
            newProgress = Math.min(95, newProgress + 2);
            newStep = "Indexation dans la base vectorielle...";
          }

          const next = new Map(prev);
          next.set(fileName, {
            ...current,
            progress: newProgress,
            status: newStatus,
            currentStep: newStep,
          });
          return next;
        });
      }, 500);

      if (!response.ok) {
        clearInterval(progressInterval);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || "Erreur lors de l'upload";
        const traceId = errorData.traceId;
        
        // Messages d'erreur plus spécifiques
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes("Qdrant") || errorMessage.includes("connexion à Qdrant")) {
          userFriendlyMessage = "Erreur de connexion à la base vectorielle. Vérifiez la configuration.";
        } else if (errorMessage.includes("OpenAI")) {
          userFriendlyMessage = "Erreur de connexion à OpenAI. Vérifiez la configuration.";
        } else if (errorMessage.includes("Storage") || errorMessage.includes("bucket")) {
          userFriendlyMessage = "Erreur de stockage. Vérifiez la configuration Firebase.";
        } else if (errorMessage.includes("corrompu") || errorMessage.includes("PDF")) {
          userFriendlyMessage = "Le fichier PDF est corrompu ou protégé. Impossible d'extraire le texte.";
        } else if (errorMessage.includes("mot de passe") || errorMessage.includes("protégé")) {
          userFriendlyMessage = "Le PDF est protégé par mot de passe. Impossible de l'indexer.";
        }
        
        updateProgress(fileName, "error", 0, undefined, { traceId });
        toast.error(userFriendlyMessage, {
          description: traceId ? `ID de trace: ${traceId}` : undefined,
          duration: 5000,
        });
        return;
      }

      clearInterval(progressInterval);
      const result = await response.json();

      // Mettre à jour avec les métriques
      updateProgress(
        fileName,
        "success",
        100,
        "Terminé avec succès",
        {
          chunksCount: result.chunkCount,
          fileSize: file.size,
          traceId: result.traceId,
        }
      );

      const successMessage = `Fichier "${fileName}" uploadé et indexé avec succès`;
      const description = result.chunkCount 
        ? `${result.chunkCount} chunk${result.chunkCount > 1 ? "s" : ""} créé${result.chunkCount > 1 ? "s" : ""}`
        : undefined;
      
      toast.success(successMessage, {
        description,
        duration: 4000,
      });
      
      // Appeler onSuccess après un court délai
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Erreur upload:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      updateProgress(fileName, "error", 0, "Erreur lors de l'upload");
      
      toast.error(`Erreur lors de l'upload de "${fileName}"`, {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    // Uploader tous les fichiers en parallèle
    await Promise.all(files.map((file) => uploadFile(file)));
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") {
      return <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />;
    }
    return <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
  };

  const getFileTypeBadge = (file: File) => {
    if (file.type === "application/pdf") {
      return "PDF";
    }
    return file.type.split("/")[1].toUpperCase();
  };

  const handleClose = () => {
    setFiles([]);
    setUploadProgress(new Map());
    setIsDragging(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-4xl !w-[calc(100vw-2rem)] sm:!w-[90vw] lg:!w-[85vw] xl:!w-[80vw] !max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <Upload className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Importer des documents
            </span>
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Ajoutez des PDFs ou des images (PNG, JPG, JPEG, WEBP) pour enrichir la base de connaissances
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 space-y-6 min-h-0 flex-shrink">
          {/* Zone de drag & drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group",
              isDragging
                ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 shadow-lg scale-[1.02]"
                : "border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 hover:shadow-md"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="relative z-10">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {isDragging ? (
                  <span className="text-purple-600 dark:text-purple-400">Déposez vos fichiers ici</span>
                ) : (
                  "Glissez-déposez vos fichiers ici ou cliquez pour parcourir"
                )}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                PDFs jusqu&apos;à <span className="font-semibold text-purple-600 dark:text-purple-400">10MB</span>, Images jusqu&apos;à <span className="font-semibold text-pink-600 dark:text-pink-400">5MB</span>
              </p>
              <Button 
                variant="outline" 
                size="lg" 
                type="button"
                className="bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
              >
                <FileText className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                Sélectionner des fichiers
              </Button>
            </div>
          </div>

          {/* Liste des fichiers sélectionnés */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold">
                    {files.length}
                  </span>
                  <span>Fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}</span>
                </h3>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto overflow-x-hidden pr-2">
                {files.map((file, index) => {
                  const progress = uploadProgress.get(file.name);
                  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

                  return (
                    <div
                      key={file.name}
                      className="flex items-start gap-4 p-4 border-2 rounded-xl bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border-purple-100 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-shrink-0 p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{file.name}</p>
                          <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium shadow-sm">
                            {getFileTypeBadge(file)}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">{fileSizeMB} MB</span>
                        </div>
                        
                        {/* Barre de progression */}
                        {progress && (
                          <div className="mt-3 space-y-2">
                            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {progress.status === "uploading" && (
                                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                                    {progress.currentStep || "Upload en cours..."}
                                  </span>
                                )}
                                {progress.status === "extracting" && (
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    {progress.currentStep || "Extraction du texte..."}
                                  </span>
                                )}
                                {progress.status === "embedding" && (
                                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                    {progress.currentStep || "Génération des embeddings..."}
                                  </span>
                                )}
                                {progress.status === "indexing" && (
                                  <span className="text-xs font-medium text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                                    {progress.currentStep || "Indexation..."}
                                  </span>
                                )}
                                {progress.status === "success" && (
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    {progress.currentStep || "Succès"}
                                  </span>
                                )}
                                {progress.status === "error" && (
                                  <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span className="truncate">{progress.error || "Erreur"}</span>
                                  </span>
                                )}
                                {progress.progress > 0 && progress.progress < 100 && (
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {progress.progress}%
                                  </span>
                                )}
                              </div>
                              {/* Métriques */}
                              {progress.metrics && progress.status === "success" && (
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {progress.metrics.chunksCount !== undefined && (
                                    <span>
                                      {progress.metrics.chunksCount} chunk{progress.metrics.chunksCount > 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {progress.metrics.traceId && (
                                    <span className="font-mono text-[10px] opacity-70">
                                      Trace: {progress.metrics.traceId.substring(0, 8)}...
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.name);
                        }}
                        className="h-9 w-9 flex-shrink-0 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        {files.length > 0 && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="min-w-[100px]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleUploadAll}
              disabled={files.some((f) => {
                const progress = uploadProgress.get(f.name);
                return progress?.status === "uploading" || progress?.status === "processing";
              })}
              className="min-w-[160px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Upload className="h-4 w-4 mr-2" />
              Uploader {files.length} fichier{files.length > 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

