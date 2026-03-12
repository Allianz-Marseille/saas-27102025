"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  EyeOff,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
import { CourtageFormModal } from "@/components/courtage/CourtageFormModal";
import { CourtageDetailModal } from "@/components/courtage/CourtageDetailModal";
import type { Courtage } from "@/types/courtage";

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function MaskedPassword({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs">{show ? value : "••••••••"}</span>
      <button
        onClick={() => setShow((v) => !v)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function InternetCell({ value }: { value: string }) {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs max-w-[160px] truncate"
        title={value}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{value}</span>
      </a>
    );
  }

  return (
    <span className="text-xs text-muted-foreground truncate max-w-[160px] block" title={value}>
      {value}
    </span>
  );
}

export default function CourtagePage() {
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === "ADMINISTRATEUR";

  const [items, setItems] = useState<Courtage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Courtage | null>(null);

  const [detailItem, setDetailItem] = useState<Courtage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Courtage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importing, setImporting] = useState(false);
  const [autoImportDone, setAutoImportDone] = useState(false);

  const fetchItems = async () => {
    try {
      const token = await user?.getIdToken();
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

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.compagnie.toLowerCase().includes(q) ||
        i.identifiant.toLowerCase().includes(q) ||
        i.internet.toLowerCase().includes(q)
    );
  }, [items, search]);

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
      const token = await user?.getIdToken();
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
      const token = await user?.getIdToken();
      const res = await fetch("/api/courtage/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      if (!silent) {
        toast.success(data.message);
      }
      await fetchItems();
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'import");
      }
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    await runInitialImport(false);
  };

  useEffect(() => {
    if (!user || !isAdmin || loading || items.length > 0 || importing || autoImportDone) return;
    setAutoImportDone(true);
    void runInitialImport(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, loading, items.length, importing, autoImportDone]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion Courtage</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {items.length} compagnie{items.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && items.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Import initial
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setEditItem(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle compagnie
          </Button>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une compagnie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tableau */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Compagnie</TableHead>
              <TableHead>Identifiant</TableHead>
              <TableHead>Mot de passe</TableHead>
              <TableHead>Lien</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {search ? "Aucun résultat pour cette recherche." : "Aucune compagnie enregistrée."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="font-medium">{item.compagnie}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                    {item.identifiant || "—"}
                  </TableCell>
                  <TableCell>
                    <MaskedPassword value={item.password} />
                  </TableCell>
                  <TableCell>
                    <InternetCell value={item.internet} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Ouvrir le lien */}
                      {item.internet && isUrl(item.internet) ? (
                        <a
                          href={item.internet}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ouvrir la connexion"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <span>
                              <ExternalLink className="h-4 w-4 text-primary" />
                            </span>
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-30 cursor-not-allowed"
                          disabled
                          title="Pas de lien disponible"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Détail */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Voir les détails"
                        onClick={() => {
                          setDetailItem(item);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Modifier */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Modifier"
                        onClick={() => {
                          setEditItem(item);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Supprimer */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Supprimer"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modales */}
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
