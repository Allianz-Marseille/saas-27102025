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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, Upload, Trash2, RefreshCw, FileText, Pencil, List, Eye, Sparkles, Info, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
import { getKnowledgeBases, type KnowledgeBaseConfig } from "@/lib/knowledge/registry";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const SUMMARY_MAX_WORDS = 20;

function truncateToWords(text: string, maxWords = SUMMARY_MAX_WORDS): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "...";
}

interface DocumentItem {
  id: string;
  title: string;
  themes?: string[];
  notes?: string;
  summary?: string;
  storagePath?: string;
  updatedAt: number | null;
  enrichedAt?: number | null;
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [docToUpdate, setDocToUpdate] = useState<DocumentItem | null>(null);
  const [docToEdit, setDocToEdit] = useState<DocumentItem | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editThemesInput, setEditThemesInput] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [patching, setPatching] = useState(false);
  const [enrichingDocId, setEnrichingDocId] = useState<string | null>(null);
  const [lastEnrichedDocId, setLastEnrichedDocId] = useState<string | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [enrichFilter, setEnrichFilter] = useState<"all" | "toEnrich" | "enriched">("all");
  const [selectedThemeFilters, setSelectedThemeFilters] = useState<string[]>([]);

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

  useEffect(() => {
    if (!lastEnrichedDocId || documents.length === 0) return;
    const timer = setTimeout(() => {
      const row = document.querySelector(`[data-doc-id="${lastEnrichedDocId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setLastEnrichedDocId(null);
    }, 100);
    return () => clearTimeout(timer);
  }, [lastEnrichedDocId, documents]);

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

  const handlePatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docToEdit || !selectedBaseId || !user) return;

    const themes = editThemesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body: { title?: string; themes?: string[]; notes?: string } = {};
    if (editTitle.trim() !== docToEdit.title) body.title = editTitle.trim();
    if (JSON.stringify(themes) !== JSON.stringify(docToEdit.themes ?? [])) body.themes = themes;
    if (editNotes !== (docToEdit.notes ?? "")) body.notes = editNotes;

    if (Object.keys(body).length === 0) {
      setEditDialogOpen(false);
      setDocToEdit(null);
      return;
    }

    setPatching(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/knowledge-base/documents/${encodeURIComponent(docToEdit.id)}?knowledgeBaseId=${encodeURIComponent(selectedBaseId)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);

      toast.success("Document modifié");
      setEditDialogOpen(false);
      setDocToEdit(null);
      fetchDocuments();
    } catch (e) {
      toast.error((e as Error).message || "Erreur lors de la modification");
    } finally {
      setPatching(false);
    }
  };

  const openEditDialog = (doc: DocumentItem) => {
    setDocToEdit(doc);
    setEditTitle(doc.title);
    setEditThemesInput((doc.themes ?? []).join(", "));
    setEditNotes(doc.notes ?? "");
    setEditDialogOpen(true);
  };

  const handlePreview = async (doc: DocumentItem) => {
    if (!doc.storagePath || !selectedBaseId || !user) {
      toast.error("Aperçu non disponible (document importé avant archivage)");
      return;
    }
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/knowledge-base/documents/${encodeURIComponent(doc.id)}/preview?knowledgeBaseId=${encodeURIComponent(selectedBaseId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      if (data.url && previewWindow) {
        previewWindow.location.href = data.url;
      } else if (!data.url) {
        throw new Error("URL non reçue");
      } else if (!previewWindow) {
        toast.error("Autorisez les pop-ups pour ouvrir l'aperçu");
      }
    } catch (e) {
      toast.error((e as Error).message || "Erreur aperçu");
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
    }
  };

  const handleEnrich = async (doc: DocumentItem) => {
    if (!selectedBaseId || !user) return;
    setEnrichingDocId(doc.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/knowledge-base/documents/${encodeURIComponent(doc.id)}/enrich?knowledgeBaseId=${encodeURIComponent(selectedBaseId)}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.details || `Erreur ${res.status}`);
      toast.success(`Document enrichi : ${data.title || doc.title}`);
      setLastEnrichedDocId(doc.id);
      setEnrichFilter("enriched");
      fetchDocuments();
    } catch (e) {
      toast.error((e as Error).message || "Erreur enrichissement");
    } finally {
      setEnrichingDocId(null);
    }
  };

  const selectedBase = bases.find((b) => b.id === selectedBaseId);
  const documentsFiltered =
    enrichFilter === "enriched"
      ? documents.filter((d) => d.enrichedAt != null)
      : enrichFilter === "toEnrich"
        ? documents.filter((d) => d.enrichedAt == null)
        : documents;
  const documentsSortedByTitle = [...documentsFiltered].sort((a, b) =>
    a.title.localeCompare(b.title, "fr")
  );

  const allUniqueThemes = Array.from(
    new Set(documentsSortedByTitle.flatMap((d) => d.themes ?? []))
  ).sort((a, b) => a.localeCompare(b, "fr"));

  const documentsFilteredByThemes =
    selectedThemeFilters.length === 0
      ? documentsSortedByTitle
      : documentsSortedByTitle.filter((d) =>
          selectedThemeFilters.some((t) => (d.themes ?? []).includes(t))
        );

  const toggleThemeFilter = (theme: string) => {
    setSelectedThemeFilters((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const resetThemeFilters = () => setSelectedThemeFilters([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="h-7 w-7" />
          Base de connaissance
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={() => setHelpDialogOpen(true)}
            aria-label="Aide"
          >
            <Info className="h-4 w-4" />
          </Button>
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
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Liste des documents intégrés dans cette base</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/50">
                  <Button
                    variant={enrichFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-1.5 px-3"
                    onClick={() => setEnrichFilter("all")}
                  >
                    Tous
                    <span className="text-xs text-slate-500">({documents.length})</span>
                  </Button>
                  <Button
                    variant={enrichFilter === "toEnrich" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-amber-600 hover:text-amber-700 dark:text-amber-500"
                    onClick={() => setEnrichFilter("toEnrich")}
                  >
                    <XCircle className="h-4 w-4" />
                    À enrichir
                    <span className="text-xs">({documents.filter((d) => !d.enrichedAt).length})</span>
                  </Button>
                  <Button
                    variant={enrichFilter === "enriched" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-emerald-600 hover:text-emerald-700 dark:text-emerald-500"
                    onClick={() => setEnrichFilter("enriched")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Enrichis
                    <span className="text-xs">({documents.filter((d) => d.enrichedAt).length})</span>
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading} className="gap-2">
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-slate-500">Chargement...</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun document dans cette base</p>
              ) : documentsFiltered.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {enrichFilter === "toEnrich"
                    ? "Tous les documents sont enrichis"
                    : "Aucun document enrichi pour le moment"}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="w-10 px-2 py-3"></th>
                        <th className="text-left py-3 px-2 font-medium">Titre</th>
                        <th className="text-left py-3 px-2 font-medium">Thèmes</th>
                        <th className="w-[220px] max-w-[220px] text-left py-3 px-2 font-medium">Résumé</th>
                        <th className="text-left py-3 px-2 font-medium">Enrichi le</th>
                        <th className="text-left py-3 px-2 font-medium">Mis à jour</th>
                        <th className="text-left py-3 px-2 font-medium">Taille</th>
                        <th className="text-right py-3 px-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentsSortedByTitle.map((doc) => {
                        const isEnriched = doc.enrichedAt != null;
                        return (
                        <tr
                          key={doc.id}
                          data-doc-id={doc.id}
                          className={cn(
                            "border-b border-slate-100 dark:border-slate-800 border-l-[6px]",
                            isEnriched
                              ? "border-l-emerald-500 bg-emerald-50/80 dark:border-l-emerald-400 dark:bg-emerald-900/30"
                              : "border-l-amber-500 bg-amber-50/80 dark:border-l-amber-400 dark:bg-amber-900/30"
                          )}
                        >
                          <td className="py-3 px-2">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    {isEnriched ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>{isEnriched ? "Document enrichi" : "À enrichir"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="py-3 px-2">
                            <span className="font-medium">{doc.title}</span>
                          </td>
                          <td className="py-3 px-2">
                            {(doc.themes ?? []).length > 0 ? (
                              <span className="flex flex-wrap gap-1">
                                {(doc.themes ?? []).map((t) => (
                                  <span
                                    key={t}
                                    className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="w-[220px] max-w-[220px] min-w-0 overflow-hidden py-3 px-2 text-slate-600 dark:text-slate-400">
                            {doc.summary ? (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="block min-w-0 cursor-default">
                                      {truncateToWords(doc.summary)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-sm max-h-48 overflow-y-auto whitespace-pre-wrap"
                                  >
                                    <p>{doc.summary}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-slate-500">
                            {doc.enrichedAt
                              ? format(new Date(doc.enrichedAt), "dd MMM yyyy HH:mm", { locale: fr })
                              : "—"}
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
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => handlePreview(doc)}
                                disabled={!doc.storagePath}
                                title={doc.storagePath ? "Ouvrir le PDF" : "Aperçu indisponible (import avant archivage)"}
                              >
                                <Eye className="h-4 w-4" />
                                Aperçu
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleEnrich(doc)}
                                disabled={enrichingDocId === doc.id}
                                title="Enrichir le document avec un titre et un résumé IA"
                              >
                                <Sparkles className={cn("h-4 w-4", enrichingDocId === doc.id && "animate-pulse")} />
                                {enrichingDocId === doc.id ? "Enrichissement..." : "Enrichir"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => openEditDialog(doc)}
                              >
                                <Pencil className="h-4 w-4" />
                                Modifier
                              </Button>
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
                                Remplacer PDF
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
                      );})}
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>
              Modifiez le titre, les thèmes ou la note du document &quot;{docToEdit?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ex. Personnes morales"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-themes">Thèmes (séparés par des virgules)</Label>
              <Input
                id="edit-themes"
                value={editThemesInput}
                onChange={(e) => setEditThemesInput(e.target.value)}
                placeholder="Ex. bonus, CRM, personne morale, flotte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Note libre sur ce document..."
                rows={3}
                maxLength={1000}
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setDocToEdit(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={patching}>
                {patching ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comment fonctionne la Base de connaissance PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <section>
              <h3 className="font-semibold mb-2">À quoi sert cette page ?</h3>
              <p>
                Cette page permet de nourrir les agents IA (Pauline, Bob, Sinistro) avec des
                documents PDF. Chaque base est liée à un bot : les documents que vous ajoutez ici
                seront utilisés pour répondre aux questions des collaborateurs.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Que se passe-t-il quand j&apos;upload un PDF ?</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  <strong>Extraction</strong> : Le texte du PDF est extrait automatiquement.
                </li>
                <li>
                  <strong>Stockage</strong> : Le PDF original est archivé dans Firebase Storage (vous
                  pourrez le consulter plus tard).
                </li>
                <li>
                  <strong>Indexation</strong> : Un &quot;embedding&quot; (représentation vectorielle)
                  est calculé pour permettre la recherche sémantique. C&apos;est ce qui permet au bot
                  de retrouver les bons passages quand on lui pose une question.
                </li>
              </ol>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Les actions disponibles</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2 pr-4 font-medium">Action</th>
                      <th className="py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4 font-medium">Aperçu</td>
                      <td className="py-2">
                        Ouvre le PDF original dans un nouvel onglet. Utile pour vérifier le document
                        source. <em>Note : indisponible pour les documents importés avant la mise en
                        place de l&apos;archivage.</em>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4 font-medium">Modifier</td>
                      <td className="py-2">
                        Change le titre, les thèmes ou les notes du document (sans ré-uploader le PDF).
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4 font-medium">Remplacer PDF</td>
                      <td className="py-2">
                        Envoie un nouveau PDF à la place de l&apos;ancien. Le texte et l&apos;index
                        sont recalculés. L&apos;ancien fichier est supprimé.
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4 font-medium">Enrichir avec l&apos;IA</td>
                      <td className="py-2">
                        L&apos;IA génère un titre court et un résumé, puis ré-indexe le document.
                        Cela améliore la précision des réponses du bot en lui donnant un &quot;contexte
                        global&quot; avant les détails. <strong>Recommandé</strong> après chaque nouvel
                        upload.
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4 font-medium">Supprimer</td>
                      <td className="py-2">
                        Supprime le document et le fichier PDF associé. Irréversible.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Colonnes du tableau</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Titre</strong> : Nom du document (modifiable via &quot;Modifier&quot;).
                </li>
                <li>
                  <strong>Thèmes</strong> : Mots-clés pour organiser et filtrer (ex. bonus, CRM,
                  personne morale).
                </li>
                <li>
                  <strong>Résumé</strong> : Synthèse générée par l&apos;IA ou saisie manuellement.
                </li>
                <li>
                  <strong>Mis à jour</strong> : Date de dernière modification.
                </li>
                <li>
                  <strong>Taille</strong> : Nombre de caractères du texte extrait.
                </li>
              </ul>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {selectedBase && documents.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-row items-center gap-2">
              <List className="h-5 w-5 shrink-0" />
              <div>
                <CardTitle>Table des matières</CardTitle>
                <CardDescription>
                  Vue synthétique des documents avec leurs thèmes
                </CardDescription>
              </div>
            </div>
            {allUniqueThemes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Filtrer par thème :
                </span>
                {allUniqueThemes.map((theme) => {
                  const isSelected = selectedThemeFilters.includes(theme);
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => toggleThemeFilter(theme)}
                      className={cn(
                        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      )}
                    >
                      {theme}
                    </button>
                  );
                })}
                {selectedThemeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={resetThemeFilters}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-medium">Titre</th>
                    <th className="text-left py-3 px-2 font-medium">Thèmes</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documentsFilteredByThemes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-slate-500">
                        {selectedThemeFilters.length > 0
                          ? "Aucun document ne correspond aux thèmes sélectionnés"
                          : "Aucun document"}
                      </td>
                    </tr>
                  ) : (
                    documentsFilteredByThemes.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3 px-2 font-medium">{doc.title}</td>
                      <td className="py-3 px-2">
                        {(doc.themes ?? []).length > 0 ? (
                          <span className="flex flex-wrap gap-1">
                            {(doc.themes ?? []).map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {t}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => openEditDialog(doc)}
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </Button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
