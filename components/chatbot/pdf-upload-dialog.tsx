"use client";

/**
 * Dialog pour uploader des fichiers PDF/images pour le RAG
 * Admin uniquement
 */

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PdfUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PdfUploadDialog({ open, onOpenChange, onSuccess }: PdfUploadDialogProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vérifier le type de fichier
  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    return validTypes.includes(file.type);
  };

  // Gérer la sélection de fichier
  const handleFileSelect = (selectedFile: File) => {
    if (!isValidFileType(selectedFile)) {
      toast.error(
        "Type de fichier non supporté. Types autorisés : PDF, PNG, JPG, JPEG, WEBP"
      );
      return;
    }

    // Vérifier la taille (10MB pour PDF, 5MB pour images)
    const maxSize = selectedFile.type === "application/pdf" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      toast.error(`Fichier trop volumineux. Taille maximale : ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Suggérer un titre basé sur le nom du fichier
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  // Gérer le drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload du fichier
  const handleUpload = async () => {
    if (!file || !user) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setIsUploading(true);

    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error("Impossible d'obtenir le token d'authentification");
      }

      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'upload");
      }

      const data = await response.json();

      toast.success(
        `Fichier uploadé avec succès ! ${data.chunkCount} chunks indexés.`
      );

      // Réinitialiser le formulaire
      setFile(null);
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'upload du fichier"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const isPdf = file?.type === "application/pdf";
  const isImage = file?.type.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uploader un document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone de drag & drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              file && "border-primary bg-primary/5"
            )}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {isPdf ? (
                    <FileText className="h-12 w-12 text-primary" />
                  ) : isImage ? (
                    <ImageIcon className="h-12 w-12 text-primary" />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    fileInputRef.current?.click();
                  }}
                >
                  Changer de fichier
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium mb-1">
                    Glissez-déposez un fichier ici
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF (max 10MB) ou Images PNG/JPG/WEBP (max 5MB)
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Sélectionner un fichier
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Métadonnées */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre (optionnel)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Guide des assurances 2024"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du document..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Uploader
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

