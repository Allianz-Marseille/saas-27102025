"use client";

import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  status: "uploading" | "processing" | "success" | "error";
  error?: string;
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

  const uploadFile = async (file: File) => {
    if (!user) {
      toast.error("Vous devez être connecté pour uploader des fichiers");
      return;
    }

    const fileName = file.name;
    
    // Initialiser le progrès
    setUploadProgress((prev) => {
      const next = new Map(prev);
      next.set(fileName, { fileName, progress: 0, status: "uploading" });
      return next;
    });

    try {
      // Récupérer le token d'authentification
      const token = await user.getIdToken();

      // Créer FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload
      const response = await fetch("/api/chat/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Erreur lors de l'upload");
      }

      const result = await response.json();

      // Mettre à jour le statut
      setUploadProgress((prev) => {
        const next = new Map(prev);
        next.set(fileName, { fileName, progress: 100, status: "success" });
        return next;
      });

      toast.success(`Fichier "${fileName}" uploadé et indexé avec succès`);
      
      // Appeler onSuccess après un court délai
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      console.error("Erreur upload:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      setUploadProgress((prev) => {
        const next = new Map(prev);
        next.set(fileName, { fileName, progress: 0, status: "error", error: errorMessage });
        return next;
      });

      toast.error(`Erreur lors de l'upload de "${fileName}": ${errorMessage}`);
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    // Uploader tous les fichiers en parallèle
    await Promise.all(files.map((file) => uploadFile(file)));
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer des documents
          </DialogTitle>
          <DialogDescription>
            Ajoutez des PDFs ou des images (PNG, JPG, JPEG, WEBP) pour enrichir la base de connaissances
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone de drag & drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              isDragging
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-gray-300 dark:border-gray-700 hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">
              {isDragging ? "Déposez vos fichiers ici" : "Glissez-déposez vos fichiers ici ou cliquez pour parcourir"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              PDFs jusqu&apos;à 10MB, Images jusqu&apos;à 5MB
            </p>
            <Button variant="outline" size="sm" type="button">
              <FileText className="h-4 w-4 mr-2" />
              Sélectionner des fichiers
            </Button>
          </div>

          {/* Liste des fichiers sélectionnés */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Fichiers sélectionnés ({files.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file) => {
                  const progress = uploadProgress.get(file.name);
                  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

                  return (
                    <div
                      key={file.name}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex-shrink-0">{getFileIcon(file)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            {getFileTypeBadge(file)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{fileSizeMB} MB</p>
                        
                        {/* Barre de progression */}
                        {progress && (
                          <div className="mt-2">
                            <Progress value={progress.progress} className="h-2" />
                            <div className="flex items-center gap-2 mt-1">
                              {progress.status === "uploading" && (
                                <span className="text-xs text-muted-foreground">Upload en cours...</span>
                              )}
                              {progress.status === "processing" && (
                                <span className="text-xs text-muted-foreground">Traitement...</span>
                              )}
                              {progress.status === "success" && (
                                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Succès
                                </span>
                              )}
                              {progress.status === "error" && (
                                <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {progress.error}
                                </span>
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
                        className="h-8 w-8 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          {files.length > 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleUploadAll}
                disabled={files.some((f) => {
                  const progress = uploadProgress.get(f.name);
                  return progress?.status === "uploading" || progress?.status === "processing";
                })}
              >
                <Upload className="h-4 w-4 mr-2" />
                Uploader {files.length} fichier{files.length > 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

