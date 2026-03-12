"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import Link from "next/link";
import {
  Calendar, ChevronLeft, ChevronRight, Upload, Filter,
  Building2, CheckCircle2, Clock, History, Car, Send,
  MessageSquare, ArrowRightLeft, SlidersHorizontal, ExternalLink, AlertTriangle,
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
  getAllPretermeImports,
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
import { StepperTimeline } from "@/components/preterme/StepperTimeline";
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
const REQUIRED_AUTO_AGENCES: AgenceCode[] = ["H91358", "H92083"];

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
  const [historiqueImports, setHistoriqueImports] = useState<PretermeImport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [activeImportId, setActiveImportId]   = useState<string | null>(null);
  const [activeAgence, setActiveAgence]       = useState<AgenceCode | null>(null);
  const [importedClients, setImportedClients] = useState<PretermeClient[]>([]);
  const [clientsByImportId, setClientsByImportId] = useState<Record<string, Pick<PretermeClient, "etp" | "tauxVariation">[]>>({});
  const [activeImport, setActiveImport]       = useState<PretermeImport | null>(null);
  const [allImports, setAllImports]           = useState<PretermeImport[]>([]);
  const [completedSteps, setCompletedSteps]   = useState<Partial<Record<Step, boolean>>>({});
  const [savedTypeChoicesByImportId, setSavedTypeChoicesByImportId] = useState<Record<string, boolean>>({});
  // Validation par-agence (dual-colonne)
  const [fullClientsByImportId, setFullClientsByImportId]       = useState<Record<string, PretermeClient[]>>({});
  const [allSocietesByImportId, setAllSocietesByImportId]       = useState<Record<string, PretermeClient[]>>({});
  const [lockedTypesByImportId, setLockedTypesByImportId]       = useState<Record<string, boolean>>({});
  const [lockedSocietesByImportId, setLockedSocietesByImportId] = useState<Record<string, boolean>>({});
  const [pendingTypeChangesByImportId, setPendingTypeChangesByImportId] = useState<Record<string, boolean>>({});

  // Sous-étape interne de l'étape validation : types puis gérants
  const [validationSubStep, setValidationSubStep] = useState<"types" | "societes">("types");

  const [config, setConfig] = useState<
    Omit<PretermeConfig, "id" | "createdAt" | "updatedAt" | "createdBy" | "valide">
  >({
    moisKey,
    branche: "AUTO",
    seuilEtp: 120,
    seuilVariation: 10,
    agences: defaultAgences(),
    slackChannelId: "CE58HNVF0",
  });

  // Token Firebase
  useEffect(() => {
    user?.getIdToken().then(setIdToken).catch(() => {});
  }, [user]);

  // Historique
  useEffect(() => {
    Promise.all([getAllPretermeConfigs("AUTO"), getAllPretermeImports()])
      .then(([configs, imports]) => {
        setHistorique(configs);
        setHistoriqueImports(imports);
      })
      .catch(() => toast.error("Impossible de charger l'historique"))
      .finally(() => setLoadingHistory(false));
  }, []);

  const historiqueCyclesComplets = useMemo(() => {
    const importsByMois = new Map<string, PretermeImport[]>();
    for (const imp of historiqueImports) {
      const list = importsByMois.get(imp.moisKey);
      if (list) {
        list.push(imp);
      } else {
        importsByMois.set(imp.moisKey, [imp]);
      }
    }

    return historique.filter((cfg) => {
      if (cfg.branche !== "AUTO") return false;
      if (!cfg.valide) return false;

      const importsForMois = importsByMois.get(cfg.moisKey) ?? [];
      return REQUIRED_AUTO_AGENCES.every((agenceCode) =>
        importsForMois.some((imp) => imp.agence === agenceCode && imp.statut === "TERMINE")
      );
    });
  }, [historique, historiqueImports]);

  // Config du mois sélectionné
  useEffect(() => {
    setExistingConfig(null);
    getPretermeConfig(moisKey, "AUTO").then((c) => {
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

  // Charger les clients complets pour la validation en double colonne
  useEffect(() => {
    if (step !== "validation") return;
    const imports = allImports.filter((imp) => imp.moisKey === moisKey);
    if (imports.length === 0) return;
    Promise.all(
      imports.map(async (imp) => ({
        importId: imp.id,
        clients: await getPretermeClients(imp.id),
        typesValidated: !!imp.typesValidatedAt || !!savedTypeChoicesByImportId[imp.id],
      }))
    )
      .then((results) => {
        const clientMap: Record<string, PretermeClient[]> = {};
        const initialLocks: Record<string, boolean> = {};
        for (const r of results) {
          clientMap[r.importId] = r.clients;
          if (r.typesValidated) initialLocks[r.importId] = true;
        }
        setFullClientsByImportId(clientMap);
        setLockedTypesByImportId((prev) =>
          Object.keys(prev).length > 0 ? prev : initialLocks
        );
      })
      .catch(() => toast.error("Impossible de charger les clients pour la validation"));
  // savedTypeChoicesByImportId intentionnellement exclu pour ne pas boucler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, allImports, moisKey]);

  // Charger les clients complets pour le dispatch (aperçu routage par agence)
  useEffect(() => {
    if (step !== "dispatch") return;
    const imports = allImports.filter((imp) => imp.moisKey === moisKey);
    if (imports.length === 0) return;
    Promise.all(
      imports.map(async (imp) => ({
        importId: imp.id,
        clients: await getPretermeClients(imp.id).catch(() => [] as PretermeClient[]),
      }))
    ).then((results) => {
      const map: Record<string, PretermeClient[]> = {};
      for (const r of results) map[r.importId] = r.clients;
      setFullClientsByImportId(map);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, moisKey]);

  // Étape 1 : confirmer la période → créer config minimale (valide: false)
  const handleConfirmPeriod = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await upsertPretermeConfig({ ...config, valide: false, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([
        getAllPretermeConfigs("AUTO"),
        getPretermeConfig(moisKey, "AUTO"),
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
      const [updated, fresh] = await Promise.all([getAllPretermeConfigs("AUTO"), getPretermeConfig(moisKey, "AUTO")]);
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
      const [updated, fresh] = await Promise.all([getAllPretermeConfigs("AUTO"), getPretermeConfig(moisKey, "AUTO")]);
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
    const latestImports = await getPretermeImportsByMois(moisKey, "AUTO").catch(() => [] as PretermeImport[]);
    setAllImports(latestImports);
    if (latestImports.length >= 2) markStepsCompleted(["upload"]);
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
    getPretermeImportsByMois(moisKey, "AUTO")
      .then(async (imports) => {
        setAllImports(imports);
        if (imports.length === 0) {
          setActiveImportId(null); setActiveAgence(null); setActiveImport(null);
          setImportedClients([]); setFullClientsByImportId({}); setAllSocietesByImportId({});
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

  // Charger les clients de toutes les agences pour le preview des seuils (étape filtrage)
  useEffect(() => {
    if (step !== "filtrage") return;
    const imports = allImports.filter((imp) => imp.moisKey === moisKey);
    if (imports.length === 0) return;
    Promise.all(
      imports.map(async (imp) => {
        const clients = await getPretermeClients(imp.id);
        return { importId: imp.id, clients: clients.map((c) => ({ etp: c.etp, tauxVariation: c.tauxVariation })) };
      })
    )
      .then((results) => {
        const map: Record<string, Pick<PretermeClient, "etp" | "tauxVariation">[]> = {};
        for (const r of results) map[r.importId] = r.clients;
        setClientsByImportId(map);
      })
      .catch(() => toast.error("Impossible de charger les clients pour le filtrage"));
  }, [step, allImports, moisKey]);

  const handleClassifySuccess = useCallback(async (_result: unknown) => {
    const latestImports = await getPretermeImportsByMois(moisKey, "AUTO").catch(() => [] as PretermeImport[]);
    setAllImports(latestImports);
    const nextActive = latestImports.find((i) => i.id === activeImportId) ?? latestImports[0];
    if (nextActive) {
      setActiveImportId(nextActive.id);
      setActiveAgence(nextActive.agence);
      await loadImportClients(nextActive.id);
    }
    setSavedTypeChoicesByImportId({});
    setLockedTypesByImportId({});
    setLockedSocietesByImportId({});
    setPendingTypeChangesByImportId({});
    setFullClientsByImportId({});
    setAllSocietesByImportId({});
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
    await loadImportClients(importToActivate.id);
  }, [loadImportClients]);

  // ─── Validation types + gérants — double colonne ──────────────────────────

  const proceedAfterAllTypesLocked = useCallback(async () => {
    const freshResults = await Promise.all(
      importsDuMois.map(async (imp) => ({
        importId: imp.id,
        clients: await getPretermeClients(imp.id).catch(() => [] as PretermeClient[]),
      }))
    );
    const freshMap: Record<string, PretermeClient[]> = {};
    let totalEntreprises = 0;
    for (const r of freshResults) {
      freshMap[r.importId] = r.clients;
      totalEntreprises += r.clients.filter(
        (c) => c.conserve && (c.typeEntite === "societe" || c.typeEntite === "a_valider")
      ).length;
    }
    setFullClientsByImportId(freshMap);

    if (totalEntreprises > 0) {
      const societeResults = await Promise.all(
        importsDuMois.map(async (imp) => ({
          importId: imp.id,
          societes: await getSocietesAValider(imp.id).catch(() => [] as PretermeClient[]),
        }))
      );
      const societeMap: Record<string, PretermeClient[]> = {};
      const autoLocked: Record<string, boolean> = {};
      for (const r of societeResults) {
        societeMap[r.importId] = r.societes;
        if (r.societes.length === 0) autoLocked[r.importId] = true;
      }
      setAllSocietesByImportId(societeMap);
      setLockedSocietesByImportId(autoLocked);
      if (importsDuMois.every((imp) => autoLocked[imp.id])) {
        markStepsCompleted(["validation"]);
        setStep("modulation");
      } else {
        setValidationSubStep("societes");
      }
    } else {
      markStepsCompleted(["validation"]);
      setStep("modulation");
    }
  }, [importsDuMois, markStepsCompleted]);

  const handleLockTypesForImport = useCallback(async (importId: string) => {
    await markTypeChoicesSavedForImport(importId);
    const newLocked = { ...lockedTypesByImportId, [importId]: true };
    setLockedTypesByImportId(newLocked);
    const allLocked = importsDuMois.every((imp) => newLocked[imp.id]);
    if (!allLocked) {
      const agence = importsDuMois.find((i) => i.id === importId)?.agence ?? importId;
      toast.success(`Agence ${agence} verrouillée — en attente de l'autre agence.`);
      return;
    }
    await proceedAfterAllTypesLocked();
  }, [importsDuMois, lockedTypesByImportId, markTypeChoicesSavedForImport, proceedAfterAllTypesLocked]);

  const handleLockSocietesForImport = useCallback((importId: string) => {
    const newLocked = { ...lockedSocietesByImportId, [importId]: true };
    setLockedSocietesByImportId(newLocked);
    const allLocked = importsDuMois.every((imp) => newLocked[imp.id]);
    if (!allLocked) {
      const agence = importsDuMois.find((i) => i.id === importId)?.agence ?? importId;
      toast.success(`Gérants validés pour ${agence} — en attente de l'autre agence.`);
      return;
    }
    markStepsCompleted(["validation"]);
    toast.success("Toutes les sociétés sont validées !");
    setStep("modulation");
  }, [importsDuMois, lockedSocietesByImportId, markStepsCompleted]);

  // ─── Dérivés ────────────────────────────────────────────────────────────────

  const hasPendingTypeChanges = Object.values(pendingTypeChangesByImportId).some(Boolean);
  const isPeriodeConfirmed   = existingConfig !== null;
  const isModulationValide   = existingConfig?.valide ?? false;
  const stepIndex            = STEPS.findIndex((s) => s.id === step);

  const canAccessStep = (s: Step): boolean => {
    if (s === "periode") return true;
    if (s === "upload") return isPeriodeConfirmed;
    if (s === "filtrage") return importsDuMois.length >= 2;
    if (s === "validation") return importsDuMois.some((imp) =>
      ["VALIDATION_SOCIETES", "PRET", "DISPATCH_TRELLO", "TERMINE"].includes(imp.statut));
    if (s === "modulation") return areAllImportsTypeChoicesSaved &&
      importsDuMois.some((imp) => ["PRET", "DISPATCH_TRELLO", "TERMINE"].includes(imp.statut));
    if (s === "dispatch") return isModulationValide && !!activeImportId;
    if (s === "synthese") return importsDuMois.some((imp) =>
      ["DISPATCH_TRELLO", "TERMINE"].includes(imp.statut));
    return false;
  };

  // Agences déjà dispatchées (dérivé du statut Firestore)
  const dispatchedByImportId = useMemo<Record<string, boolean>>(() => {
    const d: Record<string, boolean> = {};
    for (const imp of importsDuMois) {
      if (["DISPATCH_TRELLO", "TERMINE"].includes(imp.statut)) d[imp.id] = true;
    }
    return d;
  }, [importsDuMois]);

  const derivedDoneByStatus = useMemo<Partial<Record<Step, boolean>>>(() => {
    const d: Partial<Record<Step, boolean>> = {};
    if (isPeriodeConfirmed) d.periode = true;
    if (importsDuMois.length >= 2) d.upload = true;
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

      {/* ── Timeline stepper ── */}
      <StepperTimeline
        steps={STEPS}
        currentStep={step}
        completedSteps={completedSteps}
        derivedDone={derivedDoneByStatus}
        canAccess={canAccessStep}
        onStepClick={setStep}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                    branche="AUTO"
                    configValide={isPeriodeConfirmed}
                    idToken={idToken}
                    onImportSuccess={handleImportSuccess}
                  />
                </CardContent>
              </Card>
              {importsDuMois.length === 1 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-xl text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-300">1 agence manquante</p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400 mt-0.5">
                      2 fichiers requis — un par agence (H91358 et H92083) — avant de lancer le filtrage.
                    </p>
                  </div>
                </div>
              )}
              <Button
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
                disabled={importsDuMois.length < 2}
                onClick={() => setStep("filtrage")}
              >
                {importsDuMois.length < 2
                  ? `Téléchargement requis (${importsDuMois.length}/2 agences)`
                  : "Valider l'étape — Lancer le filtrage IA"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── 3. Filtrage IA ── */}
          {step === "filtrage" && importsDuMois.length >= 2 && (
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
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4 text-sky-400" />
                    Classification Gemini — {formatMoisLabel(moisKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ThresholdsStep
                    imports={importsDuMois.map((imp) => ({
                      importId: imp.id,
                      agence: imp.agence,
                      clients: clientsByImportId[imp.id] ?? [],
                    }))}
                    seuilEtpInitial={existingConfig?.seuilEtp ?? 120}
                    seuilVariationInitial={existingConfig?.seuilVariation ?? 10}
                    idToken={idToken}
                    onClassifySuccess={handleClassifySuccess}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── 4. Validation (types + gérants) ── */}
          {step === "validation" && importsDuMois.length > 0 && (
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

              {/* ── Sous-étape : types ── */}
              {validationSubStep === "types" && (() => {
                const nbLocked = importsDuMois.filter((i) => lockedTypesByImportId[i.id]).length;
                const allLocked = nbLocked === importsDuMois.length;
                return (
                  <>
                    {/* Barre de progression */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-xs",
                      allLocked
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300"
                        : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400"
                    )}>
                      {allLocked
                        ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        : <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />}
                      <span className="flex-1">
                        {allLocked
                          ? "Les deux agences sont verrouillées — passage aux gérants…"
                          : "Validez et verrouillez chaque agence. Les deux doivent être vertes avant de continuer."}
                      </span>
                      <Badge className={cn(
                        "shrink-0 text-[10px]",
                        allLocked
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700"
                          : "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                      )}>
                        {nbLocked} / {importsDuMois.length} verrouillée{nbLocked > 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {/* Double colonne */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {importsDuMois.map((imp) => {
                        const isLocked = !!lockedTypesByImportId[imp.id];
                        const isPending = !!pendingTypeChangesByImportId[imp.id];
                        const clients = (fullClientsByImportId[imp.id] ?? []).filter((c) => c.conserve);
                        return (
                          <Card key={imp.id} className={cn(
                            "bg-white dark:bg-slate-900 transition-colors",
                            isLocked
                              ? "border-emerald-300 dark:border-emerald-700"
                              : "border-slate-200 dark:border-slate-700"
                          )}>
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <ArrowRightLeft className="h-4 w-4 text-sky-400 shrink-0" />
                                <span>{imp.agence}</span>
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                  {clients.length} client{clients.length > 1 ? "s" : ""}
                                </span>
                                {!isLocked && isPending && (
                                  <Badge className="ml-auto text-[10px] border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                    Non enregistré
                                  </Badge>
                                )}
                                {isLocked && (
                                  <Badge className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Verrouillé
                                  </Badge>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {isLocked ? (
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300">
                                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                                  <span>Types validés — agence verrouillée</span>
                                </div>
                              ) : clients.length === 0 ? (
                                <p className="text-xs text-slate-500 dark:text-slate-600 italic text-center py-6">Chargement…</p>
                              ) : (
                                <TypeValidationStep
                                  clients={clients}
                                  onValidated={() => { void handleLockTypesForImport(imp.id); }}
                                  onSaved={async () => {
                                    const updated = await getPretermeClients(imp.id).catch(() => [] as PretermeClient[]);
                                    setFullClientsByImportId((prev) => ({ ...prev, [imp.id]: updated }));
                                    await markTypeChoicesSavedForImport(imp.id);
                                  }}
                                  onDirtyChange={(dirty) =>
                                    setPendingTypeChangesByImportId((prev) => ({ ...prev, [imp.id]: dirty }))
                                  }
                                />
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Bouton de reprise si les deux sont déjà verrouillées (session précédente) */}
                    {allLocked && (
                      <Button
                        onClick={() => { void proceedAfterAllTypesLocked(); }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Continuer vers les gérants
                      </Button>
                    )}
                  </>
                );
              })()}

              {/* ── Sous-étape : gérants ── */}
              {validationSubStep === "societes" && (() => {
                const nbLocked = importsDuMois.filter((i) => lockedSocietesByImportId[i.id]).length;
                const allLocked = nbLocked === importsDuMois.length;
                return (
                  <>
                    {/* Barre de progression */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-xs",
                      allLocked
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300"
                        : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400"
                    )}>
                      {allLocked
                        ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        : <Building2 className="h-3.5 w-3.5 shrink-0" />}
                      <span className="flex-1">
                        {allLocked
                          ? "Les deux agences sont verrouillées — passage à la modulation…"
                          : "Saisissez le gérant de chaque entreprise, puis verrouillez chaque agence."}
                      </span>
                      <Badge className={cn(
                        "shrink-0 text-[10px]",
                        allLocked
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700"
                          : "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                      )}>
                        {nbLocked} / {importsDuMois.length} verrouillée{nbLocked > 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {/* Double colonne */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {importsDuMois.map((imp) => {
                        const isLocked = !!lockedSocietesByImportId[imp.id];
                        const societes = allSocietesByImportId[imp.id] ?? [];
                        return (
                          <Card key={imp.id} className={cn(
                            "bg-white dark:bg-slate-900 transition-colors",
                            isLocked
                              ? "border-emerald-300 dark:border-emerald-700"
                              : "border-slate-200 dark:border-slate-700"
                          )}>
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-sky-400 shrink-0" />
                                <span>{imp.agence}</span>
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                  {societes.length} société{societes.length > 1 ? "s" : ""}
                                </span>
                                {isLocked && (
                                  <Badge className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Verrouillé
                                  </Badge>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {isLocked ? (
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300">
                                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                                  <span>Gérants validés</span>
                                </div>
                              ) : (
                                <SocietesValidationStep
                                  societes={societes}
                                  onAllValidated={() => handleLockSocietesForImport(imp.id)}
                                />
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
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
          {step === "dispatch" && existingConfig && importsDuMois.length > 0 && (() => {
            const nbDispatched = importsDuMois.filter((i) => dispatchedByImportId[i.id]).length;
            const allDispatched = nbDispatched === importsDuMois.length;
            return (
              <div className="space-y-4">
                <div className="flex justify-start">
                  <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 text-xs"
                    onClick={() => setStep("modulation")}>
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour modulation
                  </Button>
                </div>

                {/* Barre de progression */}
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-xs",
                  allDispatched
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300"
                    : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400"
                )}>
                  {allDispatched
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    : <Send className="h-3.5 w-3.5 shrink-0" />}
                  <span className="flex-1">
                    {allDispatched
                      ? "Les deux agences sont dispatchées — vous pouvez passer à la synthèse."
                      : "Lancez le dispatch Trello pour chaque agence. Les deux doivent être vertes pour continuer."}
                  </span>
                  <Badge className={cn(
                    "shrink-0 text-[10px]",
                    allDispatched
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700"
                      : "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                  )}>
                    {nbDispatched} / {importsDuMois.length} dispatchée{nbDispatched > 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Double colonne */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {importsDuMois.map((imp) => {
                    const isDispatched = !!dispatchedByImportId[imp.id];
                    const agenceCfg = existingConfig.agences.find((a) => a.code === imp.agence)
                      ?? existingConfig.agences[0];
                    const clients = fullClientsByImportId[imp.id] ?? [];
                    return (
                      <div key={imp.id} className={cn(
                        "rounded-xl border overflow-hidden transition-colors",
                        isDispatched
                          ? "border-emerald-300 dark:border-emerald-700"
                          : "border-slate-200 dark:border-slate-700"
                      )}>
                        {/* Header agence */}
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-3 border-b",
                          isDispatched
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                            : "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"
                        )}>
                          <Send className="h-4 w-4 text-sky-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{imp.agence}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {imp.pretermesConserves} conservés
                          </span>
                          {isDispatched && (
                            <Badge className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Dispatché
                            </Badge>
                          )}
                        </div>

                        {/* Contenu DispatchPreview */}
                        <div className="bg-white dark:bg-slate-900 p-4">
                          <DispatchPreview
                            importId={imp.id}
                            agence={imp.agence}
                            agenceConfig={agenceCfg}
                            moisKey={moisKey}
                            clients={clients}
                            idToken={idToken}
                            onDispatchSuccess={async () => {
                              markStepsCompleted(["dispatch"]);
                              const [updatedImp, latestImports] = await Promise.all([
                                getPretermeImport(imp.id).catch(() => null),
                                getPretermeImportsByMois(moisKey, "AUTO").catch(() => [] as PretermeImport[]),
                              ]);
                              if (latestImports.length) setAllImports(latestImports);
                              if (updatedImp) {
                                setActiveImport(updatedImp);
                                setActiveImportId(updatedImp.id);
                                setActiveAgence(updatedImp.agence);
                              }
                              const updated = await getPretermeClients(imp.id).catch(() => [] as PretermeClient[]);
                              setFullClientsByImportId((prev) => ({ ...prev, [imp.id]: updated }));
                              if (latestImports.every((i) => ["DISPATCH_TRELLO", "TERMINE"].includes(i.statut))) {
                                toast.success("Dispatch terminé pour toutes les agences !");
                                setStep("synthese");
                              } else {
                                toast.success(`Dispatch terminé pour ${imp.agence}.`);
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bouton de reprise si les deux sont déjà dispatchées */}
                {allDispatched && (
                  <Button onClick={() => setStep("synthese")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Continuer vers la synthèse
                  </Button>
                )}
              </div>
            );
          })()}

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
                    idToken={idToken}
                  />
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {/* ── Historique ── */}
        <div className="lg:col-span-1">
          <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Cycles précédents
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              {loadingHistory ? (
                <p className="text-xs text-slate-500 dark:text-slate-600">Chargement...</p>
              ) : historiqueCyclesComplets.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-600">Aucun cycle enregistré</p>
              ) : (
                historiqueCyclesComplets.slice(0, 6).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <button
                      onClick={() => { setMoisKey(h.moisKey); setStep("periode"); }}
                      className="text-slate-700 dark:text-slate-300 text-left flex-1 truncate capitalize"
                    >
                      {formatMoisLabel(h.moisKey)}
                    </button>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
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
      </div>
    </div>
  );
}
