"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import Link from "next/link";
import {
  Calendar, ChevronLeft, ChevronRight, Upload, Filter,
  Building2, CheckCircle2, Clock, History, Shield, Send,
  MessageSquare, ArrowRightLeft, SlidersHorizontal, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/use-auth";
import {
  upsertPretermeIrdConfig,
  getPretermeIrdConfig,
  getAllPretermeIrdConfigs,
  updatePretermeIrdConfigWorkflow,
  getPretermeIrdImportsByMois,
  updatePretermeIrdImport,
  getPretermeIrdClients,
  getIrdSocietesAValider,
} from "@/lib/firebase/preterme-ird";
import { ConfigurationStep } from "@/components/preterme-ird/ConfigurationStep";
import { UploadStep } from "@/components/preterme-ird/UploadStep";
import { ThresholdsStep } from "@/components/preterme-ird/ThresholdsStep";
import { TypeValidationStep } from "@/components/preterme-ird/TypeValidationStep";
import { SocietesValidationStep } from "@/components/preterme-ird/SocietesValidationStep";
import { DispatchPreview } from "@/components/preterme-ird/DispatchPreview";
import { SynthesisReport } from "@/components/preterme-ird/SynthesisReport";
import { StepperTimeline } from "@/components/preterme/StepperTimeline";
import type {
  PretermeConfig, AgenceConfig, AgenceCode, PretermeImport, PretermeWorkflowStep, PretermeClient,
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

/** Répartition initiale IRD — mêmes CDC/lettres qu'Auto, Trello à configurer pour les colonnes IARD */
function defaultAgences(): AgenceConfig[] {
  return [
    {
      code: "H91358",
      charges: [
        {
          id: uuidv4(),
          prenom: "Corentin",
          lettresDebut: "A",
          lettresFin: "C",
          trello: {
            trelloBoardId: "67b5f1b34a0b1f85c58dffc1",
            trelloListId: "67b5f1c08a0afcaac6d6866f",
            trelloListName: "PRETERME-IARD",
            trelloBoardUrl: "https://trello.com/b/nfhDBmQg/corentin",
            trelloListUrl: "https://trello.com/b/nfhDBmQg/corentin",
            trelloMemberId: "67b31e5a33967f2b0c4783e3",
          },
        },
        {
          id: uuidv4(),
          prenom: "Emma",
          lettresDebut: "D",
          lettresFin: "F",
          trello: {
            trelloBoardId: "66d00de829da279e8e667d12",
            trelloListId: "687a5986f71178246c263732",
            trelloListName: "PRETERME IRD",
            trelloBoardUrl: "https://trello.com/b/DkhXnVU8/emma",
            trelloListUrl: "https://trello.com/b/DkhXnVU8/emma",
            trelloMemberId: "66d026f95aa7e0dc4201a208",
          },
        },
        {
          id: uuidv4(),
          prenom: "Matthieu",
          lettresDebut: "G",
          lettresFin: "M",
          trello: {
            trelloBoardId: "6980592314de167992c14682",
            trelloListId: "69805938220890ca7493b889",
            trelloListName: "PRETERME IRD",
            trelloBoardUrl: "https://trello.com/b/EkK9044F/matthieu",
            trelloListUrl: "https://trello.com/b/EkK9044F/matthieu",
            trelloMemberId: "69805e6a33a948ae79241cbc",
          },
        },
        {
          id: uuidv4(),
          prenom: "Donia",
          lettresDebut: "N",
          lettresFin: "Z",
          trello: {
            trelloBoardId: "684830496441fb45a81ad2ec",
            trelloListId: "6848306555a6640697bea7ef",
            trelloListName: "PRETERME IRD",
            trelloBoardUrl: "https://trello.com/b/yYu4W7FJ/donia",
            trelloListUrl: "https://trello.com/b/yYu4W7FJ/donia",
            trelloMemberId: "6848029e7f42281696feb267",
          },
        },
      ],
    },
    {
      code: "H92083",
      charges: [
        {
          id: uuidv4(),
          prenom: "Joelle",
          lettresDebut: "A",
          lettresFin: "H",
          trello: {
            trelloBoardId: "66f0f7e293c93ba79d00ac8b",
            trelloListId: "66fef7fc15019fe88a3486a5",
            trelloListName: "PRETERME IARD",
            trelloBoardUrl: "https://trello.com/b/3oWnNHUr/joelle",
            trelloListUrl: "https://trello.com/b/3oWnNHUr/joelle",
            trelloMemberId: "66f0fabeee51053c1bdd6a1b",
          },
        },
        {
          id: uuidv4(),
          prenom: "Christelle",
          lettresDebut: "I",
          lettresFin: "Z",
          trello: {
            trelloBoardId: "696e08ca8f5fc83c1a5595af",
            trelloListId: "690ed8e102652236d610710",
            trelloListName: "PRETERME IRD",
            trelloBoardUrl: "https://trello.com/b/IexKz87i/christelle",
            trelloListUrl: "https://trello.com/b/IexKz87i/christelle",
            trelloMemberId: "696e01346b6d56cc7332c3af",
          },
        },
      ],
    },
  ];
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function mergeTrelloMapping(
  current: AgenceConfig["charges"][number]["trello"],
  fallback: AgenceConfig["charges"][number]["trello"] | undefined
) {
  if (!fallback) return current;
  if (!current) return fallback;
  return {
    ...fallback,
    ...current,
    trelloBoardId: current.trelloBoardId || fallback.trelloBoardId,
    trelloListId: current.trelloListId || fallback.trelloListId,
    trelloBoardUrl: current.trelloBoardUrl || fallback.trelloBoardUrl,
    trelloListUrl: current.trelloListUrl || fallback.trelloListUrl,
    trelloListName: current.trelloListName || fallback.trelloListName,
    trelloMemberId: current.trelloMemberId || fallback.trelloMemberId,
  };
}

function hydrateAgencesWithDefaultTrello(agences: AgenceConfig[]): AgenceConfig[] {
  const fallbackByAgenceAndPrenom = new Map<string, AgenceConfig["charges"][number]["trello"]>();
  for (const agence of defaultAgences()) {
    for (const charge of agence.charges) {
      fallbackByAgenceAndPrenom.set(
        `${agence.code}:${normalizeName(charge.prenom)}`,
        charge.trello
      );
    }
  }

  return agences.map((agence) => ({
    ...agence,
    charges: agence.charges.map((charge) => {
      const fallback = fallbackByAgenceAndPrenom.get(
        `${agence.code}:${normalizeName(charge.prenom)}`
      );
      return {
        ...charge,
        trello: mergeTrelloMapping(charge.trello, fallback),
      };
    }),
  }));
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
    if (STEP_IDS.has(key as Step) && value === true) normalized[key as Step] = true;
  }
  return normalized;
}


function getImportStatusBadge(statut?: string): { label: string; className: string } {
  switch (statut) {
    case "TERMINE":
      return {
        label: "Terminé",
        className:
          "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700",
      };
    case "PRET":
      return {
        label: "Prêt",
        className:
          "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/60 dark:text-sky-300 dark:border-sky-700",
      };
    case "VALIDATION_SOCIETES":
      return {
        label: "Validation",
        className:
          "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700",
      };
    case "DISPATCH_TRELLO":
      return {
        label: "Dispatch",
        className:
          "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/60 dark:text-violet-300 dark:border-violet-700",
      };
    default:
      return {
        label: "Brouillon",
        className:
          "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
  }
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function PretermeIrdPage() {
  const { user } = useAuth();

  const [step, setStep]         = useState<Step>("periode");
  const [moisKey, setMoisKey]   = useState<string>(getMoisCible());
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [existingConfig, setExistingConfig] = useState<PretermeConfig | null>(null);
  const [historique, setHistorique]         = useState<PretermeConfig[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Partial<Record<Step, boolean>>>({});
  const [idToken, setIdToken]   = useState<string>("");
  const [allImports, setAllImports]         = useState<PretermeImport[]>([]);
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const [activeAgence, setActiveAgence]     = useState<AgenceCode | null>(null);
  const [clientsForPreview, setClientsForPreview] = useState<Pick<PretermeClient, "etp" | "tauxVariation">[]>([]);
  const [conservedClients, setConservedClients]   = useState<PretermeClient[]>([]);
  const [validationSubStep, setValidationSubStep] = useState<"types" | "societes">("types");
  const [dispatchClients, setDispatchClients]     = useState<PretermeClient[]>([]);
  const [societesAValider, setSocietesAValider]   = useState<PretermeClient[]>([]);
  const [hasPendingTypeChanges, setHasPendingTypeChanges] = useState(false);
  const [savedTypeChoicesByImportId, setSavedTypeChoicesByImportId] = useState<Record<string, boolean>>({});
  const [societesValideesByImportId, setSocietesValideesByImportId] = useState<Record<string, boolean>>({});

  const [config, setConfig] = useState<
    Omit<PretermeConfig, "id" | "createdAt" | "updatedAt" | "createdBy" | "valide">
  >({
    moisKey,
    branche: "IRD",
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
    getAllPretermeIrdConfigs()
      .then(setHistorique)
      .catch(() => toast.error("Impossible de charger l'historique"))
      .finally(() => setLoadingHistory(false));
  }, []);

  // Config du mois sélectionné
  useEffect(() => {
    setExistingConfig(null);
    getPretermeIrdConfig(moisKey).then((c) => {
      if (c) {
        const hydratedAgences = hydrateAgencesWithDefaultTrello(c.agences);
        setExistingConfig({ ...c, agences: hydratedAgences });
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
          agences: hydratedAgences, slackChannelId: "CE58HNVF0",
        });
        setStep(restoredStep);
      } else {
        setCompletedSteps({});
        setSavedTypeChoicesByImportId({});
        setSocietesValideesByImportId({});
        setStep("periode");
        const latestAgences = historique[0]?.agences ?? defaultAgences();
        setConfig((prev) => ({
          ...prev,
          moisKey,
          agences: hydrateAgencesWithDefaultTrello(latestAgences),
          slackChannelId: "CE58HNVF0",
        }));
      }
    });
  }, [moisKey, historique]);

  const persistWorkflow = useCallback(
    async (nextLastStep?: Step, nextCompletedSteps?: Partial<Record<Step, boolean>>) => {
      if (!existingConfig?.id) return;
      try {
        await updatePretermeIrdConfigWorkflow(existingConfig.id, {
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

  useEffect(() => {
    void persistWorkflow(step, completedSteps);
  }, [step, completedSteps, persistWorkflow]);

  // Étape 1 : confirmer la période
  const handleConfirmPeriod = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await upsertPretermeIrdConfig({ ...config, valide: false, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([
        getAllPretermeIrdConfigs(),
        getPretermeIrdConfig(moisKey),
      ]);
      setHistorique(updated);
      if (fresh) setExistingConfig(fresh);
      markStepsCompleted(["periode"]);
      toast.success(`Période IARD ${formatMoisLabel(moisKey)} confirmée.`);
      setStep("upload");
    } catch {
      toast.error("Erreur lors de la confirmation de la période");
    } finally {
      setIsSaving(false);
    }
  }, [config, user, moisKey, markStepsCompleted]);

  // Charger les imports du mois sélectionné
  useEffect(() => {
    getPretermeIrdImportsByMois(moisKey)
      .then((imports) => {
        setAllImports(imports);
        if (imports.length === 0) {
          setActiveImportId(null);
          setActiveAgence(null);
          setClientsForPreview([]);
          setConservedClients([]);
          setDispatchClients([]);
          setSocietesAValider([]);
          return;
        }
        setActiveImportId((prevId) => {
          const selected = imports.find((imp) => imp.id === prevId) ?? imports[0];
          setActiveAgence(selected.agence);
          return selected.id;
        });
      })
      .catch(() => toast.error("Impossible de charger les imports du mois"));
  }, [moisKey]);

  const handleImportSuccess = useCallback(async (importId: string, agence: AgenceCode) => {
    setActiveImportId(importId);
    setActiveAgence(agence);
    getPretermeIrdImportsByMois(moisKey).then(setAllImports).catch(() => {});
    markStepsCompleted(["upload"]);
  }, [moisKey, markStepsCompleted]);

  const handleSwitchImport = useCallback((imp: PretermeImport) => {
    setActiveImportId(imp.id);
    setActiveAgence(imp.agence);
    setHasPendingTypeChanges(false);
    setClientsForPreview([]);
    setConservedClients([]);
    setDispatchClients([]);
    setSocietesAValider([]);
  }, []);

  // Charger les clients pour le preview des seuils (étape filtrage)
  useEffect(() => {
    if (step !== "filtrage" || !activeImportId) return;
    getPretermeIrdClients(activeImportId)
      .then((clients) => {
        setClientsForPreview(clients.map((c) => ({ etp: c.etp, tauxVariation: c.tauxVariation })));
      })
      .catch(() => toast.error("Impossible de charger les clients pour le filtrage"));
  }, [step, activeImportId]);

  // Charger les clients conservés pour la validation (si absents lors d'un retour de navigation)
  useEffect(() => {
    if (step !== "validation" || !activeImportId || conservedClients.length > 0) return;
    getPretermeIrdClients(activeImportId)
      .then((clients) => setConservedClients(clients.filter((c) => c.conserve)))
      .catch(() => toast.error("Impossible de charger les clients conservés"));
  }, [step, activeImportId, conservedClients.length]);

  useEffect(() => {
    if (step !== "validation" || validationSubStep !== "societes" || !activeImportId || societesAValider.length > 0) return;
    getIrdSocietesAValider(activeImportId)
      .then(setSocietesAValider)
      .catch(() => toast.error("Impossible de charger les sociétés à valider"));
  }, [step, validationSubStep, activeImportId, societesAValider.length]);

  const handleClassifySuccess = useCallback(
    (result: { nbConserves: number }) => {
      markStepsCompleted(["filtrage"]);
      if (!activeImportId) return;
      void getPretermeIrdClients(activeImportId).then((clients) => {
        setConservedClients(clients.filter((c) => c.conserve));
      });
      if (result.nbConserves === 0) {
        toast.warning("Aucun client conservé avec ces seuils.");
      }
    },
    [activeImportId, markStepsCompleted]
  );

  const markTypeChoicesSavedForImport = useCallback(async (importId: string) => {
    const now = new Date();
    setSavedTypeChoicesByImportId((prev) => ({ ...prev, [importId]: true }));
    setAllImports((prev) => prev.map((imp) => (imp.id === importId ? { ...imp, typesValidatedAt: now } : imp)));
    try {
      await updatePretermeIrdImport(importId, { typesValidatedAt: now });
    } catch {
      toast.warning("Synchronisation des types en attente.");
    }
  }, []);

  const handleTypeValidated = useCallback(
    async (nbEntreprises: number) => {
      if (!activeImportId) return;
      await markTypeChoicesSavedForImport(activeImportId);
      if (nbEntreprises > 0) {
        const societes = await getIrdSocietesAValider(activeImportId).catch(() => [] as PretermeClient[]);
        setSocietesAValider(societes);
        setValidationSubStep("societes");
      } else {
        markStepsCompleted(["validation"]);
        setStep("modulation");
      }
    },
    [activeImportId, markStepsCompleted, markTypeChoicesSavedForImport]
  );

  const handleValidateTypesForAllImports = useCallback(async () => {
    if (hasPendingTypeChanges) {
      toast.warning("Enregistre d'abord les modifications en cours.");
      return;
    }
    const latestImports = await getPretermeIrdImportsByMois(moisKey).catch(() => null);
    if (!latestImports || latestImports.length === 0) {
      toast.error("Impossible de vérifier les imports du mois.");
      return;
    }
    setAllImports(latestImports);
    const unsaved = latestImports.filter(
      (imp) => !savedTypeChoicesByImportId[imp.id] && !imp.typesValidatedAt
    );
    if (unsaved.length > 0) {
      toast.warning(`Valide d'abord les types pour : ${unsaved.map((i) => i.agence).join(", ")}.`);
      return;
    }
    markStepsCompleted(["validation"]);
    toast.success("Validation complète pour toutes les agences.");
    setStep("modulation");
  }, [hasPendingTypeChanges, moisKey, savedTypeChoicesByImportId, markStepsCompleted]);

  const handleSocietesValidated = useCallback(async () => {
    if (!activeImportId) return;
    setSocietesValideesByImportId((prev) => ({ ...prev, [activeImportId]: true }));

    const pendingImports = allImports.filter(
      (imp) => imp.id !== activeImportId && !societesValideesByImportId[imp.id]
    );
    for (const imp of pendingImports) {
      const societes = await getIrdSocietesAValider(imp.id).catch(() => [] as PretermeClient[]);
      const pending = societes.filter((s) => !s.nomGerant);
      if (pending.length > 0) {
        handleSwitchImport(imp);
        setSocietesAValider(societes);
        setValidationSubStep("societes");
        toast.info(`${pending.length} société(s) à valider pour l'agence ${imp.agence}`);
        return;
      }
    }

    markStepsCompleted(["validation"]);
    toast.success("Toutes les sociétés sont validées !");
    setStep("modulation");
  }, [activeImportId, allImports, societesValideesByImportId, handleSwitchImport, markStepsCompleted]);

  // Charger les clients conservés pour le dispatch (si absents lors d'un retour de navigation)
  useEffect(() => {
    if (step !== "dispatch" || !activeImportId || dispatchClients.length > 0) return;
    getPretermeIrdClients(activeImportId)
      .then((clients) => setDispatchClients(clients.filter((c) => c.conserve)))
      .catch(() => toast.error("Impossible de charger les clients pour le dispatch"));
  }, [step, activeImportId, dispatchClients.length]);

  const handleDispatchSuccess = useCallback(() => {
    markStepsCompleted(["dispatch"]);
  }, [markStepsCompleted]);

  // Brouillon (modulation)
  const handleSaveDraft = useCallback(async () => {
    if (!user) return;
    setIsSavingDraft(true);
    try {
      await upsertPretermeIrdConfig({ ...config, valide: false, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([getAllPretermeIrdConfigs(), getPretermeIrdConfig(moisKey)]);
      setHistorique(updated);
      if (fresh) setExistingConfig(fresh);
      toast.success("Brouillon IARD sauvegardé");
    } catch {
      toast.error("Erreur lors de la sauvegarde du brouillon");
    } finally {
      setIsSavingDraft(false);
    }
  }, [config, user, moisKey]);

  // Étape 5 : valider la modulation
  const handleValidateModulation = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await upsertPretermeIrdConfig({ ...config, valide: true, createdBy: user.uid });
      const [updated, fresh] = await Promise.all([getAllPretermeIrdConfigs(), getPretermeIrdConfig(moisKey)]);
      setHistorique(updated);
      if (fresh) setExistingConfig(fresh);
      markStepsCompleted(["modulation"]);
      toast.success("Configuration IARD validée — dispatch Trello disponible.");
      setStep("dispatch");
    } catch {
      toast.error("Erreur lors de la validation de la modulation");
    } finally {
      setIsSaving(false);
    }
  }, [config, user, moisKey, markStepsCompleted]);

  // ─── Dérivés ────────────────────────────────────────────────────────────────

  const isPeriodeConfirmed = existingConfig !== null;
  const isModulationValide = existingConfig?.valide ?? false;

  const hasImports = allImports.length > 0;
  const importsDuMois = useMemo(
    () => allImports.filter((imp) => imp.moisKey === moisKey),
    [allImports, moisKey]
  );
  const areAllImportsTypeChoicesSaved = useMemo(
    () =>
      importsDuMois.length > 0 &&
      importsDuMois.every((imp) => savedTypeChoicesByImportId[imp.id] || !!imp.typesValidatedAt),
    [importsDuMois, savedTypeChoicesByImportId]
  );

  const canAccessStep = useCallback((s: Step): boolean => {
    if (s === "periode")    return true;
    if (s === "upload")     return isPeriodeConfirmed;
    if (s === "filtrage")   return importsDuMois.length > 0;
    if (s === "validation") return importsDuMois.some((imp) =>
      ["VALIDATION_SOCIETES", "PRET", "DISPATCH_TRELLO", "TERMINE"].includes(imp.statut)
    );
    if (s === "modulation") return areAllImportsTypeChoicesSaved &&
      importsDuMois.some((imp) => ["PRET", "DISPATCH_TRELLO", "TERMINE"].includes(imp.statut));
    if (s === "dispatch")   return isModulationValide && !!activeImportId;
    if (s === "synthese")   return importsDuMois.some((imp) =>
      ["DISPATCH_TRELLO", "TERMINE"].includes(imp.statut));
    return false;
  }, [isPeriodeConfirmed, isModulationValide, importsDuMois, areAllImportsTypeChoicesSaved, activeImportId]);

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

  const AgencySwitcher = () => {
    if (importsDuMois.length <= 1) return null;
    return (
      <Card className="mb-4 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
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
                  <span className="ml-1 text-[10px] opacity-60">{imp.pretermesGlobaux} clients</span>
                  <Badge className={cn("ml-2 border text-[10px]", getImportStatusBadge(imp.statut).className)}>
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

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-950/60 rounded-lg">
          <Shield className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Prétermes IARD</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Gestion automatisée — branche IARD (habitation, pro, RC…)</p>
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
                  Sélection de la période — IARD
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
                    <p className="text-xs text-slate-500 mt-0.5">Mois traité par ce préterme IARD</p>
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
                  <p className="font-medium mb-1">Règle calendaire IARD</p>
                  <p>
                    Traitement toujours sur le <strong>mois suivant</strong> (délai 60 jours avant échéance).
                    Pré-sélectionné : <strong className="text-sky-700 dark:text-sky-200">{formatMoisLabel(getMoisCible())}</strong>.
                  </p>
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
                      <p className="font-medium">{existingConfig.valide ? "Cycle IARD terminé" : "Cycle IARD en cours"}</p>
                      <p className="text-xs opacity-80 mt-0.5">
                        {existingConfig.agences.reduce((acc, a) => acc + a.charges.length, 0)} CDC —
                        ETP ≥ {existingConfig.seuilEtp} | Variation ≥ {existingConfig.seuilVariation}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
                    Nouveau cycle IARD — confirmer la période pour commencer.
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
                    : "Valider la période IARD"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── 2. Upload ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("periode")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Changer de période
                </Button>
              </div>
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4 text-sky-400" />
                    Téléchargement des exports IARD — {formatMoisLabel(moisKey)}
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
          {step === "filtrage" && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("upload")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour téléchargement
                </Button>
              </div>
              <AgencySwitcher />
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4 text-sky-400" />
                    Filtrage + Classification IA — {formatMoisLabel(moisKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeImportId && activeAgence ? (
                    <ThresholdsStep
                      importId={activeImportId}
                      agence={activeAgence}
                      moisKey={moisKey}
                      clients={clientsForPreview}
                      availableImportIds={importsDuMois.map((i) => i.id)}
                      seuilEtpInitial={config.seuilEtp}
                      seuilVariationInitial={config.seuilVariation}
                      idToken={idToken}
                      onClassifySuccess={handleClassifySuccess}
                    />
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-500 text-center py-8">
                      Aucun import disponible — retournez à l&apos;étape de téléchargement.
                    </p>
                  )}
                </CardContent>
              </Card>
              {completedSteps.filtrage && (
                <Button
                  className="w-full bg-sky-600 hover:bg-sky-500"
                  onClick={() => { setValidationSubStep("types"); setStep("validation"); }}
                >
                  Valider et passer à la validation des types
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* ── 4. Validation ── */}
          {step === "validation" && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => {
                    if (validationSubStep === "societes") setValidationSubStep("types");
                    else setStep("filtrage");
                  }}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  {validationSubStep === "societes" ? "Retour classification" : "Retour filtrage"}
                </Button>
              </div>
              <AgencySwitcher />
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowRightLeft className="h-4 w-4 text-sky-400" />
                    {validationSubStep === "types"
                      ? "Classification particulier / entreprise — IARD"
                      : "Saisie des gérants — IARD"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {validationSubStep === "types" ? (
                    <TypeValidationStep
                      clients={conservedClients}
                      onValidated={handleTypeValidated}
                      onSaved={async () => {
                        if (!activeImportId) return;
                        await markTypeChoicesSavedForImport(activeImportId);
                        const clients = await getPretermeIrdClients(activeImportId).catch(() => [] as PretermeClient[]);
                        setConservedClients(clients.filter((c) => c.conserve));
                        setHasPendingTypeChanges(false);
                      }}
                      onDirtyChange={setHasPendingTypeChanges}
                    />
                  ) : (
                    <SocietesValidationStep
                      societes={societesAValider}
                      onAllValidated={() => {
                        void handleSocietesValidated();
                      }}
                    />
                  )}
                </CardContent>
              </Card>
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

          {/* ── 5. Modulation (CDC + seuils) ── */}
          {step === "modulation" && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("validation")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour validation
                </Button>
              </div>
              <AgencySwitcher />
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
          {step === "dispatch" && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 text-xs"
                  onClick={() => setStep("modulation")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour modulation
                </Button>
              </div>
              <AgencySwitcher />
              <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Send className="h-4 w-4 text-sky-400" />
                    Dispatch Trello IARD — {formatMoisLabel(moisKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeImportId && activeAgence && existingConfig ? (() => {
                    const agenceCfg = existingConfig.agences.find((a) => a.code === activeAgence);
                    return agenceCfg ? (
                      <DispatchPreview
                        importId={activeImportId}
                        agence={activeAgence}
                        agenceConfig={agenceCfg}
                        moisKey={moisKey}
                        clients={dispatchClients}
                        idToken={idToken}
                        onDispatchSuccess={async () => {
                          handleDispatchSuccess();
                          if (!activeImportId) return;
                          const latestImports = await getPretermeIrdImportsByMois(moisKey).catch(() => [] as PretermeImport[]);
                          if (latestImports.length > 0) setAllImports(latestImports);
                          const refreshedClients = await getPretermeIrdClients(activeImportId).catch(() => [] as PretermeClient[]);
                          setDispatchClients(refreshedClients.filter((c) => c.conserve));

                          const allDispatched = latestImports.every(
                            (i) => ["DISPATCH_TRELLO", "TERMINE"].includes(i.statut)
                          );
                          if (allDispatched) {
                            toast.success("Dispatch terminé pour toutes les agences !");
                            setStep("synthese");
                            return;
                          }
                          const nextImport = latestImports.find(
                            (i) => !["DISPATCH_TRELLO", "TERMINE"].includes(i.statut)
                          );
                          if (nextImport) {
                            handleSwitchImport(nextImport);
                            toast.success(`Dispatch terminé — agence suivante : ${nextImport.agence}`);
                          }
                        }}
                      />
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-500 text-center py-8">
                        Configuration d&apos;agence introuvable — vérifiez l&apos;étape Modulation.
                      </p>
                    );
                  })() : (
                    <p className="text-sm text-slate-500 dark:text-slate-500 text-center py-8">
                      Aucun import actif — retournez à l&apos;étape de téléchargement.
                    </p>
                  )}
                </CardContent>
              </Card>
              {completedSteps.dispatch && (
                <Button
                  className="w-full bg-sky-600 hover:bg-sky-500"
                  onClick={() => setStep("synthese")}
                >
                  Passer à la synthèse Slack
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* ── 7. Synthèse Slack ── */}
          {step === "synthese" && (() => {
            const activeImport = importsDuMois.find((imp) => imp.id === activeImportId) ?? null;
            const parCharge: Record<string, number> = {};
            for (const client of dispatchClients) {
              if (client.chargeAttribue) {
                parCharge[client.chargeAttribue] = (parCharge[client.chargeAttribue] ?? 0) + 1;
              }
            }
            const nbSocietesEnAttente = societesAValider.filter((c) => !c.chargeAttribue).length;

            return (
              <div className="space-y-4">
                <div className="flex justify-start">
                  <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 text-xs"
                    onClick={() => setStep("dispatch")}>
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour dispatch
                  </Button>
                </div>
                <AgencySwitcher />
                {activeImport && activeAgence ? (
                  <SynthesisReport
                    importData={activeImport}
                    agence={activeAgence}
                    parCharge={parCharge}
                    nbSocietesEnAttente={nbSocietesEnAttente}
                    idToken={idToken}
                  />
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Aucun import actif — revenez à l&apos;étape de téléchargement.
                  </p>
                )}
              </div>
            );
          })()}

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
              ) : historique.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-600">Aucun cycle enregistré</p>
              ) : (
                historique.slice(0, 6).map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <button
                      onClick={() => { setMoisKey(h.moisKey); setStep("periode"); }}
                      className="text-slate-700 dark:text-slate-300 text-left flex-1 truncate capitalize"
                    >
                      {formatMoisLabel(h.moisKey)}
                    </button>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      {h.valide
                        ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        : <Clock className="h-3 w-3 text-amber-500" />}
                      <Link
                        href={`/admin/preterme-ird/historique/${h.moisKey}`}
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

      {/* Agences info */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-600">
        <Building2 className="h-3.5 w-3.5" />
        Périmètre : H91358 — La Corniche (Kennedy) · H92083 — La Rouvière
        <span className="mx-2">·</span>
        <Shield className="h-3.5 w-3.5" />
        Branche IARD — Habitation, Pro, RC, risques divers
      </div>
    </div>
  );
}
