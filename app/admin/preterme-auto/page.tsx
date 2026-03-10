"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  Calendar, ChevronLeft, ChevronRight, Settings2, Upload, Filter,
  Building2, CheckCircle2, Clock, History, Car, Send
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
} from "@/lib/firebase/preterme";
import { ConfigurationStep } from "@/components/preterme/ConfigurationStep";
import { UploadStep } from "@/components/preterme/UploadStep";
import { ThresholdsStep } from "@/components/preterme/ThresholdsStep";
import { SocietesValidationStep } from "@/components/preterme/SocietesValidationStep";
import { DispatchPreview } from "@/components/preterme/DispatchPreview";
import type {
  PretermeConfig, AgenceConfig, AgenceCode, PretermeClient,
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
        { id: uuidv4(), prenom: "Corentin",   lettresDebut: "A", lettresFin: "C", trello: null },
        { id: uuidv4(), prenom: "Emma",       lettresDebut: "D", lettresFin: "F", trello: null },
        { id: uuidv4(), prenom: "Matthieu",   lettresDebut: "G", lettresFin: "M", trello: null },
        { id: uuidv4(), prenom: "Donia",      lettresDebut: "N", lettresFin: "Z", trello: null },
      ],
    },
    {
      code: "H92083",
      charges: [
        { id: uuidv4(), prenom: "Joelle",     lettresDebut: "A", lettresFin: "H", trello: null },
        { id: uuidv4(), prenom: "Christelle", lettresDebut: "I", lettresFin: "Z", trello: null },
      ],
    },
  ];
}

// ─── Steps ──────────────────────────────────────────────────────────────────

type Step = "periode" | "configuration" | "upload" | "filtrage" | "societes" | "dispatch";

const STEPS: { id: Step; label: string; icon: React.ElementType; phase: number }[] = [
  { id: "periode",       label: "Période",            icon: Calendar,  phase: 1 },
  { id: "configuration", label: "Configuration",      icon: Settings2, phase: 1 },
  { id: "upload",        label: "Upload fichiers",    icon: Upload,    phase: 2 },
  { id: "filtrage",      label: "Filtrage & IA",      icon: Filter,    phase: 3 },
  { id: "societes",      label: "Valid. sociétés",    icon: Building2, phase: 3 },
  { id: "dispatch",      label: "Dispatch Trello",    icon: Send,      phase: 4 },
];

// ─── Page principale ─────────────────────────────────────────────────────────

export default function PretermeAutoPage() {
  const { user } = useAuth();

  const [step, setStep]         = useState<Step>("periode");
  const [moisKey, setMoisKey]   = useState<string>(getMoisCible());
  const [isSaving, setIsSaving] = useState(false);
  const [idToken, setIdToken]   = useState<string>("");

  const [existingConfig, setExistingConfig]   = useState<PretermeConfig | null>(null);
  const [historique, setHistorique]           = useState<PretermeConfig[]>([]);
  const [loadingHistory, setLoadingHistory]   = useState(true);

  // Import actif (après upload)
  const [activeImportId, setActiveImportId]   = useState<string | null>(null);
  const [activeAgence, setActiveAgence]       = useState<AgenceCode | null>(null);
  const [importedClients, setImportedClients] = useState<PretermeClient[]>([]);
  const [societesAValider, setSocietesAValider] = useState<PretermeClient[]>([]);

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
        setConfig({
          moisKey: c.moisKey, branche: c.branche,
          seuilEtp: c.seuilEtp, seuilVariation: c.seuilVariation,
          agences: c.agences, slackChannelId: c.slackChannelId,
        });
      } else {
        setConfig((prev) => ({ ...prev, moisKey, agences: defaultAgences() }));
      }
    });
  }, [moisKey]);

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
      toast.success(`Configuration ${formatMoisLabel(moisKey)} validée !`);
      setStep("upload");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  }, [config, user, moisKey]);

  const handleImportSuccess = useCallback(async (importId: string, agence: AgenceCode) => {
    setActiveImportId(importId);
    setActiveAgence(agence);
    await loadImportClients(importId);
    setStep("filtrage");
  }, [loadImportClients]);

  const handleClassifySuccess = useCallback(async (result: {
    nbSocietesAValider: number;
  }) => {
    if (!activeImportId) return;
    if (result.nbSocietesAValider > 0) {
      await loadSocietes(activeImportId);
      setStep("societes");
    } else {
      setStep("dispatch");
    }
  }, [activeImportId, loadSocietes]);

  const isConfigValide = existingConfig?.valide ?? false;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const canAccessStep = (s: Step): boolean => {
    if (s === "periode" || s === "configuration") return true;
    if (s === "upload") return isConfigValide;
    if (s === "filtrage") return !!activeImportId;
    if (s === "societes") return !!activeImportId;
    if (s === "dispatch") return !!activeImportId;
    return false;
  };

  // Breadcrumb
  const Breadcrumb = ({ current }: { current: string }) => (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <button onClick={() => setStep("periode")} className="hover:text-slate-200">Période</button>
      {["configuration", "upload", "filtrage", "societes"].includes(step) && (
        <><span>/</span><button onClick={() => setStep("configuration")} className="hover:text-slate-200">Config</button></>
      )}
      {["upload", "filtrage", "societes"].includes(step) && (
        <><span>/</span><button onClick={() => setStep("upload")} className="hover:text-slate-200">Upload</button></>
      )}
      {["filtrage", "societes"].includes(step) && (
        <><span>/</span><button onClick={() => setStep("filtrage")} className="hover:text-slate-200">Filtrage</button></>
      )}
      {step === "societes" && (
        <><span>/</span><span className="text-white font-medium">{current}</span></>
      )}
      {step !== "societes" && (
        <><span>/</span><span className="text-white font-medium">{current}</span></>
      )}
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
                  (s.id === "periode" && stepIndex > 0) ||
                  (s.id === "configuration" && isConfigValide) ||
                  (s.id === "upload" && !!activeImportId && stepIndex > 2) ||
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
                    {!accessible && <Clock className="h-3 w-3 ml-auto text-slate-600" />}
                  </button>
                );
              })}

              <Separator className="bg-slate-800 my-2" />
              {[
                { label: "Synthèse Slack",  phase: 5 },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 px-3 py-2 text-slate-600 text-sm">
                  <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center">
                    <Clock className="h-3 w-3" />
                  </div>
                  <span className="text-xs">{s.label}</span>
                  <Badge className="ml-auto text-[9px] bg-slate-800 text-slate-600 h-4 px-1">P{s.phase}</Badge>
                </div>
              ))}
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
                onValidate={handleValidateConfig} isLoading={isSaving} />
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
                    seuilEtpInitial={existingConfig?.seuilEtp ?? 120}
                    seuilVariationInitial={existingConfig?.seuilVariation ?? 20}
                    idToken={idToken}
                    onClassifySuccess={handleClassifySuccess}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Validation sociétés ── */}
          {step === "societes" && activeImportId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Breadcrumb current="Validation sociétés" />
                <Button variant="ghost" size="sm" className="text-slate-400 text-xs" onClick={() => setStep("filtrage")}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Retour filtrage
                </Button>
              </div>
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-sky-400" />
                    Validation des sociétés détectées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SocietesValidationStep
                    societes={societesAValider}
                    onAllValidated={() => {
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
                    onDispatchSuccess={() => {
                      toast.success("Dispatch terminé — Phase 5 (Slack + KPI) à venir !");
                    }}
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
