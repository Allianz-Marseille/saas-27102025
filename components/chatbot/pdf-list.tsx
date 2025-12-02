"use client";

import { useState, useEffect } from "react";
import { FileText, Image as ImageIcon, Download, Trash2, Calendar, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
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

interface Document {
  id: string;
  filename: string;
  fileType: "pdf" | "image";
  imageType?: "png" | "jpg" | "jpeg" | "webp";
  uploadedBy: string;
  uploadedAt: {
    seconds: number;
    nanoseconds: number;
  } | Date | string;
  fileUrl: string;
  fileSize: number;
  chunkCount: number;
  ocrConfidence?: number;
}

interface PdfListProps {
  onRefresh?: () => void;
}

export function PdfList({ onRefresh }: PdfListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();

      const response = await fetch("/api/chat/documents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des documents");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Erreur fetch documents:", error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleDelete = async (document: Document) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const response = await fetch(`/api/chat/documents/${document.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Erreur lors de la suppression");
      }

      toast.success(`Document "${document.filename}" supprimé avec succès`);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      
      // Rafraîchir la liste
      fetchDocuments();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Erreur suppression:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    }
  };

  const handleDownload = (document: Document) => {
    window.open(document.fileUrl, "_blank");
  };

  const formatDate = (date: Document["uploadedAt"]) => {
    try {
      let dateObj: Date;
      
      if (typeof date === "string") {
        dateObj = new Date(date);
      } else if (date && typeof date === "object" && "seconds" in date) {
        dateObj = new Date(date.seconds * 1000);
      } else {
        dateObj = date as Date;
      }

      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch {
      return "Date inconnue";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (document: Document) => {
    if (document.fileType === "pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  };

  const getFileTypeBadge = (document: Document) => {
    if (document.fileType === "pdf") {
      return "PDF";
    }
    return document.imageType?.toUpperCase() || "IMAGE";
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Aucun document indexé pour le moment</p>
        <p className="text-xs mt-2">Commencez par importer des documents</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((document) => (
          <Card
            key={document.id}
            className="hover:bg-muted/50 transition-colors animate-in slide-in-from-left-4 fade-in"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                    {getFileIcon(document)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{document.filename}</p>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {getFileTypeBadge(document)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(document.uploadedAt)}
                      </span>
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {document.chunkCount} chunk{document.chunkCount > 1 ? "s" : ""}
                      </span>
                      {document.ocrConfidence && (
                        <span className="text-blue-600 dark:text-blue-400">
                          OCR: {(document.ocrConfidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(document)}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDocumentToDelete(document);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{documentToDelete?.filename}&quot; ?
              <br />
              Cette action supprimera le fichier, ses chunks dans Qdrant et ses métadonnées.
              <br />
              <strong>Cette action est irréversible.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && handleDelete(documentToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

