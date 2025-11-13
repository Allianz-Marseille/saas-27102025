"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DollarSign, FileText, Plus, ClipboardCheck, Car, Building2, Scale, Edit, Trash2, Coins, AlertCircle, CheckCircle2, Target, ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react";
import { deleteAct } from "@/lib/firebase/acts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { calculateKPI } from "@/lib/utils/kpi";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";
import { Act } from "@/types";
import { NewActDialog } from "@/components/acts/new-act-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RouteGuard } from "@/components/auth/route-guard";
import { logout } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { getActsByMonth } from "@/lib/firebase/acts";
import { useAuth } from "@/lib/firebase/use-auth";
import { Timestamp } from "firebase/firestore";
import { clsx } from "clsx";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };
  const [acts, setActs] = useState<Act[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    if (isActLocked(act)) {
      toast.error("Cet acte est bloqué et ne peut pas être modifié");
      return;
    }
    console.log("Édition de l'acte:", act.id);
    toast.info(`Édition de ${act.clientNom} - Fonctionnalité à venir`);
  };

  const kpi = calculateKPI(acts);

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

  // Fonction pour déterminer si un acte est bloqué
  // Règle : Le 15 du mois M, les saisies du mois M-1 se bloquent automatiquement
  // Exemple : Le 15 octobre 2025, les saisies de septembre 2025 sont bloquées
  const isActLocked = (act: Act): boolean => {
    const now = new Date();
    const today = now.getDate();
    const actDate = new Date(act.dateSaisie);
    
    // Si on est le 15 ou après le 15 du mois actuel
    if (today >= 15) {
      const actYear = actDate.getFullYear();
      const actMonth = actDate.getMonth();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth();
      
      // Si l'acte est du mois précédent (M-1), il est bloqué
      // Comparaison exacte de l'année et du mois
      if (actYear < nowYear || (actYear === nowYear && actMonth < nowMonth)) {
        return true;
      }
    }
    
    return false;
  };

  return (
    <RouteGuard>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <Image
                src="/allianz.svg"
                alt="Allianz"
                width={100}
                height={26}
                className="h-6 w-auto brightness-0 dark:brightness-100"
              />
            <h1 className="text-xl font-bold">Dashboard Commercial</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={handleLogout}
              size="sm"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Sélecteur mensuel avec navigation */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Label>Mois</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const [year, month] = selectedMonth.split("-").map(Number);
                  const newDate = new Date(year, month - 1);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedMonth(format(newDate, "yyyy-MM"));
                }}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="w-48 text-center">
                <span className="text-lg font-semibold">
                  {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: fr })}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const [year, month] = selectedMonth.split("-").map(Number);
                  const newDate = new Date(year, month - 1);
                  newDate.setMonth(newDate.getMonth() + 1);
                  // Ne pas permettre d'aller au-delà du mois actuel
                  const now = new Date();
                  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  if (newDate <= currentMonth) {
                    setSelectedMonth(format(newDate, "yyyy-MM"));
                  }
                }}
                className="h-9 w-9"
                disabled={selectedMonth >= format(new Date(), "yyyy-MM")}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Button 
            className="bg-[#00529B] hover:bg-[#003d73]"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvel acte
          </Button>
        </div>

        {/* Dialog Nouvel Acte */}
        <NewActDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSuccess={handleActCreated}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KPICard
            title="CA Mensuel"
            value={formatCurrency(kpi.caMensuel)}
            icon={DollarSign}
            colorScheme="green"
          />
          <KPICard
            title="CA Auto / Moto"
            value={formatCurrency(kpi.caAuto)}
            icon={DollarSign}
            colorScheme="blue"
          />
          <KPICard
            title="CA Autres"
            value={formatCurrency(kpi.caAutres)}
            icon={DollarSign}
            colorScheme="purple"
          />
          <KPICard
            title="Nombre de contrats"
            value={kpi.nbContrats.toString()}
            icon={ClipboardCheck}
            colorScheme="indigo"
          />
          <KPICard
            title="Contrats Auto / Moto"
            value={kpi.nbContratsAuto.toString()}
            icon={Car}
            colorScheme="teal"
          />
          <KPICard
            title="Contrats Autres"
            value={kpi.nbContratsAutres.toString()}
            icon={Building2}
            colorScheme="orange"
          />
          <KPICard
            title="Ratio"
            value={`${kpi.ratio.toFixed(1)}%`}
            subtitle="Objectif ≥ 100%"
            icon={Scale}
            trend={kpi.ratio >= 100 ? "up" : "down"}
            colorScheme={kpi.ratio >= 100 ? "green" : "red"}
          />
          <KPICard
            title="Nombre de process"
            value={kpi.nbProcess.toString()}
            subtitle="M+3, Pré-terme auto, Pré-terme IRD"
            icon={FileText}
            colorScheme="pink"
          />
          <KPICard
            title="Commissions potentielles"
            value={formatCurrency(kpi.commissionsPotentielles)}
            subtitle={kpi.commissionValidee ? "Validées" : "En attente"}
            icon={Coins}
            trend={kpi.commissionValidee ? "up" : "neutral"}
            colorScheme="green"
          />
          <KPICard
            title="Commissions réelles"
            value={formatCurrency(kpi.commissionsReelles)}
            subtitle={kpi.commissionValidee ? "Actives" : "Non validées"}
            icon={Coins}
            trend={kpi.commissionValidee ? "up" : "neutral"}
            colorScheme="blue"
          />
        </div>

        {/* Section Validation Commissions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Conditions de validation des commissions
                </CardTitle>
                <CardDescription className="mt-2">
                  Vérification des critères pour déclencher les commissions réelles
                </CardDescription>
              </div>
              {kpi.commissionValidee && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Validé
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Condition 1: Commissions potentielles */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                kpi.commissionsPotentielles >= 200
                  ? "border-green-500 bg-green-500/5"
                  : "border-orange-500 bg-orange-500/5"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {kpi.commissionsPotentielles >= 200 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm">Commissions potentielles</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      kpi.commissionsPotentielles >= 200
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {formatCurrency(kpi.commissionsPotentielles)}
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(200)}
                    </span>
                  </div>
                  {kpi.commissionsPotentielles < 200 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Il manque {formatCurrency(200 - kpi.commissionsPotentielles)}
                    </p>
                  )}
                </div>
              </div>

              {/* Condition 2: Nombre de process */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                kpi.nbProcess >= 15
                  ? "border-green-500 bg-green-500/5"
                  : "border-orange-500 bg-orange-500/5"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {kpi.nbProcess >= 15 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm">Nombre de process</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      kpi.nbProcess >= 15
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {kpi.nbProcess}
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-sm font-medium text-muted-foreground">15</span>
                  </div>
                  {kpi.nbProcess < 15 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Il manque {15 - kpi.nbProcess} process
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    M+3, Pré-terme auto, Pré-terme IRD
                  </p>
                </div>
              </div>

              {/* Condition 3: Ratio */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                kpi.ratio >= 100
                  ? "border-green-500 bg-green-500/5"
                  : "border-orange-500 bg-orange-500/5"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {kpi.ratio >= 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm">Ratio</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      kpi.ratio >= 100
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {kpi.ratio.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-sm font-medium text-muted-foreground">100%</span>
                  </div>
                  {kpi.ratio < 100 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Il manque {(100 - kpi.ratio).toFixed(1)}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Contrats autres / Auto
                  </p>
                </div>
              </div>
            </div>

            {kpi.commissionValidee && (
              <div className="mt-4 p-4 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-semibold">
                    Toutes les conditions sont remplies ! Les commissions seront validées.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Actes commerciaux</CardTitle>
            <CardDescription>
              Liste de tous les actes du mois sélectionné
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
                      <th className="text-center p-3 font-semibold text-sm border-b">Date de saisie</th>
                      <th className="text-center p-3 font-semibold text-sm border-b">Type</th>
                      <th className="text-center p-3 font-semibold text-sm border-b">Client</th>
                      <th className="text-center p-3 font-semibold text-sm border-b">N° Contrat</th>
                      <th className="text-center p-3 font-semibold text-sm border-b">Type Contrat</th>
                      <th className="text-center p-3 font-semibold text-sm border-b">Compagnie</th>
                      <th className="text-center p-3 font-semibold text-sm border-b">Date d&apos;effet</th>
                      <th className="text-center p-3 font-semibold text-sm border-b">Prime annuelle</th>
                      <th className="text-center p-3 font-semibold text-sm border-b">Commission</th>
                      <th className="text-center p-3 font-semibold text-sm border-b w-20">Statut</th>
                      <th className="text-center p-3 font-semibold text-sm border-b w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acts.map((act) => {
                      const isProcess = act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD";
                      const isLocked = isActLocked(act);
                      
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
                          <td className="p-3 text-sm text-center align-middle">{format(act.dateSaisie, "dd/MM/yyyy")}</td>
                          <td className="p-3 text-sm text-center align-middle">{act.kind}</td>
                          <td className="p-3 text-sm font-medium text-center align-middle">{act.clientNom}</td>
                          <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.numeroContrat}</td>
                          <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.contratType}</td>
                          <td className="p-3 text-sm text-center align-middle">{isProcess ? "-" : act.compagnie}</td>
                          <td className="p-3 text-sm text-center align-middle">{format(act.dateEffet, "dd/MM/yyyy")}</td>
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
      </main>
      
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
    </RouteGuard>
  );
}

function generateTimeline(monthKey: string, acts: Act[] = []): TimelineDay[] {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const timelineDays: TimelineDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Créer un map des actes par jour (basé sur la date de saisie)
  const actsByDay = new Map<string, Act[]>();
  
  acts.forEach((act) => {
    const actDate = new Date(act.dateSaisie);
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

