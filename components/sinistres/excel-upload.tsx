/**
 * Composant d'upload de fichier Excel pour l'import de sinistres
 * Visible uniquement pour les administrateurs
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExcelImportResult } from "@/types/sinistre";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

interface ExcelUploadProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function ExcelUpload({ onSuccess, onError }: ExcelUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Vérifier le format
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      onError?.("Le fichier doit être au format Excel (.xlsx ou .xls)");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/sinistres/upload-excel", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'import");
      }

      const data = await response.json();
      setImportResult(data.result);
      setIsDialogOpen(true);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      onError?.(
        error instanceof Error ? error.message : "Erreur lors de l'import du fichier"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <>
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Import en cours...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Importer un fichier Excel
          </>
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Dialog de résultat */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Résultat de l'import</DialogTitle>
            <DialogDescription>
              Détails de l'import du fichier Excel
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {importResult.newSinistres}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Nouveaux sinistres
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {importResult.existingSinistres}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Sinistres existants
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {importResult.updatedSinistres > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {importResult.updatedSinistres}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Sinistres mis à jour
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {importResult.totalLines}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Lignes traitées
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fichier source:</span>
                  <span className="font-medium">{importResult.excelVersion}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date d'import:</span>
                  <span className="font-medium">
                    {format(
                      importResult.importDate instanceof Timestamp
                        ? importResult.importDate.toDate()
                        : importResult.importDate,
                      "dd/MM/yyyy 'à' HH:mm"
                    )}
                  </span>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-red-600 mb-2">
                      {importResult.errors.length} erreur(s) détectée(s)
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600">
                          Ligne {error.line}: {error.error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

