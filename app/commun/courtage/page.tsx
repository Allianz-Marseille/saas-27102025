"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Download,
  BookOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
import { CourtageFormModal } from "@/components/courtage/CourtageFormModal";
import { CourtageDetailModal } from "@/components/courtage/CourtageDetailModal";
import { getTagStyle } from "@/components/courtage/TagInput";
import { cn } from "@/lib/utils";
import type { Courtage } from "@/types/courtage";

function isValidUrl(v?: string) {
  return !!v && (v.startsWith("http://") || v.startsWith("https://"));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

const CARD_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-sky-600",
  "from-slate-500 to-slate-700",
  "from-violet-500 to-purple-600",
];

function getCardGradient(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ((hash * 31) + ch.charCodeAt(0)) & 0xffff;
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CourtagePage() {
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === "ADMINISTRATEUR";

  const [items, setItems] = useState<Courtage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Courtage | null>(null);

  const [detailItem, setDetailItem] = useState<Courtage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<Courtage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importing, setImporting] = useState(false);
  const [autoImportDone, setAutoImportDone] = useState(false);

  const getToken = (): Promise<string | undefined> => user?.getIdToken() ?? Promise.resolve(undefined);

  const fetchItems = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/courtage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      toast.error("Impossible de charger les compagnies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Collect all unique tags across all items
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const tag of item.tags ?? []) set.add(tag);
    }
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.compagnie.toLowerCase().includes(q) ||
          i.identifiant.toLowerCase().includes(q) ||
          i.internet.toLowerCase().includes(q) ||
          (i.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTag) {
      list = list.filter((i) => (i.tags ?? []).includes(activeTag));
    }
    return list;
  }, [items, search, activeTag]);

  const handleSaved = (saved: Courtage) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next.sort((a, b) => a.compagnie.localeCompare(b.compagnie));
      }
      return [...prev, saved].sort((a, b) => a.compagnie.localeCompare(b.compagnie));
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/courtage/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur serveur");
      }
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.compagnie}" supprimée.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const runInitialImport = async (silent = false) => {
    setImporting(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/courtage/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      if (!silent) toast.success(data.message);
      await fetchItems();
    } catch (err) {
      if (!silent) toast.error(err instanceof Error ? err.message : "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin || loading || items.length > 0 || importing || autoImportDone) return;
    setAutoImportDone(true);
    void runInitialImport(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, loading, items.length, importing, autoImportDone]);

  return (
    <div className="min-h-screen">
      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        {/* Decorative background blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Courtage
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {loading ? "Chargement…" : `${items.length} compagnie${items.length > 1 ? "s" : ""} partenaires`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && items.length === 0 && !loading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runInitialImport(false)}
                  disabled={importing}
                  className="border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700/80 hover:text-white"
                >
                  {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Import initial
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => { setEditItem(null); setFormOpen(true); }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle compagnie
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar : recherche + filtres tags ─────────────────────────── */}
      <div className="px-6 py-4 sm:px-8 border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une compagnie, un tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Filtrer :</span>
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                activeTag === null
                  ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm"
                  : "bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
              )}
            >
              Tous
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                  activeTag === tag
                    ? cn(getTagStyle(tag), "shadow-sm scale-105")
                    : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                )}
              >
                {tag}
                {activeTag === tag && (
                  <X className="inline h-2.5 w-2.5 ml-1 -mt-0.5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Card grid ────────────────────────────────────────────────────── */}
      <div className="px-6 py-6 sm:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <BookOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">
              {search || activeTag ? "Aucun résultat pour cette recherche." : "Aucune compagnie enregistrée."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => {
              const gradient = getCardGradient(item.compagnie);
              const tags = item.tags ?? [];
              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Colored top accent */}
                  <div className={cn("h-1 w-full bg-gradient-to-r shrink-0", gradient)} />

                  {/* Subtle glow on hover */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                    "bg-gradient-to-br from-transparent via-transparent to-white/5 dark:to-white/[0.02]"
                  )} />

                  {/* Card body */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 bg-gradient-to-br overflow-hidden",
                        isValidUrl(item.logoUrl) && !logoErrors.has(item.id) ? "bg-white" : gradient
                      )}>
                        {isValidUrl(item.logoUrl) && !logoErrors.has(item.id) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.logoUrl}
                            alt={item.compagnie}
                            className="h-8 w-8 object-contain"
                            onError={() => setLogoErrors((prev) => new Set([...prev, item.id]))}
                          />
                        ) : (
                          item.compagnie.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-tight truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:[background-image:linear-gradient(to_right,var(--tw-gradient-stops))] transition-all duration-300">
                          {item.compagnie}
                        </h3>
                        {item.identifiant && (
                          <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                            {item.identifiant}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:scale-105 transition-transform",
                              getTagStyle(tag)
                            )}
                            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                          >
                            {tag}
                          </span>
                        ))}
                        {tags.length > 4 && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            +{tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* No tags yet */}
                    {tags.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">Aucun tag — cliquez sur 👁 pour en ajouter</p>
                    )}
                  </div>

                  {/* Card footer — actions */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 px-3 py-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                    {/* Link button */}
                    {item.internet && isUrl(item.internet) ? (
                      <a href={item.internet} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Ouvrir le portail"
                          asChild
                        >
                          <span><ExternalLink className="h-3.5 w-3.5" /></span>
                        </Button>
                      </a>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-20 cursor-not-allowed" disabled>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <div className="flex items-center gap-0.5">
                      {/* Détail */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Voir les détails"
                        onClick={() => { setDetailItem(item); setDetailOpen(true); }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {/* Modifier */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Modifier"
                        onClick={() => { setEditItem(item); setFormOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {/* Supprimer */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Supprimer"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      <CourtageFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        editItem={editItem}
      />

      <CourtageDetailModal
        item={detailItem}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Confirmation suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la compagnie ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.compagnie}</strong> sera définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
