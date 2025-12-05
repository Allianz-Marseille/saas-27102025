"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { FileJson, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportOffresDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportOffresDialog({
  open,
  onClose,
  onSuccess,
}: ImportOffresDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const [replaceAll, setReplaceAll] = useState(false);

  const handleImport = async () => {
    if (!jsonContent.trim()) {
      toast.error("Le contenu JSON est vide");
      return;
    }

    setLoading(true);

    try {
      // Valider le JSON
      const offres = JSON.parse(jsonContent);

      if (!Array.isArray(offres)) {
        throw new Error("Le JSON doit être un tableau d'offres");
      }

      const token = await user?.getIdToken();

      const response = await fetch("/api/offres/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          offres,
          replaceAll,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'import");
      }

      const result = await response.json();

      toast.success(
        `${result.stats.imported} offres importées${
          result.stats.failed > 0 ? ` (${result.stats.failed} erreurs)` : ""
        }`
      );

      setJsonContent("");
      setReplaceAll(false);
      onSuccess();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = `[
  {
    "segment": "Auto",
    "sous_segment": "Affaires nouvelles",
    "offre": "-15 % en AN Auto Pro",
    "code": "4016",
    "conditions": "",
    "categorie_client": "particulier",
    "periode": "Q3 2025"
  }
]`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Import JSON
          </DialogTitle>
          <DialogDescription>
            Importez des offres commerciales en masse depuis un fichier JSON
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Le JSON doit être un tableau d'objets avec les champs : segment,
              sous_segment, offre, code, conditions, categorie_client, periode
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="json-content">Contenu JSON</Label>
            <Textarea
              id="json-content"
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              placeholder={exampleJson}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="replace-all"
              checked={replaceAll}
              onCheckedChange={(checked) => setReplaceAll(checked === true)}
            />
            <Label htmlFor="replace-all" className="cursor-pointer">
              Remplacer toutes les offres existantes
            </Label>
          </div>

          {replaceAll && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Toutes les offres existantes seront supprimées avant l'import
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || !jsonContent.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? "Import en cours..." : "Importer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

