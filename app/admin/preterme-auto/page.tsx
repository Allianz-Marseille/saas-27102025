"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  Calendar, ChevronLeft, ChevronRight, Settings2, Upload, Filter,
  Building2, CheckCircle2, Clock, History, Car, Send, MessageSquare, BarChart3,
  ArrowRightLeft, Disc
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/use-auth";
import {
  upsertPretermeConfig,
  getPretermeConfig,
  getAllPretermeConfigs,
  getPretermeClients,
  getSocietesAValider,
  getPretermeImport,
  getAllPretermeImports,
  updatePretermeConfigWorkflow,
} from "@/lib/firebase/preterme";
import { ConfigurationStep } from "@/components/preterme/ConfigurationStep";
import { UploadStep } from "@/components/preterme/UploadStep";
import { ThresholdsStep } from "@/components/preterme/ThresholdsStep";
import { SocietesValidationStep } from "@/components/preterme/SocietesValidationStep";
import { TypeValidationStep } from "@/components/preterme/TypeValidationStep";
import { DispatchPreview } from "@/components/preterme/DispatchPreview";
import { SynthesisReport } from "@/components/preterme/SynthesisReport";
import { KpiDashboard } from "@/components/preterme/KpiDashboard";
import type {
  PretermeConfig, AgenceConfig, AgenceCode, PretermeClient, PretermeImport, PretermeWorkflowStep,
} from "@/types/preterme";
import { getPretermeImportsByMois } from "@/lib/firebase/preterme";

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

function getImportStatusBadge(statut?: string): { label: string; className: string } {
  switch (statut) {
    case "TERMINE":
      return { label: "Termine", className: "bg-emerald-900/60 text-emerald-300 border-emerald-700" };
    case "PRET":
      return { label: "Pret", className: "bg-sky-900/60 text-sky-300 border-sky-700" };
    case "VALIDATION_SOCIETES":
      return { label: "Validation", className: "bg-amber-900/60 text-amber-300 border-amber-700" };
    case "DISPATCH_TRELLO":
      return { label: "Dispatch", className: "bg-violet-900/60 text-violet-300 border-violet-700" };
    default:
      return { label: "Brouillon", className: "bg-slate-800 text-slate-300 border-slate-700" };
  }
}

function defaultAgences(): AgenceConfig[] {
  return [
    {
      code: "H91358",
      charges: [
        {
          id: uuidv4(), prenom: "Corentin", lettresDebut: "A", lettresFin: "C",
          trello: {
            trelloBoardId:  "67b5f1b34a0b1f85c58dffc1",
            trelloListId:   "67b5f1c697b2440733fec2e6",
            trelloListName: "PRETERME-AUTO",
            trelloBoardUrl: "https://trello.com/b/nfhDBmQg/corentin",
            trelloListUrl:  "https://trello.com/b/nfhDBmQg/corentin",
            trelloMemberId: "67b31e5a33967f2b0c4783e3",
          },
        },
        {
          id: uuidv4(), prenom: "Emma", lettresDebut: "D", lettresFin: "F",
          trello: {
            trelloBoardId:  "66d00de829da279e8e667d12",
            trelloListId:   "687a58ffda5f06e009db8ad5",
            trelloListName: "PRETERME AUTO",
            trelloBoardUrl: "https://trello.com/b/DkhXnVU8/emma",
            trelloListUrl:  "https://trello.com/b/DkhXnVU8/emma",
            trelloMemberId: "66d026f95aa7e0dc4201a208",
          },
        },
        {
          id: uuidv4(), prenom: "Matthieu", lettresDebut: "G", lettresFin: "M",
          trello: {
            trelloBoardId:  "6980592314de167992c14682",
            trelloListId:   "6980593299ba9e50b7bccfa3",
            trelloListName: "PRETERME AUTO",
            trelloBoardUrl: "https://trello.com/b/EkK9044F/matthieu",
            trelloListUrl:  "https://trello.com/b/EkK9044F/matthieu",
            trelloMemberId: "69805e6a33a948ae79241cbc",
          },
        },
        {
          id: uuidv4(), prenom: "Donia", lettresDebut: "N", lettresFin: "Z",
          trello: {
            trelloBoardId:  "684830496441fb45a81ad2ec",
            trelloListId:   "6848305df08bc5e50d5cabd4",
            trelloListName: "PRETERME AUTO",
            trelloBoardUrl: "https://trello.com/b/yYu4W7FJ/donia",
            trelloListUrl:  "https://trello.com/b/yYu4W7FJ/donia",
            trelloMemberId: "6848029e7f42281696feb267",
          },
        },
      ],
    },
    {
      code: "H92083",
      charges: [
        {
          id: uuidv4(), prenom: "Joelle", lettresDebut: "A", lettresFin: "H",
          trello: {
            trelloBoardId:  "66f0f7e293c93ba79d00ac8b",
            trelloListId:   "66f0f7f5b5637967d3526f61",
            trelloListName: "PRETERME AUTO",
            trelloBoardUrl: "https://trello.com/b/3oWnNHUr/joelle",
            trelloListUrl:  "https://trello.com/b/3oWnNHUr/joelle",
            trelloMemberId: "66f0fabeee51053c1bdd6a1b",
          },
        },
        {
          id: uuidv4(), prenom: "Christelle", lettresDebut: "I", lettresFin: "Z",
          trello: {
            trelloBoardId:  "696e08ca8f5fc83c1a5595af",
            trelloListId:   "696e08d97fb0c0bd53e4398a",
            trelloListName: "PRETERME AUTO",
            trelloBoardUrl: "https://trello.com/b/IexKz87i/christelle",
            trelloListUrl:  "https://trello.com/b/IexKz87i/christelle",
            trelloMemberId: "696e01346b6d56cc7332c3af",
          },
        },
      ],
    },
  ];
}

// ─── Steps ──────────────────────────────────────────────────────────────────

type Step = PretermeWorkflowStep;

const STEPS: { id: Step; label: string; icon: React.ElementType; phase: number }[] = [
  { id: "periode",       label: "Période",            icon: Calendar,      phase: 1 },
  { id: "configuration", label: "Configuration",      icon: Settings2,     phase: 1 },
  { id: "upload",        label: "Upload fichiers",    icon: Upload,        phase: 2 },
  { id: "filtrage",          label: "Filtrage & IA",      icon: Filter,            phase: 3 },
  { id: "validation-types", label: "Valid. types",        icon: ArrowRightLeft,    phase: 3 },
  { id: "societes",          label: "Gérants sociétés",   icon: Building2,         phase: 3 },
  { id: "dispatch",      label: "Dispatch Trello",    icon: Send,          phase: 4 },
  { id: "synthese",      label: "Synthèse Slack",     icon: MessageSquare, phase: 5 },
  { id: "kpi",           label: "KPI historiques",    icon: BarChart3,     phase: 5 },
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
  const [isSaving, setIsSaving]           = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [idToken, setIdToken]   = useState<string>("");

  const [existingConfig, setExistingConfig]   = useState<PretermeConfig | null>(null);
  const [historique, setHistorique]           = useState<PretermeConfig[]>([]);
  const [loadingHistory, setLoadingHistory]   = useState(true);

  // Import actif (après upload)
  const [activeImportId, setActiveImportId]   = useState<string | null>(null);
  const [activeAgence, setActiveAgence]       = useState<AgenceCode | null>(null);
  const [importedClients, setImportedClients] = useState<PretermeClient[]>([]);
  const [societesAValider, setSocietesAValider] = useState<PretermeClient[]>([]);
  const [activeImport, setActiveImport]       = useState<PretermeImport | null>(null);
  const [allImports, setAllImports]           = useState<PretermeImport[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Partial<Record<Step, boolean>>>({});
  const [hasPendingTypeChanges, setHasPendingTypeChanges] = useState(false);
  const [savedTypeChoicesByImportId, setSavedTypeChoicesByImportId] = useState<Record<string, boolean>>({});

  const [config, setConfig] = useState<
    Omit<PretermeConfig, "id" | "createdAt" | "updatedAt" | "createdBy" | "valide">
  >({
    moisKey,
    branche: "AUTO",
    seuilEtp: 120,
    seuilVariation: 20,
    agences: defaultAgences(),
    slackChannelId: "",
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
          ...(c.valide ? { periode: true, configuration: true } : {}),
        });
        setConfig({
          moisKey: c.moisKey, branche: c.branche,
          seuilEtp: c.seuilEtp, seuilVariation: c.seuilVariation,
          agences: c.agences, slackChannelId: c.slackChannelId,
        });
        setStep(restoredStep);
      } else {
        setCompletedSteps({});
        setSavedTypeChoicesByImportId({});
        setStep("periode");
        // Hériter les agences (CDC + mapping Trello) du mois le plus récent
        // pour ne pas ressaisir les liens Trello à chaque nouveau mois.
        const latestAgences = historique[0]?.agences ?? defaultAgences();
        setConfig((prev) => ({ ...prev, moisKey, agences: latestAgences }));
      }
    });
  }, [moisKey, historique]);

  const persistWorkflow = useCallback(
    async (
      nextLastStep?: Step,
      nextCompletedSteps?: Partial<Record<Step, boolean>>
    ) => {
      if (!existingConfig?.id) return;
      try {
        const sanitizedCompletedSteps = sanitizeCompletedSteps(
          nextCompletedSteps as Partial<Record<string, boolean>> | undefined
        );
        await updatePretermeConfigWorkflow(existingConfig.id, {
          lastStep: nextLastStep && STEP_IDS.has(nextLastStep) ? nextLastStep : undefined,
          completedSteps: sanitizedCompletedSteps,
        });
      } catch {
        toast.warning("Progression enregistrée localement, synchronisation distante en attente.");
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

  // Charger les clients d'un import
  const loadImportClients = useCallback(async (importId: string) => {
    try {
      const clients = await getPretermeClients(importId);
      setImportedClients(clients);
    } catch {
      toast.error("Impossible de charger les clients de l'import");
    }
  }, []);

  // Charger les sociétés à valider
  const loadSocietes = useCallback(async (importId: string) => {
    try {
      const s = await getSocietesAValider(importId);
      setSocietesAValider(s);
    } catch {
      toast.error("Impossible de charger les sociétés");
    }
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!user) return;
    setIsSavingDraft(true);
    try {
      await upsertPretermeConfig({ ...config, valide: false, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([
        getAllPretermeConfigs(),
        getPretermeConfig(moisKey),
      ]);
      setHistorique(updated);
      if (fresh) setExistingConfig(fresh);
      toast.success("Brouillon sauvegardé — vous pouvez reprendre plus tard");
    } catch {
      toast.error("Erreur lors de la sauvegarde du brouillon");
    } finally {
      setIsSavingDraft(false);
    }
  }, [config, user, moisKey]);

  const handleValidateConfig = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await upsertPretermeConfig({ ...config, valide: true, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([
        getAllPretermeConfigs(),
        getPretermeConfig(moisKey),
      ]);
      setHistorique(updated);
      if (fresh) setExistingConfig(fresh);
      markStepsCompleted(["periode", "configuration"]);
      toast.success(`Configuration ${formatMoisLabel(moisKey)} validée !`);
      setStep("upload");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  }, [config, user, moisKey, markStepsCompleted]);

  const handleImportSuccess = useCallback(async (importId: string, agence: AgenceCode) => {
    setActiveImportId(importId);
    setActiveAgence(agence);
    await loadImportClients(importId);
    // Charger tous les imports du mois pour les KPI
    getPretermeImportsByMois(moisKey).then(setAllImports).catch(() => {});
    markStepsCompleted(["upload"]);
  }, [loadImportClients, moisKey]);

  // Charger activeImport depuis Firestore quand activeImportId change
  useEffect(() => {
    if (!activeImportId) return;
    getPretermeImport(activeImportId).then((imp) => {
      if (imp) setActiveImport(imp);
    }).catch(() => {});
  }, [activeImportId]);

  // Charger les imports du mois courant et conserver une sélection stable
  useEffect(() => {
    getPretermeImportsByMois(moisKey)
      .then(async (imports) => {
        setAllImports(imports);

        if (imports.length === 0) {
          setActiveImportId(null);
          setActiveAgence(null);
          setActiveImport(null);
          setImportedClients([]);
          setSocietesAValider([]);
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
      .catch(() => {
        toast.error("Impossible de charger les imports du mois");
      });
  }, [moisKey, activeImportId, loadImportClients]);

  // Charger TOUS les imports historiques quand on arrive sur l'onglet KPI
  useEffect(() => {
    if (step !== "kpi") return;
    getAllPretermeImports()
      .then(setAllImports)
      .catch(() => toast.error("Impossible de charger les KPI historiques"));
  }, [step]);

  const handleClassifySuccess = useCallback(async (_result: unknown) => {
    if (!activeImportId) return;
    // Recharger les clients avec typeEntite frais depuis Gemini
    await Promise.all([
      loadImportClients(activeImportId),
      getPretermeImportsByMois(moisKey).then(setAllImports),
    ]);
    setSavedTypeChoicesByImportId({});
    setHasPendingTypeChanges(false);
    markStepsCompleted(["filtrage"]);
    setStep("validation-types");
  }, [activeImportId, loadImportClients, markStepsCompleted, moisKey]);

  const handleTypeValidationDone = useCallback(async (nbEntreprises: number) => {
    if (!activeImportId) return;
    setSavedTypeChoicesByImportId((prev) => ({ ...prev, [activeImportId]: true }));
    markStepsCompleted(["validation-types"]);
    if (nbEntreprises > 0) {
      await loadSocietes(activeImportId);
      setStep("societes");
    } else {
      markStepsCompleted(["societes"]);
      setStep("dispatch");
    }
  }, [activeImportId, loadSocietes, markStepsCompleted]);

  useEffect(() => {
    void persistWorkflow(step, completedSteps);
  }, [step, completedSteps, persistWorkflow]);

  const importsDuMois = useMemo(
    () => allImports.filter((imp) => imp.moisKey === moisKey),
    [allImports, moisKey]
  );

  const isTypeChoicesSavedForImport = useCallback(
    (imp: PretermeImport): boolean =>
      savedTypeChoicesByImportId[imp.id] === true ||
      imp.statut === "PRET" ||
      imp.statut === "DISPATCH_TRELLO" ||
      imp.statut === "TERMINE",
    [savedTypeChoicesByImportId]
  );

  const areAllImportsTypeChoicesSaved = useMemo(
    () => importsDuMois.length > 0 && importsDuMois.every((imp) => isTypeChoicesSavedForImport(imp)),
    [importsDuMois, isTypeChoicesSavedForImport]
  );

  const handleValidateTypesForAllImports = useCallback(async () => {
    if (!activeImportId) return;
    if (hasPendingTypeChanges) {
      toast.warning("Enregistre d'abord les modifications en cours sur cette agence.");
      return;
    }
    if (!areAllImportsTypeChoicesSaved) {
      toast.warning("Il faut d'abord enregistrer les choix de type sur toutes les agences.");
      return;
    }

    const nbEntreprises = importedClients.filter(
      (c) => c.conserve && (c.typeEntite === "societe" || c.typeEntite === "a_valider")
    ).length;

    await handleTypeValidationDone(nbEntreprises);
    toast.success("Choix de type validés pour toutes les agences du mois.");
  }, [
    activeImportId,
    areAllImportsTypeChoicesSaved,
    handleTypeValidationDone,
    hasPendingTypeChanges,
    importedClients,
  ]);
  const isConfigValide = existingConfig?.valide ?? false;

  const derivedDoneByStatus = useMemo<Partial<Record<Step, boolean>>>(() => {
    const derived: Partial<Record<Step, boolean>> = {};
    if (isConfigValide) {
      derived.periode = true;
      derived.configuration = true;
    }
    if (importsDuMois.length > 0) {
      derived.upload = true;
    }
    const hasFiltered = importsDuMois.some((imp) =>
      imp.statut === "VALIDATION_SOCIETES" ||
      imp.statut === "PRET" ||
      imp.statut === "DISPATCH_TRELLO" ||
      imp.statut === "TERMINE"
    );
    if (hasFiltered) {
      derived.filtrage = true;
      derived["validation-types"] = true;
    }
    const hasSocietesHandled = importsDuMois.some((imp) =>
      imp.statut === "PRET" || imp.statut === "DISPATCH_TRELLO" || imp.statut === "TERMINE"
    );
    if (hasSocietesHandled) {
      derived.societes = true;
    }
    const hasDispatch = importsDuMois.some((imp) =>
      imp.statut === "DISPATCH_TRELLO" || imp.statut === "TERMINE"
    );
    if (hasDispatch) {
      derived.dispatch = true;
    }
    const hasSynthesis = importsDuMois.some((imp) => imp.statut === "TERMINE");
    if (hasSynthesis) {
      derived.synthese = true;
    }
    if (allImports.length > 0) {
      derived.kpi = true;
    }
    return derived;
  }, [allImports.length, importsDuMois, isConfigValide]);

  const handleSwitchImport = useCallback(async (importToActivate: PretermeImport) => {
    setActiveImportId(importToActivate.id);
    setActiveAgence(importToActivate.agence);
    setActiveImport(importToActivate);
    setHasPendingTypeChanges(false);
    await loadImportClients(importToActivate.id);
    if (step === "societes") {
      await loadSocietes(importToActivate.id);
    }
  }, [loadImportClients, loadSocietes, step]);
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const canAccessStep = (s: Step): boolean => {
    if (s === "periode" || s === "configuration") return true;
    if (s === "upload") return isConfigValide;
    if (s === "filtrage" || s === "validation-types" || s === "societes" || s === "dispatch") return !!activeImportId;
    if (s === "synthese") return !!activeImportId;
    if (s === "kpi") return allImports.length > 0 || !!activeImportId;
    return false;
  };

  // Breadcrumb
  const Breadcrumb = ({ current }: { current: string }) => (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <button onClick={() => setStep("periode")} className="hover:text-slate-200">Période</button>
      {["configuration", "upload", "filtrage", "validation-types", "societes"].includes(step) && (
        <><span>/</span><button onClick={() => setStep("configuration")} className="hover:text-slate-200">Config</button></>
      )}
      {["upload", "filtrage", "validation-types", "societes"].includes(step) && (
        <><span>/</span><button onClick={() => setStep("upload")} className="hover:text-slate-200">Upload</button></>
      )}
      {["filtrage", "validation-types", "societes"].includes(step) && (
        <><span>/</span><button onClick={() => setStep("filtrage")} className="hover:text-slate-200">Filtrage</button></>
      )}
      {step === "societes" && (
        <><span>/</span><button onClick={() => setStep("validation-types")} className="hover:text-slate-200">Valid. types</button></>
      )}
      <><span>/</span><span className="text-white font-medium">{current}</span></>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-950/60 rounded-lg">
          <Car className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Prétermes Auto</h1>
          <p className="text-sm text-slate-400">Gestion automatisée — périmètre Auto uniquement</p>
        </div>
        <Badge className="ml-auto bg-sky-900/50 text-sky-300 border-sky-700 capitalize">
          {formatMoisLabel(moisKey)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4 space-y-1">
              {STEPS.map((s, i) => {
                const isActive = step === s.id;
                const isDone =
                  completedSteps[s.id] ||
                  derivedDoneByStatus[s.id] ||
                  (s.id === "periode" && stepIndex > 0) ||
                  false;
                const accessible = canAccessStep(s.id);

                return (
                  <button
                    key={s.id}
                    onClick={() => accessible && setStep(s.id)}
                    disabled={!accessible}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                      isActive
                        ? "bg-sky-950/60 text-sky-300 font-medium"
                        : accessible
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        : "text-slate-600 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      isDone ? "bg-emerald-800 text-emerald-300"
                        : isActive ? "bg-sky-700 text-sky-200"
                        : accessible ? "bg-slate-700 text-slate-400"
                        : "bg-slate-800 text-slate-600"
                    )}>
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span>{s.label}</span>
                    {completedSteps[s.id] && (
                      <Disc className="h-2.5 w-2.5 ml-auto text-cyan-400" />
                    )}
                    {!accessible && <Clock className="h-3 w-3 ml-auto text-slate-600" />}
                  </button>
                );
              })}

            </CardContent>
          </Card>

          {/* Historique */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-slate-400 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Configs précédentes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              {loadingHistory ? (
                <p className="text-xs text-slate-600">Chargement...</p>
              ) : historique.length === 0 ? (
                <p className="text-xs text-slate-600">Aucune config enregistrée</p>
              ) : (
                historique.slice(0, 6).map((h) => (
                  <button
                    key={h.id}
                    onClick={() => { setMoisKey(h.moisKey); setStep("configuration"); }}
                    className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="text-slate-300">{formatMoisLabel(h.moisKey)}</span>
                    {h.valide
                      ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      : <Clock className="h-3 w-3 text-amber-500" />
                    }
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Contenu principal ── */}
        <div className="lg:col-span-3">
          {/* Switch agence/import actif (pour garder Kennedy + Rouvière accessibles) */}
          {["filtrage", "validation-types", "societes", "dispatch", "synthese"].includes(step) &&
            importsDuMois.length > 1 && (
            <Card className="bg-slate-900 border-slate-700 mb-4">
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
                            : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        )}
                        onClick={() => { void handleSwitchImport(imp); }}
                      >
                        {imp.agence} - {imp.pretermesGlobaux} clients
                        <Badge className={cn("ml-2 text-[10px] border", getImportStatusBadge(imp.statut).className)}>
                          {getImportStatusBadge(imp.statut).label}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Période ── */}
          {step === "periode" && (
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  Sélection de la période
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800 hover:bg-slate-700"
                    onClick={() => setMoisKey((m) => navigateMois(m, -1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center min-w-48">
                    <p className="text-2xl font-bold text-white capitalize">{formatMoisLabel(moisKey)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Mois traité par ce préterme</p>
                  </div>
                  <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800 hover:bg-slate-700"
                    onClick={() => setMoisKey((m) => navigateMois(m, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 bg-sky-950/30 border border-sky-800/40 rounded-xl text-sm text-sky-300/80">
                  <p className="font-medium text-sky-300 mb-1">Règle calendaire</p>
                  <p>Traitement toujours sur le <strong>mois suivant</strong>. Pré-sélectionné :{" "}
                    <strong className="text-sky-200">{formatMoisLabel(getMoisCible())}</strong>.</p>
                </div>
                {existingConfig ? (
                  <div className={cn("p-4 rounded-xl border text-sm flex items-start gap-3",
                    existingConfig.valide
                      ? "bg-emerald-950/30 border-emerald-700/50 text-emerald-300"
                      : "bg-amber-950/30 border-amber-700/50 text-amber-300")}>
                    {existingConfig.valide
                      ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      : <Clock className="h-4 w-4 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-medium">
                        {existingConfig.valide ? "Configuration validée" : "Configuration en cours"}
                      </p>
                      <p className="text-xs opacity-80 mt-0.5">
                        {existingConfig.agences.reduce((acc, a) => acc + a.charges.length, 0)} CDC —
                        ETP ≥ {existingConfig.seuilEtp} | Variation ≥ {existingConfig.seuilVariation}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30 text-sm text-slate-400 flex items-center gap-3">
                    <Settings2 className="h-4 w-4 shrink-0" />
                    Aucune configuration pour ce mois — à créer à l&apos;étape suivante.
                  </div>
                )}
                <Button className="w-full bg-sky-600 hover:bg-sky-500" onClick={() => setStep("configuration")}>
                  Continuer vers la configuration <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Configuration ── */}
          {step === "configuration" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="Configuration" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("periode")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Changer de mois
                </Button>
              </div>
              <ConfigurationStep moisKey={moisKey} config={config} onChange={setConfig}
                onValidate={handleValidateConfig} onSaveDraft={handleSaveDraft}
                isLoading={isSaving} isSavingDraft={isSavingDraft} />
              {isConfigValide && (
                <Button className="w-full bg-sky-600 hover:bg-sky-500" onClick={() => setStep("upload")}>
                  Continuer vers l&apos;upload <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* ── Upload ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="Upload fichiers" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("configuration")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour config
                </Button>
              </div>
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4 text-sky-400" />
                    Import des exports Allianz — {formatMoisLabel(moisKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadStep moisKey={moisKey} configValide={isConfigValide}
                    idToken={idToken} onImportSuccess={handleImportSuccess} />
                </CardContent>
              </Card>
              {activeImportId && (
                <Button className="w-full bg-sky-600 hover:bg-sky-500" onClick={() => setStep("filtrage")}>
                  Continuer vers filtrage &amp; IA <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* ── Filtrage & Gemini ── */}
          {step === "filtrage" && activeImportId && activeAgence && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="Filtrage & IA" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("upload")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour upload
                </Button>
              </div>
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4 text-sky-400" />
                    Filtrage métier + Classification Gemini
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

          {/* ── Validation types (particulier / entreprise) ── */}
          {step === "validation-types" && activeImportId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="Validation des types" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("filtrage")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour filtrage
                </Button>
              </div>
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowRightLeft className="h-4 w-4 text-sky-400" />
                    Vérification de la classification IA
                    {hasPendingTypeChanges && (
                      <Badge className="ml-2 border-amber-700 bg-amber-900/50 text-amber-300">
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
                      setSavedTypeChoicesByImportId((prev) => ({ ...prev, [activeImportId]: true }));
                      setHasPendingTypeChanges(false);
                    }}
                    onDirtyChange={setHasPendingTypeChanges}
                  />
                </CardContent>
              </Card>
              {importsDuMois.length > 1 && (
                <Button
                  onClick={() => { void handleValidateTypesForAllImports(); }}
                  disabled={!areAllImportsTypeChoicesSaved || hasPendingTypeChanges}
                  className="w-full bg-violet-700 hover:bg-violet-600"
                >
                  Passer à l&apos;étape suivante pour toutes les agences
                </Button>
              )}
            </div>
          )}

          {/* ── Validation sociétés ── */}
          {step === "societes" && activeImportId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="Gérants sociétés" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("validation-types")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour validation types
                </Button>
              </div>
              <Card className="bg-slate-900 border-slate-700">
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
                      markStepsCompleted(["societes"]);
                      toast.success("Toutes les sociétés sont validées !");
                      setStep("dispatch");
                    }}
                  />
                </CardContent>
              </Card>
              <Button className="w-full bg-sky-600 hover:bg-sky-500" onClick={() => setStep("dispatch")}>
                Continuer vers le dispatch Trello
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── Dispatch Trello ── */}
          {step === "dispatch" && activeImportId && activeAgence && existingConfig && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="Dispatch Trello" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("societes")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour sociétés
                </Button>
              </div>
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Send className="h-4 w-4 text-sky-400" />
                    Création des cartes Trello
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
                      markStepsCompleted(["dispatch", "synthese"]);
                      toast.success("Dispatch terminé ! Consultation de la synthèse.");
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

          {/* ── Synthèse Slack ── */}
          {step === "synthese" && activeImport && activeAgence && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="Synthèse Slack" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("dispatch")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour dispatch
                </Button>
              </div>
              <Card className="bg-slate-900 border-slate-700">
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
                    slackChannelConfigured={!!existingConfig?.slackChannelId}
                    idToken={idToken}
                  />
                </CardContent>
              </Card>
              <Button className="w-full bg-slate-700 hover:bg-slate-600" onClick={() => setStep("kpi")}>
                Voir les KPI historiques <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── KPI historiques ── */}
          {step === "kpi" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="KPI historiques" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("synthese")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour synthèse
                </Button>
              </div>
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-sky-400" />
                    Tableau de bord KPI — Historique prétermes Auto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <KpiDashboard
                    imports={allImports}
                    currentMoisKey={activeImport?.moisKey ?? moisKey}
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
