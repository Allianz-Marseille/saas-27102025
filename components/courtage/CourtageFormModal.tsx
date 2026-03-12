"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Sparkles, Check, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
import { normalizeCompanyName } from "@/lib/utils/courtage-format";
import { TagInput } from "./TagInput";
import { cn } from "@/lib/utils";
import type { Courtage, CourtageFormData } from "@/types/courtage";

interface CourtageFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (item: Courtage) => void;
  editItem?: Courtage | null;
}

const EMPTY_FORM: CourtageFormData = {
  compagnie: "",
  identifiant: "",
  password: "",
  internet: "",
  logoUrl: "",
};

function isUrl(v?: string) {
  return !!v && (v.startsWith("http://") || v.startsWith("https://"));
}

export function CourtageFormModal({ open, onClose, onSaved, editItem }: CourtageFormModalProps) {
  const { user, userData } = useAuth();
  const canSuggestAI = userData?.role === "ADMINISTRATEUR";

  const [form, setForm] = useState<CourtageFormData>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagsDirty, setTagsDirty] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<string[]>([]);
  const [approvedSuggestions, setApprovedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setForm(
        editItem
          ? {
              compagnie: editItem.compagnie,
              identifiant: editItem.identifiant,
              password: editItem.password,
              internet: editItem.internet,
              logoUrl: editItem.logoUrl ?? "",
            }
          : EMPTY_FORM
      );
      setTags(editItem?.tags ?? []);
      setTagsDirty(false);
      setShowPassword(false);
      setLogoError(false);
      setPendingSuggestions([]);
      setApprovedSuggestions(new Set());
    }
  }, [open, editItem]);

  const handleChange = (field: keyof CourtageFormData, value: string) => {
    if (field === "compagnie") {
      setForm((prev) => ({ ...prev, compagnie: normalizeCompanyName(value) }));
      return;
    }
    if (field === "logoUrl") setLogoError(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (next: string[]) => {
    setTags(next);
    setTagsDirty(true);
  };

  const handleSuggestTags = async () => {
    if (!form.compagnie.trim()) {
      toast.error("Renseigne le nom de la compagnie avant de demander des suggestions.");
      return;
    }
    setSuggesting(true);
    setPendingSuggestions([]);
    setApprovedSuggestions(new Set());
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/courtage/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ compagnie: form.compagnie, internet: form.internet }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      const newSuggestions = (data.suggestedTags as string[]).filter((t) => !tags.includes(t));
      setPendingSuggestions(newSuggestions);
      if (newSuggestions.length === 0) toast.info("Aucun nouveau tag suggéré.");
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
    setTags((prev) => [...new Set([...prev, ...toAdd])]);
    setTagsDirty(true);
    setPendingSuggestions([]);
    setApprovedSuggestions(new Set());
  };

  const handleSubmit = async () => {
    if (!form.compagnie.trim()) {
      toast.error("Le nom de la compagnie est requis.");
      return;
    }

    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const url = editItem ? `/api/courtage/${editItem.id}` : "/api/courtage";
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur serveur");
      }

      const data = await res.json();
      const savedId = editItem?.id ?? data.id;

      // Sauvegarder les tags séparément si modifiés
      let savedTags = editItem?.tags ?? [];
      let tagsUpdatedBy = editItem?.tagsUpdatedBy ?? null;
      let tagsUpdatedAt = editItem?.tagsUpdatedAt ?? null;

      if (tagsDirty || (!editItem && tags.length > 0)) {
        try {
          const patchRes = await fetch(`/api/courtage/${savedId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tags }),
          });
          if (patchRes.ok) {
            const patchData = await patchRes.json();
            savedTags = patchData.tags;
            tagsUpdatedBy = patchData.tagsUpdatedBy;
            tagsUpdatedAt = patchData.tagsUpdatedAt;
          }
        } catch {
          // Non-bloquant
        }
      }

      const saved: Courtage = {
        ...(editItem ?? { id: data.id, createdAt: new Date().toISOString() }),
        ...form,
        compagnie: data.compagnie ?? form.compagnie,
        internet: data.internet ?? "",
        qui: data.qui ?? editItem?.qui ?? null,
        dateModification: data.dateModification ?? editItem?.dateModification ?? null,
        id: savedId,
        tags: savedTags,
        tagsUpdatedBy,
        tagsUpdatedAt,
      };

      toast.success(editItem ? "Compagnie mise à jour." : "Compagnie ajoutée.");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Modifier la compagnie" : "Nouvelle compagnie"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Compagnie */}
          <div className="space-y-1.5">
            <Label htmlFor="compagnie">Compagnie *</Label>
            <Input
              id="compagnie"
              value={form.compagnie}
              onChange={(e) => handleChange("compagnie", e.target.value)}
              placeholder="Nom de la compagnie"
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">Logo (URL)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="logoUrl"
                value={form.logoUrl ?? ""}
                onChange={(e) => handleChange("logoUrl", e.target.value)}
                placeholder="https://exemple.com/logo.png"
                className="flex-1"
              />
              {/* Prévisualisation */}
              {isUrl(form.logoUrl) && (
                <div className="h-9 w-9 rounded-lg border bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  {logoError ? (
                    <ImageOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logoUrl}
                      alt="logo"
                      className="h-7 w-7 object-contain"
                      onError={() => setLogoError(true)}
                    />
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              URL directe vers l&apos;image du logo (PNG, SVG…)
            </p>
          </div>

          {/* Identifiant */}
          <div className="space-y-1.5">
            <Label htmlFor="identifiant">Identifiant</Label>
            <Input
              id="identifiant"
              value={form.identifiant}
              onChange={(e) => handleChange("identifiant", e.target.value)}
              placeholder="Login / identifiant"
            />
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Mot de passe"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Lien internet */}
          <div className="space-y-1.5">
            <Label htmlFor="internet">Lien internet</Label>
            <Input
              id="internet"
              value={form.internet}
              onChange={(e) => handleChange("internet", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Séparateur */}
          <div className="border-t pt-1" />

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Points forts / Tags</Label>
              {canSuggestAI && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  onClick={handleSuggestTags}
                  disabled={suggesting}
                >
                  {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Suggérer avec IA
                </Button>
              )}
            </div>

            {/* Suggestions IA */}
            {pendingSuggestions.length > 0 && (
              <div className="rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20 p-3 space-y-2">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Suggestions — coche ceux à ajouter :
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
                            ? "bg-purple-200 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-400 scale-105"
                            : "bg-white dark:bg-slate-900 text-slate-500 border-dashed border-slate-300 dark:border-slate-600 opacity-70 hover:opacity-100"
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
                    type="button"
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

            <TagInput
              value={tags}
              onChange={handleTagsChange}
              placeholder="jeune conducteur, cyber, santé…"
            />
            <p className="text-[11px] text-muted-foreground">
              Entrée ou virgule pour valider · saisie libre · accessible à tous
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editItem ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
