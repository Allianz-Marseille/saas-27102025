/**
 * Modale de détails et édition d'un sinistre
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sinistre } from "@/types/sinistre";
import { updateSinistre } from "@/lib/firebase/sinistres";
import { RouteSelector } from "./route-selector";
import { StatusSelector } from "./status-selector";
import { AssigneeSelector } from "./assignee-selector";
import { SinistreNotes } from "./sinistre-notes";
import { SinistreHistoryComponent } from "./sinistre-history";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SinistreDetailsDialogProps {
  sinistre: Sinistre | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function SinistreDetailsDialog({
  sinistre,
  open,
  onOpenChange,
  onUpdate,
}: SinistreDetailsDialogProps) {
  const { userData } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Sinistre>>({});

  useEffect(() => {
    if (sinistre) {
      setFormData({
        route: sinistre.route,
        status: sinistre.status,
        assignedTo: sinistre.assignedTo,
      });
    }
  }, [sinistre]);

  const handleSave = async () => {
    if (!sinistre || !sinistre.id) return;

    setIsSaving(true);
    try {
      await updateSinistre(
        sinistre.id,
        {
          ...formData,
          lastUpdatedBy: userData?.id,
        },
        userData?.id,
        userData?.email
      );
      toast.success("Sinistre mis à jour avec succès");
      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour du sinistre");
    } finally {
      setIsSaving(false);
    }
  };

  if (!sinistre) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du sinistre</DialogTitle>
          <DialogDescription>
            Informations et gestion du sinistre {sinistre.claimNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du client</Label>
                  <Input value={sinistre.clientName} disabled />
                </div>
                <div>
                  <Label>Numéro Lagon</Label>
                  <Input value={sinistre.clientLagonNumber} disabled />
                </div>
                <div>
                  <Label>Numéro de police</Label>
                  <Input value={sinistre.policyNumber} disabled />
                </div>
                <div>
                  <Label>Catégorie de la police</Label>
                  <Input value={sinistre.policyCategory} disabled />
                </div>
                <div>
                  <Label>Type de produit</Label>
                  <Input value={sinistre.productType} disabled />
                </div>
                <div>
                  <Label>Numéro de sinistre</Label>
                  <Input value={sinistre.claimNumber} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations sinistre */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations sinistre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de survenance</Label>
                  <Input
                    value={format(
                      sinistre.incidentDate instanceof Timestamp
                        ? sinistre.incidentDate.toDate()
                        : sinistre.incidentDate,
                      "dd/MM/yyyy"
                    )}
                    disabled
                  />
                </div>
                <div>
                  <Label>Garantie sinistrée</Label>
                  <Input value={sinistre.damagedCoverage} disabled />
                </div>
                <div>
                  <Label>Montant déjà payé</Label>
                  <Input
                    value={formatCurrency(sinistre.amountPaid)}
                    disabled
                  />
                </div>
                <div>
                  <Label>Reste à payer</Label>
                  <Input
                    value={formatCurrency(sinistre.remainingAmount)}
                    disabled
                  />
                </div>
                <div>
                  <Label>Montant total</Label>
                  <Input
                    value={formatCurrency(sinistre.totalAmount)}
                    disabled
                  />
                </div>
                <div>
                  <Label>Recours</Label>
                  <Input
                    value={sinistre.recourse ? "Oui" : "Non"}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gestion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <RouteSelector
                  value={formData.route}
                  onValueChange={(value) =>
                    setFormData({ ...formData, route: value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <StatusSelector
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Affecté à</Label>
                <AssigneeSelector
                  value={formData.assignedTo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assignedTo: value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes et Historique */}
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>
            <TabsContent value="notes" className="mt-4">
              <SinistreNotes sinistreId={sinistre.id!} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <SinistreHistoryComponent sinistreId={sinistre.id!} />
            </TabsContent>
          </Tabs>

          {/* Métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Date d'import:</span>
                <span>
                  {format(
                    sinistre.importDate instanceof Timestamp
                      ? sinistre.importDate.toDate()
                      : sinistre.importDate,
                    "dd/MM/yyyy à HH:mm"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fichier source:</span>
                <span className="truncate max-w-xs">{sinistre.excelVersion}</span>
              </div>
              <div className="flex justify-between">
                <span>Créé le:</span>
                <span>
                  {format(
                    sinistre.createdAt instanceof Timestamp
                      ? sinistre.createdAt.toDate()
                      : sinistre.createdAt,
                    "dd/MM/yyyy à HH:mm"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Modifié le:</span>
                <span>
                  {format(
                    sinistre.updatedAt instanceof Timestamp
                      ? sinistre.updatedAt.toDate()
                      : sinistre.updatedAt,
                    "dd/MM/yyyy à HH:mm"
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

