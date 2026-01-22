"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { upsertMonthCommissions, deleteMonthCommissions } from "@/lib/firebase/agency-commissions";
import { AgencyCommission } from "@/types";
import { formatThousands, parseCurrency, calculateTotal, calculateResultat, getMonthName } from "@/lib/utils/commission-calculator";
import { monthCommissionSchema } from "@/lib/validations/commission-schema";
import { Shield, Gem, Handshake, Star, DollarSign, Package, CheckCircle, User, Trash2, Info } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface MonthDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  existingData: AgencyCommission | null;
  onSuccess?: () => void;
}

export function MonthDataDialog({
  open,
  onOpenChange,
  year,
  month,
  existingData,
  onSuccess,
}: MonthDataDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // États pour les champs de saisie (format texte pour l'affichage)
  const [commissionsIARD, setCommissionsIARD] = useState("");
  const [commissionsVie, setCommissionsVie] = useState("");
  const [commissionsCourtage, setCommissionsCourtage] = useState("");
  const [profitsExceptionnels, setProfitsExceptionnels] = useState("");
  const [chargesAgence, setChargesAgence] = useState("");
  const [prelevementsJulien, setPrelevementsJulien] = useState("");
  const [prelevementsJeanMichel, setPrelevementsJeanMichel] = useState("");

  // Calculer les totaux en temps réel
  const totalCommissions = calculateTotal(
    parseCurrency(commissionsIARD),
    parseCurrency(commissionsVie),
    parseCurrency(commissionsCourtage),
    parseCurrency(profitsExceptionnels)
  );
  
  const resultat = calculateResultat(totalCommissions, parseCurrency(chargesAgence));

  // Charger les données existantes
  useEffect(() => {
    if (open && existingData) {
      setCommissionsIARD(existingData.commissionsIARD.toString());
      setCommissionsVie(existingData.commissionsVie.toString());
      setCommissionsCourtage(existingData.commissionsCourtage.toString());
      setProfitsExceptionnels(existingData.profitsExceptionnels.toString());
      setChargesAgence(existingData.chargesAgence.toString());
      setPrelevementsJulien(existingData.prelevementsJulien.toString());
      setPrelevementsJeanMichel(existingData.prelevementsJeanMichel.toString());
    } else if (open && !existingData) {
      // Mode création: champs vides
      setCommissionsIARD("0");
      setCommissionsVie("0");
      setCommissionsCourtage("0");
      setProfitsExceptionnels("0");
      setChargesAgence("0");
      setPrelevementsJulien("0");
      setPrelevementsJeanMichel("0");
    }
  }, [open, existingData]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    const inputData = {
      year,
      month,
      commissionsIARD: parseCurrency(commissionsIARD),
      commissionsVie: parseCurrency(commissionsVie),
      commissionsCourtage: parseCurrency(commissionsCourtage),
      profitsExceptionnels: parseCurrency(profitsExceptionnels),
      chargesAgence: parseCurrency(chargesAgence),
      prelevementsJulien: parseCurrency(prelevementsJulien),
      prelevementsJeanMichel: parseCurrency(prelevementsJeanMichel),
    };

    // Validation
    try {
      monthCommissionSchema.parse(inputData);
    } catch (error: any) {
      const firstError = error.errors?.[0];
      toast.error(firstError?.message || "Données invalides");
      return;
    }

    setIsLoading(true);
    try {
      await upsertMonthCommissions(
        year,
        month,
        inputData,
        user.uid
      );

      toast.success(existingData ? "Données modifiées avec succès" : "Données enregistrées avec succès");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingData) return;

    setIsLoading(true);
    try {
      await deleteMonthCommissions(existingData.id);
      toast.success("Données supprimées avec succès");
      setDeleteDialog(false);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de formatage pendant la saisie
  const handleNumberInput = (
    value: string,
    setter: (value: string) => void
  ) => {
    // Ne garder que les chiffres
    const digits = value.replace(/\D/g, '');
    setter(digits);
  };

  const isEditMode = !!existingData;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <DollarSign className="h-6 w-6 text-yellow-600" />
              Commissions - {getMonthName(month)} {year}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Section Commissions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-yellow-500/30">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <h3 className="font-black text-lg">COMMISSIONS</h3>
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <Label htmlFor="iard" className="font-bold">IARD</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="iard"
                      type="text"
                      value={commissionsIARD ? formatThousands(parseCurrency(commissionsIARD)) : ""}
                      onChange={(e) => handleNumberInput(e.target.value, setCommissionsIARD)}
                      className="text-right font-mono font-bold w-40"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground font-bold">€</span>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <Gem className="h-5 w-5 text-purple-600" />
                  <Label htmlFor="vie" className="font-bold">Vie</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="vie"
                      type="text"
                      value={commissionsVie ? formatThousands(parseCurrency(commissionsVie)) : ""}
                      onChange={(e) => handleNumberInput(e.target.value, setCommissionsVie)}
                      className="text-right font-mono font-bold w-40"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground font-bold">€</span>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <Handshake className="h-5 w-5 text-cyan-600" />
                  <Label htmlFor="courtage" className="font-bold">Courtage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="courtage"
                      type="text"
                      value={commissionsCourtage ? formatThousands(parseCurrency(commissionsCourtage)) : ""}
                      onChange={(e) => handleNumberInput(e.target.value, setCommissionsCourtage)}
                      className="text-right font-mono font-bold w-40"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground font-bold">€</span>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <Star className="h-5 w-5 text-orange-600" />
                  <Label htmlFor="profits" className="font-bold">Profits exceptionnels</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="profits"
                      type="text"
                      value={profitsExceptionnels ? formatThousands(parseCurrency(profitsExceptionnels)) : ""}
                      onChange={(e) => handleNumberInput(e.target.value, setProfitsExceptionnels)}
                      className="text-right font-mono font-bold w-40"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground font-bold">€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total calculé */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-xl border-2 border-yellow-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                  <span className="font-black text-lg">Total Commissions</span>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {formatThousands(totalCommissions)} €
                </div>
              </div>
            </div>

            {/* Section Charges */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-red-500/30">
                <Package className="h-5 w-5 text-red-600" />
                <h3 className="font-black text-lg">CHARGES</h3>
              </div>

              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <Package className="h-5 w-5 text-red-600" />
                <Label htmlFor="charges" className="font-bold">Charges agence</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="charges"
                    type="text"
                    value={chargesAgence ? formatThousands(parseCurrency(chargesAgence)) : ""}
                    onChange={(e) => handleNumberInput(e.target.value, setChargesAgence)}
                    className="text-right font-mono font-bold w-40"
                    placeholder="0"
                  />
                  <span className="text-muted-foreground font-bold">€</span>
                </div>
              </div>
            </div>

            {/* Résultat calculé */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-2 border-green-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-black text-lg">Résultat</span>
                </div>
                <div className={cn(
                  "text-3xl font-black",
                  resultat >= 0 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent"
                )}>
                  {formatThousands(resultat)} €
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-semibold">
                = Total commissions - Charges agence
              </p>
            </div>

            {/* Section Prélèvements */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-500/30">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-black text-lg">PRÉLÈVEMENTS</h3>
                <div className="ml-auto">
                  <span className="text-xs bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-bold">
                    Info uniquement
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <Label htmlFor="julien" className="font-bold">Julien</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="julien"
                      type="text"
                      value={prelevementsJulien ? formatThousands(parseCurrency(prelevementsJulien)) : ""}
                      onChange={(e) => handleNumberInput(e.target.value, setPrelevementsJulien)}
                      className="text-right font-mono font-bold w-40"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground font-bold">€</span>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <Label htmlFor="jeanmichel" className="font-bold">Jean-Michel</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="jeanmichel"
                      type="text"
                      value={prelevementsJeanMichel ? formatThousands(parseCurrency(prelevementsJeanMichel)) : ""}
                      onChange={(e) => handleNumberInput(e.target.value, setPrelevementsJeanMichel)}
                      className="text-right font-mono font-bold w-40"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground font-bold">€</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200 font-semibold">
                    Les prélèvements ne sont <span className="font-black">PAS des charges</span>. Ce sont des retraits sur le résultat pour suivre la rémunération des dirigeants.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            {isEditMode && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialog(true)}
                disabled={isLoading}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg gap-2 font-bold"
            >
              <CheckCircle className="h-4 w-4" />
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer les données de <span className="font-black">{getMonthName(month)} {year}</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

