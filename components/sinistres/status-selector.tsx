/**
 * Composant de sélection de statut pour un sinistre
 */

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SinistreStatus } from "@/types/sinistre";
import {
  HelpCircle,
  FileText,
  Users,
  Briefcase,
  FileCheck,
  FileSearch,
  Clock,
  Hammer,
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  UserX,
} from "lucide-react";

interface StatusSelectorProps {
  value?: SinistreStatus;
  onValueChange: (value: SinistreStatus | undefined) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: Array<{
  value: SinistreStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    value: SinistreStatus.A_QUALIFIER,
    label: "À qualifier",
    icon: HelpCircle,
    color: "text-gray-600",
  },
  {
    value: SinistreStatus.EN_ATTENTE_PIECES_ASSURE,
    label: "En attente pièces assuré",
    icon: FileText,
    color: "text-orange-600",
  },
  {
    value: SinistreStatus.EN_ATTENTE_INFOS_TIERS,
    label: "En attente infos tiers",
    icon: Users,
    color: "text-orange-600",
  },
  {
    value: SinistreStatus.MISSION_EN_COURS,
    label: "Mission en cours",
    icon: Briefcase,
    color: "text-blue-600",
  },
  {
    value: SinistreStatus.EN_ATTENTE_DEVIS,
    label: "En attente devis",
    icon: FileCheck,
    color: "text-yellow-600",
  },
  {
    value: SinistreStatus.EN_ATTENTE_RAPPORT,
    label: "En attente rapport",
    icon: FileSearch,
    color: "text-yellow-600",
  },
  {
    value: SinistreStatus.EN_ATTENTE_ACCORD_COMPAGNIE,
    label: "En attente accord compagnie",
    icon: Clock,
    color: "text-yellow-600",
  },
  {
    value: SinistreStatus.TRAVAUX_EN_COURS,
    label: "Travaux en cours",
    icon: Hammer,
    color: "text-blue-600",
  },
  {
    value: SinistreStatus.EN_ATTENTE_FACTURE,
    label: "En attente facture",
    icon: Receipt,
    color: "text-orange-600",
  },
  {
    value: SinistreStatus.REGLEMENT_EN_COURS,
    label: "Règlement en cours",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    value: SinistreStatus.CLOS,
    label: "Clos",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  {
    value: SinistreStatus.LITIGE_CONTESTATION,
    label: "Litige / contestation",
    icon: AlertCircle,
    color: "text-red-600",
  },
];

export function StatusSelector({
  value,
  onValueChange,
  disabled,
}: StatusSelectorProps) {
  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === value);

  return (
    <Select
      value={value || "none"}
      onValueChange={(val) =>
        onValueChange(val === "none" ? undefined : (val as SinistreStatus))
      }
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner un statut">
          {selectedStatus && (
            <div className="flex items-center gap-2">
              <selectedStatus.icon className={`h-4 w-4 ${selectedStatus.color}`} />
              <span>{selectedStatus.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucun statut</SelectItem>
        {STATUS_OPTIONS.map((status) => {
          const Icon = status.icon;
          return (
            <SelectItem key={status.value} value={status.value}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${status.color}`} />
                <span>{status.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

