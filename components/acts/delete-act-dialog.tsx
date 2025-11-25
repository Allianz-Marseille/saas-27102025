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
import { deleteAct } from "@/lib/firebase/acts";
import { Act } from "@/types";

interface DeleteActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  act: Act | null;
  onSuccess?: () => void;
}

export function DeleteActDialog({
  open,
  onOpenChange,
  act,
  onSuccess,
}: DeleteActDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!act) return;

    setIsDeleting(true);
    try {
      await deleteAct(act.id);
      toast.success("Acte supprimé avec succès");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'acte:", error);
      toast.error("Erreur lors de la suppression de l'acte");
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
            Type : <span className="font-semibold">{act.kind}</span>
            <br />
            {act.kind === "AN" && (
              <>
                N° Contrat :{" "}
                <span className="font-semibold">{act.numeroContrat}</span>
              </>
            )}
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

