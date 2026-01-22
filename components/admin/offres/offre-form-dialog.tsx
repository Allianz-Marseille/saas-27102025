"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { OffreCommerciale } from "@/types/offre";

interface OffreFormDialogProps {
  open: boolean;
  onClose: () => void;
  offre?: OffreCommerciale | null;
}

export function OffreFormDialog({ open, onClose, offre }: OffreFormDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    segment: "",
    sous_segment: "",
    offre: "",
    code: "",
    conditions: "",
    categorie_client: "particulier",
    periode: "",
  });

  useEffect(() => {
    if (offre) {
      setFormData({
        segment: offre.segment,
        sous_segment: offre.sous_segment,
        offre: offre.offre,
        code: offre.code,
        conditions: offre.conditions,
        categorie_client: offre.categorie_client,
        periode: offre.periode,
      });
    } else {
      setFormData({
        segment: "",
        sous_segment: "",
        offre: "",
        code: "",
        conditions: "",
        categorie_client: "particulier",
        periode: "",
      });
    }
  }, [offre, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await user?.getIdToken();
      
      const url = offre ? `/api/offres/${offre.id}` : "/api/offres";
      const method = offre ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      toast.success(offre ? "Offre mise à jour avec succès" : "Offre créée avec succès");

      onClose();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {offre ? "Modifier l'offre" : "Nouvelle offre"}
          </DialogTitle>
          <DialogDescription>
            {offre
              ? "Modifiez les informations de l'offre commerciale"
              : "Créez une nouvelle offre commerciale"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="segment">
                Segment <span className="text-red-500">*</span>
              </Label>
              <Input
                id="segment"
                value={formData.segment}
                onChange={(e) =>
                  setFormData({ ...formData, segment: e.target.value })
                }
                required
                placeholder="Ex: Auto, MRH, Santé..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sous_segment">
                Sous-segment <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sous_segment"
                value={formData.sous_segment}
                onChange={(e) =>
                  setFormData({ ...formData, sous_segment: e.target.value })
                }
                required
                placeholder="Ex: Affaires nouvelles, Packagée..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offre">
              Offre <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="offre"
              value={formData.offre}
              onChange={(e) =>
                setFormData({ ...formData, offre: e.target.value })
              }
              required
              placeholder="Ex: -15 % en AN Auto Pro"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code promo</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Ex: 4016"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periode">
                Période <span className="text-red-500">*</span>
              </Label>
              <Input
                id="periode"
                value={formData.periode}
                onChange={(e) =>
                  setFormData({ ...formData, periode: e.target.value })
                }
                required
                placeholder="Ex: Q3 2025, 2025..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categorie_client">
              Catégorie client <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.categorie_client}
              onValueChange={(value) =>
                setFormData({ ...formData, categorie_client: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="particulier">Particulier</SelectItem>
                <SelectItem value="professionnel">Professionnel</SelectItem>
                <SelectItem value="entreprise">Entreprise</SelectItem>
                <SelectItem value="TNS">TNS</SelectItem>
                <SelectItem value="agriculteur">Agriculteur</SelectItem>
                <SelectItem value="viticulteur">Viticulteur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditions">Conditions</Label>
            <Textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) =>
                setFormData({ ...formData, conditions: e.target.value })
              }
              placeholder="Conditions particulières de l'offre..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? "Enregistrement..." : offre ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

