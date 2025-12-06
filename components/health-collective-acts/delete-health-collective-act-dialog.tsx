"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { deleteHealthCollectiveAct, getHealthCollectiveActKindLabel, getHealthCollectiveActOriginLabel } from "@/lib/firebase/health-collective-acts";
import { HealthCollectiveAct } from "@/types";

interface DeleteHealthCollectiveActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  act: HealthCollectiveAct | null;
  onSuccess?: () => void;
}

export function DeleteHealthCollectiveActDialog({
  open,
  onOpenChange,
  act,
  onSuccess,
}: DeleteHealthCollectiveActDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!act) return;

    setIsDeleting(true);
    try {
      await deleteHealthCollectiveAct(act.id);
      toast.success("Acte santé collective supprimé avec succès");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'acte santé collective:", error);
      toast.error("Erreur lors de la suppression de l'acte santé collective");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!act) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l&apos;acte santé collective de{" "}
            <span className="font-semibold">{act.clientNom}</span> ?
            <br />
            <br />
            Origine : <span className="font-semibold">{getHealthCollectiveActOriginLabel(act.origine)}</span>
            <br />
            Type : <span className="font-semibold">{getHealthCollectiveActKindLabel(act.kind)}</span>
            <br />
            N° Contrat :{" "}
            <span className="font-semibold">{act.numeroContrat || "-"}</span>
            <br />
            <br />
            <span className="text-red-600 dark:text-red-400 font-semibold">
              Cette action est irréversible.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

