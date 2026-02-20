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
import { deleteBoost as deleteBoostFn } from "@/lib/firebase/boosts";
import type { BoostWithUser } from "@/types/boost";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DeleteBoostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boost: BoostWithUser | null;
  onSuccess?: () => void;
}

function getBoostDate(b: BoostWithUser): Date {
  const d = b.date;
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function getCollaboratorName(b: BoostWithUser): string {
  if (b.userFirstName || b.userLastName) {
    return [b.userFirstName, b.userLastName].filter(Boolean).join(" ");
  }
  return b.userEmail?.split("@")[0] ?? "Inconnu";
}

export function DeleteBoostDialog({
  open,
  onOpenChange,
  boost,
  onSuccess,
}: DeleteBoostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!boost?.id) return;

    setIsDeleting(true);
    try {
      await deleteBoostFn(boost.id);
      toast.success("Boost supprimé avec succès");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la suppression du boost:", error);
      toast.error("Erreur lors de la suppression du boost");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!boost) return null;

  const dateStr = format(getBoostDate(boost), "dd/MM/yyyy", { locale: fr });
  const collaboratorName = getCollaboratorName(boost);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le boost suivant ?
            <br />
            <br />
            Client : <span className="font-semibold">{boost.clientName}</span>
            <br />
            Date : <span className="font-semibold">{dateStr}</span>
            <br />
            Collaborateur : <span className="font-semibold">{collaboratorName}</span>
            <br />
            Type : <span className="font-semibold">{boost.type}</span>
            <br />
            <br />
            <span className="text-red-600 dark:text-red-400 font-semibold">
              Cette action est irréversible.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isDeleting}
            className="min-w-[7rem] shrink-0 px-4"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-w-[7rem] shrink-0 px-4 bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
