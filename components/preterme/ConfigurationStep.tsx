"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  Plus, Trash2, AlertTriangle, CheckCircle2,
  User, Link, Building2, UserX, RefreshCw, Columns, Lock, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  return { id: uuidv4(), prenom: "", lettresDebut: "A", lettresFin: "Z", trello: null };
}

function newTrello(): TrelloMapping {
  return { trelloBoardId: "", trelloListId: "", trelloBoardUrl: "", trelloListUrl: "", trelloMemberId: "" };
}

function isTrelloComplete(t: TrelloMapping | null): boolean {
  if (!t) return false;
  return !!(t.trelloBoardId && t.trelloListId && t.trelloBoardUrl && t.trelloListUrl);
}

function isAgenceReady(agence: AgenceConfig): boolean {
  return (
    agence.charges.length > 0 &&
    agence.charges.every((c) => c.prenom.trim() !== "" && isTrelloComplete(c.trello))
  );
}

// ─── TrelloListPicker ─────────────────────────────────────────────────────────

interface TrelloList { id: string; name: string }

function TrelloListPicker({ boardId, onSelect }: { boardId: string; onSelect: (list: TrelloList) => void }) {
  const [apiKey, setApiKey]   = useState("");
  const [token, setToken]     = useState("");
  const [lists, setLists]     = useState<TrelloList[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

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
      <form onSubmit={(e) => { e.preventDefault(); fetchLists(); }} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-600 dark:text-slate-400">API Key</Label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="Trello API Key" className="h-7 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Token</Label>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="Trello Token" className="h-7 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700" />
          </div>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={loading || !boardId}
          className="h-7 text-xs border-sky-300 text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/40">
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          {loading ? "Chargement…" : "Charger les colonnes"}
        </Button>
      </form>
      {fetched && lists.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-slate-600 dark:text-slate-400">Sélectionner la colonne cible</Label>
          <Select onValueChange={(val) => { const found = lists.find((l) => l.id === val); if (found) onSelect(found); }}>
            <SelectTrigger className="h-8 text-xs bg-white border-sky-300 dark:bg-slate-800 dark:border-sky-700">
              <SelectValue placeholder="Choisir une colonne…" />
            </SelectTrigger>
            <SelectContent>
              {lists.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {fetched && lists.length === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Aucune colonne ouverte trouvée sur ce board.</p>
      )}
    </div>
  );
}

// ─── TrelloForm ───────────────────────────────────────────────────────────────

function TrelloForm({ trello, onChange }: { trello: TrelloMapping; onChange: (t: TrelloMapping) => void }) {
  const [showPicker, setShowPicker] = useState(false);

  const field = (key: keyof TrelloMapping, label: string, placeholder: string) => (
    <div className="space-y-1">
      <Label className="text-xs text-slate-600 dark:text-slate-400">{label}</Label>
      <Input value={trello[key] ?? ""} onChange={(e) => onChange({ ...trello, [key]: e.target.value })}
        placeholder={placeholder} className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700" />
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
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowPicker((v) => !v)}
                className="h-6 px-2 text-[10px] text-sky-700 hover:text-sky-800 hover:bg-sky-100 dark:text-sky-400 dark:hover:text-sky-300 dark:hover:bg-sky-900/30">
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

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-slate-600 dark:text-slate-400">List ID *</Label>
          <Input value={trello.trelloListId} onChange={(e) => onChange({ ...trello, trelloListId: e.target.value })}
            placeholder="xxxxxx" className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700 font-mono" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
            Nom colonne <span className="text-slate-500 dark:text-slate-600">(auto)</span>
          </Label>
          <Input value={trello.trelloListName ?? ""} onChange={(e) => onChange({ ...trello, trelloListName: e.target.value })}
            placeholder="ex: À traiter"
            className={cn("h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700",
              trello.trelloListName && "border-emerald-300 text-emerald-700 dark:border-emerald-700/60 dark:text-emerald-300")} />
        </div>
      </div>

      {trello.trelloListName && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-700/30">
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Colonne cible : <strong>{trello.trelloListName}</strong>
            {" "}— cartes ajoutées <strong>en fin de colonne</strong>.
          </span>
        </div>
      )}

      {field("trelloMemberId", "Member ID (optionnel)", "xxxxxx")}

      {showPicker && <TrelloListPicker boardId={trello.trelloBoardId} onSelect={handleListSelect} />}
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
  const [showTrello, setShowTrello]   = useState(!isTrelloComplete(cdc.trello));
  const [showAbsence, setShowAbsence] = useState(!!cdc.absence);
  const trelloOk = isTrelloComplete(cdc.trello);
  const absent   = !!cdc.absence;

  return (
    <div className={cn(
      "border rounded-xl p-4 space-y-3",
      absent
        ? "border-amber-300 bg-amber-50 dark:border-amber-600/50 dark:bg-amber-950/20"
        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/30"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
        <Input
          value={cdc.prenom}
          onChange={(e) => onUpdate({ ...cdc, prenom: e.target.value })}
          placeholder="Prénom du CDC"
          className="h-8 text-sm bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600 font-medium max-w-36"
        />

        {/* Tranches lettres */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span>De</span>
          <Input
            value={cdc.lettresDebut}
            onChange={(e) => onUpdate({ ...cdc, lettresDebut: e.target.value.toUpperCase().slice(0, 1) })}
            className="h-7 w-11 text-center text-sm font-mono bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600 uppercase"
            maxLength={1}
          />
          <span>à</span>
          <Input
            value={cdc.lettresFin}
            onChange={(e) => onUpdate({ ...cdc, lettresFin: e.target.value.toUpperCase().slice(0, 1) })}
            className="h-7 w-11 text-center text-sm font-mono bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600 uppercase"
            maxLength={1}
          />
        </div>

        {/* Badges statut */}
        <div className="flex items-center gap-1.5 ml-auto">
          {trelloOk ? (
            <Badge variant="outline" className="text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700 text-[10px] h-5">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Trello
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-700 border-red-300 dark:text-red-400 dark:border-red-700 text-[10px] h-5">
              <AlertTriangle className="h-3 w-3 mr-1" /> Trello
            </Badge>
          )}
          {absent && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700 text-[10px] h-5">
              <UserX className="h-3 w-3 mr-1" /> Absent
            </Badge>
          )}
        </div>

        {/* Boutons action */}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
          onClick={() => setShowTrello((v) => !v)} title="Configurer Trello">
          <Link className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon"
          className={cn("h-7 w-7", absent ? "text-amber-500 dark:text-amber-400" : "text-slate-500 hover:text-amber-600 dark:hover:text-amber-400")}
          onClick={() => setShowAbsence((v) => !v)} title="Gérer l'absence">
          <UserX className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-600 dark:hover:text-red-400"
          onClick={onDelete} disabled={isOnlyOne} title="Supprimer">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Trello */}
      {showTrello && (
        <TrelloForm trello={cdc.trello ?? newTrello()} onChange={(t) => onUpdate({ ...cdc, trello: t })} />
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
                onValueChange={(val) => onUpdate({
                  ...cdc,
                  absence: val ? { ...cdc.absence, remplacantId: val } : undefined,
                })}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Aucun —</SelectItem>
                  {allCdcs.filter((c) => c.id !== cdc.id && c.prenom).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.prenom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Début (optionnel)</Label>
              <Input type="date" value={cdc.absence?.dateDebut ?? ""}
                onChange={(e) => onUpdate({ ...cdc, absence: cdc.absence
                  ? { ...cdc.absence, dateDebut: e.target.value }
                  : { remplacantId: "", dateDebut: e.target.value } })}
                className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Fin (optionnel)</Label>
              <Input type="date" value={cdc.absence?.dateFin ?? ""}
                onChange={(e) => onUpdate({ ...cdc, absence: cdc.absence
                  ? { ...cdc.absence, dateFin: e.target.value }
                  : { remplacantId: "", dateFin: e.target.value } })}
                className="h-8 text-xs bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600" />
            </div>
          </div>
          {cdc.absence && (
            <Button variant="ghost" size="sm" className="text-xs text-slate-600 dark:text-slate-400 h-6 px-2"
              onClick={() => { onUpdate({ ...cdc, absence: undefined }); setShowAbsence(false); }}>
              Supprimer l&apos;absence
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AgenceTabContent ─────────────────────────────────────────────────────────

function AgenceTabContent({
  agence,
  isLocked,
  onChange,
  onLock,
  onUnlock,
}: {
  agence: AgenceConfig;
  isLocked: boolean;
  onChange: (updated: AgenceConfig) => void;
  onLock: () => void;
  onUnlock: () => void;
}) {
  const ready            = isAgenceReady(agence);
  const hasEmptyPrenom   = agence.charges.some((c) => !c.prenom.trim());
  const trelloIncomplete = agence.charges.some((c) => !isTrelloComplete(c.trello));

  const updateCdc = (id: string, updated: ChargeDeClientele) =>
    onChange({ ...agence, charges: agence.charges.map((c) => (c.id === id ? updated : c)) });

  const deleteCdc = (id: string) =>
    onChange({ ...agence, charges: agence.charges.filter((c) => c.id !== id) });

  const addCdc = () =>
    onChange({ ...agence, charges: [...agence.charges, newCdc()] });

  // ── Vue verrouillée ────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-800/40">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300 flex-1">
            {agence.charges.length} CDC configuré{agence.charges.length > 1 ? "s" : ""} — agence verrouillée
          </span>
          <Button variant="ghost" size="sm" onClick={onUnlock}
            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            <Pencil className="h-3 w-3 mr-1" /> Modifier
          </Button>
        </div>

        {/* Résumé CDC */}
        <div className="space-y-2">
          {agence.charges.map((cdc) => (
            <div key={cdc.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700">
              <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{cdc.prenom}</span>
              <Badge variant="outline" className="text-[10px] font-mono border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                {cdc.lettresDebut} → {cdc.lettresFin}
              </Badge>
              {cdc.absence && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                  <UserX className="h-3 w-3 mr-0.5" /> Absent
                </Badge>
              )}
              <Badge variant="outline" className={cn(
                "text-[10px] ml-auto",
                isTrelloComplete(cdc.trello)
                  ? "text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700"
                  : "text-red-600 border-red-300 dark:text-red-400 dark:border-red-700"
              )}>
                {isTrelloComplete(cdc.trello) ? "Trello ✓" : "Trello !"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Vue édition ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pt-4">
      {/* Liste CDC */}
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

      {/* Ajouter CDC */}
      <Button variant="outline" size="sm" onClick={addCdc}
        className="w-full border-dashed border-slate-300 text-slate-600 hover:text-sky-600 hover:border-sky-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-sky-400 dark:hover:border-sky-600">
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Ajouter un CDC
      </Button>

      {/* Alertes */}
      {(hasEmptyPrenom || trelloIncomplete) && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700/50 rounded-lg space-y-1">
          {hasEmptyPrenom && (
            <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Tous les CDC doivent avoir un prénom.
            </p>
          )}
          {trelloIncomplete && (
            <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Le mapping Trello (Board ID, List ID, URLs) doit être complet pour chaque CDC.
            </p>
          )}
        </div>
      )}

      {/* Bouton verrouiller */}
      <Button
        onClick={onLock}
        disabled={!ready}
        className={cn(
          "w-full font-medium py-5",
          ready
            ? "bg-sky-600 hover:bg-sky-500 text-white"
            : "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
        )}
        size="lg"
      >
        <Lock className="h-4 w-4 mr-2" />
        Verrouiller l&apos;agence
      </Button>
    </div>
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
  const [lockedAgences, setLockedAgences] = useState<Partial<Record<AgenceCode, boolean>>>({});

  const allLocked = config.agences.length > 0 && config.agences.every((a) => lockedAgences[a.code]);
  const nbLocked  = config.agences.filter((a) => lockedAgences[a.code]).length;

  const updateAgence = (code: AgenceCode, updated: AgenceConfig) => {
    onChange({ ...config, agences: config.agences.map((a) => (a.code === code ? updated : a)) });
    // Réinitialise le verrou si l'agence est modifiée après verrouillage
    setLockedAgences((prev) => ({ ...prev, [code]: false }));
  };

  const lockAgence = (code: AgenceCode) => {
    setLockedAgences((prev) => ({ ...prev, [code]: true }));
    const info = AGENCES[code];
    toast.success(`Agence ${info?.label ?? code} verrouillée.`);
  };

  const unlockAgence = (code: AgenceCode) => {
    setLockedAgences((prev) => ({ ...prev, [code]: false }));
  };

  return (
    <div className="space-y-4">
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
            ? "Les deux agences sont configurées — vous pouvez valider la modulation."
            : "Configurez les CDC de chaque agence, puis verrouillez. Les deux doivent être vertes."}
        </span>
        <Badge className={cn(
          "shrink-0 text-[10px]",
          allLocked
            ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-700"
            : "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
        )}>
          {nbLocked} / {config.agences.length} verrouillée{nbLocked > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Onglets agences */}
      {config.agences.length > 0 && (
        <Tabs defaultValue={config.agences[0].code}>
          <TabsList className="w-full">
            {config.agences.map((agence) => {
              const locked = !!lockedAgences[agence.code];
              const info   = AGENCES[agence.code];
              return (
                <TabsTrigger
                  key={agence.code}
                  value={agence.code}
                  className={cn(
                    "flex-1 gap-1.5 text-xs",
                    locked && "data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
                  )}
                >
                  {locked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />}
                  {info.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {config.agences.map((agence) => (
            <TabsContent
              key={agence.code}
              value={agence.code}
              className={cn(
                "rounded-lg border transition-colors",
                lockedAgences[agence.code]
                  ? "border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 px-4 pb-4"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pb-4"
              )}
            >
              <AgenceTabContent
                agence={agence}
                isLocked={!!lockedAgences[agence.code]}
                onChange={(updated) => updateAgence(agence.code, updated)}
                onLock={() => lockAgence(agence.code)}
                onUnlock={() => unlockAgence(agence.code)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isLoading}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 font-medium py-4 disabled:opacity-60"
          >
            {isSavingDraft ? "Sauvegarde..." : "Sauvegarder le brouillon"}
          </Button>
        )}

        <Button
          onClick={onValidate}
          disabled={!allLocked || isLoading}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-5 disabled:opacity-50"
          size="lg"
        >
          {isLoading ? "Validation..." : (
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
