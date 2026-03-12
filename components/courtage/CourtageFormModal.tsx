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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
import { normalizeCompanyName } from "@/lib/utils/courtage-format";
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
};

export function CourtageFormModal({ open, onClose, onSaved, editItem }: CourtageFormModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<CourtageFormData>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        editItem
          ? {
              compagnie: editItem.compagnie,
              identifiant: editItem.identifiant,
              password: editItem.password,
              internet: editItem.internet,
            }
          : EMPTY_FORM
      );
      setShowPassword(false);
    }
  }, [open, editItem]);

  const handleChange = (field: keyof CourtageFormData, value: string) => {
    if (field === "compagnie") {
      setForm((prev) => ({ ...prev, compagnie: normalizeCompanyName(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur serveur");
      }

      const data = await res.json();
      const saved: Courtage = {
        ...(editItem ?? { id: data.id, createdAt: new Date().toISOString() }),
        ...form,
        compagnie: data.compagnie ?? form.compagnie,
        internet: data.internet ?? "",
        qui: data.qui ?? editItem?.qui ?? null,
        dateModification: data.dateModification ?? editItem?.dateModification ?? null,
        id: editItem?.id ?? data.id,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Modifier la compagnie" : "Nouvelle compagnie"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="compagnie">Compagnie *</Label>
            <Input
              id="compagnie"
              value={form.compagnie}
              onChange={(e) => handleChange("compagnie", e.target.value)}
              placeholder="Nom de la compagnie"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="identifiant">Identifiant</Label>
            <Input
              id="identifiant"
              value={form.identifiant}
              onChange={(e) => handleChange("identifiant", e.target.value)}
              placeholder="Login / identifiant"
            />
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="internet">Lien internet</Label>
            <Input
              id="internet"
              value={form.internet}
              onChange={(e) => handleChange("internet", e.target.value)}
              placeholder="https://..."
            />
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
