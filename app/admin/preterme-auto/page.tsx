"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import Link from "next/link";
import {
  Calendar, ChevronLeft, ChevronRight, Upload, Filter,
  Building2, CheckCircle2, Clock, History, Car, Send,
  MessageSquare, ArrowRightLeft, SlidersHorizontal, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/use-auth";
import {
  upsertPretermeConfig,
  getPretermeConfig,
  getAllPretermeConfigs,
  getPretermeClients,
  getSocietesAValider,
  getPretermeImport,
  updatePretermeImport,
  updatePretermeConfigWorkflow,
  getPretermeImportsByMois,
} from "@/lib/firebase/preterme";
import { ConfigurationStep } from "@/components/preterme/ConfigurationStep";
import { UploadStep } from "@/components/preterme/UploadStep";
import { ThresholdsStep } from "@/components/preterme/ThresholdsStep";
import { SocietesValidationStep } from "@/components/preterme/SocietesValidationStep";
import { TypeValidationStep } from "@/components/preterme/TypeValidationStep";
import { DispatchPreview } from "@/components/preterme/DispatchPreview";
import { SynthesisReport } from "@/components/preterme/SynthesisReport";
import type {
  PretermeConfig, AgenceConfig, AgenceCode, PretermeClient,
  PretermeImport, PretermeWorkflowStep,
} from "@/types/preterme";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMoisCible(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoisLabel(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function navigateMois(moisKey: string, delta: number): string {
  const [year, month] = moisKey.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function defaultAgences(): AgenceConfig[] {
  return [
    {
      code: "H91358",
      charges: [
        { id: uuidv4(), prenom: "Corentin", lettresDebut: "A", lettresFin: "C", trello: { trelloBoardId: "67b5f1b34a0b1f85c58dffc1", trelloListId: "67b5f1c697b2440733fec2e6", trelloListName: "PRETERME-AUTO", trelloBoardUrl: "https://trello.com/b/nfhDBmQg/corentin", trelloListUrl: "https://trello.com/b/nfhDBmQg/corentin", trelloMemberId: "67b31e5a33967f2b0c4783e3" } },
        { id: uuidv4(), prenom: "Emma", lettresDebut: "D", lettresFin: "F", trello: { trelloBoardId: "66d00de829da279e8e667d12", trelloListId: "687a58ffda5f06e009db8ad5", trelloListName: "PRETERME AUTO", trelloBoardUrl: "https://trello.com/b/DkhXnVU8/emma", trelloListUrl: "https://trello.com/b/DkhXnVU8/emma", trelloMemberId: "66d026f95aa7e0dc4201a208" } },
        { id: uuidv4(), prenom: "Matthieu", lettresDebut: "G", lettresFin: "M", trello: { trelloBoardId: "6980592314de167992c14682", trelloListId: "6980593299ba9e50b7bccfa3", trelloListName: "PRETERME AUTO", trelloBoardUrl: "https://trello.com/b/EkK9044F/matthieu", trelloListUrl: "https://trello.com/b/EkK9044F/matthieu", trelloMemberId: "69805e6a33a948ae79241cbc" } },
        { id: uuidv4(), prenom: "Donia", lettresDebut: "N", lettresFin: "Z", trello: { trelloBoardId: "684830496441fb45a81ad2ec", trelloListId: "6848305df08bc5e50d5cabd4", trelloListName: "PRETERME AUTO", trelloBoardUrl: "https://trello.com/b/yYu4W7FJ/donia", trelloListUrl: "https://trello.com/b/yYu4W7FJ/donia", trelloMemberId: "6848029e7f42281696feb267" } },
      ],
    },
    {
      code: "H92083",
      charges: [
        { id: uuidv4(), prenom: "Joelle", lettresDebut: "A", lettresFin: "H", trello: { trelloBoardId: "66f0f7e293c93ba79d00ac8b", trelloListId: "66f0f7f5b5637967d3526f61", trelloListName: "PRETERME AUTO", trelloBoardUrl: "https://trello.com/b/3oWnNHUr/joelle", trelloListUrl: "https://trello.com/b/3oWnNHUr/joelle", trelloMemberId: "66f0fabeee51053c1bdd6a1b" } },
        { id: uuidv4(), prenom: "Christelle", lettresDebut: "I", lettresFin: "Z", trello: { trelloBoardId: "696e08ca8f5fc83c1a5595af", trelloListId: "696e08d97fb0c0bd53e4398a", trelloListName: "PRETERME AUTO", trelloBoardUrl: "https://trello.com/b/IexKz87i/christelle", trelloListUrl: "https://trello.com/b/IexKz87i/christelle", trelloMemberId: "696e01346b6d56cc7332c3af" } },
      ],
    },
  ];
}

function getImportStatusBadge(statut?: string): { label: string; className: string } {
  switch (statut) {
    case "TERMINE": return { label: "Terminé", className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700" };
    case "PRET": return { label: "Prêt", className: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/60 dark:text-sky-300 dark:border-sky-700" };
    case "VALIDATION_SOCIETES": return { label: "Validation", className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700" };
    case "DISPATCH_TRELLO": return { label: "Dispatch", className: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/60 dark:text-violet-300 dark:border-violet-700" };
    default: return { label: "Brouillon", className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" };
  }
}

function isImportTypesValidated(
  imp: PretermeImport,
  savedTypeChoicesByImportId: Record<string, boolean>
): boolean {
  return (
    savedTypeChoicesByImportId[imp.id] === true ||
    !!imp.typesValidatedAt ||
    imp.statut === "PRET" ||
    imp.statut === "DISPATCH_TRELLO" ||
    imp.statut === "TERMINE"
  );
}

// ─── Steps ──────────────────────────────────────────────────────────────────

type Step = PretermeWorkflowStep;

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "periode",    label: "Période",         icon: Calendar },
  { id: "upload",     label: "Téléchargement",  icon: Upload },
  { id: "filtrage",   label: "Filtrage IA",     icon: Filter },
  { id: "validation", label: "Validation",      icon: ArrowRightLeft },
  { id: "modulation", label: "Modulation",      icon: SlidersHorizontal },
  { id: "dispatch",   label: "Dispatch Trello", icon: Send },
  { id: "synthese",   label: "Synthèse Slack",  icon: MessageSquare },
];
const STEP_IDS = new Set<Step>(STEPS.map((s) => s.id));

function sanitizeCompletedSteps(
  raw: Partial<Record<string, boolean>> | undefined
): Partial<Record<Step, boolean>> {
  const normalized: Partial<Record<Step, boolean>> = {};
  if (!raw) return normalized;
  for (const [key, value] of Object.entries(raw)) {
    if (STEP_IDS.has(key as Step) && value === true) {
      normalized[key as Step] = true;
    }
  }
  return normalized;
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function PretermeAutoPage() {
  const { user } = useAuth();

  const [step, setStep]         = useState<Step>("periode");
  const [moisKey, setMoisKey]   = useState<string>(getMoisCible());
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [idToken, setIdToken]   = useState<string>("");

  const [existingConfig, setExistingConfig] = useState<PretermeConfig | null>(null);
  const [historique, setHistorique]         = useState<PretermeConfig[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [activeImportId, setActiveImportId]   = useState<string | null>(null);
  const [activeAgence, setActiveAgence]       = useState<AgenceCode | null>(null);
  const [importedClients, setImportedClients] = useState<PretermeClient[]>([]);
  const [societesAValider, setSocietesAValider] = useState<PretermeClient[]>([]);
  const [activeImport, setActiveImport]       = useState<PretermeImport | null>(null);
  const [allImports, setAllImports]           = useState<PretermeImport[]>([]);
  const [completedSteps, setCompletedSteps]   = useState<Partial<Record<Step, boolean>>>({});
  const [hasPendingTypeChanges, setHasPendingTypeChanges] = useState(false);
  const [savedTypeChoicesByImportId, setSavedTypeChoicesByImportId] = useState<Record<string, boolean>>({});

  // Sous-étape interne de l'étape validation : types puis gérants
  const [validationSubStep, setValidationSubStep] = useState<"types" | "societes">("types");

  const [config, setConfig] = useState<
    Omit<PretermeConfig, "id" | "createdAt" | "updatedAt" | "createdBy" | "valide">
  >({
    moisKey,
    branche: "AUTO",
    seuilEtp: 120,
    seuilVariation: 20,
    agences: defaultAgences(),
    slackChannelId: "CE58HNVF0",
  });

  // Token Firebase
  useEffect(() => {
    user?.getIdToken().then(setIdToken).catch(() => {});
  }, [user]);

  // Historique
  useEffect(() => {
    getAllPretermeConfigs()
      .then(setHistorique)
      .catch(() => toast.error("Impossible de charger l'historique"))
      .finally(() => setLoadingHistory(false));
  }, []);

  // Config du mois sélectionné
  useEffect(() => {
    setExistingConfig(null);
    getPretermeConfig(moisKey).then((c) => {
      if (c) {
        setExistingConfig(c);
        const persistedCompletedSteps = sanitizeCompletedSteps(
          c.workflow?.completedSteps as Partial<Record<string, boolean>> | undefined
        );
        const restoredStep = c.workflow?.lastStep && STEP_IDS.has(c.workflow.lastStep)
          ? c.workflow.lastStep
          : "periode";
        setCompletedSteps({
          ...persistedCompletedSteps,
          ...(c.valide ? { periode: true, modulation: true } : { periode: true }),
        });
        setConfig({
          moisKey: c.moisKey, branche: c.branche,
          seuilEtp: c.seuilEtp, seuilVariation: c.seuilVariation,
          agences: c.agences, slackChannelId: "CE58HNVF0",
        });
        setStep(restoredStep);
      } else {
        setCompletedSteps({});
        setSavedTypeChoicesByImportId({});
        setStep("periode");
        const latestAgences = historique[0]?.agences ?? defaultAgences();
        setConfig((prev) => ({ ...prev, moisKey, agences: latestAgences, slackChannelId: "CE58HNVF0" }));
      }
    });
  }, [moisKey, historique]);

  const persistWorkflow = useCallback(
    async (nextLastStep?: Step, nextCompletedSteps?: Partial<Record<Step, boolean>>) => {
      if (!existingConfig?.id) return;
      try {
        await updatePretermeConfigWorkflow(existingConfig.id, {
          lastStep: nextLastStep && STEP_IDS.has(nextLastStep) ? nextLastStep : undefined,
          completedSteps: sanitizeCompletedSteps(nextCompletedSteps as Partial<Record<string, boolean>> | undefined),
        });
      } catch {
        toast.warning("Progression enregistrée localement.");
      }
    },
    [existingConfig?.id]
  );

  const markStepsCompleted = useCallback(
    (steps: Step[]) => {
      setCompletedSteps((prev) => {
        const merged = { ...prev };
        for (const s of steps) merged[s] = true;
        void persistWorkflow(step, merged);
        return merged;
      });
    },
    [persistWorkflow, step]
  );

  const loadImportClients = useCallback(async (importId: string) => {
    try {
      setImportedClients(await getPretermeClients(importId));
    } catch {
      toast.error("Impossible de charger les clients de l'import");
    }
  }, []);

  const loadSocietes = useCallback(async (importId: string) => {
    try {
      setSocietesAValider(await getSocietesAValider(importId));
    } catch {
      toast.error("Impossible de charger les sociétés");
    }
  }, []);

  // Étape 1 : confirmer la période → créer config minimale (valide: false)
  const handleConfirmPeriod = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await upsertPretermeConfig({ ...config, valide: false, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([
        getAllPretermeConfigs(),
        getPretermeConfig(moisKey),
      ]);
      setHistorique(updated);
      if (fresh) setExistingConfig(fresh);
      markStepsCompleted(["periode"]);
      toast.success(`Période ${formatMoisLabel(moisKey)} confirmée.`);
      setStep("upload");
    } catch {
      toast.error("Erreur lors de la confirmation de la période");
    } finally {
      setIsSaving(false);
    }
  }, [config, user, moisKey, markStepsCompleted]);

  // Brouillon (modulation en cours)
  const handleSaveDraft = useCallback(async () => {
    if (!user) return;
    setIsSavingDraft(true);
    try {
      await upsertPretermeConfig({ ...config, valide: false, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([getAllPretermeConfigs(), getPretermeConfig(moisKey)]);
      setHistorique(updated);
      if (fresh) setExistingConfig(fresh);
      toast.success("Brouillon sauvegardé");
    } catch {
      toast.error("Erreur lors de la sauvegarde du brouillon");
    } finally {
      setIsSavingDraft(false);
    }
  }, [config, user, moisKey]);

  // Étape 5 : valider la modulation (CDC + seuils) → config.valide = true
  const handleValidateModulation = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await upsertPretermeConfig({ ...config, valide: true, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([getAllPretermeConfigs(), getPretermeConfig(moisKey)]);
      setHistorique(updated);
      if (fresh) setExistingConfig(fresh);
      markStepsCompleted(["modulation"]);
      toast.success("Configuration validée — dispatch Trello disponible.");
      setStep("dispatch");
    } catch {
      toast.error("Erreur lors de la validation de la modulation");
    } finally {
      setIsSaving(false);
    }
  }, [config, user, moisKey, markStepsCompleted]);

  const handleImportSuccess = useCallback(async (importId: string, agence: AgenceCode) => {
    setActiveImportId(importId);
    setActiveAgence(agence);
    await loadImportClients(importId);
    getPretermeImportsByMois(moisKey).then(setAllImports).catch(() => {});
    markStepsCompleted(["upload"]);
  }, [loadImportClients, moisKey, markStepsCompleted]);

  // Charger import actif
  useEffect(() => {
    if (!activeImportId) return;
    getPretermeImport(activeImportId).then((imp) => {
      if (imp) setActiveImport(imp);
    }).catch(() => {});
  }, [activeImportId]);

  // Charger les imports du mois
  useEffect(() => {
    getPretermeImportsByMois(moisKey)
      .then(async (imports) => {
        setAllImports(imports);
        if (imports.length === 0) {
          setActiveImportId(null); setActiveAgence(null); setActiveImport(null);
          setImportedClients([]); setSocietesAValider([]);
          return;
        }
        const stillActive = activeImportId && imports.some((imp) => imp.id === activeImportId);
        const nextActive = stillActive
          ? imports.find((imp) => imp.id === activeImportId)!
          : imports[0];
        setActiveImportId(nextActive.id);
        setActiveAgence(nextActive.agence);
        setActiveImport(nextActive);
        await loadImportClients(nextActive.id);
      })
      .catch(() => toast.error("Impossible de charger les imports du mois"));
  }, [moisKey, activeImportId, loadImportClients]);

  const handleClassifySuccess = useCallback(async (_result: unknown) => {
    if (!activeImportId) return;
    await Promise.all([
      loadImportClients(activeImportId),
      getPretermeImportsByMois(moisKey).then(setAllImports),
    ]);
    setSavedTypeChoicesByImportId({});
    setHasPendingTypeChanges(false);
    markStepsCompleted(["filtrage"]);
    setValidationSubStep("types");
    setStep("validation");
  }, [activeImportId, loadImportClients, markStepsCompleted, moisKey]);

  const markTypeChoicesSavedForImport = useCallback(async (importId: string) => {
    const now = new Date();
    setSavedTypeChoicesByImportId((prev) => ({ ...prev, [importId]: true }));
    setAllImports((prev) =>
      prev.map((imp) => (imp.id === importId ? { ...imp, typesValidatedAt: now } : imp))
    );
    if (activeImport?.id === importId) {
      setActiveImport((prev) => (prev ? { ...prev, typesValidatedAt: now } : prev));
    }
    try {
      await updatePretermeImport(importId, { typesValidatedAt: now });
    } catch {
      toast.warning("Synchronisation en attente.");
    }
  }, [activeImport?.id]);

  const handleTypeValidationDone = useCallback(async (nbEntreprises: number) => {
    if (!activeImportId) return;
    await markTypeChoicesSavedForImport(activeImportId);
    if (nbEntreprises > 0) {
      await loadSocietes(activeImportId);
      setValidationSubStep("societes");
    } else {
      markStepsCompleted(["validation"]);
      setStep("modulation");
    }
  }, [activeImportId, loadSocietes, markStepsCompleted, markTypeChoicesSavedForImport]);

  const handleValidateTypesForAllImports = useCallback(async () => {
    if (!activeImportId) return;
    if (hasPendingTypeChanges) {
      toast.warning("Enregistre d'abord les modifications en cours.");
      return;
    }
    const latestImports = await getPretermeImportsByMois(moisKey).catch(() => null);
    if (!latestImports || latestImports.length === 0) {
      toast.error("Impossible de vérifier les imports du mois.");
      return;
    }
    setAllImports(latestImports);
    const unsaved = latestImports.filter(
      (imp) => !isImportTypesValidated(imp, savedTypeChoicesByImportId)
    );
    if (unsaved.length > 0) {
      toast.warning(`Valide d'abord les types pour : ${unsaved.map((i) => i.agence).join(", ")}.`);
      return;
    }
    const nbEntreprises = importedClients.filter(
      (c) => c.conserve && (c.typeEntite === "societe" || c.typeEntite === "a_valider")
    ).length;
    await handleTypeValidationDone(nbEntreprises);
    toast.success("Validation complète pour toutes les agences.");
  }, [
    activeImportId, handleTypeValidationDone, hasPendingTypeChanges,
    importedClients, moisKey, savedTypeChoicesByImportId,
  ]);

  useEffect(() => {
    void persistWorkflow(step, completedSteps);
  }, [step, completedSteps, persistWorkflow]);

  const importsDuMois = useMemo(
    () => allImports.filter((imp) => imp.moisKey === moisKey),
    [allImports, moisKey]
  );

  const isTypeChoicesSavedForImport = useCallback(
    (imp: PretermeImport): boolean => isImportTypesValidated(imp, savedTypeChoicesByImportId),
    [savedTypeChoicesByImportId]
  );

  const areAllImportsTypeChoicesSaved = useMemo(
    () => importsDuMois.length > 0 && importsDuMois.every((imp) => isTypeChoicesSavedForImport(imp)),
    [importsDuMois, isTypeChoicesSavedForImport]
  );

  const handleSwitchImport = useCallback(async (importToActivate: PretermeImport) => {
    setActiveImportId(importToActivate.id);
    setActiveAgence(importToActivate.agence);
    setActiveImport(importToActivate);
    setHasPendingTypeChanges(false);
    await loadImportClients(importToActivate.id);
    if (step === "validation" && validationSubStep === "societes") {
      await loadSocietes(importToActivate.id);
    }
  }, [loadImportClients, loadSocietes, step, validationSubStep]);

  // ─── Dérivés ────────────────────────────────────────────────────────────────

  const isPeriodeConfirmed   = existingConfig !== null;
  const isModulationValide   = existingConfig?.valide ?? false;
  const stepIndex            = STEPS.findIndex((s) => s.id === step);

  const canAccessStep = (s: Step): boolean => {
    if (s === "periode") return true;
    if (s === "upload") return isPeriodeConfirmed;
    if (s === "filtrage") return importsDuMois.length > 0;
    if (s === "validation") return importsDuMois.some((imp) =>
      ["VALIDATION_SOCIETES", "PRET", "DISPATCH_TRELLO", "TERMINE"].includes(imp.statut));
    if (s === "modulation") return areAllImportsTypeChoicesSaved &&
      importsDuMois.some((imp) => ["PRET", "DISPATCH_TRELLO", "TERMINE"].includes(imp.statut));
    if (s === "dispatch") return isModulationValide && !!activeImportId;
    if (s === "synthese") return importsDuMois.some((imp) =>
      ["DISPATCH_TRELLO", "TERMINE"].includes(imp.statut));
    return false;
  };

  const derivedDoneByStatus = useMemo<Partial<Record<Step, boolean>>>(() => {
    const d: Partial<Record<Step, boolean>> = {};
    if (isPeriodeConfirmed) d.periode = true;
    if (importsDuMois.length > 0) d.upload = true;
    if (importsDuMois.some((imp) => ["VALIDATION_SOCIETES", "PRET", "DISPATCH_TRELLO", "TERMINE"].includes(imp.statut)))
      d.filtrage = true;
    if (areAllImportsTypeChoicesSaved && importsDuMois.some((imp) =>
      ["PRET", "DISPATCH_TRELLO", "TERMINE"].includes(imp.statut)))
      d.validation = true;
    if (isModulationValide) d.modulation = true;
    if (importsDuMois.some((imp) => ["DISPATCH_TRELLO", "TERMINE"].includes(imp.statut)))
      d.dispatch = true;
    if (importsDuMois.some((imp) => imp.statut === "TERMINE"))
      d.synthese = true;
    return d;
  }, [importsDuMois, isPeriodeConfirmed, isModulationValide, areAllImportsTypeChoicesSaved]);

  // ─── Sélecteur d'agence (navigation inter-agences) ─────────────────────────

  const AgencySwitcher = () => {
    if (importsDuMois.length <= 1) return null;
    return (
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {importsDuMois.map((imp) => {
              const isActive = imp.id === activeImportId;
              return (
                <Button
                  key={imp.id}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs",
                    isActive
                      ? "bg-sky-600 hover:bg-sky-500"
                      : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  )}
                  onClick={() => { void handleSwitchImport(imp); }}
                >
                  {imp.agence}
                  <span className="ml-1 opacity-60 text-[10px]">{imp.pretermesGlobaux} clients</span>
                  <Badge className={cn("ml-2 text-[10px] border", getImportStatusBadge(imp.statut).className)}>
                    {getImportStatusBadge(imp.statut).label}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  void stepIndex; // utilisé implicitement dans le rendu

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-950/60 rounded-lg">
          <Car className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Prétermes Auto</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Gestion automatisée — périmètre Auto uniquement</p>
        </div>
        <Badge className="ml-auto bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700 capitalize">
          {formatMoisLabel(moisKey)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <CardContent className="p-4 space-y-1">
              {STEPS.map((s, i) => {
                const isActive  = step === s.id;
                const isDone    = completedSteps[s.id] || derivedDoneByStatus[s.id] || false;
                const accessible = canAccessStep(s.id);
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => accessible && setStep(s.id)}
                    disabled={!accessible}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                      isActive
                        ? "bg-sky-100 text-sky-700 font-medium dark:bg-sky-950/60 dark:text-sky-300"
                        : accessible
                        ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
                        : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      isDone
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300"
                        : isActive
                        ? "bg-sky-200 text-sky-700 dark:bg-sky-700 dark:text-sky-200"
                        : accessible
                        ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                    )}>
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span>{s.label}</span>
                    {!accessible && <Clock className="h-3 w-3 ml-auto text-slate-400 dark:text-slate-600" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Historique */}
          <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Configs précédentes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              {loadingHistory ? (
                <p className="text-xs text-slate-500 dark:text-slate-600">Chargement...</p>
              ) : historique.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-600">Aucun cycle enregistré</p>
              ) : (
                historique.slice(0, 6).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <button
                      onClick={() => { setMoisKey(h.moisKey); setStep("periode"); }}
                      className="text-slate-700 dark:text-slate-300 text-left flex-1 truncate"
                    >
                      {formatMoisLabel(h.moisKey)}
                    </button>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      {h.valide
                        ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        : <Clock className="h-3 w-3 text-amber-500" />}
                      <Link
                        href={`/admin/preterme-auto/historique/${h.moisKey}`}
                        className="text-sky-500 hover:text-sky-400 transition-colors"
                        title="Voir le détail"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Contenu principal ── */}
        <div className="lg:col-span-3">

          {/* ── 1. Période ── */}
          {step === "periode" && (
            <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  Sélection de la période
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline" size="icon"
                    className="border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    onClick={() => setMoisKey((m) => navigateMois(m, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center min-w-48">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                      {formatMoisLabel(moisKey)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Mois traité par ce préterme</p>
                  </div>
                  <Button
                    variant="outline" size="icon"
                    className="border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    onClick={() => setMoisKey((m) => navigateMois(m, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-700 dark:bg-sky-950/30 dark:border-sky-800/40 dark:text-sky-300/80">
                  <p className="font-medium mb-1">Règle calendaire</p>
                  <p>Traitement toujours sur le <strong>mois suivant</strong>. Pré-sélectionné :{" "}
                    <strong className="text-sky-700 dark:text-sky-200">{formatMoisLabel(getMoisCible())}</strong>.</p>
                </div>

                {existingConfig ? (
                  <div className={cn(
                    "p-4 rounded-xl border text-sm flex items-start gap-3",
                    existingConfig.valide
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700/50 dark:text-emerald-300"
                      : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-700/50 dark:text-amber-300"
                  )}>
                    {existingConfig.valide
                      ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      : <Clock className="h-4 w-4 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-medium">
                        {existingConfig.valide ? "Cycle terminé" : "Cycle en cours"}
                      </p>
                      <p className="text-xs opacity-80 mt-0.5">
                        {existingConfig.agences.reduce((acc, a) => acc + a.charges.length, 0)} CDC —
                        ETP ≥ {existingConfig.seuilEtp} | Variation ≥ {existingConfig.seuilVariation}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
                    Nouveau cycle — confirmer la période pour commencer.
                  </div>
                )}

                <Button
                  className="w-full bg-sky-600 hover:bg-sky-500"
                  disabled={isSaving}
                  onClick={isPeriodeConfirmed ? () => setStep("upload") : handleConfirmPeriod}
                >
                  {isSaving
                    ? "Confirmation…"
                    : isPeriodeConfirmed
                    ? "Continuer vers le téléchargement"
                    : "Valider la période"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── 2. Upload ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button
                  variant="ghost" size="sm"
                  className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("periode")}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Changer de période
                </Button>
              </div>
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4 text-sky-400" />
                    Téléchargement des exports Allianz — {formatMoisLabel(moisKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadStep
                    moisKey={moisKey}
                    configValide={isPeriodeConfirmed}
                    idToken={idToken}
                    onImportSuccess={handleImportSuccess}
                  />
                </CardContent>
              </Card>
              {importsDuMois.length > 0 && (
                <Button
                  className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60"
                  disabled={importsDuMois.length < 2}
                  onClick={() => setStep("filtrage")}
                  title={importsDuMois.length < 2 ? "Les 2 agences doivent être importées pour continuer" : ""}
                >
                  Valider l&apos;étape — Lancer le filtrage IA
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* ── 3. Filtrage IA ── */}
          {step === "filtrage" && activeImportId && activeAgence && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button
                  variant="ghost" size="sm"
                  className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("upload")}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour téléchargement
                </Button>
              </div>
              <AgencySwitcher />
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4 text-sky-400" />
                    Classification Gemini — {activeAgence}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ThresholdsStep
                    importId={activeImportId}
                    agence={activeAgence}
                    moisKey={moisKey}
                    clients={importedClients}
                    availableImportIds={importsDuMois.map((imp) => imp.id)}
                    seuilEtpInitial={existingConfig?.seuilEtp ?? 120}
                    seuilVariationInitial={existingConfig?.seuilVariation ?? 20}
                    idToken={idToken}
                    onClassifySuccess={handleClassifySuccess}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── 4. Validation (types + gérants) ── */}
          {step === "validation" && activeImportId && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button
                  variant="ghost" size="sm"
                  className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("filtrage")}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour filtrage
                </Button>
              </div>
              <AgencySwitcher />

              {validationSubStep === "types" && (
                <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ArrowRightLeft className="h-4 w-4 text-sky-400" />
                      Validation particulier / entreprise
                      {hasPendingTypeChanges && (
                        <Badge className="ml-2 border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          Modifications non enregistrées
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TypeValidationStep
                      clients={importedClients.filter((c) => c.conserve)}
                      onValidated={handleTypeValidationDone}
                      onSaved={async () => {
                        if (!activeImportId) return;
                        await loadImportClients(activeImportId);
                        await markTypeChoicesSavedForImport(activeImportId);
                        setHasPendingTypeChanges(false);
                      }}
                      onDirtyChange={setHasPendingTypeChanges}
                    />
                  </CardContent>
                </Card>
              )}

              {validationSubStep === "societes" && (
                <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4 text-sky-400" />
                      Saisie des gérants d&apos;entreprise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SocietesValidationStep
                      societes={societesAValider}
                      onAllValidated={() => {
                        markStepsCompleted(["validation"]);
                        toast.success("Toutes les sociétés sont validées !");
                        setStep("modulation");
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {importsDuMois.length > 1 && validationSubStep === "types" && (
                <Button
                  onClick={() => { void handleValidateTypesForAllImports(); }}
                  disabled={hasPendingTypeChanges}
                  className="w-full bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60"
                >
                  Valider l&apos;étape pour toutes les agences
                </Button>
              )}
            </div>
          )}

          {/* ── 5. Modulation (CDC + lettres + seuils) ── */}
          {step === "modulation" && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button
                  variant="ghost" size="sm"
                  className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("validation")}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour validation
                </Button>
              </div>
              <ConfigurationStep
                moisKey={moisKey}
                config={config}
                onChange={setConfig}
                onValidate={handleValidateModulation}
                onSaveDraft={handleSaveDraft}
                isLoading={isSaving}
                isSavingDraft={isSavingDraft}
              />
            </div>
          )}

          {/* ── 6. Dispatch Trello ── */}
          {step === "dispatch" && activeImportId && activeAgence && existingConfig && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button
                  variant="ghost" size="sm"
                  className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("modulation")}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour modulation
                </Button>
              </div>
              <AgencySwitcher />
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Send className="h-4 w-4 text-sky-400" />
                    Création des cartes Trello — {activeAgence}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DispatchPreview
                    importId={activeImportId}
                    agence={activeAgence}
                    agenceConfig={
                      existingConfig.agences.find((a) => a.code === activeAgence) ??
                      existingConfig.agences[0]
                    }
                    moisKey={moisKey}
                    clients={importedClients}
                    idToken={idToken}
                    onDispatchSuccess={async () => {
                      markStepsCompleted(["dispatch"]);
                      toast.success("Dispatch Trello terminé !");
                      if (activeImportId) {
                        const [imp] = await Promise.all([
                          getPretermeImport(activeImportId).catch(() => null),
                          loadImportClients(activeImportId),
                          getPretermeImportsByMois(moisKey).then(setAllImports).catch(() => {}),
                        ]);
                        if (imp) setActiveImport(imp);
                      }
                      setStep("synthese");
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── 7. Synthèse Slack ── */}
          {step === "synthese" && activeImport && activeAgence && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button
                  variant="ghost" size="sm"
                  className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("dispatch")}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour dispatch
                </Button>
              </div>
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4 text-sky-400" />
                    Synthèse du traitement &amp; envoi Slack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SynthesisReport
                    importData={activeImport}
                    agence={activeAgence}
                    parCharge={importedClients
                      .filter((c) => c.conserve && c.chargeAttribue)
                      .reduce<Record<string, number>>((acc, c) => {
                        acc[c.chargeAttribue!] = (acc[c.chargeAttribue!] ?? 0) + 1;
                        return acc;
                      }, {})}
                    nbSocietesEnAttente={importedClients.filter(
                      (c) => c.conserve &&
                        (c.typeEntite === "societe" || c.typeEntite === "a_valider") &&
                        !c.nomGerant
                    ).length}
                    slackChannelConfigured={true}
                    idToken={idToken}
                  />
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
