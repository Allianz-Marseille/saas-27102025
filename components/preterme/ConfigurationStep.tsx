"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  Plus, Trash2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  User, Link, Settings, Building2, UserX, RefreshCw, Columns
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type {
  AgenceConfig,
  ChargeDeClientele,
  TrelloMapping,
  PretermeConfig,
  AgenceCode,
} from "@/types/preterme";
import { AGENCES } from "@/types/preterme";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function newCdc(): ChargeDeClientele {
  return {
    id: uuidv4(),
    prenom: "",
    lettresDebut: "A",
    lettresFin: "Z",
    trello: null,
  };
}

function newTrello(): TrelloMapping {
  return {
    trelloBoardId: "",
    trelloListId: "",
    trelloBoardUrl: "",
    trelloListUrl: "",
    trelloMemberId: "",
  };
}

function isTrelloComplete(t: TrelloMapping | null): boolean {
  if (!t) return false;
  return !!(t.trelloBoardId && t.trelloListId && t.trelloBoardUrl && t.trelloListUrl);
}

function hasTrelloIncomplete(agences: AgenceConfig[]): boolean {
  return agences.some((a) =>
    a.charges.some((c) => !isTrelloComplete(c.trello))
  );
}

// ─── TrelloListPicker ─────────────────────────────────────────────────────────

interface TrelloList { id: string; name: string }

function TrelloListPicker({
  boardId,
  onSelect,
}: {
  boardId: string;
  onSelect: (list: TrelloList) => void;
}) {
  const [apiKey, setApiKey]     = useState("");
  const [token, setToken]       = useState("");
  const [lists, setLists]       = useState<TrelloList[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);

  const fetchLists = async () => {
    if (!boardId || !apiKey || !token) {
      toast.error("Board ID, API Key et Token requis pour charger les colonnes");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/preterme-auto/trello-lists?boardId=${encodeURIComponent(boardId)}&apiKey=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(token)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      setLists(data.lists);
      setFetched(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur Trello");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-sky-200 dark:border-sky-700/40 space-y-2">
      <p className="text-xs font-medium text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
        <Columns className="h-3.5 w-3.5" /> Charger les colonnes disponibles
      </p>
      <p className="text-[10px] text-slate-600 dark:text-slate-500">
        Credentials temporaires (non sauvegardés) — utilisés uniquement pour lister les colonnes du board.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-slate-600 dark:text-slate-400">API Key</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Trello API Key"
            className="h-7 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-600 dark:text-slate-400">Token</Label>
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Trello Token"
            className="h-7 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={fetchLists}
        disabled={loading || !boardId}
        className="h-7 text-xs border-sky-300 text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/40"
      >
        {loading ? (
          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        )}
        {loading ? "Chargement…" : "Charger les colonnes"}
      </Button>

      {fetched && lists.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-slate-600 dark:text-slate-400">Sélectionner la colonne cible</Label>
          <Select onValueChange={(val) => {
            const found = lists.find((l) => l.id === val);
            if (found) onSelect(found);
          }}>
            <SelectTrigger className="h-8 text-xs bg-white border-sky-300 dark:bg-slate-800 dark:border-sky-700">
              <SelectValue placeholder="Choisir une colonne…" />
            </SelectTrigger>
            <SelectContent>
              {lists.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-600 dark:text-slate-500">
            La sélection remplira automatiquement le List ID et le nom de la colonne.
          </p>
        </div>
      )}

      {fetched && lists.length === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Aucune colonne ouverte trouvée sur ce board.</p>
      )}
    </div>
  );
}

// ─── TrelloForm ───────────────────────────────────────────────────────────────

function TrelloForm({
  trello,
  onChange,
}: {
  trello: TrelloMapping;
  onChange: (t: TrelloMapping) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const field = (key: keyof TrelloMapping, label: string, placeholder: string) => (
    <div className="space-y-1">
      <Label className="text-xs text-slate-600 dark:text-slate-400">{label}</Label>
      <Input
        value={trello[key] ?? ""}
        onChange={(e) => onChange({ ...trello, [key]: e.target.value })}
        placeholder={placeholder}
        className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700"
      />
    </div>
  );

  const handleListSelect = (list: TrelloList) => {
    onChange({ ...trello, trelloListId: list.id, trelloListName: list.name });
    setShowPicker(false);
    toast.success(`Colonne sélectionnée : "${list.name}"`);
  };

  return (
    <div className="grid grid-cols-1 gap-2 mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Link className="h-3.5 w-3.5" /> Configuration Trello
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPicker((v) => !v)}
                className="h-6 px-2 text-[10px] text-sky-700 hover:text-sky-800 hover:bg-sky-100 dark:text-sky-400 dark:hover:text-sky-300 dark:hover:bg-sky-900/30"
              >
                <Columns className="h-3 w-3 mr-1" />
                {showPicker ? "Masquer" : "Chercher une colonne"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Charge la liste des colonnes du board pour sélectionner par nom
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {field("trelloBoardUrl", "URL du tableau *", "https://trello.com/b/...")}
      {field("trelloListUrl", "URL de la colonne *", "https://trello.com/b/.../liste")}
      {field("trelloBoardId", "Board ID *", "xxxxxx")}

      {/* List ID + nom colonne */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-slate-600 dark:text-slate-400">List ID *</Label>
          <Input
            value={trello.trelloListId}
            onChange={(e) => onChange({ ...trello, trelloListId: e.target.value })}
            placeholder="xxxxxx"
            className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700 font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
            Nom colonne
            <span className="text-slate-500 dark:text-slate-600">(auto-rempli)</span>
          </Label>
          <Input
            value={trello.trelloListName ?? ""}
            onChange={(e) => onChange({ ...trello, trelloListName: e.target.value })}
            placeholder="ex: À traiter"
            className={cn(
              "h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700",
              trello.trelloListName && "border-emerald-300 text-emerald-700 dark:border-emerald-700/60 dark:text-emerald-300"
            )}
          />
        </div>
      </div>

      {trello.trelloListName && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-700/30">
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Colonne cible : <strong>{trello.trelloListName}</strong>
            {" "}— les cartes seront ajoutées <strong>en fin de colonne</strong>.
          </span>
        </div>
      )}

      {field("trelloMemberId", "Member ID (optionnel)", "xxxxxx")}

      {/* Picker par nom */}
      {showPicker && (
        <TrelloListPicker
          boardId={trello.trelloBoardId}
          onSelect={handleListSelect}
        />
      )}
    </div>
  );
}

// ─── CdcRow ───────────────────────────────────────────────────────────────────

function CdcRow({
  cdc,
  allCdcs,
  onUpdate,
  onDelete,
  isOnlyOne,
}: {
  cdc: ChargeDeClientele;
  allCdcs: ChargeDeClientele[];
  onUpdate: (updated: ChargeDeClientele) => void;
  onDelete: () => void;
  isOnlyOne: boolean;
}) {
  const [showTrello, setShowTrello] = useState(!isTrelloComplete(cdc.trello));
  const [showAbsence, setShowAbsence] = useState(!!cdc.absence);
  const trelloOk = isTrelloComplete(cdc.trello);
  const absent = !!cdc.absence;

  return (
    <div className={cn(
      "border rounded-xl p-4 space-y-3",
      absent ? "border-amber-300 bg-amber-50 dark:border-amber-600/50 dark:bg-amber-950/20" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/30"
    )}>
      {/* Header CDC */}
      <div className="flex items-center gap-3">
        <User className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
        <Input
          value={cdc.prenom}
          onChange={(e) => onUpdate({ ...cdc, prenom: e.target.value })}
          placeholder="Prénom du CDC"
          className="h-8 text-sm bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600 font-medium max-w-40"
        />

        {/* Tranches lettres */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span>De</span>
          <Input
            value={cdc.lettresDebut}
            onChange={(e) => onUpdate({ ...cdc, lettresDebut: e.target.value.toUpperCase().slice(0, 1) })}
            className="h-7 w-12 text-center text-sm bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600 uppercase"
            maxLength={1}
          />
          <span>à</span>
          <Input
            value={cdc.lettresFin}
            onChange={(e) => onUpdate({ ...cdc, lettresFin: e.target.value.toUpperCase().slice(0, 1) })}
            className="h-7 w-12 text-center text-sm bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600 uppercase"
            maxLength={1}
          />
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 ml-auto">
          {trelloOk ? (
            <Badge variant="outline" className="text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700 text-[10px] h-5">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Trello
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-700 border-red-300 dark:text-red-400 dark:border-red-700 text-[10px] h-5">
              <AlertTriangle className="h-3 w-3 mr-1" /> Trello manquant
            </Badge>
          )}
          {absent && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700 text-[10px] h-5">
              <UserX className="h-3 w-3 mr-1" /> Absent
            </Badge>
          )}
        </div>

        {/* Actions */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400"
          onClick={() => setShowTrello((v) => !v)}
          title="Configurer Trello"
        >
          <Link className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", absent ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400")}
          onClick={() => setShowAbsence((v) => !v)}
          title="Gérer l'absence"
        >
          <UserX className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-500 hover:text-red-600 dark:hover:text-red-400"
          onClick={onDelete}
          disabled={isOnlyOne}
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Trello form */}
      {showTrello && (
        <TrelloForm
          trello={cdc.trello ?? newTrello()}
          onChange={(t) => onUpdate({ ...cdc, trello: t })}
        />
      )}

      {/* Absence */}
      {showAbsence && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-700/40 space-y-2">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <UserX className="h-3.5 w-3.5" /> Absence / Remplacement
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Remplaçant</Label>
              <Select
                value={cdc.absence?.remplacantId ?? ""}
                onValueChange={(val) =>
                  onUpdate({
                    ...cdc,
                    absence: val
                      ? { ...cdc.absence, remplacantId: val }
                      : undefined,
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Aucun —</SelectItem>
                  {allCdcs
                    .filter((c) => c.id !== cdc.id && c.prenom)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.prenom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Début (optionnel)</Label>
              <Input
                type="date"
                value={cdc.absence?.dateDebut ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...cdc,
                    absence: cdc.absence
                      ? { ...cdc.absence, dateDebut: e.target.value }
                      : { remplacantId: "", dateDebut: e.target.value },
                  })
                }
                className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Fin (optionnel)</Label>
              <Input
                type="date"
                value={cdc.absence?.dateFin ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...cdc,
                    absence: cdc.absence
                      ? { ...cdc.absence, dateFin: e.target.value }
                      : { remplacantId: "", dateFin: e.target.value },
                  })
                }
                className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
          </div>
          {cdc.absence && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600 dark:text-slate-400 h-6 px-2"
              onClick={() => {
                onUpdate({ ...cdc, absence: undefined });
                setShowAbsence(false);
              }}
            >
              Supprimer l&apos;absence
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AgenceSection ────────────────────────────────────────────────────────────

function AgenceSection({
  agence,
  onChange,
}: {
  agence: AgenceConfig;
  onChange: (updated: AgenceConfig) => void;
}) {
  const [open, setOpen] = useState(true);
  const info = AGENCES[agence.code];

  const updateCdc = (id: string, updated: ChargeDeClientele) => {
    onChange({
      ...agence,
      charges: agence.charges.map((c) => (c.id === id ? updated : c)),
    });
  };

  const deleteCdc = (id: string) => {
    onChange({ ...agence, charges: agence.charges.filter((c) => c.id !== id) });
  };

  const addCdc = () => {
    onChange({ ...agence, charges: [...agence.charges, newCdc()] });
  };

  const trelloIncomplete = agence.charges.some((c) => !isTrelloComplete(c.trello));

  return (
    <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-sky-400" />
                <span>{info.label}</span>
                <span className="text-sm font-normal text-slate-600 dark:text-slate-400">{info.nom}</span>
              </div>
              <div className="flex items-center gap-2">
                {trelloIncomplete ? (
                  <Badge variant="outline" className="text-red-700 border-red-300 dark:text-red-400 dark:border-red-700 text-[10px]">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Config Trello incomplète
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Trello configuré
                  </Badge>
                )}
                <Badge className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 text-[10px]">
                  {agence.charges.length} CDC
                </Badge>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {agence.charges.map((cdc) => (
              <CdcRow
                key={cdc.id}
                cdc={cdc}
                allCdcs={agence.charges}
                onUpdate={(updated) => updateCdc(cdc.id, updated)}
                onDelete={() => deleteCdc(cdc.id)}
                isOnlyOne={agence.charges.length === 1}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addCdc}
              className="w-full border-dashed border-slate-300 text-slate-600 hover:text-sky-600 hover:border-sky-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-sky-400 dark:hover:border-sky-600"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Ajouter un CDC
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ─── ConfigurationStep (export principal) ─────────────────────────────────────

interface ConfigurationStepProps {
  moisKey: string;
  config: Omit<PretermeConfig, "id" | "createdAt" | "updatedAt" | "createdBy" | "valide">;
  onChange: (config: ConfigurationStepProps["config"]) => void;
  onValidate: () => Promise<void>;
  onSaveDraft?: () => Promise<void>;
  isLoading?: boolean;
  isSavingDraft?: boolean;
}

export function ConfigurationStep({
  moisKey,
  config,
  onChange,
  onValidate,
  onSaveDraft,
  isLoading,
  isSavingDraft,
}: ConfigurationStepProps) {
  const trelloBlocked = hasTrelloIncomplete(config.agences);
  const hasEmptyPrenom = config.agences.some((a) =>
    a.charges.some((c) => !c.prenom.trim())
  );

  const canValidate = !trelloBlocked && !hasEmptyPrenom;

  const updateAgence = (code: AgenceCode, updated: AgenceConfig) => {
    onChange({
      ...config,
      agences: config.agences.map((a) => (a.code === code ? updated : a)),
    });
  };

  return (
    <div className="space-y-6">
      {/* Seuils */}
      <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-sky-400" />
            Seuils de conservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-700 dark:text-slate-300">
                Seuil ETP (Écart Tarif Portefeuille)
              </Label>
              <span className="text-sm font-semibold text-sky-700 bg-sky-100 dark:text-sky-400 dark:bg-sky-950/40 px-2 py-0.5 rounded">
                ≥ {config.seuilEtp}
              </span>
            </div>
            <Slider
              value={[config.seuilEtp]}
              onValueChange={(vals: number[]) => onChange({ ...config, seuilEtp: vals[0] })}
              min={100}
              max={200}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-slate-600 dark:text-slate-500">
              Valeur par défaut : 120 (= 1.20). Conserver si ETP ≥ seuil.
            </p>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-800" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-700 dark:text-slate-300">
                Seuil Taux de variation (%)
              </Label>
              <span className="text-sm font-semibold text-sky-700 bg-sky-100 dark:text-sky-400 dark:bg-sky-950/40 px-2 py-0.5 rounded">
                ≥ {config.seuilVariation}%
              </span>
            </div>
            <Slider
              value={[config.seuilVariation]}
              onValueChange={(vals: number[]) => onChange({ ...config, seuilVariation: vals[0] })}
              min={5}
              max={50}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-slate-600 dark:text-slate-500">
              Valeur par défaut : 20%. Conserver si Taux de variation ≥ seuil.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Règle appliquée :</span>{" "}
            un client est conservé si{" "}
            <code className="text-sky-400">ETP ≥ {config.seuilEtp}</code>{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">OU</span>{" "}
            <code className="text-sky-400">Taux de variation ≥ {config.seuilVariation}%</code>
          </div>
        </CardContent>
      </Card>

      {/* Agences & CDC */}
      {config.agences.map((agence) => (
        <AgenceSection
          key={agence.code}
          agence={agence}
          onChange={(updated) => updateAgence(agence.code, updated)}
        />
      ))}

      {/* Alertes bloquantes */}
      {(trelloBlocked || hasEmptyPrenom) && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700/50 rounded-xl space-y-2">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Validation bloquée
          </p>
          {hasEmptyPrenom && (
            <p className="text-xs text-red-700 dark:text-red-300">
              • Tous les CDC doivent avoir un prénom renseigné.
            </p>
          )}
          {trelloBlocked && (
            <p className="text-xs text-red-700 dark:text-red-300">
              • Le mapping Trello (Board ID, List ID, URLs) doit être complet pour chaque CDC.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={cn("flex gap-3", !canValidate ? "flex-col" : "flex-col")}>
        {/* Brouillon — toujours disponible */}
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isLoading || hasEmptyPrenom}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 font-medium py-4 disabled:opacity-60"
          >
            {isSavingDraft ? (
              "Sauvegarde..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-amber-400" />
                Sauvegarder le brouillon
              </>
            )}
          </Button>
        )}

        {/* Validation finale — requiert Trello complet */}
        <Button
          onClick={onValidate}
          disabled={!canValidate || isLoading}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-5 disabled:opacity-60"
          size="lg"
        >
          {isLoading ? (
            "Validation..."
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Valider la configuration — {moisKey}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
