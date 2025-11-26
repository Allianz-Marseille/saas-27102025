"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Plus, Edit, Trash2, Lock, Unlock, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { deleteAct } from "@/lib/firebase/acts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Act } from "@/types";
import { NewActDialog } from "@/components/acts/new-act-dialog";
import { EditActDialog } from "@/components/acts/edit-act-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getActsByMonth } from "@/lib/firebase/acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Timestamp } from "firebase/firestore";
import { clsx } from "clsx";
import { isActLocked as checkActLocked } from "@/lib/utils/act-lock";
import { toDate } from "@/lib/utils/date-helpers";
import { MonthSelector } from "@/components/dashboard/month-selector";

export default function ActsPage() {
  const { user, userData } = useAuth();
  const [acts, setActs] = useState<Act[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [actToEdit, setActToEdit] = useState<Act | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; actId: string | null; clientName: string }>({
    open: false,
    actId: null,
    clientName: "",
  });
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; note: string; clientName: string }>({
    open: false,
    note: "",
    clientName: "",
  });
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const [sortConfig, setSortConfig] = useState<SortState>({
    key: "dateSaisie",
    direction: "desc",
  });

  const loadActs = async () => {
    if (!user) {
      setActs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const actsData = await getActsByMonth(user.uid, selectedMonth);
      
      // Convertir les Timestamp en Date
      const convertedActs: Act[] = actsData.map((act) => {
        const dateEffet = (act as unknown as { dateEffet: Timestamp | Date }).dateEffet instanceof Timestamp 
          ? (act as unknown as { dateEffet: Timestamp }).dateEffet.toDate() 
          : (act as unknown as { dateEffet: Date }).dateEffet;
          
        const dateSaisie = (act as unknown as { dateSaisie: Timestamp | Date }).dateSaisie instanceof Timestamp 
          ? (act as unknown as { dateSaisie: Timestamp }).dateSaisie.toDate() 
          : (act as unknown as { dateSaisie: Date }).dateSaisie;
        
        return {
          ...act,
          dateEffet,
          dateSaisie,
        };
      });
      
      setActs(convertedActs);
    } catch {
      toast.error("Erreur lors du chargement des actes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, user]);

  const handleActCreated = () => {
    loadActs();
  };

  const handleDeleteActClick = (actId: string, clientName: string) => {
    setDeleteDialog({ open: true, actId, clientName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.actId) return;

    try {
      await deleteAct(deleteDialog.actId);
      toast.success("Acte supprimé avec succès");
      setDeleteDialog({ open: false, actId: null, clientName: "" });
      loadActs();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l'acte");
    }
  };

  const handleEditAct = (act: Act) => {
    if (checkActLocked(act, userData)) {
      toast.error("Cet acte est bloqué et ne peut pas être modifié");
      return;
    }
    setActToEdit(act);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    loadActs();
  };

  const sortedActs = useMemo(() => {
    if (acts.length === 0) {
      return acts;
    }

    const actsClone = [...acts];
    actsClone.sort((actA, actB) => {
      const valueA = getSortableValue(actA, sortConfig.key);
      const valueB = getSortableValue(actB, sortConfig.key);

      if (valueA === null && valueB === null) {
        return 0;
      }
      if (valueA === null) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (valueB === null) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        const comparison = valueA.localeCompare(valueB, "fr", { sensitivity: "base" });
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      return 0;
    });

    return actsClone;
  }, [acts, sortConfig]);

  const handleSortChange = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        direction: "desc",
      };
    });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
    }

    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />;
    }

    return <ArrowDown className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />;
  };

  const getAriaSort = (column: SortKey, sortConfig: SortState): "ascending" | "descending" | "none" => {
    if (sortConfig.key !== column) {
      return "none";
    }

    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };

  const timelineDays = useMemo(() => generateTimeline(selectedMonth, acts), [selectedMonth, acts]);

  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return;

    const todayElement = container.querySelector<HTMLDivElement>('[data-timeline-day="today"]');

    if (!todayElement) {
      container.scrollTo({ left: 0, behavior: "auto" });
      return;
    }

    const targetLeft = todayElement.offsetLeft - container.clientWidth / 2 + todayElement.clientWidth / 2;
    const safeTarget = Math.max(targetLeft, 0);

    container.scrollTo({
      left: safeTarget,
      behavior: "smooth",
    });
  }, [timelineDays]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mes actes</h1>
          <div className="flex items-center gap-4">
            <MonthSelector 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
            <Button 
              className="bg-[#00529B] hover:bg-[#003d73]"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvel acte
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Dialog Nouvel Acte */}
        <NewActDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSuccess={handleActCreated}
        />

        {/* Dialog Éditer Acte */}
        <EditActDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          act={actToEdit}
          onSuccess={handleEditSuccess}
        />

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>
              Visualisation des actes sur le mois sélectionné
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={timelineContainerRef} className="overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {timelineDays.map((day, index) => (
                  <div
                    key={index}
                    data-timeline-day={day.isToday ? "today" : undefined}
                    className={clsx(
                      "flex flex-col items-center p-3 rounded-lg min-w-[80px] transition-colors border",
                      {
                        "bg-orange-100 dark:bg-orange-900/20": day.isSaturday && !day.isToday,
                        "bg-red-100 dark:bg-red-900/20": day.isSunday && !day.isToday,
                        "bg-muted": !day.isSaturday && !day.isSunday && !day.isToday,
                        "border-blue-500 bg-blue-500/20 shadow-lg": day.isToday,
                        "border-transparent": !day.isToday,
                      }
                    )}
                  >
                    <span className="text-xs font-medium">
                      {format(day.date, "EEE", { locale: fr }).substring(0, 3)}
                    </span>
                    <span className="text-2xl font-bold">
                      {format(day.date, "d")}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {day.acts.length} acte{day.acts.length > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des actes */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des actes</CardTitle>
            <CardDescription>
              Tous vos actes commerciaux du mois sélectionné
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Chargement...</p>
            ) : acts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucun acte pour ce mois</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-center p-3 font-semibold text-sm border-b w-12"></th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("dateSaisie", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("dateSaisie")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Date de saisie
                          {renderSortIcon("dateSaisie")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("kind", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("kind")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Type
                          {renderSortIcon("kind")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("clientNom", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("clientNom")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Client
                          {renderSortIcon("clientNom")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("numeroContrat", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("numeroContrat")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          N° Contrat
                          {renderSortIcon("numeroContrat")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("contratType", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("contratType")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Type Contrat
                          {renderSortIcon("contratType")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("compagnie", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("compagnie")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Compagnie
                          {renderSortIcon("compagnie")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("dateEffet", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("dateEffet")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Date d&apos;effet
                          {renderSortIcon("dateEffet")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("primeAnnuelle", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("primeAnnuelle")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Prime annuelle
                          {renderSortIcon("primeAnnuelle")}
                        </button>
                      </th>
                      <th 
                        className="text-center p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/70 transition-colors"
                        aria-sort={getAriaSort("commissionPotentielle", sortConfig)}
                      >
                        <button
                          onClick={() => handleSortChange("commissionPotentielle")}
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Commission
                          {renderSortIcon("commissionPotentielle")}
                        </button>
                      </th>
                      <th className="text-center p-3 font-semibold text-sm border-b w-20">Statut</th>
                      <th className="text-center p-3 font-semibold text-sm border-b w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActs.map((act) => {
                      const isProcess = act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD";
                      const isLocked = checkActLocked(act, userData);
                      
                      return (
                        <tr
                          key={act.id}
                          className={`border-b hover:bg-muted/30 transition-colors ${
                            isLocked ? "opacity-60 bg-muted/20" : ""
                          }`}
                        >
                          <td className="p-3 text-center align-middle">
                            {act.note ? (
                              <button 
                                onClick={() => setNoteDialog({ open: true, note: act.note!, clientName: act.clientNom })}
                                className="hover:opacity-70 transition-opacity" 
                                title="Voir la note"
                              >
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-center align-middle">{format(toDate(act.dateSaisie), "dd/MM/yyyy")}</td>
                          <td className="p-3 text-sm text-center align-middle">{act.kind}</td>
                          <td className="p-3 text-sm font-medium text-center align-middle">{act.clientNom}</td>
                          <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.numeroContrat}</td>
                          <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.contratType}</td>
                          <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.compagnie}</td>
                          <td className="p-3 text-sm text-center align-middle">{format(toDate(act.dateEffet), "dd/MM/yyyy")}</td>
                          <td className="p-3 text-sm text-center align-middle">
                            {act.primeAnnuelle ? formatCurrency(act.primeAnnuelle) : "-"}
                          </td>
                          <td className="p-3 text-sm text-center font-semibold align-middle">
                            {formatCurrency(act.commissionPotentielle)}
                          </td>
                          <td className="p-3 text-center align-middle">
                            {isLocked ? (
                              <div className="flex items-center justify-center" title="Bloqué">
                                <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center" title="Débloqué">
                                <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center align-middle">
                            <div className="flex gap-2 justify-center items-center">
                              <button
                                onClick={() => handleEditAct(act)}
                                className={`p-1 rounded transition-colors ${
                                  isLocked 
                                    ? "opacity-30 cursor-not-allowed" 
                                    : "hover:bg-muted"
                                }`}
                                disabled={isLocked}
                                title={isLocked ? "Modification bloquée" : "Modifier"}
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={() => !isLocked && handleDeleteActClick(act.id, act.clientNom)}
                                className={`p-1 rounded transition-colors ${
                                  isLocked 
                                    ? "opacity-30 cursor-not-allowed" 
                                    : "hover:bg-muted"
                                }`}
                                disabled={isLocked}
                                title={isLocked ? "Suppression bloquée" : "Supprimer"}
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modale de confirmation de suppression */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;acte pour {deleteDialog.clientName} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>
                Annuler
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Supprimer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modale d'affichage de la note */}
      <Dialog open={noteDialog.open} onOpenChange={(open) => setNoteDialog({ ...noteDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Note - {noteDialog.clientName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base whitespace-pre-wrap wrap-break-word">{noteDialog.note}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getSortableValue(act: Act, key: SortKey): number | string | null {
  switch (key) {
    case "dateSaisie": {
      const date = toDate(act.dateSaisie);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "dateEffet": {
      const date = toDate(act.dateEffet);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    case "commissionPotentielle":
      return typeof act.commissionPotentielle === "number" ? act.commissionPotentielle : null;
    case "primeAnnuelle":
      return typeof act.primeAnnuelle === "number" ? act.primeAnnuelle : null;
    case "numeroContrat":
      return act.numeroContrat ? act.numeroContrat.toLowerCase() : null;
    case "contratType":
      return act.contratType ? act.contratType.toLowerCase() : null;
    case "compagnie":
      return act.compagnie ? act.compagnie.toLowerCase() : null;
    case "clientNom":
      return act.clientNom ? act.clientNom.toLowerCase() : null;
    case "kind":
      return act.kind ? act.kind.toLowerCase() : null;
    default:
      return null;
  }
}

function generateTimeline(monthKey: string, acts: Act[] = []): TimelineDay[] {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const timelineDays: TimelineDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const actsByDay = new Map<string, Act[]>();
  
  acts.forEach((act) => {
    const actDate = toDate(act.dateSaisie);
    const dayKey = `${actDate.getFullYear()}-${actDate.getMonth() + 1}-${actDate.getDate()}`;
    
    if (!actsByDay.has(dayKey)) {
      actsByDay.set(dayKey, []);
    }
    actsByDay.get(dayKey)!.push(act);
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    
    const dayKey = `${year}-${month}-${day}`;
    const dayActs = actsByDay.get(dayKey) || [];

    timelineDays.push({
      date,
      isSaturday,
      isSunday,
      isToday: normalizedDate.getTime() === today.getTime(),
      acts: dayActs,
    });
  }

  return timelineDays;
}

type TimelineDay = {
  date: Date;
  isSaturday: boolean;
  isSunday: boolean;
  isToday: boolean;
  acts: Act[];
};

type SortKey =
  | "dateSaisie"
  | "dateEffet"
  | "clientNom"
  | "numeroContrat"
  | "contratType"
  | "compagnie"
  | "primeAnnuelle"
  | "commissionPotentielle"
  | "kind";

type SortDirection = "asc" | "desc";

type SortState = {
  key: SortKey;
  direction: SortDirection;
};
