"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ExternalLink, Calendar, User, Copy, Sparkles, Loader2, Tag, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Courtage } from "@/types/courtage";
import { TagInput, getTagStyle } from "./TagInput";
import { cn } from "@/lib/utils";

interface CourtageDetailModalProps {
  item: Courtage | null;
  open: boolean;
  onClose: () => void;
  /** Affiche le bouton "Suggérer avec IA" (réservé admin). Les tags restent éditables par tous les rôles. */
  canSuggestAI?: boolean;
  onTagsUpdated?: (id: string, tags: string[], tagsUpdatedBy: string, tagsUpdatedAt: string) => void;
  getToken: () => Promise<string | undefined>;
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function Row({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Copié !");
  };
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono break-all">
          {secret && !show ? "••••••••••••" : (value || "—")}
        </span>
        {secret && value && (
          <button onClick={() => setShow((v) => !v)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
        {value && (
          <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function CourtageDetailModal({
  item,
  open,
  onClose,
  canSuggestAI,
  onTagsUpdated,
  getToken,
}: CourtageDetailModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [savingTags, setSavingTags] = useState(false);
  const [tagsDirty, setTagsDirty] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<string[]>([]);
  const [approvedSuggestions, setApprovedSuggestions] = useState<Set<string>>(new Set());

  // Sync tags when item changes
  useEffect(() => {
    if (item) {
      setTags(item.tags ?? []);
      setTagsDirty(false);
      setPendingSuggestions([]);
      setApprovedSuggestions(new Set());
    }
  }, [item]);

  if (!item) return null;

  const hasUrl = item.internet && isUrl(item.internet);

  const handleTagsChange = (next: string[]) => {
    setTags(next);
    setTagsDirty(true);
  };

  const handleSaveTags = async () => {
    setSavingTags(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/courtage/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur serveur");
      }
      const data = await res.json();
      onTagsUpdated?.(item.id, data.tags, data.tagsUpdatedBy, data.tagsUpdatedAt);
      setTagsDirty(false);
      toast.success("Tags enregistrés");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingTags(false);
    }
  };

  const handleSuggestTags = async () => {
    setSuggesting(true);
    setPendingSuggestions([]);
    setApprovedSuggestions(new Set());
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/courtage/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ compagnie: item.compagnie, internet: item.internet }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      const newSuggestions = (data.suggestedTags as string[]).filter((t) => !tags.includes(t));
      setPendingSuggestions(newSuggestions);
      if (newSuggestions.length === 0) {
        toast.info("Aucun nouveau tag suggéré — les tags existants semblent déjà complets.");
      }
    } catch {
      toast.error("Impossible de contacter Gemini.");
    } finally {
      setSuggesting(false);
    }
  };

  const toggleSuggestion = (tag: string) => {
    setApprovedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  const applyApprovedSuggestions = () => {
    const toAdd = pendingSuggestions.filter((t) => approvedSuggestions.has(t));
    if (toAdd.length === 0) return;
    const next = [...new Set([...tags, ...toAdd])];
    setTags(next);
    setTagsDirty(true);
    setPendingSuggestions([]);
    setApprovedSuggestions(new Set());
    toast.success(`${toAdd.length} tag${toAdd.length > 1 ? "s" : ""} ajouté${toAdd.length > 1 ? "s" : ""}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {item.compagnie}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Infos de connexion */}
          <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
            <Row label="Identifiant" value={item.identifiant} />
            <div className="border-t" />
            <Row label="Mot de passe" value={item.password} secret />
            <div className="border-t" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lien internet</span>
              <div className="flex items-center gap-2">
                <span className="text-sm break-all">{item.internet || "—"}</span>
                {hasUrl && (
                  <a href={item.internet} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tags / Spécialités */}
          <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Points forts / Spécialités
                </span>
              </div>
              {canSuggestAI && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  onClick={handleSuggestTags}
                  disabled={suggesting}
                >
                  {suggesting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Suggérer avec IA
                </Button>
              )}
            </div>

            {/* Suggestions IA en attente */}
            {pendingSuggestions.length > 0 && (
              <div className="rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20 p-3 space-y-2">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Suggestions Gemini — coche ceux à ajouter :
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pendingSuggestions.map((tag) => {
                    const approved = approvedSuggestions.has(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleSuggestion(tag)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all",
                          approved
                            ? "bg-purple-200 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-400 dark:border-purple-600 scale-105"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-dashed border-slate-300 dark:border-slate-600 opacity-70 hover:opacity-100"
                        )}
                      >
                        {approved && <Check className="h-2.5 w-2.5" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {approvedSuggestions.size > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300"
                    onClick={applyApprovedSuggestions}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Appliquer {approvedSuggestions.size} tag{approvedSuggestions.size > 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            )}

            <TagInput value={tags} onChange={handleTagsChange} placeholder="Ajouter un tag..." />

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-muted-foreground">
                {item.tagsUpdatedBy && item.tagsUpdatedAt
                  ? `Mis à jour par ${item.tagsUpdatedBy} · ${item.tagsUpdatedAt}`
                  : <span className="italic">Aucune mise à jour</span>}
              </div>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSaveTags}
                disabled={!tagsDirty || savingTags}
              >
                {savingTags && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>

          {/* Traçabilité credentials */}
          <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Traçabilité</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {item.qui ? (
                  <>Modifié par <strong>{item.qui}</strong></>
                ) : (
                  <span className="text-muted-foreground">Aucune modification</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {item.dateModification ? (
                  <>Le <strong>{item.dateModification}</strong></>
                ) : (
                  <span className="text-muted-foreground">Import initial</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
