"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  Plus, Trash2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  User, Link, Settings, Building2, UserX, UserCheck
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

// ─── TrelloForm ───────────────────────────────────────────────────────────────

function TrelloForm({
  trello,
  onChange,
}: {
  trello: TrelloMapping;
  onChange: (t: TrelloMapping) => void;
}) {
  const field = (key: keyof TrelloMapping, label: string, placeholder: string) => (
    <div className="space-y-1">
      <Label className="text-xs text-slate-400">{label}</Label>
      <Input
        value={trello[key] ?? ""}
        onChange={(e) => onChange({ ...trello, [key]: e.target.value })}
        placeholder={placeholder}
        className="h-8 text-xs bg-slate-800 border-slate-700"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-2 mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
        <Link className="h-3.5 w-3.5" /> Configuration Trello
      </p>
      {field("trelloBoardUrl", "URL du tableau *", "https://trello.com/b/...")}
      {field("trelloListUrl", "URL de la colonne *", "https://trello.com/b/.../liste")}
      {field("trelloBoardId", "Board ID *", "xxxxxx")}
      {field("trelloListId", "List ID *", "xxxxxx")}
      {field("trelloMemberId", "Member ID (optionnel)", "xxxxxx")}
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
      absent ? "border-amber-600/50 bg-amber-950/20" : "border-slate-700 bg-slate-800/30"
    )}>
      {/* Header CDC */}
      <div className="flex items-center gap-3">
        <User className="h-4 w-4 text-slate-400 shrink-0" />
        <Input
          value={cdc.prenom}
          onChange={(e) => onUpdate({ ...cdc, prenom: e.target.value })}
          placeholder="Prénom du CDC"
          className="h-8 text-sm bg-slate-800 border-slate-600 font-medium max-w-40"
        />

        {/* Tranches lettres */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>De</span>
          <Input
            value={cdc.lettresDebut}
            onChange={(e) => onUpdate({ ...cdc, lettresDebut: e.target.value.toUpperCase().slice(0, 1) })}
            className="h-7 w-12 text-center text-sm bg-slate-800 border-slate-600 uppercase"
            maxLength={1}
          />
          <span>à</span>
          <Input
            value={cdc.lettresFin}
            onChange={(e) => onUpdate({ ...cdc, lettresFin: e.target.value.toUpperCase().slice(0, 1) })}
            className="h-7 w-12 text-center text-sm bg-slate-800 border-slate-600 uppercase"
            maxLength={1}
          />
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 ml-auto">
          {trelloOk ? (
            <Badge variant="outline" className="text-emerald-400 border-emerald-700 text-[10px] h-5">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Trello
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-400 border-red-700 text-[10px] h-5">
              <AlertTriangle className="h-3 w-3 mr-1" /> Trello manquant
            </Badge>
          )}
          {absent && (
            <Badge variant="outline" className="text-amber-400 border-amber-700 text-[10px] h-5">
              <UserX className="h-3 w-3 mr-1" /> Absent
            </Badge>
          )}
        </div>

        {/* Actions */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-sky-400"
          onClick={() => setShowTrello((v) => !v)}
          title="Configurer Trello"
        >
          <Link className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", absent ? "text-amber-400" : "text-slate-400 hover:text-amber-400")}
          onClick={() => setShowAbsence((v) => !v)}
          title="Gérer l'absence"
        >
          <UserX className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-500 hover:text-red-400"
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
        <div className="p-3 bg-amber-950/30 rounded-lg border border-amber-700/40 space-y-2">
          <p className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
            <UserX className="h-3.5 w-3.5" /> Absence / Remplacement
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Remplaçant</Label>
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
                <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-600">
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
              <Label className="text-xs text-slate-400">Début (optionnel)</Label>
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
                className="h-8 text-xs bg-slate-800 border-slate-600"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Fin (optionnel)</Label>
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
                className="h-8 text-xs bg-slate-800 border-slate-600"
              />
            </div>
          </div>
          {cdc.absence && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 h-6 px-2"
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
    <Card className="bg-slate-900 border-slate-700">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-800/50 transition-colors rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-sky-400" />
                <span>{info.label}</span>
                <span className="text-sm font-normal text-slate-400">{info.nom}</span>
              </div>
              <div className="flex items-center gap-2">
                {trelloIncomplete ? (
                  <Badge variant="outline" className="text-red-400 border-red-700 text-[10px]">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Config Trello incomplète
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-700 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Trello configuré
                  </Badge>
                )}
                <Badge className="bg-slate-700 text-slate-300 text-[10px]">
                  {agence.charges.length} CDC
                </Badge>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
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
              className="w-full border-dashed border-slate-600 text-slate-400 hover:text-sky-400 hover:border-sky-600"
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
  isLoading?: boolean;
}

export function ConfigurationStep({
  moisKey,
  config,
  onChange,
  onValidate,
  isLoading,
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
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-sky-400" />
            Seuils de conservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">
                Seuil ETP (Écart Tarif Portefeuille)
              </Label>
              <span className="text-sm font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded">
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
            <p className="text-xs text-slate-500">
              Valeur par défaut : 120 (= 1.20). Conserver si ETP ≥ seuil.
            </p>
          </div>

          <Separator className="bg-slate-800" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">
                Seuil Taux de variation (%)
              </Label>
              <span className="text-sm font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded">
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
            <p className="text-xs text-slate-500">
              Valeur par défaut : 20%. Conserver si Taux de variation ≥ seuil.
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Règle appliquée :</span>{" "}
            un client est conservé si{" "}
            <code className="text-sky-400">ETP ≥ {config.seuilEtp}</code>{" "}
            <span className="font-medium">OU</span>{" "}
            <code className="text-sky-400">Taux de variation ≥ {config.seuilVariation}%</code>
          </div>
        </CardContent>
      </Card>

      {/* Canal Slack */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">💬</span> Canal Slack (synthèse de fin de traitement)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-sm text-slate-400">ID du canal Slack</Label>
            <Input
              value={config.slackChannelId ?? ""}
              onChange={(e) => onChange({ ...config, slackChannelId: e.target.value })}
              placeholder="ex: C0XXXXXXXXX"
              className="bg-slate-800 border-slate-700 max-w-xs"
            />
            <p className="text-xs text-slate-500">
              Trouvez l&apos;ID dans les paramètres du canal Slack (section &quot;À propos&quot;).
            </p>
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
        <div className="p-4 bg-red-950/30 border border-red-700/50 rounded-xl space-y-2">
          <p className="text-sm font-medium text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Validation bloquée
          </p>
          {hasEmptyPrenom && (
            <p className="text-xs text-red-300">
              • Tous les CDC doivent avoir un prénom renseigné.
            </p>
          )}
          {trelloBlocked && (
            <p className="text-xs text-red-300">
              • Le mapping Trello (Board ID, List ID, URLs) doit être complet pour chaque CDC.
            </p>
          )}
        </div>
      )}

      {/* Bouton validation */}
      <Button
        onClick={onValidate}
        disabled={!canValidate || isLoading}
        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-5 disabled:opacity-50"
        size="lg"
      >
        {isLoading ? (
          "Enregistrement..."
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Valider la configuration — {moisKey}
          </>
        )}
      </Button>
    </div>
  );
}
