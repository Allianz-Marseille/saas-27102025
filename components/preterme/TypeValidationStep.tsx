"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Building2, User, ArrowRightLeft, CheckCircle2, Loader2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updatePretermeClient } from "@/lib/firebase/preterme";
import type { PretermeClient } from "@/types/preterme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TypeValidationStepProps {
  /** Clients déjà conservés (conserve === true) tels que classifiés par Gemini */
  clients: PretermeClient[];
  onValidated: (nbEntreprises: number) => void;
}

type EffectiveType = "particulier" | "societe";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEffectiveType(
  client: PretermeClient,
  overrides: Map<string, EffectiveType>
): EffectiveType {
  if (overrides.has(client.id)) return overrides.get(client.id)!;
  // a_valider → société par défaut (résultat ambigu de l'IA)
  return client.typeEntite === "particulier" ? "particulier" : "societe";
}

function getAiLabel(typeEntite: PretermeClient["typeEntite"]): string {
  if (typeEntite === "particulier") return "particulier";
  if (typeEntite === "societe") return "société";
  return "ambigu";
}

// ─── ClientRow ────────────────────────────────────────────────────────────────

function ClientRow({
  client,
  effectiveType,
  isChanged,
  onToggle,
}: {
  client: PretermeClient;
  effectiveType: EffectiveType;
  isChanged: boolean;
  onToggle: () => void;
}) {
  const isParticulier = effectiveType === "particulier";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 border transition-all",
        isChanged
          ? isParticulier
            ? "bg-sky-950/40 border-sky-800/50"
            : "bg-amber-950/40 border-amber-800/50"
          : "bg-slate-800/40 border-slate-700/50"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-200 truncate">{client.nomClient}</p>
        {isChanged ? (
          <p className={cn(
            "text-[10px] mt-0.5",
            isParticulier ? "text-sky-500" : "text-amber-500"
          )}>
            IA : {getAiLabel(client.typeEntite)} → corrigé manuellement
          </p>
        ) : (
          <p className="text-[10px] text-slate-600 mt-0.5">
            IA : {getAiLabel(client.typeEntite)}
          </p>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className={cn(
          "shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border transition-colors",
          isParticulier
            ? "border-slate-700 text-slate-500 hover:border-amber-700 hover:text-amber-400 hover:bg-amber-950/30"
            : "border-slate-700 text-slate-500 hover:border-sky-700 hover:text-sky-400 hover:bg-sky-950/30"
        )}
        title={isParticulier ? "Convertir en entreprise" : "Convertir en particulier"}
      >
        {isParticulier ? (
          <><Building2 className="h-3 w-3" /><span className="hidden sm:inline">Entreprise</span></>
        ) : (
          <><User className="h-3 w-3" /><span className="hidden sm:inline">Particulier</span></>
        )}
      </button>
    </div>
  );
}

// ─── TypeValidationStep ───────────────────────────────────────────────────────

export function TypeValidationStep({ clients, onValidated }: TypeValidationStepProps) {
  const [overrides, setOverrides] = useState<Map<string, EffectiveType>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (client: PretermeClient) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      const current = getEffectiveType(client, prev);
      const newType: EffectiveType = current === "particulier" ? "societe" : "particulier";
      // Si on revient au type original de l'IA, on supprime l'override
      const originalType: EffectiveType = client.typeEntite === "particulier" ? "particulier" : "societe";
      if (newType === originalType) {
        next.delete(client.id);
      } else {
        next.set(client.id, newType);
      }
      return next;
    });
  };

  const particuliers = useMemo(
    () => clients.filter((c) => getEffectiveType(c, overrides) === "particulier"),
    [clients, overrides]
  );
  const entreprises = useMemo(
    () => clients.filter((c) => getEffectiveType(c, overrides) === "societe"),
    [clients, overrides]
  );

  const nbChanged = overrides.size;

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      if (overrides.size > 0) {
        await Promise.all(
          Array.from(overrides.entries()).map(([id, typeEntite]) =>
            updatePretermeClient(id, { typeEntite })
          )
        );
      }
      const msg = entreprises.length > 0
        ? `${entreprises.length} entreprise${entreprises.length > 1 ? "s" : ""} à compléter`
        : "Aucune entreprise — dispatch direct";
      toast.success(`Types confirmés — ${msg}`);
      onValidated(entreprises.length);
    } catch {
      toast.error("Erreur lors de la sauvegarde des corrections");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start gap-3 p-3 bg-sky-950/20 border border-sky-900/40 rounded-lg text-xs text-sky-400/80">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Voici la classification de l&apos;IA pour les{" "}
          <strong className="text-sky-300">{clients.length}</strong> clients conservés.
          Cliquez sur le bouton à droite d&apos;une ligne pour corriger son type.
          Seules les <strong className="text-sky-300">entreprises</strong> nécessiteront un gérant.
        </span>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-3 flex items-center gap-3">
          <User className="h-5 w-5 text-sky-400 shrink-0" />
          <div>
            <p className="text-xl font-bold text-sky-300">{particuliers.length}</p>
            <p className="text-xs text-slate-400">Particuliers</p>
          </div>
        </div>
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-xl font-bold text-amber-300">{entreprises.length}</p>
            <p className="text-xs text-slate-400">Entreprises</p>
          </div>
        </div>
      </div>

      {/* Deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Colonne Particuliers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
            <User className="h-3.5 w-3.5 text-sky-400" />
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Particuliers ({particuliers.length})
            </p>
          </div>
          {particuliers.length === 0 ? (
            <p className="text-xs text-slate-600 italic py-3 text-center">Aucun particulier</p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-0.5">
              {particuliers.map((c) => (
                <ClientRow
                  key={c.id}
                  client={c}
                  effectiveType="particulier"
                  isChanged={overrides.has(c.id)}
                  onToggle={() => toggle(c)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Colonne Entreprises */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Entreprises ({entreprises.length})
            </p>
          </div>
          {entreprises.length === 0 ? (
            <p className="text-xs text-slate-600 italic py-3 text-center">Aucune entreprise</p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-0.5">
              {entreprises.map((c) => (
                <ClientRow
                  key={c.id}
                  client={c}
                  effectiveType="societe"
                  isChanged={overrides.has(c.id)}
                  onToggle={() => toggle(c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Indicateur corrections */}
      {nbChanged > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-950/30 border border-violet-800/40 rounded-lg text-xs text-violet-300">
          <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
          <span>
            {nbChanged} correction{nbChanged > 1 ? "s" : ""} manuelle{nbChanged > 1 ? "s" : ""} —
            sauvegardée{nbChanged > 1 ? "s" : ""} à la validation
          </span>
        </div>
      )}

      {/* Bouton confirmation */}
      <Button
        onClick={handleConfirm}
        disabled={isSaving}
        className="w-full bg-sky-600 hover:bg-sky-500 py-5 font-medium"
        size="lg"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sauvegarde…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {entreprises.length > 0
              ? `Confirmer — saisir les gérants (${entreprises.length} entreprise${entreprises.length > 1 ? "s" : ""})`
              : "Confirmer — aucune entreprise, passer au dispatch"}
          </>
        )}
      </Button>
    </div>
  );
}
