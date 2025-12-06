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
import { deleteHealthAct, getHealthActKindLabel } from "@/lib/firebase/health-acts";
import { HealthAct } from "@/types";

interface DeleteHealthActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  act: HealthAct | null;
  onSuccess?: () => void;
}

export function DeleteHealthActDialog({
  open,
  onOpenChange,
  act,
  onSuccess,
}: DeleteHealthActDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!act) return;

    setIsDeleting(true);
    try {
      await deleteHealthAct(act.id);
      toast.success("Acte santé supprimé avec succès");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'acte santé:", error);
      toast.error("Erreur lors de la suppression de l'acte santé");
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
            Êtes-vous sûr de vouloir supprimer l'acte de{" "}
            <span className="font-semibold">{act.clientNom}</span> ?
            <br />
            <br />
            Type : <span className="font-semibold">{getHealthActKindLabel(act.kind)}</span>
            <br />
            {act.kind === "AFFAIRE_NOUVELLE" && act.numeroContrat && (
              <>
                N° Contrat :{" "}
                <span className="font-semibold">{act.numeroContrat}</span>
                <br />
              </>
            )}
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

