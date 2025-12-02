"use client";

/**
 * Liste des documents indexés dans le RAG
 * Affiche les métadonnées et permet la suppression (admin uniquement)
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Trash2, Calendar, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { RAGDocument } from "@/lib/rag/types";

interface PdfListProps {
  onDelete?: () => void;
}

export function PdfList({ onDelete }: PdfListProps) {
  const { user, userData } = useAuth();
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isAdmin = userData?.role === "ADMINISTRATEUR";

  // Charger les documents
  const loadDocuments = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error("Impossible d'obtenir le token d'authentification");
      }

      const response = await fetch("/api/chat/documents", {
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  // Supprimer un document
  const handleDelete = async (documentId: string) => {
    if (!user || !isAdmin) {
      toast.error("Accès refusé : Admin requis");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return;
    }

    setDeletingId(documentId);

    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error("Impossible d'obtenir le token d'authentification");
      }

      const response = await fetch(`/api/chat/documents/${documentId}`, {
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
      onDelete?.();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression du document"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucun document indexé</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc, index) => {
        const uploadedDate = doc.uploadedAt?.toDate
          ? doc.uploadedAt.toDate()
          : new Date(doc.uploadedAt);

        return (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            {/* Icône */}
            <div className="flex-shrink-0">
              {doc.fileType === "pdf" ? (
                <FileText className="h-8 w-8 text-red-500" />
              ) : (
                <ImageIcon className="h-8 w-8 text-blue-500" />
              )}
            </div>

            {/* Informations */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {doc.metadata?.title || doc.filename}
                  </h3>
                  {doc.metadata?.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {doc.metadata.description}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="shrink-0"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                )}
              </div>

              {/* Métadonnées */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(uploadedDate, "d MMM yyyy", { locale: fr })}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {doc.chunkCount} chunks
                </div>
                <div>
                  {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                </div>
                {doc.ocrConfidence && (
                  <div>
                    OCR: {(doc.ocrConfidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

