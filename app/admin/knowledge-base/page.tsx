"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Upload, Trash2, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
import { getKnowledgeBases, type KnowledgeBaseConfig } from "@/lib/knowledge/registry";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DocumentItem {
  id: string;
  title: string;
  updatedAt: number | null;
  contentLength: number;
  sourceFileName?: string;
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [bases] = useState<KnowledgeBaseConfig[]>(() => getKnowledgeBases());
  const [selectedBaseId, setSelectedBaseId] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [docToUpdate, setDocToUpdate] = useState<DocumentItem | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const token = await user?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [user]);

  const fetchDocuments = useCallback(async () => {
    if (!selectedBaseId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/admin/knowledge-base/documents?knowledgeBaseId=${encodeURIComponent(selectedBaseId)}`,
        { headers }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) {
      toast.error((e as Error).message || "Erreur chargement documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBaseId, getAuthHeaders]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (e: React.FormEvent, forUpdate = false) => {
    e.preventDefault();
    if (!selectedBaseId || !uploadFile || !user) return;

    setUploading(true);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("knowledgeBaseId", selectedBaseId);
      if (forUpdate && docToUpdate) {
        formData.append("docId", docToUpdate.id);
      }

      const res = await fetch("/api/admin/knowledge-base/ingest", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.details || `Erreur ${res.status}`);

      toast.success(
        forUpdate ? "Document mis à jour" : `Document ajouté : ${data.title || uploadFile.name}`
      );
      setUploadFile(null);
      setUpdateDialogOpen(false);
      setDocToUpdate(null);
      fetchDocuments();
    } catch (e) {
      toast.error((e as Error).message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete || !selectedBaseId || !user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/knowledge-base/documents/${encodeURIComponent(docToDelete.id)}?knowledgeBaseId=${encodeURIComponent(selectedBaseId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }
      toast.success("Document supprimé");
      setDeleteDialogOpen(false);
      setDocToDelete(null);
      fetchDocuments();
    } catch (e) {
      toast.error((e as Error).message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const selectedBase = bases.find((b) => b.id === selectedBaseId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="h-7 w-7" />
          Base de connaissance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Consulter et gérer les bases RAG des agents IA
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
        <CardHeader>
          <CardTitle>Choisir une base</CardTitle>
          <CardDescription>
            Sélectionnez le bot dont vous souhaitez enrichir ou gérer la base de connaissance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBaseId} onValueChange={setSelectedBaseId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Sélectionner une base..." />
            </SelectTrigger>
            <SelectContent>
              {bases.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedBase && (
        <>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upload PDF</CardTitle>
                <CardDescription>
                  Ajouter un nouveau document à la base {selectedBase.name}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => handleUpload(e, false)}
                className="flex flex-col sm:flex-row gap-4 items-start"
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300 dark:hover:file:bg-slate-700"
                />
                <Button type="submit" disabled={!uploadFile || uploading} className="gap-2">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Envoi..." : "Ajouter"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Liste des documents intégrés dans cette base</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading} className="gap-2">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-slate-500">Chargement...</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun document dans cette base</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-2 font-medium">Titre</th>
                        <th className="text-left py-3 px-2 font-medium">Mis à jour</th>
                        <th className="text-left py-3 px-2 font-medium">Taille</th>
                        <th className="text-right py-3 px-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        >
                          <td className="py-3 px-2">
                            <span className="font-medium">{doc.title}</span>
                          </td>
                          <td className="py-3 px-2 text-slate-500">
                            {doc.updatedAt
                              ? format(new Date(doc.updatedAt), "dd MMM yyyy HH:mm", { locale: fr })
                              : "—"}
                          </td>
                          <td className="py-3 px-2 text-slate-500">
                            {doc.contentLength >= 1000
                              ? `${(doc.contentLength / 1000).toFixed(1)} k`
                              : doc.contentLength}{" "}
                            car.
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                  setDocToUpdate(doc);
                                  setUploadFile(null);
                                  setUpdateDialogOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                                Mettre à jour
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={() => {
                                  setDocToDelete(doc);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{docToDelete?.title}&quot; ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le document</DialogTitle>
            <DialogDescription>
              Choisissez un nouveau PDF pour remplacer &quot;{docToUpdate?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleUpload(e, true)} className="space-y-4">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300 dark:hover:file:bg-slate-700"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUpdateDialogOpen(false);
                  setDocToUpdate(null);
                  setUploadFile(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={!uploadFile || uploading}>
                {uploading ? "Envoi..." : "Mettre à jour"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
